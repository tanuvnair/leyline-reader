import type {GoodArtifactDto} from '../../domain/good/artifacts';
import {
  parseGoodInventoryJson,
  refreshInventoryIcons,
  type GoodInventory,
  type GoodMaterialDto,
  type GoodWeaponDto,
} from '../../domain/good/inventory';
import {requireUnlocked} from '../../infrastructure/auth/session';
import {appConfigPort} from '../../infrastructure/config/app-config-port';
import {vaultPort} from '../../infrastructure/vault/vault';
import {
  deleteCached,
  getCached,
  setSessionCached,
} from '../cache/ttl-cache';

/** Bump when DTO shape for cached status changes. */
const INVENTORY_CACHE_KEY = 'goodInventory:v3';

export type {GoodArtifactDto, GoodWeaponDto, GoodMaterialDto};

export type GoodInventoryStatusDto =
  | {
      ok: true;
      imported: false;
      source: null;
      version: null;
      importedAt: null;
      artifactCount: 0;
      weaponCount: 0;
      materialCount: 0;
      artifacts: readonly [];
      weapons: readonly [];
      materials: readonly [];
    }
  | {
      ok: true;
      imported: true;
      source: string;
      version: number;
      importedAt: string;
      artifactCount: number;
      weaponCount: number;
      materialCount: number;
      artifacts: GoodArtifactDto[];
      weapons: GoodWeaponDto[];
      materials: GoodMaterialDto[];
    };

function iconBases() {
  return {
    artifactIconBaseUrl: appConfigPort.artifactIconBaseUrl(),
    artifactIconFallbackBaseUrl: appConfigPort.artifactIconFallbackBaseUrl(),
    characterIconBaseUrl: appConfigPort.characterIconBaseUrl(),
    characterIconFallbackBaseUrl: appConfigPort.characterIconFallbackBaseUrl(),
    weaponIconBaseUrl: appConfigPort.weaponIconBaseUrl(),
    weaponIconFallbackBaseUrl: appConfigPort.weaponIconFallbackBaseUrl(),
    materialIconBaseUrl: appConfigPort.materialIconBaseUrl(),
    materialIconFallbackBaseUrl: appConfigPort.materialIconFallbackBaseUrl(),
  };
}

function emptyStatus(): GoodInventoryStatusDto {
  return {
    ok: true,
    imported: false,
    source: null,
    version: null,
    importedAt: null,
    artifactCount: 0,
    weaponCount: 0,
    materialCount: 0,
    artifacts: [],
    weapons: [],
    materials: [],
  };
}

function statusFromInventory(inventory: GoodInventory): GoodInventoryStatusDto {
  const refreshed = refreshInventoryIcons(inventory, iconBases());
  return {
    ok: true,
    imported: true,
    source: refreshed.source,
    version: refreshed.version,
    importedAt: refreshed.importedAt,
    artifactCount: refreshed.artifactCount,
    weaponCount: refreshed.weaponCount,
    materialCount: refreshed.materialCount,
    artifacts: refreshed.artifacts,
    weapons: refreshed.weapons,
    materials: refreshed.materials,
  };
}

function remember(status: GoodInventoryStatusDto): GoodInventoryStatusDto {
  setSessionCached(INVENTORY_CACHE_KEY, status);
  return status;
}

export function getGoodInventoryStatus(): GoodInventoryStatusDto {
  requireUnlocked();
  const hit = getCached<GoodInventoryStatusDto>(INVENTORY_CACHE_KEY);
  if (hit) {
    return hit;
  }

  const inventory = vaultPort.loadGoodInventory();
  if (!inventory) {
    return remember(emptyStatus());
  }
  return remember(statusFromInventory(inventory));
}

export function importGoodInventory(jsonText: string): GoodInventoryStatusDto {
  requireUnlocked();
  const inventory = parseGoodInventoryJson(
    jsonText,
    appConfigPort.goodInventoryMaxBytes(),
    iconBases(),
  );
  vaultPort.saveGoodInventory(inventory);
  return remember({
    ok: true,
    imported: true,
    source: inventory.source,
    version: inventory.version,
    importedAt: inventory.importedAt,
    artifactCount: inventory.artifactCount,
    weaponCount: inventory.weaponCount,
    materialCount: inventory.materialCount,
    artifacts: inventory.artifacts,
    weapons: inventory.weapons,
    materials: inventory.materials,
  });
}

export function clearGoodInventory(): {ok: true; imported: false} {
  requireUnlocked();
  vaultPort.clearGoodInventory();
  deleteCached(INVENTORY_CACHE_KEY);
  return {ok: true, imported: false};
}
