// AdilStore Service Worker — v1
// Provides offline shell and caches static assets

const CACHE_NAME = "adilstore-v1";
const OFFLINE_URL = "/";

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/adilstore-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Skip Supabase API requests — always network
  if (request.url.includes("supabase.co")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Cache successful responses for static assets
          if (
            response.ok &&
            (request.url.includes("/icons/") ||
              request.url.includes("/adilstore-icon") ||
              request.url.includes("/_next/static/"))
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Return offline shell for navigation requests
          if (request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});
