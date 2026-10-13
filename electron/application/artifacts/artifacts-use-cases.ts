import {
  attachArtifactIcons,
  parseGoodArtifactsJson,
  type GoodArtifactDto,
} from '../../domain/good/artifacts';
import {requireUnlocked} from '../../infrastructure/auth/session';
import {appConfigPort} from '../../infrastructure/config/app-config-port';
import {vaultPort} from '../../infrastructure/vault/vault';
import {
  deleteCached,
  getCached,
  setSessionCached,
} from '../cache/ttl-cache';

/** Bump when DTO shape for cached status changes (e.g. locationIcon). */
const ARTIFACTS_CACHE_KEY = 'artifacts:v5';

export type ArtifactsStatusDto =
  | {
      ok: true;
      imported: false;
      source: null;
      version: null;
      importedAt: null;
      artifactCount: 0;
      artifacts: readonly [];
    }
  | {
      ok: true;
      imported: true;
      source: string;
      version: number;
      importedAt: string;
      artifactCount: number;
      artifacts: GoodArtifactDto[];
    };

function iconBases() {
  return {
    artifactIconBaseUrl: appConfigPort.artifactIconBaseUrl(),
    artifactIconFallbackBaseUrl: appConfigPort.artifactIconFallbackBaseUrl(),
    characterIconBaseUrl: appConfigPort.characterIconBaseUrl(),
    characterIconFallbackBaseUrl: appConfigPort.characterIconFallbackBaseUrl(),
  };
}

function emptyStatus(): ArtifactsStatusDto {
  return {
    ok: true,
    imported: false,
    source: null,
    version: null,
    importedAt: null,
    artifactCount: 0,
    artifacts: [],
  };
}

function statusFromInventory(inventory: {
  source: string;
  version: number;
  importedAt: string;
  artifactCount: number;
  artifacts: GoodArtifactDto[];
}): ArtifactsStatusDto {
  // Re-resolve icons on read so older vault rows pick up CDN/base changes
  // without forcing a re-import.
  const artifacts = attachArtifactIcons(inventory.artifacts, iconBases());
  return {
    ok: true,
    imported: true,
    source: inventory.source,
    version: inventory.version,
    importedAt: inventory.importedAt,
    artifactCount: inventory.artifactCount,
    artifacts,
  };
}

function remember(status: ArtifactsStatusDto): ArtifactsStatusDto {
  setSessionCached(ARTIFACTS_CACHE_KEY, status);
  return status;
}

export function getArtifactsStatus(): ArtifactsStatusDto {
  requireUnlocked();
  const hit = getCached<ArtifactsStatusDto>(ARTIFACTS_CACHE_KEY);
  if (hit) {
    return hit;
  }

  const inventory = vaultPort.loadGoodArtifacts();
  if (!inventory) {
    return remember(emptyStatus());
  }
  return remember(statusFromInventory(inventory));
}

export function importGoodArtifacts(jsonText: string): ArtifactsStatusDto {
  requireUnlocked();
  const inventory = parseGoodArtifactsJson(
    jsonText,
    appConfigPort.goodArtifactsMaxBytes(),
    iconBases(),
  );
  vaultPort.saveGoodArtifacts(inventory);
  return remember({
    ok: true,
    imported: true,
    source: inventory.source,
    version: inventory.version,
    importedAt: inventory.importedAt,
    artifactCount: inventory.artifactCount,
    artifacts: inventory.artifacts,
  });
}

export function clearGoodArtifacts(): {ok: true; imported: false} {
  requireUnlocked();
  vaultPort.clearGoodArtifacts();
  deleteCached(ARTIFACTS_CACHE_KEY);
  return {ok: true, imported: false};
}
