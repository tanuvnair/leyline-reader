import type {CharacterDto} from './types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
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

export function normalizeCharacter(raw: unknown): CharacterDto | null {
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
  return {
    id,
    name,
    element: typeof base.element === 'string' ? base.element : undefined,
    level: typeof base.level === 'number' ? base.level : undefined,
    rarity: typeof base.rarity === 'number' ? base.rarity : undefined,
    fetter: typeof base.fetter === 'number' ? base.fetter : undefined,
    actived_constellation_num:
      typeof base.actived_constellation_num === 'number'
        ? base.actived_constellation_num
        : undefined,
    icon: typeof base.icon === 'string' ? base.icon : undefined,
  };
}
