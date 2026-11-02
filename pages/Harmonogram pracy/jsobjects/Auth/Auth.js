export default {

  sessionTimer: null,
  logoutTimer: null,

  // Inicjalizacja sesji
  async initialize() {

    const session = appsmith.store.session;

    if (!session || !session.token) {
      await clearStore();
      await navigateTo("Logowanie");
      return false;
    }

    const ok = await this.checkSession();

    if (!ok) {
      return false;
    }

    this.startSessionTimer();

    return true;
  },

  // Ręczne wylogowanie
  async logout() {

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    try {

      await authLogoutSession.run();

    } catch (e) {

      console.error("Błąd wylogowania:", e);

      showAlert(
        "Błąd podczas wylogowania: " + e.message,
        "error"
      );

    } finally {

      try {
        closeModal("ModalSessionTimeout");
      } catch (e) {}

      await clearStore();
      await navigateTo("Logowanie");

    }
  },

  // Wymuszone wylogowanie
  async forceLogout(destination = "Logowanie") {

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    // Zachowujemy dane przed wyczyszczeniem sesji
    const session = appsmith.store.session;

    // Zapis logu automatycznego wylogowania
    if (destination === "Wylogowanie") {

      await Log.write(
        "AUTO_LOGOUT",
        "Automatyczne wylogowanie",
        session?.user?.id ?? null,
        session?.user?.name ?? null,
        session?.token ?? null
      );

    }

    // Unieważnienie sesji w bazie danych
    try {

      await authLogoutSession.run();

    } catch (e) {

      console.error(
        "Błąd unieważnienia sesji:",
        e
      );

    }

    try {
      closeModal("ModalSessionTimeout");
    } catch (e) {}

    await clearStore();
    await navigateTo(destination);

  },

  // Sprawdzenie ważności sesji
  async checkSession() {

    try {

      await authCheckSession.run();

      if (!authCheckSession.data?.length) {

        showAlert(
          "Sesja wygasła. Zaloguj się ponownie.",
          "warning"
        );

        await this.forceLogout();

        return false;
      }

      return true;

    } catch (e) {

      console.error(e);

      showAlert(
        "Nie można sprawdzić sesji.",
        "error"
      );

      return false;
    }
  },

  // Przedłużenie sesji w bazie danych
  async refreshSession() {

    try {

      await authRefreshSession.run();

      if (!authRefreshSession.data?.length) {

        showAlert(
          "Twoja sesja wygasła. Zaloguj się ponownie.",
          "warning"
        );

        await this.forceLogout();

        return false;
      }

      const session = appsmith.store.session;

      if (session) {

        session.expiresAt =
          authRefreshSession.data[0].expires_at;

        await storeValue(
          "session",
          session
        );

      }

      return true;

    } catch (e) {

      console.error(e);

      showAlert(
        "Nie można odświeżyć sesji.",
        "error"
      );

      return false;
    }
  },

  // Uruchomienie licznika sesji
  startSessionTimer() {

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    const session = appsmith.store.session;

    if (!session?.expiresAt) {
      return;
    }

    const expiresAt =
      new Date(session.expiresAt).getTime();

    const now = Date.now();

    // Modal pojawia się 60 sekund
    // przed wygaśnięciem sesji
    const timeout = Math.max(
      0,
      expiresAt - now - 60000
    );

    this.sessionTimer = setTimeout(() => {

      showModal("ModalSessionTimeout");

      this.startLogoutTimer();

    }, timeout);

  },

  // Automatyczne wylogowanie po 60 sekundach
  startLogoutTimer() {

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }

    this.logoutTimer = setTimeout(async () => {

      await this.forceLogout("Wylogowanie");

    }, 60000);

  },

  // Przedłużenie sesji przez użytkownika
  async extendSession() {

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }

    const ok = await this.refreshSession();

    if (!ok) {
      return;
    }

    try {
      closeModal("ModalSessionTimeout");
    } catch (e) {}

    this.startSessionTimer();

  },

  // Sprawdzenie roli administratora
  isAdmin() {

    return (
      appsmith.store.session?.user?.role?.code ===
      "ADMIN"
    );

  },

  // Sprawdzenie roli użytkownika
  isUser() {

    return (
      appsmith.store.session?.user?.role?.code ===
      "USER"
    );

  },

  // Ochrona stron administracyjnych
  async requireAdmin() {

    const sessionOk =
      await this.checkSession();

    if (!sessionOk) {
      return false;
    }

    if (!this.isAdmin()) {

      showAlert(
        "Brak uprawnień do tej strony.",
        "warning"
      );

      await navigateTo("Home");

      return false;
    }

    return true;

  },	

};
