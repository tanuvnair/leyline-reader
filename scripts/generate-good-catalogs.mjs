/**
 * One-shot generator: Ambr/yatta public catalog → GOOD key maps for Enka icons.
 * Usage: node scripts/generate-good-catalogs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'electron', 'domain', 'good');
const tmp = os.tmpdir();

function toGoodKey(name) {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function normalizeSlug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function loadJson(fileName, url, {force = false} = {}) {
  const local = path.join(tmp, fileName);
  if (!force && fs.existsSync(local)) {
    return JSON.parse(fs.readFileSync(local, 'utf8'));
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const json = await res.json();
  fs.writeFileSync(local, JSON.stringify(json));
  return json;
}

const TYPE_MAP = {
  WEAPON_SWORD_ONE_HAND: 'sword',
  WEAPON_CLAYMORE: 'claymore',
  WEAPON_POLE: 'polearm',
  WEAPON_CATALYST: 'catalyst',
  WEAPON_BOW: 'bow',
};

const weaponsJson = await loadJson(
  'yatta-weapons.json',
  'https://gi.yatta.moe/api/v2/en/weapon',
);
const materialsJson = await loadJson(
  'yatta-materials.json',
  'https://gi.yatta.moe/api/v2/en/material',
);
const foodJson = await loadJson(
  'yatta-food.json',
  'https://gi.yatta.moe/api/v2/en/food',
  {force: true},
);
const bookJson = await loadJson(
  'yatta-book.json',
  'https://gi.yatta.moe/api/v2/en/book',
  {force: true},
);

const weapons = weaponsJson.data.items;

const weaponByGood = {};
const weaponBySlug = {};
for (const item of Object.values(weapons)) {
  const goodKey = toGoodKey(item.route || item.name);
  const icon = String(item.icon || '').replace(/^UI_EquipIcon_/, '');
  if (!goodKey || !icon) {
    continue;
  }
  const entry = {
    icon,
    rarity: item.rank,
    type: TYPE_MAP[item.type] || 'sword',
  };
  weaponByGood[goodKey] = entry;
  weaponBySlug[normalizeSlug(goodKey)] = entry;
  weaponBySlug[normalizeSlug(item.name)] = entry;
}

const materialByGood = {};
const materialBySlug = {};

function addMaterialEntry(item, categoryFallback) {
  const goodKey = toGoodKey(item.route || item.name);
  const icon = String(item.icon || '');
  if (!goodKey || !icon.startsWith('UI_ItemIcon_')) {
    return;
  }
  const entry = {
    icon,
    rarity: item.rank || 1,
    category: item.type || categoryFallback || 'other',
  };
  // Prefer richer material rows over food/book when keys collide.
  if (!materialByGood[goodKey] || categoryFallback === 'material') {
    materialByGood[goodKey] = entry;
  }
  const slug = normalizeSlug(goodKey);
  const nameSlug = normalizeSlug(item.name);
  materialBySlug[slug] = materialByGood[goodKey];
  materialBySlug[nameSlug] = materialByGood[goodKey];
  // "1000YearsOfLoneliness" → also index "yearsofloneliness"
  const noLeadingDigits = slug.replace(/^[0-9]+/, '');
  if (noLeadingDigits && noLeadingDigits !== slug) {
    materialBySlug[noLeadingDigits] = materialByGood[goodKey];
  }
}

for (const item of Object.values(materialsJson.data.items)) {
  addMaterialEntry(item, 'material');
}
for (const item of Object.values(foodJson.data.items)) {
  addMaterialEntry(item, 'food');
}
for (const item of Object.values(bookJson.data.items)) {
  addMaterialEntry(item, 'book');
}

const weaponTs = `/** Auto-generated from Ambr/yatta weapon catalog — do not edit by hand. */
export type GoodWeaponType = 'sword' | 'claymore' | 'polearm' | 'bow' | 'catalyst';

export interface WeaponCatalogEntry {
  /** Stem after UI_EquipIcon_ (e.g. Bow_Troupe). */
  icon: string;
  rarity: number;
  type: GoodWeaponType;
}

export const WEAPON_CATALOG: Record<string, WeaponCatalogEntry> = ${JSON.stringify(weaponByGood, null, 2)};

const WEAPON_BY_SLUG: Record<string, WeaponCatalogEntry> = ${JSON.stringify(weaponBySlug, null, 2)};

export function lookupWeaponCatalog(
  weaponKey: string,
): WeaponCatalogEntry | undefined {
  const trimmed = weaponKey.trim();
  if (!trimmed) {
    return undefined;
  }
  if (WEAPON_CATALOG[trimmed]) {
    return WEAPON_CATALOG[trimmed];
  }
  const slug = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  return WEAPON_BY_SLUG[slug];
}
`;

const materialTs = `/** Auto-generated from Ambr/yatta material/food/book catalogs — do not edit by hand. */
export interface MaterialCatalogEntry {
  /** Full Enka filename without .png (e.g. UI_ItemIcon_202). */
  icon: string;
  rarity: number;
  category: string;
}

export const MATERIAL_CATALOG: Record<string, MaterialCatalogEntry> = ${JSON.stringify(materialByGood, null, 2)};

const MATERIAL_BY_SLUG: Record<string, MaterialCatalogEntry> = ${JSON.stringify(materialBySlug, null, 2)};

export function lookupMaterialCatalog(
  materialKey: string,
): MaterialCatalogEntry | undefined {
  const trimmed = materialKey.trim();
  if (!trimmed) {
    return undefined;
  }
  if (MATERIAL_CATALOG[trimmed]) {
    return MATERIAL_CATALOG[trimmed];
  }
  const slug = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (MATERIAL_BY_SLUG[slug]) {
    return MATERIAL_BY_SLUG[slug];
  }
  const noDigits = slug.replace(/^[0-9]+/, '');
  if (noDigits && MATERIAL_BY_SLUG[noDigits]) {
    return MATERIAL_BY_SLUG[noDigits];
  }
  // Food quality variants: DeliciousX / SuspiciousX / StrangeX → base X
  for (const prefix of ['delicious', 'suspicious', 'strange']) {
    if (slug.startsWith(prefix) && slug.length > prefix.length) {
      const base = slug.slice(prefix.length);
      if (MATERIAL_BY_SLUG[base]) {
        return MATERIAL_BY_SLUG[base];
      }
    }
  }
  return undefined;
}
`;

fs.writeFileSync(path.join(outDir, 'weapon-catalog.ts'), weaponTs);
fs.writeFileSync(path.join(outDir, 'material-catalog.ts'), materialTs);
console.log(
  'Wrote catalogs:',
  Object.keys(weaponByGood).length,
  'weapons,',
  Object.keys(materialByGood).length,
  'materials/food/books',
);
console.log('TheStringless', weaponByGood.TheStringless);
console.log('Mora', materialByGood.Mora);
console.log(
  '1000YearsOfLoneliness',
  materialByGood['1000YearsOfLoneliness'],
);
console.log('ABuoyantBreeze', materialByGood.ABuoyantBreeze);
