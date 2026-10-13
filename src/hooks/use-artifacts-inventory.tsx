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

interface ArtifactsStatusSnapshot {
  imported: boolean;
  source: string | null;
  version: number | null;
  importedAt: string | null;
  artifactCount: number;
  artifacts: GoodArtifactRow[];
}

interface ArtifactsInventoryContextValue extends ArtifactsStatusSnapshot {
  loading: boolean;
  busy: boolean;
  error: string | null;
  refresh: (options?: {force?: boolean}) => Promise<void>;
  importJson: (jsonText: string) => Promise<{
    ok: boolean;
    error?: string;
    artifactCount?: number;
  }>;
  clearInventory: () => Promise<{ok: boolean; error?: string}>;
}

const emptySnapshot: ArtifactsStatusSnapshot = {
  imported: false,
  source: null,
  version: null,
  importedAt: null,
  artifactCount: 0,
  artifacts: [],
};

/** Bump when renderer must re-pull status (e.g. new icon fields). */
const CLIENT_DTO_REV = 5;
let lastHydratedRev = 0;

const ArtifactsInventoryContext =
  createContext<ArtifactsInventoryContextValue | null>(null);

function snapshotFromResult(result: {
  imported?: boolean;
  source?: string | null;
  version?: number | null;
  importedAt?: string | null;
  artifactCount?: number;
  artifacts?: GoodArtifactRow[];
}): ArtifactsStatusSnapshot {
  return {
    imported: Boolean(result.imported),
    source: result.source ?? null,
    version: typeof result.version === 'number' ? result.version : null,
    importedAt: result.importedAt ?? null,
    artifactCount: result.artifactCount ?? 0,
    artifacts: result.artifacts ?? [],
  };
}

export function ArtifactsInventoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] =
    useState<ArtifactsStatusSnapshot>(emptySnapshot);

  const applySnapshot = useCallback((next: ArtifactsStatusSnapshot) => {
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
        const result = await getLeyline().artifacts.status();
        if (!result.ok) {
          setError(result.error ?? 'Failed to load artifacts');
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
        const result = await getLeyline().artifacts.import(jsonText);
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
      const result = await getLeyline().artifacts.clear();
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
    <ArtifactsInventoryContext.Provider value={value}>
      {children}
    </ArtifactsInventoryContext.Provider>
  );
}

export function useArtifactsInventory(): ArtifactsInventoryContextValue {
  const ctx = useContext(ArtifactsInventoryContext);
  if (!ctx) {
    throw new Error(
      'useArtifactsInventory requires ArtifactsInventoryProvider',
    );
  }
  return ctx;
}
