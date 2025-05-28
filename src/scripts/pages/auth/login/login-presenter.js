export default class LoginPresenter {
  #view;
  #model;
  #authModel;

  constructor({ view, model, authModel }) {
    this.#view = view;
    this.#model = model;
    this.#authModel = authModel;
  }

  async getLogin({ email, password }) {
    this.#view.showSubmitLoadingButton();
    console.log('Attempting to login with:', { email, password });

    try {
      const response = await this.#model.getLogin({ email, password });
      console.log('Response from API:', response);

      if (!response.ok) {
        console.error("getLogin: response:", response);
        this.#view.loginFailed(response.message);
        return;
      }

      const token = response?.loginResult?.token;
      console.log("Token:", token);
      if (!token) {
        this.#view.loginFailed("Token tidak ditemukan di response.");
        return;
      }

      this.#authModel.putAccessToken(token);
      this.#view.loginSuccessfully(response.message, response.loginResult);
    } catch (error) {
      console.error("getLogin: error:", error);
      this.#view.loginFailed(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}
