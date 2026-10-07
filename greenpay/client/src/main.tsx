import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { ErrorBoundary } from "./components/error-boundary";
import "./index.css";

// Polyfill for global if needed
if (typeof global === 'undefined') {
  (window as any).global = window;
}

const APP_VERSION = "1.0.3";
const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

// Only do version-mismatch reload on web — on native it kills the WebView
if (!isNative) {
  const storedVersion = localStorage.getItem("app_version");
  if (storedVersion && storedVersion !== APP_VERSION) {
    localStorage.setItem("app_version", APP_VERSION);
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  } else if (!storedVersion) {
    localStorage.setItem("app_version", APP_VERSION);
  }
}

// ─── Debug overlay (visible on device without adb) ───────────────────────────
function showDebugLine(msg: string) {
  try {
    let overlay = document.getElementById("gp-debug-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "gp-debug-overlay";
      overlay.style.cssText =
        "position:fixed;bottom:0;left:0;right:0;max-height:45vh;" +
        "overflow-y:auto;background:rgba(0,0,0,0.9);color:#ff4444;" +
        "font-size:11px;font-family:monospace;padding:8px;" +
        "z-index:99999;border-top:2px solid #ff0000;";
      document.body?.appendChild(overlay);
    }
    const entry = `[${new Date().toISOString().slice(11, 23)}] ${msg}`;
    const line = document.createElement("div");
    line.style.cssText = "padding:2px 0;border-bottom:1px solid #333;word-break:break-all;";
    line.textContent = entry;
    overlay.appendChild(line);
    overlay.scrollTop = overlay.scrollHeight;
  } catch {}
}

function logError(msg: string, src?: string) {
  const full = msg + (src ? " @ " + src : "");
  console.error("GP_ERROR:", full); // Shows in adb logcat under Capacitor/Console
  if (isNative) showDebugLine(full);
  try {
    const prev: string[] = JSON.parse(sessionStorage.getItem("gp_errors") || "[]");
    prev.push(full);
    if (prev.length > 30) prev.shift();
    sessionStorage.setItem("gp_errors", JSON.stringify(prev));
  } catch {}
}

// Catch all unhandled JS errors — log only, never redirect
window.addEventListener("error", (event) => {
  logError(event.message || "JS Error", event.filename?.split("/").pop());
});

// Catch unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const reason =
    event.reason instanceof Error
      ? event.reason.message + (event.reason.stack ? "\n" + event.reason.stack.split("\n")[1] : "")
      : String(event.reason ?? "Unhandled rejection");
  logError(reason);
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </HelmetProvider>
);
