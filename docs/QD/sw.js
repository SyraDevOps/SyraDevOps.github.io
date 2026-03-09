// Cache version - injected at build time by Vite
// Falls back to timestamp if not built with Vite
const CACHE_NAME = typeof __CACHE_VERSION__ !== 'undefined' 
    ? __CACHE_VERSION__ 
    : `qd-web-${new Date().getTime()}`;

const APP_SHELL = [
    './',
    'index.html',
    'diario.html',
    'linha-do-tempo.html',
    'notas.html',
    'adesivos.html',
    'perfil.html',
    'styles.css',
    'toast-styles.css',
    'script.js',
    'utils.js',
    'Sory.js',
    'drawing.js',
    'stickers.js',
    'stickers-manager.js',
    'font-size.js',
    'theme.js',
    'api-client.js',
    'crypto-utils.js',
    'backup-utils.js',
    'analytics-utils.js',
    'pwa-install.js',
    'manifest.webmanifest',
    'icons/assets/favicon.png',
    'icons/assets/icon.png',
    'icons/assets/adaptive-icon.png',
    'icons/assets/splash-icon.png'
];

// Instalação - cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(APP_SHELL).catch(() => {
                // Se algum arquivo falhar, continua mesmo assim
                return APP_SHELL.map(url => cache.add(url).catch(() => null));
            });
        })
    );
    self.skipWaiting();
});

// Ativação - limpar caches antigos
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

// Fetch - estratégia cache-first com fallback de rede
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Ignorar requisições que não são GET
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Ignorar esquemas não suportados (ex: chrome-extension://)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    // Não fazer cache de APIs (dados sensíveis/dinâmicos)
    if (url.pathname.startsWith('/api') || url.hostname === 'api.syradevops.com') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Log para monitoramento
                    if (!response.ok) console.warn(`API Error: ${response.status} ${url}`);
                    return response;
                })
                .catch(() => {
                    // Se falhar, retornar erro offlineComNet
                    return new Response(
                        JSON.stringify({ error: 'Sem conexão com servidor' }),
                        { status: 503, headers: { 'Content-Type': 'application/json' } }
                    );
                })
        );
        return;
    }

    // Para navegacao de paginas HTML, prioriza rede para evitar interface desatualizada.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const cloned = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
                    }
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match('index.html')))
        );
        return;
    }

    // Estratégia cache-first para arquivos estáticos
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request)
                .then((response) => {
                    // Não fazer cache de respostas que falharem
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }

                    // Fazer clone e armazenar no cache
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
                    return response;
                })
                .catch(() => {
                    // Fallback para cached ou página de offline
                    return caches.match(request) || caches.match('index.html');
                })
        )
    );
});
