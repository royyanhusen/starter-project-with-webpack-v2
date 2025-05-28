import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import Header from "./components/header.js";
import config from "../config";
import { getLogout } from "../utils/auth";
import Swal from "sweetalert2";
import { setupSkipToContent, transitionHelper } from "../utils";
import Footer from "./components/footer.js";
import router from "../../scripts/routes/router.js";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #skipLinkButton;

  constructor({ navigationDrawer, drawerButton, content, skipLinkButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#skipLinkButton = skipLinkButton;

    this.footer = new Footer();
    this.header = new Header();

    this.#init();
  }

  #init() {
    setupSkipToContent(this.#skipLinkButton, this.#content);
    this._setupDrawer();
    this.#renderFooter();
  }

  _setupDrawer() {
    if (this.#drawerButton) {
      this.#drawerButton.addEventListener("click", () => {
        this.#navigationDrawer.classList.toggle("open");
      });
    }

    if (this.#navigationDrawer) {
      document.body.addEventListener("click", (event) => {
        if (
          !this.#navigationDrawer.contains(event.target) &&
          !this.#drawerButton.contains(event.target)
        ) {
          this.#navigationDrawer.classList.remove("open");
        }

        this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
          if (link.contains(event.target)) {
            this.#navigationDrawer.classList.remove("open");
          }
        });
      });
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    console.log("[DEBUG] Current route:", url);

    // Ambil getter fungsi halaman dari routes
    const pageGetter = routes[url];
    const token = localStorage.getItem(config.ACCESS_TOKEN_KEY);

    // Jika route tidak ditemukan, redirect ke login
    if (!pageGetter) {
      console.warn("[WARN] Route tidak ditemukan:", url);
      location.hash = "#/login";
      return;
    }

    // Panggil fungsi getter route, hasilnya bisa null (guard) atau instance halaman
    const pageInstance = pageGetter();

    // Jika guard mengembalikan null (redirect sedang terjadi), stop render
    if (!pageInstance) {
      console.info("[INFO] Rendering dibatalkan oleh guard, redirect terjadi");
      return;
    }

    // Validasi method render di halaman
    if (typeof pageInstance.render !== "function") {
      console.error("[ERROR] Halaman tidak valid: render() tidak ditemukan.");
      this.#content.innerHTML = `<h2>Halaman tidak valid.</h2>`;
      return;
    }

    // Atur visibilitas UI (header, drawer) sesuai halaman
    if (["/login", "/register", "/new-guest-story"].includes(url)) {
      this.#hideDrawerButton();
      this.#hideHeader();
    } else {
      this.#showDrawerButton();
      this.#showHeader();
    }

    // Gunakan transitionHelper untuk efek transisi halaman
    const transition = transitionHelper({
      updateDOM: async () => {
        this.#content.innerHTML = await pageInstance.render();
        await pageInstance.afterRender?.();
      },
    });

    // Tangani error saat transition
    transition.ready?.catch((err) => {
      if (
        !(
          err.message?.includes("unsupported") ||
          err.message?.includes("skipped")
        )
      ) {
        console.error("[Transition Error]", err);
      }
    });

    transition.updateCallbackDone.then(() => {
      scrollTo({ top: 0, behavior: "instant" });
      this.#setupNavigationList?.();
    });
  }

  #hideDrawerButton() {
    if (this.#drawerButton) {
      this.#drawerButton.style.display = "none";
    }
  }

  #showDrawerButton() {
    if (this.#drawerButton) {
      this.#drawerButton.style.display = "block";
    }
  }

  #showHeader() {
    const headerContainer = document.querySelector("#header-container");
    if (headerContainer) {
      const headerElement = this.header.createHeader();

      headerContainer.innerHTML = "";
      headerContainer.appendChild(headerElement);

      // Setup drawer only in header OR in App, avoid both
      this.header.setupDrawer();

      // Setup notification UI dan subscription status
      this.header.setupNotificationUI().catch(console.error);
      this.header.checkSubscriptionStatus();

      // **Tambah ini supaya dapat mendengarkan pesan dari service worker**
      this.header.listenToServiceWorkerMessages();

      this.#setupLogoutButton();
    } else {
      console.warn(
        "Element #header-container tidak ditemukan. Header tidak dapat ditampilkan."
      );
    }
  }

  #renderFooter() {
    const footerContainer = document.querySelector("#footer-container");
    if (footerContainer) {
      footerContainer.innerHTML = this.footer.render();
    } else {
      console.warn(
        "Element #footer-container tidak ditemukan. Footer tidak dapat ditampilkan."
      );
    }
  }

  #hideHeader() {
    const headerContainer = document.querySelector("#header-container");
    if (headerContainer) {
      headerContainer.innerHTML = "";
    }
  }

  #hideFooter() {
    const footerContainer = document.querySelector("#footer-container");
    if (footerContainer) {
      footerContainer.innerHTML = "";
    }
  }

  #setupLogoutButton() {
    const logoutButton = document.querySelector(".logout-button");

    if (logoutButton) {
      logoutButton.addEventListener("click", async (event) => {
        event.preventDefault();

        const result = await Swal.fire({
          title: "Konfirmasi Logout",
          text: "Apakah Anda yakin ingin keluar?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Ya, keluar!",
          cancelButtonText: "Batal",
        });

        if (result.isConfirmed) {
          getLogout(); // Hapus token
          // localStorage.removeItem(config.ACCESS_TOKEN_KEY);
          location.hash = "/login";
        }
      });
    }
  }

  #setupNavigationList() {
    const navLinks = this.#navigationDrawer?.querySelectorAll("a");

    if (!navLinks) return;

    navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const targetUrl = link.getAttribute("href")?.slice(1); // remove #
        if (targetUrl) {
          location.hash = `#${targetUrl}`;
        }
      });
    });
  }
}

export default App;
