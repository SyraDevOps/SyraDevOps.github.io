/* Nex — service worker
 * - Pré-carrega o "casco" do app para abrir mesmo offline (a interface; as mensagens
 *   continuam precisando de internet, pois o chat é ponto a ponto).
 * - Páginas: rede primeiro, cache como reserva.  Arquivos locais: cache primeiro com
 *   atualização em segundo plano.  Bibliotecas/fontes externas: cache depois do 1º uso.
 * - Nunca intercepta POST, WebSocket/WebRTC nem o serviço de sinalização do PeerJS.
 * Ao alterar qualquer arquivo do app, aumente VERSION para renovar o cache. */
const VERSION = 'nex-v1.0.0';
const SHELL_CACHE = VERSION + '-shell';
const RUNTIME_CACHE = VERSION + '-runtime';

const SHELL = [
  './', './index.html', './registro.html', './sobre.html',
  './nex.css', './nex-app.css', './nex-core.js', './nex-app.js',
  './manifest.json',
  './icons/favicon.ico', './icons/favicon-16.png', './icons/favicon-32.png',
  './icons/icon-192.png', './icons/icon-256.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];

// bibliotecas externas que o app usa (guardadas no 1º acesso)
const CACHEABLE_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // um arquivo ausente não deve impedir a instalação
    await Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('nex-') && !keep.has(n)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

function isOk(res) { return res && (res.ok || res.type === 'opaque'); }

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const res = await fetch(request);
    if (isOk(res)) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const url = new URL(request.url);
    const fallback = await cache.match(url.pathname.endsWith('/') ? './index.html' : './index.html');
    if (fallback) return fallback;
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((res) => {
    if (isOk(res)) cache.put(request, res.clone()).catch(() => {});
    return res;
  }).catch(() => null);
  if (cached) { refresh.catch(() => {}); return cached; }
  const res = await refresh;
  return res || new Response('', { status: 504 });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // páginas: rede primeiro
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // arquivos do próprio app
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith('/sw.js')) return;
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  // bibliotecas e fontes conhecidas
  if (CACHEABLE_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
  // todo o resto (ex.: servidor de sinalização do PeerJS) passa direto
});
