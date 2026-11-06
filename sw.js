// 嗯嗯日記：離線快取（網路優先，失敗時用快取）
const CACHE = "poodiary-v1.23.0"; // 版本號要跟 index.html 的 APP_VERSION 一致
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-v2.svg", "./icon-v2-180.png", "./icon-v2-192.png", "./icon-v2-512.png", "./icon-v2-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
