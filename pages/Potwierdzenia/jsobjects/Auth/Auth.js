export default {

  sessionTimer: null,
  logoutTimer: null,

  async logout() {
    try {

      if (this.logoutTimer) {
        clearTimeout(this.logoutTimer);
        this.logoutTimer = null;
      }

      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }

      await authLogoutSession.run();

    } catch (e) {

      console.error(e);

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

  async forceLogout() {

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    try {
      closeModal("ModalSessionTimeout");
    } catch (e) {}

    await clearStore();
    await navigateTo("Logowanie");

  },

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

    const timeout =
      Math.max(
        0,
        expiresAt - now - 60000
      );

    this.sessionTimer = setTimeout(() => {

      showModal("ModalSessionTimeout");

      this.startLogoutTimer();

    }, timeout);

  },

  startLogoutTimer() {

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }

    this.logoutTimer = setTimeout(() => {

      this.logout();

    }, 60000);

  },

  async extendSession() {

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }

    const ok =
      await this.refreshSession();

    if (!ok) {
      return;
    }

    try {
      closeModal("ModalSessionTimeout");
    } catch (e) {}

    this.startSessionTimer();

  },

  isAdmin() {

    return (
      appsmith.store.session?.user?.role?.code ===
      "ADMIN"
    );

  },

  isUser() {

    return (
      appsmith.store.session?.user?.role?.code ===
      "USER"
    );

  },

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

  }

}