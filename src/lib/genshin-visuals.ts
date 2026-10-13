/** Moegirl Genshincolor-aligned keys used by CSS `data-element` / chips. */
export type GenshinElement =
  | 'pyro'
  | 'hydro'
  | 'anemo'
  | 'electro'
  | 'dendro'
  | 'cryo'
  | 'geo'
  | 'none';

export type GenshinMetric =
  | 'resin'
  | 'commission'
  | 'expedition'
  | 'achievement'
  | 'abyss'
  | 'stars'
  | 'battles'
  | 'status';

export type ConstellationBand = 'low' | 'mid' | 'high' | 'max';
export type FriendshipBand = 'low' | 'mid' | 'high' | 'max';
export type WorldStatKind = 'element' | 'chest' | 'achievement' | 'neutral';

const ELEMENT_ALIASES: Record<string, GenshinElement> = {
  pyro: 'pyro',
  fire: 'pyro',
  hydro: 'hydro',
  water: 'hydro',
  anemo: 'anemo',
  wind: 'anemo',
  electro: 'electro',
  electric: 'electro',
  lightning: 'electro',
  dendro: 'dendro',
  grass: 'dendro',
  cryo: 'cryo',
  ice: 'cryo',
  geo: 'geo',
  rock: 'geo',
  none: 'none',
  adaptive: 'none',
};

/** Map HoYoLab / genshin.dev element or vision strings onto token keys. */
export function normalizeElement(
  raw: string | null | undefined,
): GenshinElement {
  if (!raw) {
    return 'none';
  }
  const key = raw.trim().toLowerCase();
  return ELEMENT_ALIASES[key] ?? 'none';
}

export function constellationBand(
  level: number | null | undefined,
): ConstellationBand {
  const n = Math.max(0, Math.min(6, Number(level) || 0));
  if (n >= 6) {
    return 'max';
  }
  if (n >= 4) {
    return 'high';
  }
  if (n >= 2) {
    return 'mid';
  }
  return 'low';
}

export function friendshipBand(
  fetter: number | null | undefined,
): FriendshipBand {
  const n = Math.max(0, Number(fetter) || 0);
  if (n >= 10) {
    return 'max';
  }
  if (n >= 7) {
    return 'high';
  }
  if (n >= 4) {
    return 'mid';
  }
  return 'low';
}

export function rarityAccent(rarity: number | null | undefined): 4 | 5 | null {
  if (rarity === 5) {
    return 5;
  }
  if (rarity === 4) {
    return 4;
  }
  return null;
}

const OCULUS_ELEMENTS: Record<string, GenshinElement> = {
  anemoculus: 'anemo',
  geoculus: 'geo',
  electroculus: 'electro',
  dendroculus: 'dendro',
  hydroculus: 'hydro',
  pyroculus: 'pyro',
  cryoculus: 'cryo',
};

export interface WorldStatVisual {
  kind: WorldStatKind;
  element?: GenshinElement;
}

/** Classify game-record stat keys for colored chips. */
export function worldStatVisual(key: string): WorldStatVisual {
  const normalized = key.toLowerCase().replaceAll('_', '');
  for (const [needle, element] of Object.entries(OCULUS_ELEMENTS)) {
    if (normalized.includes(needle)) {
      return {kind: 'element', element};
    }
  }
  if (
    normalized.includes('chest') ||
    normalized.includes('luxurious') ||
    normalized.includes('precious') ||
    normalized.includes('exquisite') ||
    normalized.includes('common')
  ) {
    return {kind: 'chest'};
  }
  if (normalized.includes('achievement')) {
    return {kind: 'achievement'};
  }
  return {kind: 'neutral'};
}

export function battlesTone(
  wins: number,
  total: number,
): 'high' | 'low' | undefined {
  if (total <= 0) {
    return 'low';
  }
  return wins / total >= 0.5 ? 'high' : 'low';
}

export const ELEMENTS: GenshinElement[] = [
  'anemo',
  'geo',
  'electro',
  'dendro',
  'hydro',
  'pyro',
  'cryo',
  'none',
];

export const WEAPONS = [
  'Sword',
  'Claymore',
  'Polearm',
  'Bow',
  'Catalyst',
] as const;

export type GenshinWeapon = (typeof WEAPONS)[number];

const WEAPON_ALIASES: Record<string, GenshinWeapon> = {
  sword: 'Sword',
  claymore: 'Claymore',
  polearm: 'Polearm',
  bow: 'Bow',
  catalyst: 'Catalyst',
};

/** Normalize HoYoLab / genshin.dev weapon labels for filter matching. */
export function normalizeWeapon(
  raw: string | null | undefined,
): GenshinWeapon | '' {
  if (!raw) {
    return '';
  }
  return WEAPON_ALIASES[raw.trim().toLowerCase()] ?? '';
}

export type CharacterSort =
  | 'level-desc'
  | 'rarity-desc'
  | 'friendship-desc'
  | 'constellation-desc'
  | 'name-asc';

export function characterRouteKey(character: {
  id?: number;
  name?: string;
}): string {
  if (character.id != null) {
    return String(character.id);
  }
  return encodeURIComponent(character.name ?? 'unknown');
}

/**
 * Prefer HoYoLab / CDN roster icons (reliable), then genshin.dev assets when
 * enrichment succeeded. Broken genshin.dev URLs must not shadow working icons.
 */
export function characterAvatarSrc(
  character: {icon?: string},
  enrichment?: {
    portraitUrl?: string;
    iconBigUrl?: string;
    iconUrl?: string;
  },
): string | undefined {
  const candidates = [
    character.icon,
    enrichment?.iconBigUrl,
    enrichment?.iconUrl,
    enrichment?.portraitUrl,
  ];
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:') {
        return url.toString();
      }
    } catch {
      // Ignore invalid URLs.
    }
  }
  return undefined;
}

