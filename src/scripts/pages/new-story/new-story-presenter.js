import { addNewStory } from "../../data/api";
import config from "../../config";

export default class NewStoryPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  // Menampilkan peta pada halaman
  async showMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error("showMap: error:", error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async addStory(description, photos, lat, lon) {
    const token = localStorage.getItem(config.ACCESS_TOKEN_KEY);
    // console.log("token add story", token);

    if (!token) {
      return { error: true, message: "Token tidak tersedia" };
    }

    // Asumsikan hanya ambil foto pertama
    const photo = photos.length > 0 ? photos[0].blob : null;

    try {
      const response = await addNewStory(description, photo, lat, lon, token);
      return response;
    } catch (error) {
      console.error("addStory: error:", error);
      return { error: true, message: error.message };
    }
  }

  // Menyusun dan menampilkan daftar cerita
  async initialGalleryAndMap() {
    this.#view.showLoading();
    try {
      // Menampilkan peta
      await this.showMap();

      // Mendapatkan daftar cerita
      const response = await this.#model.getAllStories();

      // Menangani respons dari model
      if (!response.ok) {
        console.error("initialGalleryAndMap: response:", response);
        this.#view.populateReportsListError(response.message);
        return;
      }

      // Menampilkan daftar cerita
      this.#view.populateReportsList(response.message, response.listStory);
    } catch (error) {
      console.error("initialGalleryAndMap: error:", error);
      this.#view.populateReportsListError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}
