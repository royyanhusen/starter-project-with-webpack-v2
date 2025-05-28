import { map, tileLayer, Icon, icon, marker, latLng } from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import CONFIG from "../config";
import "leaflet/dist/leaflet.css";

export default class Map {
  #zoom = 5;
  #map = null;
  #activeMarker = null;

  static async getPlaceNameByCoordinate(latitude, longitude) {
    try {
      const url = new URL(
        `https://api.maptiler.com/geocoding/${longitude},${latitude}.json`
      );
      url.searchParams.set("key", CONFIG.MAP_SERVICE_API_KEY);
      url.searchParams.set("language", "id");
      url.searchParams.set("limit", "1");

      const response = await fetch(url);
      const json = await response.json();

      const feature = json.features?.[0];
      if (!feature) return `${latitude}, ${longitude}`;

      const region = feature.context?.find((c) =>
        c.id.includes("region")
      )?.text;
      const country = feature.context?.find((c) =>
        c.id.includes("country")
      )?.text;

      if (region && country) return `${region}, ${country}`;
      return feature.place_name || `${latitude}, ${longitude}`;
    } catch (error) {
      console.error("getPlaceNameByCoordinate error:", error);
      return `${latitude}, ${longitude}`;
    }
  }

  static isGeolocationAvailable() {
    return "geolocation" in navigator;
  }

  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject("Geolocation API unsupported");
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  static async build(selector, options = {}) {
    if (options.locate) {
      try {
        const position = await Map.getCurrentPosition();
        const coordinate = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        const mapInstance = new Map(selector, {
          ...options,
          center: coordinate,
        });
        const placeName = await Map.getPlaceNameByCoordinate(...coordinate);

        mapInstance.#updateLatLonInputs(...coordinate);
        mapInstance.#activeMarker = mapInstance.addMarker(
          coordinate,
          { draggable: true },
          { content: `<strong>Lokasi Anda:</strong> ${placeName}` }
        );

        mapInstance.#setupDragListener(mapInstance.#activeMarker);

        return mapInstance;
      } catch (error) {
        console.error("Gagal mendapatkan lokasi pengguna:", error);
        return null;
      }
    }

    throw new Error("Opsi `locate` harus diaktifkan.");
  }

  constructor(selector, options = {}) {
    const container = document.querySelector(selector);

    if (container && container._leaflet_id) {
      container._leaflet_id = null;
    }

    this.#zoom = options.zoom ?? this.#zoom;

    // Define tile layers (tanpa attribution di sini)
    const tileOsm = tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png");

    const maptilerStreets = tileLayer(
      `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${CONFIG.MAP_SERVICE_API_KEY}`
    );

    const maptilerSatellite = tileLayer(
      `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${CONFIG.MAP_SERVICE_API_KEY}`
    );

    // Initialize map with attributionControl disabled
    this.#map = map(container, {
      zoom: this.#zoom,
      scrollWheelZoom: false,
      center: options.center ?? [0, 0],
      layers: [maptilerStreets],
      attributionControl: false, // prevent duplicate attribution
      ...options,
    });

    // Add custom attribution once
    L.control
      .attribution({ prefix: false })
      .addAttribution("© MapTiler | OpenStreetMap")
      .addTo(this.#map);

    // Add Layer Control
    const baseMaps = {
      "MapTiler Streets": maptilerStreets,
      "MapTiler Satellite": maptilerSatellite,
      OpenStreetMap: tileOsm,
    };

    L.control.layers(baseMaps).addTo(this.#map);

    // Accessibility enhancements
    setTimeout(() => {
      const controlContainer = document.querySelector(
        ".leaflet-control-layers"
      );
      if (!controlContainer) return;

      controlContainer.setAttribute("tabindex", "0");
      controlContainer.setAttribute("role", "region");
      controlContainer.setAttribute("aria-label", "Pilihan Layer Peta");

      const inputs = controlContainer.querySelectorAll("input[type=radio]");
      inputs.forEach((input) => {
        input.setAttribute("tabindex", "0");

        const label = input.nextSibling?.textContent?.trim();
        if (label) {
          input.setAttribute("aria-label", label);
        }

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            input.click();
          }
        });
      });

      const labels = controlContainer.querySelectorAll("label");
      labels.forEach((label) => {
        label.setAttribute("tabindex", "0");
        label.setAttribute("role", "button");
        label.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            label.click();
          }
        });
      });

      controlContainer.addEventListener("focus", () => {
        controlContainer.style.outline = "2px solid #4a90e2";
      });
      controlContainer.addEventListener("blur", () => {
        controlContainer.style.outline = "none";
      });
    }, 200);

    this.#enableMapClickToSetMarker();
  }

  destroy() {
    if (this.#map) {
      this.#map.off();
      this.#map.remove();
      this.#map = null;
      this.#activeMarker = null;
    }
  }

  changeCamera(coordinate, zoomLevel = null) {
    if (!zoomLevel) {
      this.#map.setView(latLng(coordinate), this.#zoom);
      return;
    }
    this.#map.setView(latLng(coordinate), zoomLevel);
  }

  createIcon(options = {}) {
    return icon({
      ...L.Icon.Default.prototype.options,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      ...options,
    });
  }

  addMarker(coordinates, markerOptions = {}, popupOptions = null) {
    const newMarker = marker(coordinates, {
      icon: this.createIcon(),
      draggable: true,
      ...markerOptions,
    });

    let popupContent = `Lat: ${coordinates[0]}, Lng: ${coordinates[1]}`;
    if (popupOptions?.content) {
      popupContent = popupOptions.content;
    }

    newMarker.bindPopup(popupContent).openPopup();
    newMarker.addTo(this.#map);
    return newMarker;
  }

  #updateLatLonInputs(lat, lon) {
    const latInput = document.querySelector("#lat");
    const lonInput = document.querySelector("#lon");
    if (latInput && lonInput) {
      latInput.value = lat.toFixed(6);
      lonInput.value = lon.toFixed(6);
    }
  }

  #setupDragListener(markerInstance) {
    markerInstance.on("dragend", async () => {
      const position = markerInstance.getLatLng();
      const placeName = await Map.getPlaceNameByCoordinate(
        position.lat,
        position.lng
      );

      this.#updateLatLonInputs(position.lat, position.lng);
      markerInstance.setPopupContent(`Lokasi dipilih: ${placeName}`);
      markerInstance.openPopup();
    });
  }

  #enableMapClickToSetMarker() {
    this.#map.on("click", async (e) => {
      const { lat, lng } = e.latlng;

      this.#updateLatLonInputs(lat, lng);

      if (this.#activeMarker) {
        this.#map.removeLayer(this.#activeMarker);
      }

      const placeName = await Map.getPlaceNameByCoordinate(lat, lng);

      this.#activeMarker = this.addMarker(
        [lat, lng],
        { draggable: true },
        { content: `Lokasi dipilih: ${placeName}` }
      );

      this.#setupDragListener(this.#activeMarker);
    });
  }
}
