// Bump this version whenever the app shell changes. All runtime dependencies
// are local, and a complete shell is installed before an update can activate.
const CACHE_NAME = 'kaffe-journal-v22';
const SHELL = ['./', './index.html', './styles.css', './app.js', './pour.js', './model.js', './data.js', './manifest.json', './icon.svg'];
const shellURLs = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('kaffe-') && key !== CACHE_NAME).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && url.href.startsWith(self.registration.scope)) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache =>
      (await cache.match('./index.html')) || fetch(request)));
  } else if (shellURLs.has(url.href)) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache =>
      (await cache.match(request)) || fetch(request)));
  }
});
