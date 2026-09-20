/* ==========================================================================
   METRO-CHECK - Progressive Web App Service Worker (sw.js)
   Provides Offline Inspection Support & Cache Management for Field Officers
   ========================================================================== */

const CACHE_NAME = 'metrocheck-pwa-v1';

// Static assets to pre-cache on Service Worker installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/inspector.html',
  '/admin.html',
  '/officer.html',
  '/report.html',
  '/features.html',
  '/css/style.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/admin.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/masthead.js',
  '/js/notifications.js',
  '/js/pdfService.js',
  '/js/report.js',
  '/js/rules.js',
  '/js/scanner.js',
  '/js/storage.js',
  '/js/pwa.js',
  '/manifest.json',
  '/logo/logo.png',
  '/logo/pwa-icon-192.png',
  '/logo/pwa-icon-512.png',
  '/logo/header-logo-emblem.png',
  '/logo/digital-india.png'
];

// 1. Install Event - Cache Core Static Assets
self.addEventListener('install', (event) => {
  console.log('[METRO-CHECK SW] Installing Service Worker & pre-caching static assets...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[METRO-CHECK SW] Pre-caching partial notice:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event - Cleanup Stale Caches
self.addEventListener('activate', (event) => {
  console.log('[METRO-CHECK SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[METRO-CHECK SW] Deleting obsolete cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event - Strategy: Cache-First for static assets, Network-Only for /api/
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // CRITICAL: NEVER cache API routes (/api/scan, /api/inspections, etc.)
  // Real-time AI vision OCR & central database updates MUST hit network directly.
  if (url.pathname.startsWith('/api/')) {
    return; // Allow normal browser network fetch
  }

  // Only handle GET requests for static app shell & resources
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update to keep cache fresh (stale-while-revalidate pattern)
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && url.origin === location.origin) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {/* Ignore network error when offline */});

        return cachedResponse;
      }

      // Network Fallback for uncached items
      return fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && url.origin === location.origin) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Offline Fallback for HTML page navigation requests
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html') || caches.match(req);
        }
      });
    })
  );
});
