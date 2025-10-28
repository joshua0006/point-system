// Service Worker for AgentHub - Performance Optimization
// Implements stale-while-revalidate strategy for static assets

const CACHE_NAME = 'agenthub-v1';
const STATIC_CACHE = 'agenthub-static-v1';
const DYNAMIC_CACHE = 'agenthub-dynamic-v1';

// Assets to cache immediately on install
// CRITICAL: These are fetched and cached during Service Worker installation
// for instant repeat-visit performance (Network Waterfall Optimization)
const STATIC_ASSETS = [
  '/',
  '/fonts/montserrat-400-latin.woff2',
  '/fonts/montserrat-500-latin.woff2',
  // Note: montserrat-600 removed (Phase 4 font optimization)
  // Note: Vite-generated JS/CSS chunks are NOT listed here because:
  // 1. Filenames include content hashes that change with each build
  // 2. SW would need to be regenerated after every build
  // 3. Instead, we cache them dynamically via fetch event (stale-while-revalidate)
  // 4. This approach provides better cache invalidation and flexibility
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

  // Skip Vite dev server paths (HMR, modules, etc.)
  if (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/__vite') ||
    url.pathname.includes('/node_modules/.vite/') ||
    url.pathname.includes('/@fs/') ||
    url.pathname.includes('/@id/') ||
    url.pathname === '/@react-refresh' ||
    url.searchParams.has('import') ||
    url.searchParams.has('direct')
  ) {
    return;
  }

  // Skip WebSocket upgrade requests
  if (request.headers.get('upgrade') === 'websocket') {
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

          // Determine which cache to use based on asset type
          let cacheName = DYNAMIC_CACHE;

          // Static assets (vendor chunks, fonts, images)
          if (url.pathname.startsWith('/assets/vendor-') ||
              url.pathname.startsWith('/fonts/') ||
              url.pathname.match(/\.(woff2?|ttf|eot|png|jpg|jpeg|gif|svg|ico)$/)) {
            cacheName = STATIC_CACHE;
          }
          // Route chunks and other assets
          else if (url.pathname.startsWith('/assets/')) {
            cacheName = DYNAMIC_CACHE;
          }

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
