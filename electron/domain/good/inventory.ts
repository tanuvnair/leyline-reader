import {z} from 'zod';
import {resolveCharacterIconUrl} from '../hoyo/icons';
import {
  attachArtifactIcons,
  type ArtifactIconBases,
  type GoodArtifactDto,
  type GoodArtifactParsed,
  goodArtifactSchema,
} from './artifacts';
import {resolveMaterialIconUrl, resolveWeaponIconUrl} from './icons';
import {lookupMaterialCatalog} from './material-catalog';
import {
  lookupWeaponCatalog,
  type GoodWeaponType,
} from './weapon-catalog';

const goodWeaponSchema = z.object({
  key: z.string().min(1),
  level: z.number().int().min(1).max(90),
  ascension: z.number().int().min(0).max(6),
  refinement: z.number().int().min(1).max(5),
  location: z.string().default(''),
  lock: z.boolean().default(false),
});

/**
 * Root GOOD document — artifacts / weapons optional (weapons-only exports OK).
 * Community scanners may also include `materials` as key → count.
 */
const goodDocumentSchema = z
  .object({
    format: z.literal('GOOD'),
    version: z.number().int().positive(),
    source: z.string().min(1),
    artifacts: z.array(goodArtifactSchema).default([]),
    weapons: z.array(goodWeaponSchema).default([]),
    materials: z
      .record(z.string().min(1), z.number().int().nonnegative())
      .optional(),
  })
  .passthrough();

export type GoodWeaponParsed = z.infer<typeof goodWeaponSchema>;

/** Sanitized weapon row for the renderer. */
export type GoodWeaponDto = GoodWeaponParsed & {
  rarity?: number;
  weaponType?: GoodWeaponType;
  icon?: string;
  iconFallback?: string;
  locationIcon?: string;
  locationIconFallback?: string;
};

/** Material bag row (optional GOOD extension). */
export type GoodMaterialDto = {
  key: string;
  count: number;
  rarity?: number;
  category?: string;
  icon?: string;
  iconFallback?: string;
};

export interface GoodInventory {
  source: string;
  version: number;
  importedAt: string;
  artifactCount: number;
  weaponCount: number;
  materialCount: number;
  artifacts: GoodArtifactDto[];
  weapons: GoodWeaponDto[];
  materials: GoodMaterialDto[];
}

export interface InventoryIconBases extends ArtifactIconBases {
  weaponIconBaseUrl: string;
  weaponIconFallbackBaseUrl: string;
  /** Same Enka `/ui` host; materials use `UI_ItemIcon_*`. */
  materialIconBaseUrl: string;
  materialIconFallbackBaseUrl: string;
}

/** Attach weapon catalog meta + CDN icons (Enka primary). */
export function attachWeaponIcons(
  weapons: GoodWeaponParsed[],
  bases: InventoryIconBases,
): GoodWeaponDto[] {
  return weapons.map((weapon) => {
    const catalog = lookupWeaponCatalog(weapon.key);
    const location = weapon.location.trim();
    const icon = resolveWeaponIconUrl(weapon.key, bases.weaponIconBaseUrl);
    const iconFallback = resolveWeaponIconUrl(
      weapon.key,
      bases.weaponIconFallbackBaseUrl,
    );
    const locationIcon = location
      ? resolveCharacterIconUrl(
          undefined,
          location,
          bases.characterIconBaseUrl,
        )
      : undefined;
    const locationIconFallback = location
      ? resolveCharacterIconUrl(
          undefined,
          location,
          bases.characterIconFallbackBaseUrl,
        )
      : undefined;
    return {
      ...weapon,
      rarity: catalog?.rarity,
      weaponType: catalog?.type,
      icon,
      iconFallback:
        iconFallback && iconFallback !== icon ? iconFallback : undefined,
      locationIcon,
      locationIconFallback:
        locationIconFallback && locationIconFallback !== locationIcon
          ? locationIconFallback
          : undefined,
    };
  });
}

