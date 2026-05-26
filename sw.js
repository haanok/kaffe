// Kaffeavhengig service worker
// Strategy:
//   - Network-first for HTML/navigation so edits to index.html show up on
//     refresh during development (and updates roll out fast in production).
//   - Stale-while-revalidate for same-origin static assets and known CDNs
//     (fonts + version-pinned React/Babel from unpkg) — fast offline, fresh
//     on the next visit.
//   - skipWaiting + clients.claim so a new SW takes over immediately.
// Bump CACHE_VERSION to force-clear old caches.

const CACHE_VERSION = 'v7';
const CACHE_NAME = `kaffe-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
];

const CDN_HOSTS = [
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isNavigation = req.mode === 'navigate' || req.destination === 'document';

  // HTML / navigation: network-first, cache fallback.
  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const isKnownCDN = CDN_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith('.' + h));
  if (!sameOrigin && !isKnownCDN) return;

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type !== 'opaque') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
