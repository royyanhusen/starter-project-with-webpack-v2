import { guestNewAddStory } from "../../data/api";

export default class NewStoryGuestPresenter {
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

  async guestAddStory(description, photos, lat, lon) {
    let photo = null;
    if (photos.length > 0) {
      const blob = photos[0].blob;
      // Jika blob bukan File, convert ke File
      if (blob instanceof File) {
        photo = blob;
      } else if (blob instanceof Blob) {
        photo = new File([blob], "camera-photo.jpg", { type: blob.type });
      } else {
        photo = null;
      }
    }

    // console.log("guestAddStory params:", { description, photo, lat, lon });

    try {
      const response = await guestNewAddStory({ description, photo, lat, lon });
      return response;
    } catch (error) {
      console.error("guestNewAddStory: error:", error);
      return { error: true, message: error.message };
    }
  }
}
