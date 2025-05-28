import { Database } from "../../data/database";
import Map from "../../utils/map";

const BookmarkPresenter = {
  async init() {
    try {
      const stories = await Database.getAllBookmarks();

      // Proses tambahkan locationName dari lat/lon
      const storiesWithLocation = await Promise.all(
        stories.map(async (story) => {
          let locationName = null;

          if (story.lat && story.lon) {
            locationName = await Map.getPlaceNameByCoordinate(
              story.lat,
              story.lon
            );
          }

          return {
            ...story,
            locationName, // null jika tidak tersedia
          };
        })
      );

      return {
        success: true,
        stories: storiesWithLocation,
      };
    } catch (error) {
      console.error("[BookmarkPresenter] Error:", error);
      return {
        success: false,
        message: "Gagal mengambil data cerita yang disimpan.",
      };
    }
  },
};

export default BookmarkPresenter;
