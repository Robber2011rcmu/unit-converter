self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('unit-converter-cache-v1').then(function (cache) {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './service-worker.js',
        './icon-192.png',
        './icon-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});