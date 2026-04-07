/**
 * API Configuration for GreenPay
 * Handles both web and mobile environments
 */

export function getApiBaseUrl(): string {
  // Check if running in Capacitor (mobile app)
  if (window.Capacitor && window.Capacitor.isNativePlatform?.()) {
    // Use Capacitor server URL for mobile
    const baseUrl = import.meta.env.VITE_API_URL || 'https://greenpay.world';
    return baseUrl;
  }

  // Check for environment variable (build-time configuration)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Check for runtime environment variable
  const envUrl = (window as any).REACT_APP_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // Use current origin for web (same-origin requests)
  // This works for web where React and backend are on same domain
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }

  // Default to production
  return 'https://greenpay.world';
}

/**
 * Construct full API URL from path
 * @example
 * apiUrl('/api/auth/login') → 'https://greenpay.world/api/auth/login'
 */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // If base is root (same-origin), return relative path
  if (base === window.location.origin || base === '/') {
    return normalizedPath;
  }

  // Otherwise combine base URL with path
  return `${base}${normalizedPath}`.replace(/\/+/g, '/').replace(':/', '://');
}

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    isNative: window.Capacitor?.isNativePlatform?.(),
    apiBaseUrl: getApiBaseUrl(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    buildEnv: import.meta.env.MODE,
    apiUrl: import.meta.env.VITE_API_URL || 'default',
  };
}
