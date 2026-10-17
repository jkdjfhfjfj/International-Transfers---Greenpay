void (async () => {
  // In development, an older service worker can serve cached .tsx modules
  // before React mounts, preventing component-level cleanup from ever running.
  if (import.meta.env.DEV && "serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    } catch (error) {
      console.warn("Could not clear stale development preview caches:", error);
    }
  }

  await import("./main");
})();
