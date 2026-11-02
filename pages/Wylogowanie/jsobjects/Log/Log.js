export default {

  async write(
    eventType,
    description,
    userId = null,
    userName = null,
    sessionToken = null,
    details = null
  ) {

    try {

      await logEvent.run({

        eventType,
        description,
        userId,
        userName,
        sessionToken,
        details

      });

    } catch (e) {

      console.error("Błąd zapisu logu:", e);

    }

  }

}