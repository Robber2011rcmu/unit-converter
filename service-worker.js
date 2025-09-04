const CACHE_NAME = 'unit-converter-cache-v2'; // ← 版本號必改，強制更新
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // 立刻啟用新 SW
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  // 清舊版快取並立刻接管頁面
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 對 index.html 採 network-first，避免舊版卡住；其他採 cache-first
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isIndex = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('index.html');

  if (request.method !== 'GET') return;

  if (isIndex) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(request);
        return cached || new Response('Offline and no cached index.html', { status: 503 });
      }
    })());
  } else {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());
        return fresh;
      } catch (e) {
        return new Response('Offline', { status: 503 });
      }
    })());
  }
});
