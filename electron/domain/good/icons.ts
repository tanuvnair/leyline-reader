import {ARTIFACT_SET_IDS, GOOD_SET_KEY_ALIASES} from './set-ids';

/** `UI_RelicIcon_{setId}_{pos}` slot index (1–5) for normal 5-piece sets. */
const SLOT_POS: Record<string, number> = {
  flower: 1,
  plume: 2,
  sands: 3,
  goblet: 4,
  circlet: 5,
};

/**
 * Single-piece “Prayers” circlets only ship `UI_RelicIcon_{id}_3.png` in game
 * assets / Enka (not the usual circlet `_5` suffix).
 */
const PRAYER_SET_IDS = new Set([15009, 15010, 15011, 15013]);

function normalizeSetSlug(setKey: string): string {
  const raw = setKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  return GOOD_SET_KEY_ALIASES[raw] ?? raw;
}

/**
 * Resolve a GOOD artifact set+slot into an absolute HTTPS CDN URL.
 * `iconBaseUrl` is the directory hosting `UI_RelicIcon_*.png` (Enka preferred).
 */
export function resolveArtifactIconUrl(
  setKey: string,
  slotKey: string,
  iconBaseUrl: string,
): string | undefined {
  const base = iconBaseUrl.replace(/\/$/, '');
  if (!base.startsWith('https://')) {
    return undefined;
  }
  const setId = ARTIFACT_SET_IDS[normalizeSetSlug(setKey)];
  if (setId == null) {
    return undefined;
  }
  const pos = PRAYER_SET_IDS.has(setId) ? 3 : SLOT_POS[slotKey];
  if (pos == null) {
    return undefined;
  }
  return `${base}/UI_RelicIcon_${setId}_${pos}.png`;
}
