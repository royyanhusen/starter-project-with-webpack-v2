import { openDB } from "idb";

const DATABASE_NAME = "storyapp";
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = "saved-reports";

export const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade: (database) => {
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      database.createObjectStore(OBJECT_STORE_NAME, {
        keyPath: "id",
      });
    }
  },
});

export const Database = {
  async putBookmark(story) {
    if (!Object.hasOwn(story, "id")) {
      throw new Error("`id` is required to save.");
    }
    return (await dbPromise).put(OBJECT_STORE_NAME, story);
  },

  async getAllBookmarks() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

  async getBookmarkById(id) {
    return (await dbPromise).get(OBJECT_STORE_NAME, id);
  },

  async deleteBookmark(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },
};
