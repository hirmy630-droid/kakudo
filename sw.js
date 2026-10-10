const CACHE_PREFIX = 'slope-angle-pwa-cache-';
const CACHE_NAME = `${CACHE_PREFIX}20261010-1608`;
const APP_BASE = new URL('./', self.location.href);
const APP_BASE_PATH = APP_BASE.pathname;
const INDEX_URL = new URL('index.html', APP_BASE).href;
const INDEX_PATH = new URL(INDEX_URL).pathname;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(INDEX_URL, { cache: 'reload' });
    if (!response.ok) throw new Error(`index.html fetch failed: ${response.status}`);
    await cache.put(INDEX_URL, response.clone());
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname !== APP_BASE_PATH && url.pathname !== INDEX_PATH) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request, { cache: 'no-store' });
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(INDEX_URL, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(INDEX_URL);
      if (cached) return cached;
      throw error;
    }
  })());
});
