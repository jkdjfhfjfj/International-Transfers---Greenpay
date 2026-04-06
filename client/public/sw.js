const CACHE_NAME = 'greenpay-v4';
const API_CACHE = 'greenpay-api-v4';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url).catch(() => {}))
        );
      }),
      caches.open(API_CACHE)
    ])
  );
});

// Fetch event - with offline API caching support
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always fetch JS and CSS from network to get latest code
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(fetch(event.request).catch(() => {
      return caches.match(event.request);
    }));
    return;
  }

  // API requests - network first, cache fallback for offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful GET requests
          if (response.ok && event.request.method === 'GET') {
            const cacheResponse = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, cacheResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback - return cached response
          return caches.match(event.request).then((cached) => {
            if (cached) {
              return cached;
            }
            // Return offline indicator for failed API
            return new Response(
              JSON.stringify({ offline: true, cached: false }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // For navigation requests (HTML pages), network first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const cacheResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request) || caches.match('/offline.html');
        })
    );
    return;
  }

  // For everything else, cache first then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Activate event - claim all clients immediately and clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Keep current caches
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Handle messages from clients (clear cache, etc)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(CACHE_NAME),
        caches.delete(API_CACHE)
      ]).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  } else if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        let totalSize = 0;
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.open(cacheName).then((cache) => {
              return cache.keys().then((requests) => {
                return Promise.all(
                  requests.map((request) => {
                    return cache.match(request).then((response) => {
                      return response.blob().then((blob) => {
                        totalSize += blob.size;
                      });
                    });
                  })
                );
              });
            });
          })
        ).then(() => {
          event.ports[0].postMessage({ cacheSize: totalSize });
        });
      })
    );
  }
});
