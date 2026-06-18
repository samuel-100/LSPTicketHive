// Service worker: provides install + offline fallback ONLY.
// Pages and assets are always fetched fresh (network-first / pass-through) so
// new deploys show immediately — no stale-cache "won't refresh" problem.
const CACHE = "lsptickethive-v3";

self.addEventListener("install", (e) => {
  // Pre-cache just the offline page; activate immediately.
  e.waitUntil(caches.open(CACHE).then((c) => c.add("/offline").catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  // Drop all old caches so previous builds can't be served.
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.url.includes("/api/")) return;

  // Navigations: always go to the network; only fall back to offline page if truly offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline")));
    return;
  }
  // Everything else: just pass through to network (no asset caching → never stale).
});

// Allow the page to tell a waiting SW to take over.
self.addEventListener("message", (e) => {
  if (e.data === "skip-waiting") self.skipWaiting();
});

// Web push (future).
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
