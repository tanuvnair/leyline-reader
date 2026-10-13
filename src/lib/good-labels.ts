/**
 * User-facing labels for GOOD (Genshin Open Object Description) keys.
 * Prefer Title Case for chips and card chrome; keep acronyms (HP, ATK, DMG) uppercase.
 */

import {splitIdentifier, toTitleCase} from '@/lib/text-labels';

const SLOT_LABELS: Record<string, string> = {
  flower: 'Flower',
  plume: 'Plume',
  sands: 'Sands',
  goblet: 'Goblet',
  circlet: 'Circlet',
};

/** GOOD stat keys → display labels (Genshin Optimizer / Inventory Kamera). */
const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  hp_: 'HP%',
  atk: 'ATK',
  atk_: 'ATK%',
  def: 'DEF',
  def_: 'DEF%',
  eleMas: 'Elemental Mastery',
  enerRech_: 'Energy Recharge',
  critRate_: 'Crit Rate',
  critDMG_: 'Crit DMG',
  heal_: 'Healing Bonus',
  physical_dmg_: 'Physical DMG',
  anemo_dmg_: 'Anemo DMG',
  geo_dmg_: 'Geo DMG',
  electro_dmg_: 'Electro DMG',
  hydro_dmg_: 'Hydro DMG',
  pyro_dmg_: 'Pyro DMG',
  cryo_dmg_: 'Cryo DMG',
  dendro_dmg_: 'Dendro DMG',
};

export {toTitleCase} from '@/lib/text-labels';

/**
 * GOOD PascalCase set key → readable set name.
 * Applies common possessive fixes (Wanderer's, Shimenawa's, Gladiator's).
 */
export function formatGoodSetName(setKey: string): string {
  const words = splitIdentifier(setKey);
  if (words.length === 0) {
    return setKey;
  }
  const adjusted = words.map((word, index) => {
    const lower = word.toLowerCase();
    if (index >= words.length - 1) {
      return word;
    }
    // Wanderers / Gladiators → Wanderer's / Gladiator's
    if (lower.endsWith('ers') && lower.length > 4) {
      return `${word.slice(0, -1)}'s`;
    }
    // Shimenawas → Shimenawa's
    if (lower.endsWith('as') && lower.length > 4) {
      return `${word.slice(0, -1)}'s`;
    }
    return word;
  });
  return toTitleCase(adjusted.join(' '));
}

export function formatGoodSlotLabel(slotKey: string): string {
  return SLOT_LABELS[slotKey] ?? toTitleCase(slotKey);
}

/** GOOD `location` character key → display name (empty → unequipped caller). */
export function formatGoodLocationLabel(location: string): string {
  const trimmed = location.trim();
  if (!trimmed) {
    return '';
  }
  return toTitleCase(splitIdentifier(trimmed).join(' ') || trimmed);
}

/** GOOD PascalCase weapon key → readable name. */
export function formatGoodWeaponName(weaponKey: string): string {
  const words = splitIdentifier(weaponKey);
  return words.length > 0 ? toTitleCase(words.join(' ')) : weaponKey;
}

/** GOOD material key → readable name. */
export function formatGoodMaterialName(materialKey: string): string {
  const words = splitIdentifier(materialKey);
  return words.length > 0 ? toTitleCase(words.join(' ')) : materialKey;
}

const WEAPON_TYPE_LABELS: Record<string, string> = {
  sword: 'Sword',
  claymore: 'Claymore',
  polearm: 'Polearm',
  bow: 'Bow',
  catalyst: 'Catalyst',
};

export function formatGoodWeaponTypeLabel(weaponType: string): string {
  return WEAPON_TYPE_LABELS[weaponType] ?? toTitleCase(weaponType);
}

/** Yatta / Ambr material category slug → short chip label. */
export function formatMaterialCategoryLabel(category: string): string {
  const known: Record<string, string> = {
    commonCurrency: 'Currency',
    characterLevelUpMaterial: 'Character EXP',
    weaponLevelUpMaterial: 'Weapon EXP',
    characterAscensionMaterial: 'Ascension',
    characterTalentMaterial: 'Talent',
    characterandWeaponEnhancementMaterial: 'Enhancement',
    weaponAscensionMaterial: 'Weapon Ascension',
    localSpecialty: 'Local Specialty',
    cookingIngredient: 'Ingredient',
    food: 'Food',
    book: 'Book',
    forgingOre: 'Ore',
    gadget: 'Gadget',
    questItem: 'Quest',
    fish: 'Fish',
    material: 'Material',
    materials: 'Material',
    other: 'Other',
  };
  if (known[category]) {
    return known[category];
  }
  // "characterandWeaponEnhancementMaterial" → readable words.
  const spaced = category
    .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll(/and([A-Z])/g, ' and $1');
  return toTitleCase(spaced);
}

export function formatGoodStatLabel(statKey: string): string {
  if (STAT_LABELS[statKey]) {
    return STAT_LABELS[statKey];
  }
  // Strip trailing underscore used for percent keys in GOOD.
  const stripped = statKey.endsWith('_') ? statKey.slice(0, -1) : statKey;
  if (STAT_LABELS[stripped]) {
    return STAT_LABELS[stripped];
  }
  if (STAT_LABELS[`${stripped}_`]) {
    return STAT_LABELS[`${stripped}_`];
  }
  return toTitleCase(stripped);
}

/** Format a substat/main chip: "Crit Rate 13.2" / "ATK 16". */
export function formatGoodStatChip(statKey: string, value?: number): string {
  const label = formatGoodStatLabel(statKey);
  if (value === undefined || !Number.isFinite(value)) {
    return label;
  }
  const rounded =
    Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
  const isPercent =
    statKey.endsWith('_') ||
    label.endsWith('%') ||
    label.includes('Rate') ||
    label.includes('Recharge') ||
    label.includes('Bonus') ||
    label.includes('DMG');
  // Flat HP/ATK/DEF and EM stay unitless; percent keys keep a % suffix.
  if (isPercent && !label.endsWith('%') && statKey.endsWith('_')) {
    return `${label} ${rounded}%`;
  }
  if (label.endsWith('%')) {
    return `${label.slice(0, -1).trim()} ${rounded}%`;
  }
  return `${label} ${rounded}`;
}
