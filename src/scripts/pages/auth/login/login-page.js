import LoginPresenter from "./login-presenter";
import * as StoryApi from "../../../data/api";
import * as AuthModel from "../../../utils/auth";
import Swal from "sweetalert2";

export default class LoginPage {
  #presenter = null;

  async render() {
    return `
    <section class="login-container">
      <article class="login-form-container">
        <h1 class="login__title">Masuk akun</h1>

        <form id="login-form" class="login-form">
          <div class="form-control">
            <label for="email-input" class="login-form__email-title">Email</label>
            <div class="login-form__title-container">
              <input id="email-input" type="email" name="email" placeholder="Contoh: nama@email.com" />
            </div>
          </div>

          <div class="form-control">
            <label for="password-input" class="login-form__password-title">Password</label>
            <div class="login-form__title-container">
              <input id="password-input" type="password" name="password" placeholder="Masukkan password Anda" />
            </div>
          </div>

          <div class="form-buttons login-form__form-buttons">
            <div id="submit-button-container">
              <button class="btn" type="submit">
                <i class="fas fa-sign-in-alt"></i> Masuk
              </button>
            </div>
            <p class="login-form__do-not-have-account">
              Belum punya akun? <a href="#/register">Daftar</a>
            </p>
          </div>
        </form>

        <hr style="margin: 2rem 0; border: 0; border-top: 1px solid #ccc;" />

        <!-- Tombol Buat Cerita Tamu -->
        <div style="margin-top: 1.5rem;">
          <button
            id="guest-create-button"
            class="btn"
            type="button"
            onclick="location.href='#/new-guest-story'"
            style="background-color: #28a745; color: white;"
          >
            <i class="fas fa-user-secret"></i> Buat Cerita Tamu
          </button>
        </div>
      </article>
    </section>
  `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter({
      view: this,
      model: StoryApi,
      authModel: AuthModel,
    });

    this.#setupForm();
  }

  #setupForm() {
    document
      .getElementById("login-form")
      .addEventListener("submit", async (event) => {
        event.preventDefault();

        const data = {
          email: document.getElementById("email-input").value,
          password: document.getElementById("password-input").value,
        };
        await this.#presenter.getLogin(data);
      });
  }

  loginSuccessfully(message) {
    console.log("login sukses", message);

    // Redirect ke halaman utama
    location.hash = "/";
  }

  loginFailed(message) {
    Swal.fire({
      icon: "error",
      title: "Login Gagal",
      text: message,
      confirmButtonColor: "#007BFF", // warna biru tombol OK
    });
  }

  showSubmitLoadingButton() {
    document.getElementById("submit-button-container").innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Masuk
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById("submit-button-container").innerHTML = `
      <button class="btn" type="submit">
        <i class="fas fa-sign-in-alt"></i> Masuk
      </button>    
    `;
  }
}
