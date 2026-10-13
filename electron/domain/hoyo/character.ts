import type {CharacterDto} from './types';
import {resolveCharacterIconUrl} from './icons';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/** Canonical English weapon type labels used by the Characters filter. */
const WEAPON_ALIASES: Record<string, string> = {
  sword: 'Sword',
  claymore: 'Claymore',
  polearm: 'Polearm',
  bow: 'Bow',
  catalyst: 'Catalyst',
};

/**
 * HoYoLab summary `weapon_type` integers (legacy / charactersSummary).
 * Prefer string names when present; this is a fallback only.
 */
const WEAPON_TYPE_BY_ID: Record<number, string> = {
  1: 'Sword',
  11: 'Claymore',
  12: 'Polearm',
  13: 'Catalyst',
  14: 'Bow',
};

function normalizeWeaponLabel(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  return WEAPON_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

/** Weapon type from modern list, summary, or legacy equipped-weapon payloads. */
function pickWeapon(
  ...sources: Array<Record<string, unknown> | null>
): string | undefined {
  for (const source of sources) {
    if (!source) {
      continue;
    }
    const direct =
      (typeof source.weapon_type_name === 'string'
        ? source.weapon_type_name
        : undefined) ??
      (typeof source.weaponTypeName === 'string'
        ? source.weaponTypeName
        : undefined);
    const fromDirect = normalizeWeaponLabel(direct);
    if (fromDirect) {
      return fromDirect;
    }
    if (typeof source.weapon === 'string') {
      const fromString = normalizeWeaponLabel(source.weapon);
      if (fromString) {
        return fromString;
      }
    }
    const weaponObj = asRecord(source.weapon);
    if (weaponObj) {
      const typeName =
        (typeof weaponObj.type_name === 'string'
          ? weaponObj.type_name
          : undefined) ??
        (typeof weaponObj.typeName === 'string'
          ? weaponObj.typeName
          : undefined);
      const fromObj = normalizeWeaponLabel(typeName);
      if (fromObj) {
        return fromObj;
      }
      if (typeof weaponObj.type === 'number') {
        const mapped = WEAPON_TYPE_BY_ID[weaponObj.type];
        if (mapped) {
          return mapped;
        }
      }
    }
    if (typeof source.weapon_type === 'number') {
      const mapped = WEAPON_TYPE_BY_ID[source.weapon_type];
      if (mapped) {
        return mapped;
      }
    }
  }
  return undefined;
}

export function pickCharacterList(payload: unknown): unknown[] {
  const root = asRecord(payload);
  if (!root) {
    return [];
  }
  for (const key of ['list', 'avatars', 'characters'] as const) {
    const value = root[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

/** Raw icon-like string from common HoYoLab field names. */
function pickRawIcon(
  ...sources: Array<Record<string, unknown> | null>
): string | undefined {
  const keys = [
    'icon',
    'image',
    'side_icon',
    'avatar_side_icon',
    'icon_url',
    'side_icon_url',
  ] as const;
  for (const source of sources) {
    if (!source) {
      continue;
    }
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }
  return undefined;
}

/** HoYoLab sometimes encodes rarity as 105 (5★) / 104 (4★). */
function normalizeRarity(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  if (value >= 100 && value <= 105) {
    return Math.floor(value / 100);
  }
  if (value >= 1 && value <= 5) {
    return value;
  }
  return undefined;
}

export function normalizeCharacter(
  raw: unknown,
  iconBaseUrl: string,
): CharacterDto | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const base = asRecord(row.base) ?? row;
  const name = typeof base.name === 'string' ? base.name : undefined;
  const id = typeof base.id === 'number' ? base.id : undefined;
  if (!name && id === undefined) {
    return null;
  }
  const icon = resolveCharacterIconUrl(
    pickRawIcon(base, row),
    name,
    iconBaseUrl,
  );
  return {
    id,
    name,
    element: typeof base.element === 'string' ? base.element : undefined,
    weapon: pickWeapon(base, row),
    level: typeof base.level === 'number' ? base.level : undefined,
    rarity: normalizeRarity(base.rarity),
    fetter: typeof base.fetter === 'number' ? base.fetter : undefined,
    actived_constellation_num:
      typeof base.actived_constellation_num === 'number'
        ? base.actived_constellation_num
        : undefined,
    icon,
  };
}

/**
 * Copy missing icons / weapon types from a richer roster (legacy `/character`)
 * onto modern list rows.
 */
export function mergeCharacterDetails(
  primary: CharacterDto[],
  secondary: CharacterDto[],
): CharacterDto[] {
  const byId = new Map<number, CharacterDto>();
  const byName = new Map<string, CharacterDto>();
  for (const row of secondary) {
    if (row.id != null) {
      byId.set(row.id, row);
    }
    if (row.name) {
      byName.set(row.name, row);
    }
  }
  return primary.map((row) => {
    if (row.icon && row.weapon) {
      return row;
    }
    const match =
      (row.id != null ? byId.get(row.id) : undefined) ??
      (row.name ? byName.get(row.name) : undefined);
    if (!match) {
      return row;
    }
    return {
      ...row,
      icon: row.icon ?? match.icon,
      weapon: row.weapon ?? match.weapon,
    };
  });
}
