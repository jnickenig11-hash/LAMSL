const CACHE_NAME = 'lamsl-mobile-v2';
const ASSETS = ['mobile.html', 'css/mobile.css', 'js/mobile.js', 'js/backend-config.js', 'Images/LAMSLLogo.jpg', 'manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache backend API responses; always let the page fetch fresh content.
  if (url.pathname.includes('/api/')) return;

  // Only apply the mobile cache strategy to same-origin assets.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') return caches.match('mobile.html');
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
