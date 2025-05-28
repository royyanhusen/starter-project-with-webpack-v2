import StoryDetailPresenter from "./stories-detail-presenter";
import Map from "../../utils/map";
import {
  generateSaveReportButtonTemplate,
  generateRemoveReportButtonTemplate,
} from "../../templates";

import NotFoundPage from "../not-found-page/not-found-page"; // Pastikan path ini benar

export default class StoryDetailPage {
  #map = null;
  #presenter = null;
  #storyId = null;

  async render() {
    return `
      <section class="story-detail detail-container" aria-labelledby="story-detail-heading">
        <div class="story-detail-card">
          <h2 id="story-detail-heading" class="story-detail-title">Detail Cerita</h2>

          <figure id="story-photo-container" tabindex="-1">
            <img 
              id="story-image"
              src="" 
              alt="Foto dokumentasi cerita" 
              class="story-photo" 
              loading="lazy"
            />
          </figure>

          <article class="story-detail-content" aria-labelledby="detail-content-heading">
            <h3 id="detail-content-heading" class="story-detail-title-dua">Detail Lengkap</h3>

            <div class="story-detail-item">
              <label for="story-title">Nama:</label>
              <p id="story-title" class="story-detail-name" tabindex="0"></p>
            </div>

            <div class="story-detail-item">
              <label for="story-description">Deskripsi:</label>
              <p id="story-description" class="story-detail-description" tabindex="0"></p>
            </div>

            <div class="story-detail-item">
              <label for="story-date">Tanggal Dibuat:</label>
              <span id="story-date" class="story-detail-date" tabindex="0"></span>
            </div>

            <div class="story-detail-item">
              <label for="story-location">Alamat:</label>
              <span id="story-location" class="story-detail-location" tabindex="0"></span>
            </div>

            <div class="story-detail-item">
              <label for="story-location-lat">Latitude:</label>
              <span id="story-location-lat" class="story-detail-location-lat" tabindex="0"></span>
            </div>

            <div class="story-detail-item">
              <label for="story-location-long">Longitude:</label>
              <span id="story-location-long" class="story-detail-location-long" tabindex="0"></span>
            </div>

            <div class="story-detail-item">
              <label for="story-map-frame">Peta Lokasi:</label>
              <div 
                id="story-map-frame" 
                class="story-map" 
                style="width: 100%; height: 300px; border-radius: 10px; margin-top: 1rem;" 
                role="region" 
                aria-label="Peta lokasi cerita"
                tabindex="0"
              >
                <div class="map-loading">Loading map...</div>
              </div>
            </div>
          </article>

          <div class="actions-wrapper">
            <button onclick="location.href='#/stories'" class="btn-back">
              <i class="fas fa-arrow-left"></i> Kembali
            </button>

            <div id="save-actions-container"></div>
          </div>

        </div>
      </section>
    `;
  }

  async afterRender() {
    const storyId = this._getStoryIdFromUrl();

    if (!storyId) {
      const notFound = new NotFoundPage();
      const app = document.getElementById("main-content");
      app.innerHTML = await notFound.render();
      await notFound.afterRender?.();
      return;
    }

    this.#presenter = new StoryDetailPresenter(this);

    try {
      await this.#presenter.init({ storyId });
    } catch (error) {
      console.error("Gagal memuat detail story:", error);
      const notFound = new NotFoundPage();
      const app = document.getElementById("main-content");
      app.innerHTML = await notFound.render();
      await notFound.afterRender?.();
    }
  }

  async initialMap(lat, lon) {
    const mapContainer = document.querySelector("#story-map-frame");

    if (!mapContainer) {
      console.warn("Map container belum tersedia.");
      return;
    }

    mapContainer.innerHTML = "";

    if (this.#map && typeof this.#map.destroy === "function") {
      this.#map.destroy();
    }
    this.#map = null;

    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log("Inisialisasi peta di:", lat, lon);

    this.#map = new Map("#story-map-frame", {
      center: [lat, lon],
      zoom: 13,
    });

    const placeName = await Map.getPlaceNameByCoordinate(lat, lon);

    this.#map.addMarker(
      [lat, lon],
      { draggable: false },
      {
        content: `<strong>Lokasi:</strong> ${placeName}`,
      }
    );
  }

  _getStoryIdFromUrl() {
    const url = window.location.hash.slice(1);
    const matches = url.match(/\/story-detail\/([^/]+)/);
    return matches ? matches[1] : null;
  }

  setImage(url) {
    const img = document.querySelector("#story-image");
    if (img) img.src = url;
  }

  setTitle(title) {
    const el = document.querySelector("#story-title");
    if (el) el.textContent = title;
  }

  setDescription(desc) {
    const el = document.querySelector("#story-description");
    if (el) el.textContent = desc;
  }

  setDate(dateString) {
    const el = document.querySelector("#story-date");
    if (el)
      el.textContent = new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
  }

  async setLocation(lat, lon) {
    if (!lat || !lon) {
      console.warn("Latitude atau longitude tidak valid:", lat, lon);
      return;
    }

    const locationEl = document.querySelector("#story-location");
    const latEl = document.querySelector("#story-location-lat");
    const lonEl = document.querySelector("#story-location-long");

    if (latEl) latEl.textContent = lat;
    if (lonEl) lonEl.textContent = lon;

    if (locationEl)
      locationEl.textContent = await Map.getPlaceNameByCoordinate(lat, lon);

    await this.initialMap(lat, lon);
  }

  showError(msg) {
    const container = document.querySelector(".detail-container");
    if (container) {
      container.innerHTML = `<p class="error-message">${msg}</p>`;
    }
  }

  renderSaveButton() {
    document.getElementById("save-actions-container").innerHTML =
      generateSaveReportButtonTemplate();

    document
      .getElementById("report-detail-save")
      .addEventListener("click", async () => {
        await this.#presenter.saveReport();
        await this.#presenter.showSaveButton();
      });
  }

  saveToBookmarkSuccessfully(message) {
    console.log(message);
  }

  saveToBookmarkFailed(message) {
    alert(message);
  }

  renderRemoveButton() {
    document.getElementById("save-actions-container").innerHTML =
      generateRemoveReportButtonTemplate();

    document
      .getElementById("report-detail-remove")
      .addEventListener("click", async () => {
        await this.#presenter.removeReport();
        await this.#presenter.showSaveButton();
      });
  }

  removeFromBookmarkSuccessfully(message) {
    console.log(message);
  }

  removeFromBookmarkFailed(message) {
    alert(message);
  }
}
