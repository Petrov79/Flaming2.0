export default {
  async login() {
    try {

      // 1. Sprawdzenie loginu i hasła
      await authLogin.run();

      if (!authLogin.data?.length) {
        showAlert("Niepoprawny login lub hasło.", "error");
        return;
      }

      // 2. Usunięcie poprzednich sesji użytkownika
      await authDeleteSessions.run();

      // 3. Utworzenie nowej sesji
      await authCreateSession.run();

      // 4. Wyczyszczenie store
      await clearStore();

      // 5. Zapis sesji
      await storeValue("session", {
        token: authCreateSession.data[0].token,
        createdAt: authCreateSession.data[0].created_at,
        expiresAt: authCreateSession.data[0].expires_at,
        lastActivity: Date.now(),
        lastRefresh: Date.now(),

        user: {
          id: authLogin.data[0].id,
          name: authLogin.data[0].name,
          mail: authLogin.data[0].mail,
          mustChangePassword: authLogin.data[0].must_change_password,

          role: {
            id: authLogin.data[0].role_id,
            code: authLogin.data[0].role_code,
            name: authLogin.data[0].role_name
          }
        }
      });

      // 6. Przekierowanie
      if (authLogin.data[0].must_change_password) {
        navigateTo("ZmianaHasla");
      } else {
        navigateTo("Home");
      }

    } catch (e) {
      console.error(e);
      showAlert("Błąd logowania: " + e.message, "error");
    }
  }
}