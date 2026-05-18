const CACHE_NAME = 'mebistium-v27-12';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './index.css',
];

// Activar inmediatamente sin esperar — no bloquear en waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // index.js e index.html: siempre red primero, sin cache stale
  if (url.pathname.endsWith('index.js') || url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then((response) => {
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  // Resto: red primero, cache como fallback
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response && response.status === 200) {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned)).catch(() => {});
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
