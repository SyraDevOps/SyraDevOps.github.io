// Nexus — Service Worker
// Cacheia o "app shell" (HTML/ícones/fontes/lib) para abrir instalado e offline.
// Nunca intercepta chamadas de sinalização do PeerJS (websocket) nem tráfego WebRTC —
// isso passa direto pela rede, como deveria.

const CACHE_NAME = 'nexus-shell-v7'; // v7: convites seguros, canal exclusivo e transferências verificadas

const APP_SHELL = [
  './',
  './index.html',
  './sobre.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Nunca mexer em WebSocket (sinalização PeerJS) ou métodos não-GET.
  if (req.method !== 'GET') return;
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

  // App shell local: cache-first (abre instantâneo, funciona offline).
  const isLocal = url.origin === self.location.origin;

  if (isLocal) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Recursos externos (fontes, PeerJS via CDN): network-first com fallback pro cache.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
