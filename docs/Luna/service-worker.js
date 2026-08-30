const CACHE = 'luna-v21';
const ASSETS = ['./', './index.html', './Pulse.html', './Sobre.html', './manifest.webmanifest', './icons/icon.svg', './runtime/wllama.mjs', './runtime/wllama.wasm', './runtime/pdf.min.mjs', './runtime/pdf.worker.min.mjs'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const save = response => {
    const copy = response.clone();
    if (response.ok || response.type === 'opaque') caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  };
  // HTML novo sempre vem da rede quando possível: evita PWA presa numa versão antiga.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(save).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(save).catch(() => caches.match('./index.html'))));
});
