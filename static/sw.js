// Service Worker for Mayo FamilyNest PWA - Minimal version until Sprint 4
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("v1").then((cache) => {
      try {
        return cache.addAll(["/"]);
      } catch (err) {
        console.warn("SW cache addAll skipped:", err);
        return Promise.resolve();
      }
    })
  );
});