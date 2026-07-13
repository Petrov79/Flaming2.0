export default {

  async login() {

    try {

      // 1. Pobranie ustawień logowania
      await authGetLoginSettings.run();

      // 2. Sprawdzenie blokady konta
      await authCheckLoginLock.run();

      if (
        authCheckLoginLock.data.length &&
        authCheckLoginLock.data[0].is_locked
      ) {

        const lockUntil = new Date(
          authCheckLoginLock.data[0].login_locked_until
        );

        showAlert(
          "Konto jest zablokowane do " +
          lockUntil.toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit"
          }),
          "warning"
        );

        return;

      }

      // 3. Sprawdzenie loginu i hasła
      await authLogin.run();

      if (!authLogin.data?.length) {

        // Zwiększenie licznika błędnych logowań
        await authLoginFailed.run();

        if (
          authLoginFailed.data.length &&
          authLoginFailed.data[0].login_locked_until
        ) {

          const lockUntil = new Date(
            authLoginFailed.data[0].login_locked_until
          );

          showAlert(
            "Przekroczono liczbę prób logowania. Konto zostało zablokowane do " +
            lockUntil.toLocaleTimeString("pl-PL", {
              hour: "2-digit",
              minute: "2-digit"
            }),
            "error"
          );

        } else {

          showAlert(
            "Niepoprawny login lub hasło.",
            "error"
          );

        }

        return;

      }

      // 4. Wyzerowanie licznika błędnych logowań
      await authResetLoginAttempts.run();

      // 5. Usunięcie poprzednich sesji
      await authDeleteSessions.run();

      // 6. Utworzenie nowej sesji
      await authCreateSession.run();

      // 7. Wyczyszczenie Store
      await clearStore();

      // 8. Zapis sesji
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
          mustChangePassword:
            authLogin.data[0].must_change_password,

          role: {

            id: authLogin.data[0].role_id,
            code: authLogin.data[0].role_code,
            name: authLogin.data[0].role_name

          }

        }

      });

      // 9. Przekierowanie

      if (authLogin.data[0].must_change_password) {

        navigateTo("Zmiana hasła");

      } else {

        navigateTo("Home");

      }

    } catch (e) {

      console.error(e);

      showAlert(
        "Błąd logowania: " + e.message,
        "error"
      );

    }

  }

}