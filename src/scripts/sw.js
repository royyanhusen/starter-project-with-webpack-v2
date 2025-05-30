import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";

import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";

import config from "./config";

// Aktifkan SW segera setelah terinstal
self.skipWaiting();
clientsClaim();

// Precaching halaman dan assets bawaan (hasil build)
precacheAndRoute(self.__WB_MANIFEST);

// Tambahkan SPA fallback (penting untuk offline)
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));

// Caching file manifest (penting agar manifest selalu terupdate)
registerRoute(
  ({ url }) => url.pathname === "/app.webmanifest",
  new StaleWhileRevalidate({
    cacheName: "manifest-cache",
  })
);

// --- Tambahan: Caching CSS agar tidak hilang saat offline ---
registerRoute(
  ({ request }) => request.destination === "style",
  new StaleWhileRevalidate({
    cacheName: "css-cache",
  })
);

// Runtime caching: Google Fonts
registerRoute(
  ({ url }) =>
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts",
  })
);

// Runtime caching: CSS dan font dari CDN FontAwesome (via cdnjs)
registerRoute(
  ({ url }) =>
    url.origin === "https://cdnjs.cloudflare.com" &&
    url.pathname.startsWith("/ajax/libs/font-awesome/"),
  new CacheFirst({
    cacheName: "fontawesome-cache-v2",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
      }),
    ],
  })
);


// Runtime caching: avatar dari ui-avatars
registerRoute(
  ({ url }) => url.origin === "https://ui-avatars.com",
  new CacheFirst({
    cacheName: "avatars-api",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Runtime caching: API JSON (non-image)
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(config.BASE_URL);
    return url.origin === baseUrl.origin && request.destination !== "image";
  },
  new NetworkFirst({
    cacheName: "story-api",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Runtime caching: Gambar dari API
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(config.BASE_URL);
    return url.origin === baseUrl.origin && request.destination === "image";
  },
  new StaleWhileRevalidate({
    cacheName: "story-api-images",
  })
);

// Runtime caching: MapTiler tile
registerRoute(
  ({ url }) => url.origin === "https://api.maptiler.com",
  new CacheFirst({
    cacheName: "maptiler-api",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 minggu
      }),
    ],
  })
);

registerRoute(
  ({ url }) =>
    url.href.includes("marker-icon.png") ||
    url.href.includes("marker-shadow.png"),
  new CacheFirst({
    cacheName: "leaflet-icons",
  })
);

// Push Notification Handler
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Notifikasi";
  const options = data.options || {};
  const storyId = data.storyId || null;

  console.log("[SW] Push diterima:", title);

  event.waitUntil(self.registration.showNotification(title, options));

  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "NEW_PUSH_MESSAGE",
          payload: { storyId, title, options },
        });
      });
    })
  );
});

// Handle klik notifikasi
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.notification);
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});

// Handling pengiriman pesan untuk force update (misalnya, pada perubahan cache)
self.addEventListener("message", (event) => {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting(); // Memaksa service worker baru untuk aktif segera
  }
});
