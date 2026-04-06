import { useEffect, useState } from 'react';

/**
 * Hook to detect offline/online status
 * Also caches responses locally for offline use
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Handle online event
    const handleOnline = () => {
      setIsOnline(true);
      // Emit event for app to refresh data
      window.dispatchEvent(new CustomEvent('app-online'));
    };

    // Handle offline event
    const handleOffline = () => {
      setIsOnline(false);
      // Emit event for app to show offline indicator
      window.dispatchEvent(new CustomEvent('app-offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}

/**
 * Store data locally for offline access
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('LocalStorage read error:', error);
      return defaultValue;
    }
  });

  const setStoredValue = (newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      // Emit storage event for other tabs
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          newValue: JSON.stringify(valueToStore),
        })
      );
    } catch (error) {
      console.error('LocalStorage write error:', error);
    }
  };

  return [value, setStoredValue] as const;
}

/**
 * Cache API response data for offline use
 */
export async function cacheApiResponse(
  endpoint: string,
  data: unknown
) {
  try {
    const key = `api-cache:${endpoint}`;
    window.localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.warn('Cache save failed:', error);
  }
}

/**
 * Get cached API response
 */
export function getCachedApiResponse(endpoint: string): unknown | null {
  try {
    const key = `api-cache:${endpoint}`;
    const cached = window.localStorage.getItem(key);
    if (!cached) return null;
    const { data } = JSON.parse(cached);
    return data;
  } catch (error) {
    console.warn('Cache read failed:', error);
    return null;
  }
}

/**
 * Clear all cached data
 */
export function clearAllCache() {
  try {
    const keys = Object.keys(window.localStorage);
    keys.forEach((key) => {
      if (key.startsWith('api-cache:')) {
        window.localStorage.removeItem(key);
      }
    });

    // Also clear service worker cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CLEAR_CACHE',
      });
    }
  } catch (error) {
    console.error('Cache clear failed:', error);
  }
}

/**
 * Get cache size in bytes
 */
export async function getCacheSize(): Promise<number> {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.cacheSize || 0);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [channel.port2]
      );
    } else {
      resolve(0);
    }
  });
}
