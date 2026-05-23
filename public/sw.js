const CACHE_NAME = "berc-utensili-cache-v1";

// Install Event
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing Old Cache");
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Exclude non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Exclude chrome-extension, supabase database calls, and Vite HMR/dev files
  if (
    !event.request.url.startsWith("http") ||
    event.request.url.includes("supabase.co") ||
    event.request.url.includes("/@vite/") ||
    event.request.url.includes("/node_modules/") ||
    url.pathname.startsWith("/ws")
  ) {
    return;
  }

  // Network-First strategy with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If a valid response, cache it
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, serve from cache
        return caches.match(event.request);
      })
  );
});
