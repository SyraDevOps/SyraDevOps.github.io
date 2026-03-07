const CACHE_NAME = 'qd-web-v1.3';
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
    'api-client.js',
    'crypto-utils.js',
    'backup-utils.js',
    'analytics-utils.js',
    'manifest.webmanifest',
    'icons/icon.svg',
    'icons/icon-192.svg',
    'icons/icon-512.svg'
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
