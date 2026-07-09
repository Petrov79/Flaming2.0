export default {

  async logout() {
    try {
      await authLogoutSession.run();
    } catch (e) {
      console.error(e);
      showAlert("Błąd podczas wylogowania: " + e.message, "error");
    } finally {
      await clearStore();
      await navigateTo("Logowanie");
    }
  },

  async forceLogout() {
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
        session.expiresAt = authRefreshSession.data[0].expires_at;
        await storeValue("session", session);
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

  isAdmin() {
    return appsmith.store.session?.user?.role?.code === "ADMIN";
  },

  isUser() {
    return appsmith.store.session?.user?.role?.code === "USER";
  },

  async requireAdmin() {

    const sessionOk = await this.checkSession();

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