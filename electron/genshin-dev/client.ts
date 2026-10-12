import {loadConfig} from '../config/load';
import {isHttpsUrl} from '../security/trust';

interface CacheEntry {
  expiresAt: number;
  data: unknown;
}

const cache = new Map<string, CacheEntry>();
const SAFE_PATH_SEGMENT = /^[a-z0-9][a-z0-9-]{0,63}$/i;

function assertSafePathSuffix(pathSuffix: string): void {
  const cleaned = pathSuffix.replace(/^\//, '');
  const segments = cleaned.split('/').filter(Boolean);
  if (segments.length === 0 || segments.length > 4) {
    throw new Error('Invalid genshin.dev path');
  }
  for (const segment of segments) {
    if (segment === '..' || segment === '.' || !SAFE_PATH_SEGMENT.test(segment)) {
      throw new Error('Invalid genshin.dev path segment');
    }
  }
}

async function fetchJson<T>(pathSuffix: string): Promise<T> {
  assertSafePathSuffix(pathSuffix);
  const config = loadConfig();
  const base = config.genshinDev.baseUrl.replace(/\/$/, '');
  if (!isHttpsUrl(base)) {
    throw new Error('genshin.dev base URL must be HTTPS');
  }
  const url = `${base}/${pathSuffix.replace(/^\//, '')}`;
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    config.genshinDev.timeoutMs,
  );
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'error',
      headers: {Accept: 'application/json'},
    });
    if (!response.ok) {
      throw new Error(`genshin.dev request failed (${response.status})`);
    }
    const data = (await response.json()) as T;
    cache.set(url, {
      data,
      expiresAt: Date.now() + config.genshinDev.cacheTtlMs,
    });
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export interface GenshinDevCharacter {
  name?: string;
  title?: string;
  vision?: string;
  weapon?: string;
  nation?: string;
  rarity?: number;
  description?: string;
  birthday?: string;
  constellation?: string;
  [key: string]: unknown;
}

export async function listCharacterIds(): Promise<string[]> {
  return fetchJson<string[]>('characters');
}

export async function getCharacter(id: string): Promise<GenshinDevCharacter> {
  const slug = id.toLowerCase().replace(/\s+/g, '-');
  assertSafePathSuffix(`characters/${slug}`);
  return fetchJson<GenshinDevCharacter>(`characters/${slug}`);
}

export function characterIconUrl(id: string): string {
  const config = loadConfig();
  const base = config.genshinDev.baseUrl.replace(/\/$/, '');
  const slug = id.toLowerCase().replace(/\s+/g, '-');
  assertSafePathSuffix(`characters/${slug}/icon`);
  return `${base}/characters/${encodeURIComponent(slug)}/icon`;
}

export async function enrichCharacters(
  names: string[],
): Promise<Record<string, GenshinDevCharacter & {iconUrl: string}>> {
  const unique = [...new Set(names)].slice(0, 80);
  const result: Record<string, GenshinDevCharacter & {iconUrl: string}> = {};
  await Promise.all(
    unique.map(async (name) => {
      try {
        const data = await getCharacter(name);
        result[name] = {
          ...data,
          iconUrl: characterIconUrl(name),
        };
      } catch {
        // Character may be missing from genshin.dev catalog; skip enrichment.
      }
    }),
  );
  return result;
}

export function clearGenshinDevCache(): void {
  cache.clear();
}
