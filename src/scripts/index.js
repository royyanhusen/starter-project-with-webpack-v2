import "../styles/styles.css";
import "leaflet/dist/leaflet.css";
import App from "./pages/app";
import { registerServiceWorker } from "./utils";
import { setupPWAInstallButton } from "../scripts/templates";
import router from './routes/router';



document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
    skipLinkButton: document.querySelector("#skip-to-content"),
  });
  await app.renderPage();

  await registerServiceWorker();
  console.log("Berhasil mendaftarkan service worker.");

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });
});
