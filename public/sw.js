// Service Worker for AgentHub - Performance Optimization
// Implements stale-while-revalidate strategy for static assets

const CACHE_NAME = 'agenthub-v1';
const STATIC_CACHE = 'agenthub-static-v1';
const DYNAMIC_CACHE = 'agenthub-dynamic-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/fonts/montserrat-400-latin.woff2',
  '/fonts/montserrat-500-latin.woff2',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - implement stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and non-GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // Skip Supabase API calls (need fresh data)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Fetch from network in background
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();

          // Determine which cache to use
          const cacheName = url.pathname.startsWith('/assets/')
            ? STATIC_CACHE
            : DYNAMIC_CACHE;

          caches.open(cacheName).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return cached response on network failure
        return cachedResponse;
      });

      // Return cached response immediately (stale-while-revalidate)
      return cachedResponse || fetchPromise;
    })
  );
});
