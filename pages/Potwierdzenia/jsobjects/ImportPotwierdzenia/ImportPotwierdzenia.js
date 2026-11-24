export default {
  odczytajPlik() {
    const plik = FilePickerImport.files[0];

    if (!plik) {
      showAlert("Wybierz plik Excel.", "warning");
      return [];
    }

    if (!plik.name.toLowerCase().endsWith(".xlsx")) {
      showAlert("Wybierz plik w formacie XLSX.", "error");
      return [];
    }

    try {
      const base64 = plik.data.includes(",")
        ? plik.data.split(",")[1]
        : plik.data;

      const workbook = XLSX.read(base64, {
        type: "base64",
        cellDates: false,
        dense: false
      });

      const arkusz = workbook.Sheets[workbook.SheetNames[0]];
      const zakres = XLSX.utils.decode_range(arkusz["!ref"]);

      zakres.s.r = 4;
      zakres.s.c = 0;
      zakres.e.c = Math.min(zakres.e.c, 29);

      const dane = XLSX.utils.sheet_to_json(arkusz, {
        range: zakres,
        defval: null,
        blankrows: false
      });

      return dane
        .filter(row => row["Ekspert"] || row["Nr naboru"] || row["Nr wniosku"])
        .map(row => {
          const data = XLSX.SSF.parse_date_code(
            row["Data oceny "]
          );

          return {
            lp: row["Lp"],
            ekspert: String(row["Ekspert"] ?? "").trim(),
            nr_naboru: String(row["Nr naboru"] ?? "").trim(),
            nr_wniosku: String(row["Nr wniosku"] ?? "").trim(),
            data_oceny: data
              ? `${data.y}-${String(data.m).padStart(2, "0")}-${String(data.d).padStart(2, "0")}`
              : null,
            rodzaj_oceny: String(row["Rodzaj oceny"] ?? "").trim(),
            kwota: row["Kwota"],
            opiekun: String(row["Opiekun"] ?? "").trim()
          };
        });

    } catch (error) {
      showAlert("Błąd odczytu: " + error.message, "error");
      return [];
    }
  },

  async weryfikujDane() {
    const dane = this.odczytajPlik();

    if (!dane.length) return [];

    const slownik = await getImportId.run();

    const normalizuj = wartosc =>
      String(wartosc ?? "")
        .normalize("NFC")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

    const wynik = dane.map(row => {
      const eksperci = slownik.filter(item =>
        item.typ === "ekspert" &&
        normalizuj(item.nazwa) === normalizuj(row.ekspert)
      );

      const nabory = slownik.filter(item =>
        item.typ === "nabor" &&
        normalizuj(item.nazwa) === normalizuj(row.nr_naboru)
      );

      const opiekunowie = slownik.filter(item =>
        item.typ === "opiekun" &&
        normalizuj(item.nazwa) === normalizuj(row.opiekun)
      );

      const bledy = [];

      if (eksperci.length !== 1)
        bledy.push("Brak jednoznacznego eksperta");

      if (nabory.length !== 1)
        bledy.push("Brak jednoznacznego naboru");

      if (opiekunowie.length !== 1)
        bledy.push("Brak jednoznacznego opiekuna");

      if (!row.nr_wniosku)
        bledy.push("Brak numeru wniosku");

      if (!row.data_oceny)
        bledy.push("Brak daty oceny");

      if (!row.rodzaj_oceny)
        bledy.push("Brak rodzaju oceny");

      if (row.kwota === null ||
          row.kwota === "" ||
          !Number.isFinite(Number(row.kwota)))
        bledy.push("Nieprawidłowa kwota");

      return {
        ...row,
        ekspert_id: eksperci.length === 1 ? eksperci[0].id : null,
        nabor_id: nabory.length === 1 ? nabory[0].id : null,
        pracownik_id: opiekunowie.length === 1 ? opiekunowie[0].id : null,
        status: bledy.length === 0 ? "OK" : "BŁĄD",
        uwagi: bledy.join("; ")
      };
    });

    await storeValue("importPotwierdzenia", wynik, false);

    return {
      wszystkie: wynik.length,
      poprawne: wynik.filter(row => row.status === "OK").length,
      bledne: wynik.filter(row => row.status === "BŁĄD").length,
      bledy: wynik.filter(row => row.status === "BŁĄD")
    };
  }
}

