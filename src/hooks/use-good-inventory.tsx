import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {getLeyline} from '@/lib/leyline';

export interface GoodArtifactRow {
  setKey: string;
  slotKey: string;
  level: number;
  rarity: number;
  mainStatKey: string;
  lock: boolean;
  star?: boolean;
  location: string;
  icon?: string;
  iconFallback?: string;
  locationIcon?: string;
  locationIconFallback?: string;
  substats: Array<{key: string; value: number}>;
}

export interface GoodWeaponRow {
  key: string;
  level: number;
  ascension: number;
  refinement: number;
  location: string;
  lock: boolean;
  rarity?: number;
  weaponType?: 'sword' | 'claymore' | 'polearm' | 'bow' | 'catalyst';
  icon?: string;
  iconFallback?: string;
  locationIcon?: string;
  locationIconFallback?: string;
}

export interface GoodMaterialRow {
  key: string;
  count: number;
  rarity?: number;
  category?: string;
  icon?: string;
  iconFallback?: string;
}

interface InventoryStatusSnapshot {
  imported: boolean;
  source: string | null;
  version: number | null;
  importedAt: string | null;
  artifactCount: number;
  weaponCount: number;
  materialCount: number;
  artifacts: GoodArtifactRow[];
  weapons: GoodWeaponRow[];
  materials: GoodMaterialRow[];
}

interface GoodInventoryContextValue extends InventoryStatusSnapshot {
  loading: boolean;
  busy: boolean;
  error: string | null;
  refresh: (options?: {force?: boolean}) => Promise<void>;
  importJson: (jsonText: string) => Promise<{
    ok: boolean;
    error?: string;
    artifactCount?: number;
    weaponCount?: number;
    materialCount?: number;
  }>;
  clearInventory: () => Promise<{ok: boolean; error?: string}>;
}

const emptySnapshot: InventoryStatusSnapshot = {
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

/** Bump when renderer must re-pull status (e.g. new icon fields). */
const CLIENT_DTO_REV = 3;
let lastHydratedRev = 0;

const GoodInventoryContext =
  createContext<GoodInventoryContextValue | null>(null);

function snapshotFromResult(result: {
  imported?: boolean;
  source?: string | null;
  version?: number | null;
  importedAt?: string | null;
  artifactCount?: number;
  weaponCount?: number;
  materialCount?: number;
  artifacts?: GoodArtifactRow[];
  weapons?: GoodWeaponRow[];
  materials?: GoodMaterialRow[];
}): InventoryStatusSnapshot {
  return {
    imported: Boolean(result.imported),
    source: result.source ?? null,
    version: typeof result.version === 'number' ? result.version : null,
    importedAt: result.importedAt ?? null,
    artifactCount: result.artifactCount ?? 0,
    weaponCount: result.weaponCount ?? 0,
    materialCount: result.materialCount ?? 0,
    artifacts: result.artifacts ?? [],
    weapons: result.weapons ?? [],
    materials: result.materials ?? [],
  };
}

export function GoodInventoryProvider({children}: {children: ReactNode}) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] =
    useState<InventoryStatusSnapshot>(emptySnapshot);

  const applySnapshot = useCallback((next: InventoryStatusSnapshot) => {
    setSnapshot(next);
  }, []);

  const refresh = useCallback(
    async (options: {force?: boolean} = {}) => {
      const needsHydration = lastHydratedRev < CLIENT_DTO_REV;
      if (loaded && !options.force && !needsHydration) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await getLeyline().inventory.status();
        if (!result.ok) {
          setError(result.error ?? 'Failed to load inventory');
          applySnapshot(emptySnapshot);
          setLoaded(true);
          lastHydratedRev = CLIENT_DTO_REV;
          return;
        }
        applySnapshot(snapshotFromResult(result));
        setLoaded(true);
        lastHydratedRev = CLIENT_DTO_REV;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
        applySnapshot(emptySnapshot);
        setLoaded(true);
        lastHydratedRev = CLIENT_DTO_REV;
      } finally {
        setLoading(false);
      }
    },
    [applySnapshot, loaded],
  );

  const importJson = useCallback(
    async (jsonText: string) => {
      setBusy(true);
      setError(null);
      try {
        const result = await getLeyline().inventory.import(jsonText);
        if (!result.ok) {
          const message = result.error ?? 'Import failed';
          setError(message);
          return {ok: false, error: message};
        }
        applySnapshot(snapshotFromResult(result));
        setLoaded(true);
        return {
          ok: true,
          artifactCount: result.artifactCount ?? 0,
          weaponCount: result.weaponCount ?? 0,
          materialCount: result.materialCount ?? 0,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Import failed';
        setError(message);
        return {ok: false, error: message};
      } finally {
        setBusy(false);
      }
    },
    [applySnapshot],
  );

  const clearInventory = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await getLeyline().inventory.clear();
      if (!result.ok) {
        const message = result.error ?? 'Clear failed';
        setError(message);
        return {ok: false, error: message};
      }
      applySnapshot(emptySnapshot);
      setLoaded(true);
      return {ok: true};
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Clear failed';
      setError(message);
      return {ok: false, error: message};
    } finally {
      setBusy(false);
    }
  }, [applySnapshot]);

  const value = useMemo(
    () => ({
      ...snapshot,
      loading,
      busy,
      error,
      refresh,
      importJson,
      clearInventory,
    }),
    [
      snapshot,
      loading,
      busy,
      error,
      refresh,
      importJson,
      clearInventory,
    ],
  );

  return (
    <GoodInventoryContext.Provider value={value}>
      {children}
    </GoodInventoryContext.Provider>
  );
}

export function useGoodInventory(): GoodInventoryContextValue {
  const ctx = useContext(GoodInventoryContext);
  if (!ctx) {
    throw new Error('useGoodInventory requires GoodInventoryProvider');
  }
  return ctx;
}
