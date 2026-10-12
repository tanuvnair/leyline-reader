import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {getLeyline, hasLeylineBridge, withTimeout} from '@/lib/leyline';

interface AuthState {
  loading: boolean;
  hasPassword: boolean;
  unlocked: boolean;
  bridgeError: string | null;
  refresh: () => Promise<void>;
  setup: (password: string) => Promise<{ok: boolean; error?: string}>;
  unlock: (password: string) => Promise<{ok: boolean; error?: string}>;
  lock: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [loading, setLoading] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (!hasLeylineBridge()) {
        setHasPassword(false);
        setUnlocked(false);
        setBridgeError(
          'Electron bridge missing. Use npm run dev (not a browser tab).',
        );
        return;
      }
      const status = await withTimeout(
        getLeyline().auth.status(),
        5000,
        'Auth status timed out',
      );
      setHasPassword(status.hasPassword);
      setUnlocked(status.unlocked);
      setBridgeError(null);
    } catch (error) {
      setHasPassword(false);
      setUnlocked(false);
      setBridgeError(
        error instanceof Error ? error.message : 'Failed to reach app vault',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setup = useCallback(
    async (password: string) => {
      const result = await getLeyline().auth.setup(password);
      if (result.ok) {
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  const unlock = useCallback(
    async (password: string) => {
      const result = await getLeyline().auth.unlock(password);
      if (result.ok) {
        await refresh();
      }
      return result;
    },
    [refresh],
  );

  const lock = useCallback(async () => {
    await getLeyline().auth.lock();
    await refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{
        loading,
        hasPassword,
        unlocked,
        bridgeError,
        refresh,
        setup,
        unlock,
        lock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
