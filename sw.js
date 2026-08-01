// =====================
// MyBrain Service Worker
// =====================

const CACHE_NAME = "mybrain-v12";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",

  "./app.js",
  "./utils.js",
  "./storage.js",
  "./history.js",
  "./dashboard.js",
  "./ui.js",

  "./masterlist.js",
  "./today.js",
  "./journal.js",
  "./calendar.js",

  "./tracker-logging.js",
  "./sleep-tracking.js",
  "./number-tracking.js",
  "./note-tracking.js",
  "./subpages.js",

  "./insights.js",
  "./achievements.js",
  "./customization.js",
  "./more.js",

  "./manifest.json",
  "./icon.svg"
];

// ----- Install -----

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_FILES);
    })
  );
});

// ----- Activate -----

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }

            return null;
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// ----- Fetch -----

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseCopy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseCopy);
        });

        return response;
      })
      .catch(async () => {
        const cachedResponse =
          await caches.match(event.request);

        if (cachedResponse) {
          return cachedResponse;
        }

        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }

        throw new Error(
          "Resource unavailable offline."
        );
      })
  );
});

// ----- Notification clicks -----

self.addEventListener(
  "notificationclick",
  event => {
    event.notification.close();

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then(clientList => {
          for (const client of clientList) {
            if (
              "focus" in client &&
              client.url.includes(
                "/mental-dashboard/"
              )
            ) {
              return client.focus();
            }
          }

          if (self.clients.openWindow) {
            return self.clients.openWindow("./");
          }

          return null;
        })
    );
  }
);
