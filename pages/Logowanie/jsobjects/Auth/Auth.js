export default {
  async login() {
    try {

      // 1. Sprawdzenie loginu i hasła
      await authLogin.run();

      if (!authLogin.data?.length) {
        showAlert("Niepoprawny login lub hasło.", "error");
        return;
      }

      const user = authLogin.data[0];

      // 2. Usunięcie poprzednich sesji użytkownika
      await authDeleteSessions.run();

      // 3. Utworzenie nowej sesji
      await authCreateSession.run();

      const session = authCreateSession.data[0];

      // 4. Wyczyszczenie store
      await clearStore();

      // 5. Zapis sesji
      await storeValue("session", {
        token: session.token,
        createdAt: session.created_at,
        expiresAt: session.expires_at,

        user: {
          id: user.id,
          name: user.name,
          mail: user.mail,

          role: {
            id: user.role_id,
            code: user.role_code,
            name: user.role_name
          }
        }
      });

      // 6. Przejście do strony głównej
      await navigateTo("Home");

    } catch (e) {
      console.error(e);
      showAlert("Błąd logowania: " + e.message, "error");
    }
  }
}