const CACHE_NAME = 'qd-web-v1.5';
const APP_SHELL = [
    './',
    'index.html',
    'diario.html',
    'linha-do-tempo.html',
    'notas.html',
    'perfil.html',
    'styles.css',
    'script.js',
    'Sory.js',
    'drawing.js',
    'stickers.js',
    'font-size.js',
    'theme.js',
    'api-client.js',
    'crypto-utils.js',
    'backup-utils.js',
    'analytics-utils.js',
    'manifest.webmanifest',
    'icons/icon.svg',
    'icons/icon-192.svg',
    'icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Ignora esquemas nao suportados pelo Cache API (ex.: chrome-extension://)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    // Nao faz cache de chamadas da API para evitar dados sensiveis/stale
    if (url.pathname.startsWith('/api') || url.hostname === 'api.syradevops.com') return;

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request)
                .then((response) => {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
                    return response;
                })
                .catch(() => caches.match('index.html'));
        })
    );
});
