import {z} from 'zod';
import {resolveCharacterIconUrl} from '../hoyo/icons';
import {resolveArtifactIconUrl} from './icons';

/** GOOD artifact slot keys (Genshin Optimizer / Inventory Kamera). */
export const GOOD_SLOT_KEYS = [
  'flower',
  'plume',
  'sands',
  'goblet',
  'circlet',
] as const;

export type GoodSlotKey = (typeof GOOD_SLOT_KEYS)[number];

const goodSubstatSchema = z.object({
  key: z.string().min(1),
  value: z.number().finite(),
});

/** Exported for shared GOOD document parsing in inventory.ts. */
export const goodArtifactSchema = z.object({
  setKey: z.string().min(1),
  slotKey: z.enum(GOOD_SLOT_KEYS),
  level: z.number().int().min(0).max(20),
  rarity: z.number().int().min(1).max(5),
  mainStatKey: z.string().min(1),
  lock: z.boolean().default(false),
  /** Non-standard; some scanners export inventory “star” / favorite marks. */
  star: z.boolean().optional().default(false),
  location: z.string().default(''),
  substats: z.array(goodSubstatSchema).max(4).default([]),
});

export type GoodArtifactParsed = z.infer<typeof goodArtifactSchema>;

/** Sanitized artifact row for the renderer (equip + equipped-by CDN icons). */
export type GoodArtifactDto = GoodArtifactParsed & {
  /** Primary relic icon (Enka). */
  icon?: string;
  /** Secondary relic icon (HoYoLab) when primary 404s. */
  iconFallback?: string;
  /** Primary avatar CDN for GOOD `location` when equipped (Enka). */
  locationIcon?: string;
  /** Secondary avatar CDN when primary 404s (HoYoLab). */
  locationIconFallback?: string;
};

export interface ArtifactIconBases {
  artifactIconBaseUrl: string;
  artifactIconFallbackBaseUrl: string;
  characterIconBaseUrl: string;
  characterIconFallbackBaseUrl: string;
}

/** Attach relic + equipped-character CDN icons (Enka primary, HoYoLab fallback). */
export function attachArtifactIcons(
  artifacts: GoodArtifactParsed[],
  bases: ArtifactIconBases,
): GoodArtifactDto[] {
  return artifacts.map((artifact) => {
    const location = artifact.location.trim();
    const icon = resolveArtifactIconUrl(
      artifact.setKey,
      artifact.slotKey,
      bases.artifactIconBaseUrl,
    );
    const iconFallback = resolveArtifactIconUrl(
      artifact.setKey,
      artifact.slotKey,
      bases.artifactIconFallbackBaseUrl,
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
      ...artifact,
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
