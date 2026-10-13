interface CacheEntry {
  expiresAt: number;
  data: unknown;
}

const store = new Map<string, CacheEntry>();

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function setCached(key: string, data: unknown, ttlMs: number): void {
  if (ttlMs <= 0) {
    return;
  }
  store.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Cache until explicit delete / clearHoyoDataCache (lock, quit, link events).
 * Used for vault-backed payloads (e.g. GOOD artifacts) that are not TTL-bound.
 */
export function setSessionCached(key: string, data: unknown): void {
  store.set(key, {
    data,
    expiresAt: Number.POSITIVE_INFINITY,
  });
}

export function deleteCached(key: string): void {
  store.delete(key);
}

/** Drop HoYo + session caches (link, unlink, lock, quit). */
export function clearHoyoDataCache(): void {
  store.clear();
}
