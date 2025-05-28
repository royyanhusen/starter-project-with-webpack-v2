import NewStoryPresenter from "./new-story-presenter";
import { generateLoaderAbsoluteTemplate } from "../../templates";
import Map from "../../utils/map";
import * as StoryAPI from "../../data/api";
import Camera from "../../utils/camera";
import { convertBase64ToBlob } from "../../utils";
import config from "../../config";
import Swal from "sweetalert2";

export default class NewStoryPage {
  #presenter = null;
  #map = null;
  #camera = null;
  #takenDocumentations = [];
  #form;
  headerInstance = null;

  async render() {
    return `
    <section class="new-story">
      <div class="form-container">
          <div class="section-header">
            <h2 class="section-title">Buat Cerita Baru</h2>
          </div>
        <form id="add-story-form">
          <div class="form-group">
            <label for="description">Deskripsi Cerita</label>
            <textarea 
              id="description" 
              name="description" 
              placeholder="Tulis deskripsi cerita di sini..." 
              required
            ></textarea>
          </div>

          <div class="form-control">
              <label for="documentations-input" class="new-story-title">Dokumentasi</label>
              <div id="documentations-more-info">Anda dapat menyertakan foto sebagai dokumentasi.</div>
  
              <div class="new-story-container">
                <div class="new-story-documentations-buttons">
                  <button id="documentations-input-button" class="btn btn-outline" type="button">
                    <i class="fas fa-camera"></i> Ambil Gambar
                  </button>
                  <input id="documentations-input" name="documentations" type="file" accept="image/*" multiple="" hidden="hidden" aria-multiline="true" aria-describedby="documentations-more-info">
                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button">
                    <i class="fas fa-video"></i> Buka Kamera
                  </button>
                </div>
                <div id="camera-container" class="new-story-camera-container">
                  <video id="camera-video" class="new-story-camera-video">
                    Video stream not available.
                  </video>
                  <canvas id="camera-canvas" class="new-story-camera-canvas"></canvas>
  
                  <div class="new-story-camera-tools">
                    <select id="camera-select"></select>
                    <div class="new-story-camera-tools_buttons">
                      <button id="camera-take-button" class="btn" type="button">
                        Ambil Gambar
                      </button>
                    </div>
                  </div>
                </div>
                <ul id="documentations-taken-list" class="new-story-documentations-outputs"></ul>
              </div>
          </div>

          <div>
            <label for="map" style="font-weight: bold;">Tentukan Lokasi (Klik pada peta)</label>
            <div id="map" class="map-container"></div>
            <div id="map-loading-container"></div>
          </div>

          <div class="new-story-location">
            <input 
              type="number" 
              id="lat" 
              name="lat" 
              placeholder="Contoh: -6.200000" 
              step="any"
            />
            <input 
              type="number" 
              id="lon" 
              name="lon" 
              placeholder="Contoh: 106.816666" 
              step="any"
            />
          </div>

          <div class="btn-new-story">
            <button type="submit" class="submit-button">
                <i class="fas fa-paper-plane"></i> Kirim Cerita
            </button>
          </div>
        </form>
      </div>
    </section>
  `;
  }

