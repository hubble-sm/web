const CACHE_NAME = 'hubble-v1';
const ASSETS = [
  '/',
  '/css/styles.css',
  '/js/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Only cache successful responses
        return cache.addAll([
          '/',
          '/css/styles.css',
          '/js/main.js'
        ]).catch(error => console.log('Cache addAll error:', error));
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
