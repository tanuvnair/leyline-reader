/**
 * Resolve HoYoLab / CDN character icon strings into absolute HTTPS URLs.
 * `iconBaseUrl` is the directory that hosts `UI_AvatarIcon_*.png` files.
 */

/** Multi-word English names → miHoYo `UI_AvatarIcon_*` stems. */
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

export function iconStemFromEnglishName(name: string): string | undefined {
  const key = name.trim().toLowerCase();
  if (!key) {
    return undefined;
  }
  if (ICON_STEM_ALIASES[key]) {
    return ICON_STEM_ALIASES[key];
  }
  const stem = stemFromName(name);
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
