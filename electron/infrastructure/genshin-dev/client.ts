import type {CatalogCharacter, CatalogPort} from '../../domain/ports/catalog';
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

/** Normalize roster / catalog names into genshin.dev path slugs. */
export function toCharacterSlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

interface GenshinDevCharacter {
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

async function getCharacter(slug: string): Promise<GenshinDevCharacter> {
  assertSafePathSuffix(`characters/${slug}`);
  return fetchJson<GenshinDevCharacter>(`characters/${slug}`);
}

function characterAssetUrl(slug: string, asset: string): string {
  const config = loadConfig();
  const base = config.genshinDev.baseUrl.replace(/\/$/, '');
  assertSafePathSuffix(`characters/${slug}/${asset}`);
  return `${base}/characters/${encodeURIComponent(slug)}/${encodeURIComponent(asset)}`;
}

async function enrichCharacters(
  names: string[],
): Promise<Record<string, CatalogCharacter>> {
  const unique = [...new Set(names)].slice(0, 80);
  const result: Record<string, CatalogCharacter> = {};
  await Promise.all(
    unique.map(async (name) => {
      const slug = toCharacterSlug(name);
      if (!slug) {
        return;
      }
      try {
        const data = await getCharacter(slug);
        // Only attach asset URLs when the catalog responds — dead CDN links
        // otherwise win over working HoYoLab icons in the renderer.
        result[name] = {
          ...data,
          iconUrl: characterAssetUrl(slug, 'icon'),
          iconBigUrl: characterAssetUrl(slug, 'icon-big'),
          portraitUrl: characterAssetUrl(slug, 'portrait'),
        };
      } catch {
        // Character missing or genshin.dev unavailable; skip enrichment.
      }
    }),
  );
  return result;
}

export function clearGenshinDevCache(): void {
  cache.clear();
}

export const catalogPort: CatalogPort = {
  enrichCharacters,
};
