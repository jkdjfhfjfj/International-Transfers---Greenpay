/**
 * API Configuration for GreenPay
 * Handles both web and mobile (Capacitor) environments
 */

function isNativePlatform(): boolean {
  try {
    const cap = (window as any).Capacitor;
    if (!cap) return false;
    if (typeof cap.isNativePlatform === "function") return cap.isNativePlatform();
    // Fallback: if platform is android or ios, it's native
    return cap.platform === "android" || cap.platform === "ios";
  } catch {
    return false;
  }
}

export function getApiBaseUrl(): string {
  // Native app (Android / iOS) — always call the production server
  if (isNativePlatform()) {
    return import.meta.env.VITE_API_URL || "https://greenpay.world";
  }

  // Build-time env var override
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Runtime window variable
  const envUrl = (window as any).REACT_APP_API_URL;
  if (envUrl) return envUrl;

  // Web: same-origin (React + backend on same domain)
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }

  return "https://greenpay.world";
}

/**
 * Construct full API URL from path
 * @example apiUrl('/api/auth/login') → 'https://greenpay.world/api/auth/login'
 */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (base === window.location.origin || base === "/") {
    return normalizedPath;
  }

  return `${base}${normalizedPath}`.replace(/([^:])\/\/+/g, "$1/");
}

export function getEnvironmentInfo() {
  return {
    isNative: isNativePlatform(),
    apiBaseUrl: getApiBaseUrl(),
    userAgent: navigator.userAgent,
    platform: (window as any).Capacitor?.platform ?? "web",
    buildEnv: import.meta.env.MODE,
    apiUrl: import.meta.env.VITE_API_URL || "default",
  };
}
