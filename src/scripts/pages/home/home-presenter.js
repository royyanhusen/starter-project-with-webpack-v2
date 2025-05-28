import { getAllStories } from "../../data/api";
import Map from "../../utils/map";

const HomePresenter = {
  async init() {
    try {
      const token = localStorage.getItem("accessToken");

      const { listStory } = await getAllStories({ token, location: 1 });

      const storiesWithLocation = await Promise.all(
        listStory.map(async (story) => {
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

      return { success: true, stories: storiesWithLocation };
    } catch (error) {
      console.error(error);
      return { success: false, message: "Gagal memuat data cerita" };
    }
  },
};

export default HomePresenter;
