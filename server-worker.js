const CACHE_NAME = "plantvision-v1";
const assets = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json"
];

// Install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
  );
});

// Fetch
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});