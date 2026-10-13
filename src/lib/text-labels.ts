/**
 * Shared Title Case helpers for user-facing chrome (chips, cards, filters).
 * Prefer Title Case; keep known game acronyms uppercase via explicit maps.
 */

const SMALL_WORDS = new Set(['of', 'the', 'and', 'a', 'an', 'to', 'in', 'on']);

export function splitIdentifier(raw: string): string[] {
  return raw
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function capitalizeWord(word: string): string {
  if (!word) {
    return word;
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Title Case with small words lowercased (except first / last). */
export function toTitleCase(raw: string): string {
  const words = splitIdentifier(raw);
  if (words.length === 0) {
    return '';
  }
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (
        index > 0 &&
        index < words.length - 1 &&
        SMALL_WORDS.has(lower)
      ) {
        return lower;
      }
      return capitalizeWord(word);
    })
    .join(' ');
}

/**
 * HoYoLab game-record `stats` keys → display labels.
 * Falls back to Title Case of the snake_case key (drops trailing "Number").
 */
const WORLD_STAT_LABELS: Record<string, string> = {
  active_day_number: 'Active Days',
  achievement_number: 'Achievements',
  anemoculus_number: 'Anemoculus',
  geoculus_number: 'Geoculus',
  electroculus_number: 'Electroculus',
  dendroculus_number: 'Dendroculus',
  hydroculus_number: 'Hydroculus',
  pyroculus_number: 'Pyroculus',
  cryoculus_number: 'Cryoculus',
  avatar_number: 'Characters',
  way_point_number: 'Waypoints',
  domain_number: 'Domains',
  spiral_abyss: 'Spiral Abyss',
  precious_chest_number: 'Precious Chests',
  luxurious_chest_number: 'Luxurious Chests',
  exquisite_chest_number: 'Exquisite Chests',
  common_chest_number: 'Common Chests',
  magic_chest_number: 'Remarkable Chests',
};

export function formatWorldStatLabel(key: string): string {
  if (WORLD_STAT_LABELS[key]) {
    return WORLD_STAT_LABELS[key];
  }
  const stripped = key.replace(/_number$/i, '').replace(/_num$/i, '');
  return toTitleCase(stripped);
}

/** Chip text: "Active Days: 307". */
export function formatWorldStatChip(key: string, value: unknown): string {
  return `${formatWorldStatLabel(key)}: ${String(value)}`;
}
