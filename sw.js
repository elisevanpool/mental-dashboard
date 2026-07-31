const CACHE_NAME = "mental-dashboard-v4";

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./utils.js",
  "./storage.js",
  "./history.js",
  "./dashboard.js",
  "./ui.js",
  "./today.js",
  "./masterlist.js",
  "./journal.js",
  "./calendar.js",
  "./tracker-logging.js",
  "./subpages.js",
  "./insights.js",
  "./more.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseCopy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseCopy);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});