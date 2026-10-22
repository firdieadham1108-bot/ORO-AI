// ORO AI service worker - online-first.
// It does NOT cache the app or any data, and nothing can be created or edited offline.
// Its only job: when a page is opened with no connection, show a clear "you are offline" page
// instead of the browser's error screen. Every API call goes straight to the network.
const CACHE = "oro-offline-v1";
const OFFLINE_URL = "offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return; // assets and /api requests are not touched
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