  async afterRender() {
    this.#presenter = new NewStoryPresenter({
      view: this,
      model: StoryAPI,
    });

    this.#presenter.showMap();

    await this.initialMap(); // Panggil method untuk inisialisasi peta
    this.#setupCamera(); // Setup Kamera

    // Initialize this.#form
    this.#form = document.getElementById("add-story-form");

    this.#form.addEventListener("submit", (event) =>
      this.handleFormSubmit(event)
    );

    document
      .getElementById("documentations-input")
      .addEventListener("change", async (event) => {
        const files = event.target.files;
        // console.log("Files selected:", files);

        const insertingPicturesPromises = Object.values(event.target.files).map(
          async (file) => {
            return await this.#addTakenPicture(file);
          }
        );
        await Promise.all(insertingPicturesPromises);
        await this.#populateTakenPictures();
      });

    document
      .getElementById("documentations-input-button")
      .addEventListener("click", () => {
        // Accessing this.#form after initialization
        this.#form.elements.namedItem("documentations-input").click();
      });

    document
      .getElementById("open-documentations-camera-button")
      .addEventListener("click", async (event) => {
        const cameraContainer = document.getElementById("camera-container");
        const cameraButton = event.currentTarget;

        // Toggle open/close class untuk container kamera
        cameraContainer.classList.toggle("open");

        // Mengganti teks dan ikon tombol dengan benar
        if (cameraContainer.classList.contains("open")) {
          // Ketika kamera dibuka
          cameraButton.classList.remove("open-camera");
          cameraButton.classList.add("close-camera");
          // cameraButton.innerHTML = `<i class="fas fa-times"></i> Tutup Kamera`;
          cameraButton.innerHTML = `<i class="fas fa-times"></i> Tutup Kamera`;
          cameraButton.style.backgroundColor = "#e53935"; // merah terang
          cameraButton.style.color = "white"; // teks putih biar kontras

          await this.#camera.launch(); // Meluncurkan kamera
        } else {
          // Ketika kamera ditutup
          cameraButton.classList.remove("close-camera");
          cameraButton.classList.add("open-camera");
          cameraButton.innerHTML = `<i class="fas fa-video"></i> Buka Kamera`;
          cameraButton.style.backgroundColor = ""; // reset ke default
          cameraButton.style.color = ""; // reset ke default

          this.#camera.stop(); // Menutup kamera
        }
      });

    // Mematikan kamera saat user meninggalkan halaman
    window.addEventListener("hashchange", () => {
      if (this.#camera) {
        this.#camera.stop();
      }
    });

    window.addEventListener("beforeunload", () => {
      if (this.#camera) {
        this.#camera.stop();
      }
    });
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const description = formData.get("description");
    const lat = formData.get("lat") || null;
    const lon = formData.get("lon") || null;

    const token = localStorage.getItem(config.ACCESS_TOKEN_KEY);

    try {
      const response = await this.#presenter.addStory(
        description,
        this.#takenDocumentations,
        lat,
        lon
      );

      if (response.error) {
        await Swal.fire({
          icon: "error",
          title: "Gagal",
          text: response.message,
        });
      } else {
        // Notifikasi untuk Header (asumsikan kamu punya akses instance header)
        if (this.headerInstance) {
          const newNotification = {
            title: "Story berhasil dibuat",
            options: {
              body: `Anda telah membuat story baru dengan deskripsi: ${description}`,
            },
          };

          // Tambah notifikasi ke storage dan update UI
          this.headerInstance.addNotification(newNotification);
          this.headerInstance.showNotificationList();
        }

        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Story berhasil dibuat",
          position: "top-end",
          toast: true,
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });

        window.location.hash = "/";
      }
    } catch (error) {
      console.error("Error:", error);
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal menambahkan cerita",
      });
    }
  }

  #setupCamera() {
    this.#camera = new Camera({
      video: document.getElementById("camera-video"),
      cameraSelect: document.getElementById("camera-select"),
      canvas: document.getElementById("camera-canvas"),
    });

    document
      .getElementById("camera-take-button")
      .addEventListener("click", async () => {
        const image = await this.#camera.takePicture();
        await this.#addTakenPicture(image);
        await this.#populateTakenPictures();
      });
  }

  async #addTakenPicture(image) {
    let blob = image;

    if (image instanceof String) {
      blob = await convertBase64ToBlob(image, "image/png");
    }

    const newDocumentation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob: blob,
    };
    this.#takenDocumentations = [
      ...this.#takenDocumentations,
      newDocumentation,
    ];
  }

  async #populateTakenPictures() {
    const html = this.#takenDocumentations.reduce(
      (accumulator, picture, currentIndex) => {
        const imageUrl = URL.createObjectURL(picture.blob);
        return accumulator.concat(`
        <li class="new-story-documentations-outputs-item">
          <button type="button" data-deletepictureid="${
            picture.id
          }" class="new-story-documentations-outputs-item__delete-btn">
            <img src="${imageUrl}" alt="Dokumentasi ke-${currentIndex + 1}">
          </button>
        </li>
      `);
      },
      ""
    );

    document.getElementById("documentations-taken-list").innerHTML = html;

    document
      .querySelectorAll("button[data-deletepictureid]")
      .forEach((button) =>
        button.addEventListener("click", (event) => {
          const pictureId = event.currentTarget.dataset.deletepictureid;
          this.#removePicture(pictureId);
          this.#populateTakenPictures(); // Refresh gambar yang sudah diambil
        })
      );
  }

  #removePicture(id) {
    this.#takenDocumentations = this.#takenDocumentations.filter(
      (picture) => picture.id !== id
    );
  }

  async initialMap() {
    this.#map = await Map.build("#map", {
      zoom: 10,
      locate: true,
    });
  }

  showMapLoading() {
    document.getElementById("map-loading-container").innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById("map-loading-container").innerHTML = "";
  }
}
