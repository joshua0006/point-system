// Service Worker for AgentHub - Performance Optimization
// Implements stale-while-revalidate strategy for static assets
// ENHANCED: Aggressive caching for vendor chunks to improve repeat visit performance

const CACHE_VERSION = 'v3.0'; // Increment when caching strategy changes
const STATIC_CACHE = `agenthub-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `agenthub-dynamic-${CACHE_VERSION}`;
const VENDOR_CACHE = `agenthub-vendor-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/fonts/montserrat-400-latin.woff2',
  '/fonts/montserrat-500-latin.woff2',
];

// PERFORMANCE: Vendor chunks are cached dynamically via pattern matching
// No hardcoded filenames - matches any vendor-*.js, index-*.js, or *.css files

// Install event - cache static assets only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, VENDOR_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !currentCaches.includes(cacheName))
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
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
      // PERFORMANCE: Pattern-based vendor chunk detection (works with any hash)
      // Matches: vendor-*.js, index-*.js, index-*.css files
      const isVendorChunk = /\/assets\/vendor-[a-zA-Z0-9_-]+\.js$/.test(url.pathname) ||
                            /\/assets\/index-[a-zA-Z0-9_-]+\.(js|css)$/.test(url.pathname);

      if (cachedResponse && isVendorChunk) {
        // Return cached vendor chunk immediately, no network fetch needed
        return cachedResponse;
      }

      // Fetch from network in background for non-vendor resources
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();

          // Determine which cache to use
          let cacheName;
          if (isVendorChunk) {
            cacheName = VENDOR_CACHE;
          } else if (url.pathname.startsWith('/assets/')) {
            cacheName = STATIC_CACHE;
          } else {
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
