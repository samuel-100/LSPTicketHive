// Minimal service worker: enables PWA install + offline shell caching.
const CACHE = "lsptickethive-v1";
const APP_SHELL = ["/", "/events", "/offline"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Only handle GET navigations/assets; never cache API calls.
  if (req.method !== "GET" || req.url.includes("/api/")) return;

  if (req.mode === "navigate") {
    // Network-first for pages, fall back to cache/offline.
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/offline")))
    );
    return;
  }

  // Cache-first for static assets.
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res.ok && (req.url.includes("/_next/static") || req.destination === "image")) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => cached))
  );
});

// Show push notifications (for future web-push).
self.addEventListener("push", (e) => {
  if (!e.data) return;
  try {
    const d = e.data.json();
    e.waitUntil(self.registration.showNotification(d.title || "LSPTicketHive", { body: d.body, icon: "/icon.svg", data: d.url }));
  } catch {}
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow(e.notification.data || "/"));
});
