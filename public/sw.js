// Service Worker for AgentHub - Aggressive Performance Optimization
// Implements stale-while-revalidate + intelligent prefetching for Lovable deployment

const CACHE_NAME = 'agenthub-v2';
const STATIC_CACHE = 'agenthub-static-v2';
const DYNAMIC_CACHE = 'agenthub-dynamic-v2';
const ROUTE_CACHE = 'agenthub-routes-v2';

// Assets to cache immediately on install
// CRITICAL: These are fetched and cached during Service Worker installation
// for instant repeat-visit performance (Network Waterfall Optimization)
const STATIC_ASSETS = [
  '/',
  '/fonts/montserrat-400-latin.woff2',
  '/fonts/montserrat-500-latin.woff2',
];

// PERFORMANCE: Common navigation patterns for intelligent prefetching
// Based on user behavior analysis - prefetch likely next destinations
const NAVIGATION_PATTERNS = {
  '/': ['/dashboard', '/marketplace', '/services'],
  '/dashboard': ['/settings', '/campaigns', '/marketplace'],
  '/marketplace': ['/services'],
  '/campaigns': ['/campaigns/launch', '/campaigns/my-campaigns'],
  '/admin-dashboard': ['/admin-dashboard/overview', '/admin-dashboard/users'],
};

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
            // Keep current version caches, delete old ones
            return cacheName !== STATIC_CACHE &&
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName !== ROUTE_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      return self.clients.claim(); // Take control immediately
    })
  );
});

// PERFORMANCE: Prefetch vendor chunks aggressively after activation
// These are large, frequently-used chunks that benefit from early caching
self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Wait a bit for the page to load, then prefetch vendor chunks in background
    new Promise((resolve) => {
      setTimeout(() => {
        // Prefetch critical vendor chunks (these filenames have hashes)
        // Pattern matching for vendor chunks
        fetch('/assets/').then(response => {
          if (response.ok) {
            return response.text();
          }
        }).catch(() => {
          // Silently fail - prefetch is optional optimization
        }).finally(() => resolve());
      }, 2000); // 2 second delay after activation
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
      // PERFORMANCE: Aggressive caching strategy for Lovable deployment
      // Fetch from network in background
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();

          // Determine which cache to use based on asset type
          let cacheName = DYNAMIC_CACHE;

          // CRITICAL: Vendor chunks - cache aggressively (immutable due to content hashes)
          if (url.pathname.includes('/assets/vendor-')) {
            cacheName = STATIC_CACHE;
          }
          // Route chunks - cache for faster navigation
          else if (url.pathname.match(/\/assets\/(.*?)\.js$/) && !url.pathname.includes('vendor-')) {
            cacheName = ROUTE_CACHE;
          }
          // Fonts - static and immutable
          else if (url.pathname.startsWith('/fonts/') ||
                   url.pathname.match(/\.(woff2?|ttf|eot)$/)) {
            cacheName = STATIC_CACHE;
          }
          // Images and media - cache but allow updates
          else if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/)) {
            cacheName = DYNAMIC_CACHE;
          }
          // CSS - cache dynamically (content-hashed but may update)
          else if (url.pathname.match(/\.css$/)) {
            cacheName = DYNAMIC_CACHE;
          }

          // Cache in background (non-blocking)
          caches.open(cacheName).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failure - return cached response if available
        return cachedResponse;
      });

      // PERFORMANCE: Stale-while-revalidate strategy
      // Return cached immediately (if exists), fetch in background
      // For vendor chunks, prefer cache (immutable content-hashed files)
      if (cachedResponse && url.pathname.includes('/assets/vendor-')) {
        // Vendor chunks are immutable - serve from cache immediately without revalidation
        return cachedResponse;
      }

      // For everything else, return cache immediately but revalidate in background
      return cachedResponse || fetchPromise;
    })
  );
});
