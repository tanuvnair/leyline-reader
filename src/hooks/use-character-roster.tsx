import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {isNotLinkedError} from '@/components/account-setup-empty';
import {useHoyoAccount} from '@/hooks/use-hoyo-account';
import {getLeyline} from '@/lib/leyline';

export interface CharacterRow {
  id?: number;
  name?: string;
  element?: string;
  /** Weapon type from HoYoLab (Sword, Claymore, …) when present. */
  weapon?: string;
  level?: number;
  rarity?: number;
  fetter?: number;
  actived_constellation_num?: number;
  /** Absolute HTTPS avatar from HoYoLab when present. */
  icon?: string;
}

export interface CharacterEnrichment {
  iconUrl?: string;
  iconBigUrl?: string;
  portraitUrl?: string;
  vision?: string;
  weapon?: string;
  title?: string;
  description?: string;
  nation?: string;
  rarity?: number;
  constellation?: string;
  birthday?: string;
}

interface RosterContextValue {
  loading: boolean;
  error: string | null;
  characters: CharacterRow[];
  enrichment: Record<string, CharacterEnrichment>;
  refresh: (options?: {force?: boolean}) => Promise<void>;
  clear: () => void;
  findByKey: (key: string) => {
    character: CharacterRow;
    meta?: CharacterEnrichment;
  } | null;
}

const RosterContext = createContext<RosterContextValue | null>(null);

export function CharacterRosterProvider({children}: {children: ReactNode}) {
  const {linked, refresh: refreshAccount} = useHoyoAccount();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [enrichment, setEnrichment] = useState<
    Record<string, CharacterEnrichment>
  >({});

  const clear = useCallback(() => {
    setCharacters([]);
    setEnrichment({});
    setError(null);
    setLoaded(false);
  }, []);

  useEffect(() => {
    if (!linked) {
      clear();
    }
  }, [linked, clear]);

  const refresh = useCallback(
    async (options: {force?: boolean} = {}) => {
      if (!linked) {
        clear();
        return;
      }
      if (loaded && !options.force) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await getLeyline().data.characters({
          force: options.force,
        });
        if (!result.ok) {
          const message = result.error ?? 'Failed to load characters';
          if (isNotLinkedError(message)) {
            await refreshAccount();
          }
          setError(message);
          setCharacters([]);
          setEnrichment({});
          setLoaded(true);
          return;
        }
        setCharacters((result.characters as CharacterRow[]) ?? []);
        setEnrichment(
          (result.enrichment as Record<string, CharacterEnrichment>) ?? {},
        );
        setLoaded(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load';
        if (isNotLinkedError(message)) {
          await refreshAccount();
        }
        setError(message);
        setLoaded(true);
      } finally {
        setLoading(false);
      }
    },
    [clear, linked, loaded, refreshAccount],
  );

  const findByKey = useCallback(
    (key: string) => {
      const decoded = decodeURIComponent(key);
      const character =
        characters.find((row) => String(row.id) === key) ??
        characters.find((row) => row.name === decoded) ??
        characters.find((row) => row.name === key);
      if (!character) {
        return null;
      }
      const name = character.name ?? '';
      return {character, meta: enrichment[name]};
    },
    [characters, enrichment],
  );

  const value = useMemo(
    () => ({
      loading,
      error,
      characters,
      enrichment,
      refresh,
      clear,
      findByKey,
    }),
    [loading, error, characters, enrichment, refresh, clear, findByKey],
  );

  return (
    <RosterContext.Provider value={value}>{children}</RosterContext.Provider>
  );
}

export function useCharacterRoster(): RosterContextValue {
  const ctx = useContext(RosterContext);
  if (!ctx) {
    throw new Error('useCharacterRoster requires CharacterRosterProvider');
  }
  return ctx;
}
