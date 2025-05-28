import { getStoryDetail } from "../../data/api";
import { dbPromise } from "../../data/database";

const OBJECT_STORE_NAME = "saved-reports";

export default class StoryDetailPresenter {
  constructor(view) {
    this._view = view;
    this._story = null;
  }

  async init({ storyId }) {
    try {
      const result = await getStoryDetail(storyId);

      // Tambahkan validasi story
      if (!result || result.error || !result.story) {
        throw new Error("Cerita tidak ditemukan.");
      }

      this.setBookmarkStory(result.story);
      this._renderStory(result.story);
      await this.showSaveButton();
    } catch (error) {
      this._renderError(error.message || "Gagal memuat detail cerita.");
      // Tambahkan throw agar afterRender() tahu ini error penting
      throw error;
    }
  }

  _renderStory(story) {
    this._view.setImage(story.photoUrl);
    this._view.setTitle(story.name);
    this._view.setDescription(story.description);
    this._view.setDate(story.createdAt);

    if (typeof story.lat === "number" && typeof story.lon === "number") {
      this._view.setLocation(story.lat, story.lon);
    } else {
      this._view.showError("Lokasi cerita tidak tersedia");
    }
  }

  _renderError(msg) {
    this._view.showError(msg);
  }

  setBookmarkStory(story) {
    this._story = story;
  }

  async showSaveButton() {
    if (!this._story) return;

    const db = await dbPromise;
    const existing = await db.get(OBJECT_STORE_NAME, this._story.id);

    if (existing) {
      this._view.renderRemoveButton();
    } else {
      this._view.renderSaveButton();
    }
  }

  async saveReport() {
    if (!this._story) return;

    try {
      const db = await dbPromise;
      await db.put(OBJECT_STORE_NAME, this._story);
      this._view.saveToBookmarkSuccessfully("Cerita berhasil disimpan.");
    } catch (err) {
      this._view.saveToBookmarkFailed("Gagal menyimpan cerita.");
    }
  }

  async removeReport() {
    if (!this._story) return;

    try {
      const db = await dbPromise;
      await db.delete(OBJECT_STORE_NAME, this._story.id);
      this._view.removeFromBookmarkSuccessfully("Cerita berhasil dihapus.");
    } catch (err) {
      this._view.removeFromBookmarkFailed("Gagal menghapus cerita.");
    }
  }
}
