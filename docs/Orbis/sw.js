const CACHE = "orbis-shell-v20";
const SHELL = [
  "./", "./index.html", "./styles/app.css?v=18", "./scripts/app.js?v=20", "./manifest.webmanifest?v=18",
  "./assets/logo-orbis.svg", "./assets/logo-orbis-symbol.svg", "./assets/icons/orbis-icon.svg", "./assets/icons/orbis-maskable.svg"
];

self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
