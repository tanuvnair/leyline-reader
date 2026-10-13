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

/** Drop HoYo overview / characters / abyss caches (link, unlink, lock, force). */
export function clearHoyoDataCache(): void {
  store.clear();
}
