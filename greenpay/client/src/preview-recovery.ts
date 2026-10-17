export interface PreviewServiceWorkerContainer {
  getRegistrations(): Promise<Array<{ unregister(): Promise<boolean> }>>;
}

export interface PreviewCacheStorage {
  keys(): Promise<string[]>;
  delete(cacheName: string): Promise<boolean>;
}

export async function clearStalePreviewCaches(
  serviceWorkers: PreviewServiceWorkerContainer | undefined,
  cacheStorage: PreviewCacheStorage | undefined,
): Promise<void> {
  if (serviceWorkers) {
    const registrations = await serviceWorkers.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
  }
  if (cacheStorage) {
    const cacheNames = await cacheStorage.keys();
    await Promise.all(cacheNames.map(cacheName => cacheStorage.delete(cacheName)));
  }
}
