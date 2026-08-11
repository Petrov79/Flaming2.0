export default {

	data: [],

	dataWykazuTekst: "",


	async readFile() {

		if (!FilePickerGPR.files.length) {

			showAlert(
				"Wybierz plik XLSX.",
				"warning"
			);

			return false;
		}

		try {

			const XLSX = {};

			make_xlsx_lib(XLSX);

			// Pobranie Data URL
			const dataUrl =
						FilePickerGPR.files[0].data;

			// Pobranie samego Base64
			const base64 =
						dataUrl.split(",")[1];

			// Odczyt pliku XLSX
			const workbook =
						XLSX.read(
							base64,
							{
								type: "base64",
								cellDates: true
							}
						);

			const sheet =
						workbook.Sheets["wykaz GPR"];

			if (!sheet) {

				showAlert(
					'Nie znaleziono arkusza "wykaz GPR".',
					"error"
				);

				return false;
			}


			// Odczyt tekstu z komórki I1
			this.dataWykazuTekst =
						sheet["I1"]?.v ?? "";


			/*
			 * Odczytujemy dane jako tablicę.
			 *
			 * range: 3 oznacza rozpoczęcie
			 * od 4. wiersza Excela.
			 */
			const rows =
						XLSX.utils.sheet_to_json(
							sheet,
							{
								range: 3,
								header: 1,
								defval: null,
								raw: true
							}
						);

			console.log(
				"Liczba rekordów:",
				rows.length
			);

			console.log(
				"Pierwszy rekord:",
				rows[0]
			);

			const dane =
						rows
				.filter(row =>
							row[4] !== null &&
							row[4] !== undefined &&
							row[4] !== ""
						 )
				.map(row => {

					let kodGminy =
							String(row[4])
					.trim()
					.replace(/\.0$/, "");

					kodGminy =
						kodGminy.padStart(
						7,
						"0"
					);

					return {

						// kolumna E
						kod_gminy:
						kodGminy,

						// kolumna F
						tytul:
						String(
							row[5] || ""
						).trim(),

						// kolumna G
						data_zatwierdzenia:
						this.normalizeDate(
							row[6]
						),

						// kolumna H
						data_wykazu:
						this.normalizeDate(
							row[7]
						),

						// kolumna I
						link:
						String(
							row[8] || ""
						).trim(),

						// tekst z komórki I1
						uchwala:
						this.dataWykazuTekst

					};

				});

			this.data = dane;

			showAlert(
				"Odczytano " +
				dane.length +
				" rekordów.",
				"success"
			);

			return true;

		} catch (e) {

			console.error(e);

			showAlert(
				"Błąd odczytu pliku: " +
				e.message,
				"error"
			);

			return false;
		}
	},


	normalizeDate(value) {

		if (!value) {
			return null;
		}

		/*
		 * Excel przy cellDates=true
		 * zwraca obiekt Date.
		 */
		if (
			Object.prototype.toString.call(value) ===
			"[object Date]"
		) {

			if (isNaN(value.getTime())) {
				return null;
			}

			return (
				value.getFullYear() +
				"-" +
				String(
					value.getMonth() + 1
				).padStart(2, "0") +
				"-" +
				String(
					value.getDate()
				).padStart(2, "0")
			);
		}

		const text =
					String(value).trim();

		// YYYY-MM-DD
		if (
			/^\d{4}-\d{2}-\d{2}$/.test(text)
		) {
			return text;
		}

		// DD-MM-YYYY
		if (
			/^\d{2}-\d{2}-\d{4}$/.test(text)
		) {

			const parts =
						text.split("-");

			return (
				parts[2] +
				"-" +
				parts[1] +
				"-" +
				parts[0]
			);
		}

		// DD.MM.YYYY
		if (
			/^\d{2}\.\d{2}\.\d{4}$/.test(text)
		) {

			const parts =
						text.split(".");

			return (
				parts[2] +
				"-" +
				parts[1] +
				"-" +
				parts[0]
			);
		}

		return null;
	},


	async importData() {

		if (!this.data || this.data.length === 0) {

			showAlert(
				"Brak danych do importu.",
				"warning"
			);

			return false;
		}

		try {

			// Import danych do tabeli gpr
			await importGPR.run();

			// Odświeżenie tabeli GPR
			await getGPR.run();

			showAlert(
				"Import GPR zakończony pomyślnie.",
				"success"
			);

			return true;

		} catch (e) {

			console.error(e);

			showAlert(
				"Błąd importu GPR: " +
				e.message,
				"error"
			);

			return false;
		}
	}

}