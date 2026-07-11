export default {
  async logout() {
    try {
      await authLogoutSession.run();
    } finally {
      await clearStore();
      navigateTo("Logowanie");
    }
  }
}