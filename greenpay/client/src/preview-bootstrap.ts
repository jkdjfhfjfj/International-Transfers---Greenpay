import { clearStalePreviewCaches } from "./preview-recovery";

void (async () => {
  // In development, an older service worker can serve cached .tsx modules
  // before React mounts, preventing component-level cleanup from ever running.
  if (import.meta.env.DEV && "serviceWorker" in navigator) {
    try {
      const cleanup = clearStalePreviewCaches(navigator.serviceWorker, caches)
        .then(() => true)
        .catch(error => {
          console.warn("Could not clear stale development preview caches:", error);
          return true;
        });
      const completed = await Promise.race([
        cleanup,
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 800)),
      ]);
      if (!completed) {
        console.warn("Preview cache cleanup timed out; continuing app startup.");
      }
    } catch (error) {
      console.warn("Could not clear stale development preview caches:", error);
    }
  }

  await import("./main");
})();
