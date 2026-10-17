import { clearStalePreviewCaches } from "./preview-recovery";

void (async () => {
  // In development, an older service worker can serve cached .tsx modules
  // before React mounts, preventing component-level cleanup from ever running.
  if (import.meta.env.DEV && "serviceWorker" in navigator) {
    try {
      await clearStalePreviewCaches(navigator.serviceWorker, caches);
    } catch (error) {
      console.warn("Could not clear stale development preview caches:", error);
    }
  }

  await import("./main");
})();
