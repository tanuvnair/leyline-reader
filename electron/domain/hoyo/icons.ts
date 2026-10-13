/**
 * Resolve HoYoLab / CDN character icon strings into absolute HTTPS URLs.
 * `iconBaseUrl` is the directory that hosts `UI_AvatarIcon_*.png` files.
 */

/** Multi-word English / GOOD keys → `UI_AvatarIcon_*` stems (Enka + HoYoLab). */
const ICON_STEM_ALIASES: Record<string, string> = {
  'raiden shogun': 'Shougun',
  'hu tao': 'Hutao',
  'yae miko': 'Yae',
  'kaedehara kazuha': 'Kazuha',
  'kamisato ayaka': 'Ayaka',
  'kamisato ayato': 'Ayato',
  'arataki itto': 'Itto',
  'kuki shinobu': 'Shinobu',
  'sangonomiya kokomi': 'Kokomi',
  'shikanoin heizou': 'Heizou',
  'yun jin': 'Yunjin',
  'lan yan': 'Lanyan',
  'kujou sara': 'Sara',
  sara: 'Sara',
  yanfei: 'Feiyan',
  amber: 'Ambor',
  jean: 'Qin',
  barbara: 'Barbara',
  traveler: 'PlayerBoy',
  aether: 'PlayerBoy',
  lumine: 'PlayerGirl',
  'al haitham': 'Alhatham',
  alhaitham: 'Alhatham',
};

function asHttpsUrl(raw: string): string | undefined {
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    // not an absolute URL
  }
  return undefined;
}

/** Last whitespace token, letters only — "Kamisato Ayaka" → "Ayaka". */
function stemFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const token = parts[parts.length - 1] ?? name;
  return token.replace(/[^A-Za-z]/g, '');
}

/**
 * Normalize display / GOOD keys for alias lookup.
 * `RaidenShogun` → `raiden shogun`, `HuTao` → `hu tao`.
 */
export function normalizeCharacterNameKey(name: string): string {
  return name
    .trim()
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replaceAll(/[_-]+/g, ' ')
    .toLowerCase()
    .replaceAll(/\s+/g, ' ')
    .trim();
}

/**
 * GOOD keys are often PascalCase (`LanYan`, `RaidenShogun`). Prefer aliases,
 * then joined stem (`Lanyan`) for PascalCase / spaced names, else last token
 * (`Ayaka` from "Kamisato Ayaka").
 */
export function iconStemFromEnglishName(name: string): string | undefined {
  const raw = name.trim();
  const key = normalizeCharacterNameKey(raw);
  if (!key) {
    return undefined;
  }
  if (ICON_STEM_ALIASES[key]) {
    return ICON_STEM_ALIASES[key];
  }

  const pascalOrSpaced =
    /[a-z][A-Z]/.test(raw) ||
    /^[A-Z][a-z]+[A-Z]/.test(raw) ||
    key.includes(' ');
  if (pascalOrSpaced) {
    const joined = key.replaceAll(' ', '');
    if (joined) {
      return joined.charAt(0).toUpperCase() + joined.slice(1);
    }
  }

  const spaced = key.replaceAll(/\b\w/g, (ch) => ch.toUpperCase());
  const stem = stemFromName(spaced);
  return stem || undefined;
}

/**
 * Turn API icon fields (full URL, protocol-relative, or UI_AvatarIcon_*) into
 * an absolute HTTPS URL using the configured CDN directory.
 */
export function resolveCharacterIconUrl(
  raw: string | undefined,
  name: string | undefined,
  iconBaseUrl: string,
): string | undefined {
  const base = iconBaseUrl.replace(/\/$/, '');
  if (!base.startsWith('https://')) {
    return undefined;
  }

  if (raw?.trim()) {
    const value = raw.trim();
    const absolute = asHttpsUrl(value);
    if (absolute) {
      return absolute;
    }
    if (value.startsWith('//')) {
      return asHttpsUrl(`https:${value}`);
    }
    if (value.startsWith('UI_AvatarIcon_')) {
      const file = value.endsWith('.png') ? value : `${value}.png`;
      return `${base}/${file}`;
    }
  }

  if (name) {
    const stem = iconStemFromEnglishName(name);
    if (stem) {
      return `${base}/UI_AvatarIcon_${stem}.png`;
    }
  }

  return undefined;
}
