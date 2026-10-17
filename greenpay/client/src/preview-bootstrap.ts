import { clearStalePreviewCaches } from "./preview-recovery";

declare global {
  interface Window {
    __greenpayBootStage?: string;
    showPreviewBootFailure?: (reason?: unknown) => void;
  }
}

void (async () => {
  window.__greenpayBootStage = "Starting preview bootstrap";
  // In development, an older service worker can serve cached .tsx modules
  // before React mounts, preventing component-level cleanup from ever running.
  if (import.meta.env.DEV && "serviceWorker" in navigator) {
    try {
      window.__greenpayBootStage = "Removing stale service-worker caches";
      const cleanup = clearStalePreviewCaches(navigator.serviceWorker, caches)
        .then(() => true)
        .catch(error => {
          console.warn("Could not clear stale development preview caches:", error);
          return true;
        });
      const completed = await Promise.race([
        cleanup,
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 4000)),
      ]);
      if (!completed) {
        throw new Error("Service-worker cleanup exceeded 4 seconds; refusing to load potentially stale app modules.");
      }
    } catch (error) {
      console.error("Preview cache recovery failed:", error);
      window.showPreviewBootFailure?.(error);
      return;
    }
  }

  try {
    window.__greenpayBootStage = "Loading GreenPay application modules";
    await import("./main");
    window.__greenpayBootStage = "Mounting GreenPay";
  } catch (error) {
    console.error("GreenPay startup module failed:", error);
    window.showPreviewBootFailure?.(error);
  }
})();
