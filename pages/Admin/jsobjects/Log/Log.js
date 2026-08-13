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

  },


  getLogChartData() {

    const logs = getLogs.data || [];

    const counts = {};

    logs.forEach(log => {

      const type = log.event_type || "INNE";

      counts[type] = (counts[type] || 0) + 1;

    });

    return Object.entries(counts).map(
      ([event_type, count]) => ({
        event_type,
        count
      })
    );

  }

}