/** Attach material catalog meta + CDN icons. */
export function attachMaterialIcons(
  materials: Array<{key: string; count: number}>,
  bases: InventoryIconBases,
): GoodMaterialDto[] {
  return materials.map((material) => {
    const catalog = lookupMaterialCatalog(material.key);
    const icon = resolveMaterialIconUrl(
      material.key,
      bases.materialIconBaseUrl,
    );
    const iconFallback = resolveMaterialIconUrl(
      material.key,
      bases.materialIconFallbackBaseUrl,
    );
    return {
      ...material,
      rarity: catalog?.rarity,
      category: catalog?.category,
      icon,
      iconFallback:
        iconFallback && iconFallback !== icon ? iconFallback : undefined,
    };
  });
}

function materialsFromRecord(
  record: Record<string, number> | undefined,
): Array<{key: string; count: number}> {
  if (!record) {
    return [];
  }
  return Object.entries(record)
    .map(([key, count]) => ({key, count}))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Coerce vault JSON (new inventory or legacy artifacts-only) into GoodInventory.
 */
export function coerceGoodInventory(raw: unknown): GoodInventory | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.source !== 'string' || typeof obj.version !== 'number') {
    return null;
  }
  if (!Array.isArray(obj.artifacts)) {
    return null;
  }
  const artifacts = obj.artifacts as GoodArtifactDto[];
  const weapons = Array.isArray(obj.weapons)
    ? (obj.weapons as GoodWeaponDto[])
    : [];
  const materials = Array.isArray(obj.materials)
    ? (obj.materials as GoodMaterialDto[])
    : [];
  return {
    source: obj.source,
    version: obj.version,
    importedAt:
      typeof obj.importedAt === 'string'
        ? obj.importedAt
        : new Date().toISOString(),
    artifactCount:
      typeof obj.artifactCount === 'number'
        ? obj.artifactCount
        : artifacts.length,
    weaponCount:
      typeof obj.weaponCount === 'number' ? obj.weaponCount : weapons.length,
    materialCount:
      typeof obj.materialCount === 'number'
        ? obj.materialCount
        : materials.length,
    artifacts,
    weapons,
    materials,
  };
}

/** Re-resolve CDN icons for vault rows (base URL / stem updates). */
export function refreshInventoryIcons(
  inventory: GoodInventory,
  bases: InventoryIconBases,
): GoodInventory {
  const artifacts = attachArtifactIcons(
    inventory.artifacts as GoodArtifactParsed[],
    bases,
  );
  const weapons = attachWeaponIcons(
    inventory.weapons as GoodWeaponParsed[],
    bases,
  );
  const materials = attachMaterialIcons(
    inventory.materials.map((row) => ({key: row.key, count: row.count})),
    bases,
  );
  return {
    ...inventory,
    artifacts,
    weapons,
    materials,
    artifactCount: artifacts.length,
    weaponCount: weapons.length,
    materialCount: materials.length,
  };
}

export function parseGoodInventoryJson(
  jsonText: string,
  maxBytes: number,
  bases: InventoryIconBases,
): GoodInventory {
  const byteLength = new TextEncoder().encode(jsonText).length;
  if (byteLength > maxBytes) {
    throw new Error(
      `GOOD file is too large (${byteLength} bytes; max ${maxBytes}).`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText) as unknown;
  } catch {
    throw new Error('File is not valid JSON.');
  }

  const result = goodDocumentSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.length ? first.path.join('.') : 'root';
    const message = first?.message ?? 'Invalid GOOD document';
    throw new Error(`Invalid GOOD export (${path}): ${message}`);
  }

  const {source, version, artifacts, weapons, materials} = result.data;
  const withArtifactIcons = attachArtifactIcons(artifacts, bases);
  const withWeaponIcons = attachWeaponIcons(weapons, bases);
  const withMaterialIcons = attachMaterialIcons(
    materialsFromRecord(materials),
    bases,
  );

  return {
    source,
    version,
    importedAt: new Date().toISOString(),
    artifactCount: withArtifactIcons.length,
    weaponCount: withWeaponIcons.length,
    materialCount: withMaterialIcons.length,
    artifacts: withArtifactIcons,
    weapons: withWeaponIcons,
    materials: withMaterialIcons,
  };
}
