import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {getLeyline} from '@/lib/leyline';

export interface HoyoAccountMeta {
  uid: number;
  nickname: string;
  level: number;
  region: string;
  linkedAt: string;
}

interface HoyoAccountState {
  /** False until the first status read finishes. */
  ready: boolean;
  linked: boolean;
  account: HoyoAccountMeta | null;
  error: string | null;
  refresh: () => Promise<void>;
}

const HoyoAccountContext = createContext<HoyoAccountState | null>(null);

export function HoyoAccountProvider({children}: {children: ReactNode}) {
  const [ready, setReady] = useState(false);
  const [linked, setLinked] = useState(false);
  const [account, setAccount] = useState<HoyoAccountMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const status = await getLeyline().hoyo.status();
      if (!status.ok) {
        setLinked(false);
        setAccount(null);
        setError(status.error ?? 'Failed to read account status');
        return;
      }
      setLinked(Boolean(status.linked));
      setAccount((status.account as HoyoAccountMeta | null) ?? null);
      setError(null);
    } catch (err) {
      setLinked(false);
      setAccount(null);
      setError(
        err instanceof Error ? err.message : 'Failed to read account status',
      );
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <HoyoAccountContext.Provider
      value={{ready, linked, account, error, refresh}}
    >
      {children}
    </HoyoAccountContext.Provider>
  );
}

export function useHoyoAccount(): HoyoAccountState {
  const ctx = useContext(HoyoAccountContext);
  if (!ctx) {
    throw new Error('useHoyoAccount must be used within HoyoAccountProvider');
  }
  return ctx;
}
