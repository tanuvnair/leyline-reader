import {ipcMain, type BrowserWindow, type IpcMainInvokeEvent} from 'electron';
import {z} from 'zod';
import {getPublicConfig, loadConfig} from '../config/load';
import {
  changePassword,
  getAuthStatus,
  lockSession,
  requireUnlocked,
  setupPassword,
  unlock,
} from '../auth/session';
import {openHoyoLoginWindow} from '../hoyolab/login';
import {
  fetchCharacters,
  fetchDailyNoteResult,
  fetchGameRecord,
  fetchSpiralAbyss,
  validateAndLinkAccount,
} from '../hoyolab/client';
import {enrichCharacters} from '../genshin-dev/client';
import {
  clearHoyoCookie,
  getAccount,
  hasHoyoCookie,
} from '../store/vault';
import {assertTrustedIpcSender} from '../security/trust';
import {IpcChannels} from './channels';

const passwordSchema = z.string().min(1).max(256);
const abyssScheduleSchema = z.union([z.literal(1), z.literal(2)]).default(1);
const NOT_LINKED = 'not-linked';

function redactError(error: unknown): Error {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const redacted = message
    .replace(/(ltoken|cookie_token|ltmid|ltuid)[_v0-9]*=\S+/gi, '[REDACTED]')
    .replace(/Bearer\s+\S+/gi, '[REDACTED]');
  return new Error(redacted);
}

function withSecurity<TArgs extends unknown[], TResult>(
  handler: (event: IpcMainInvokeEvent, ...args: TArgs) => TResult | Promise<TResult>,
) {
  return async (event: IpcMainInvokeEvent, ...args: TArgs): Promise<TResult> => {
    assertTrustedIpcSender(event);
    return handler(event, ...args);
  };
}

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  loadConfig();

  ipcMain.handle(
    IpcChannels.GET_PUBLIC_CONFIG,
    withSecurity(() => getPublicConfig()),
  );

  ipcMain.handle(
    IpcChannels.AUTH_STATUS,
    withSecurity(() => getAuthStatus()),
  );

  ipcMain.handle(
    IpcChannels.AUTH_SETUP,
    withSecurity(async (_event, password: unknown) => {
      try {
        const value = passwordSchema.parse(password);
        await setupPassword(value);
        return {ok: true as const};
      } catch (error) {
        return {ok: false as const, error: redactError(error).message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.AUTH_UNLOCK,
    withSecurity(async (_event, password: unknown) => {
      try {
        const value = passwordSchema.parse(password);
        const ok = await unlock(value);
        return {ok};
      } catch (error) {
        return {ok: false, error: redactError(error).message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.AUTH_LOCK,
    withSecurity(() => {
      lockSession();
      return {ok: true};
    }),
  );

  ipcMain.handle(
    IpcChannels.AUTH_CHANGE_PASSWORD,
    withSecurity(async (_event, currentPassword: unknown, newPassword: unknown) => {
      try {
        const current = passwordSchema.parse(currentPassword);
        const next = passwordSchema.parse(newPassword);
        await changePassword(current, next);
        return {ok: true as const};
      } catch (error) {
        return {ok: false as const, error: redactError(error).message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.HOYO_STATUS,
    withSecurity(() => {
      try {
        requireUnlocked();
        return {
          ok: true as const,
          linked: hasHoyoCookie(),
          account: getAccount(),
        };
      } catch (error) {
        return {
          ok: false as const,
          linked: false,
          account: null,
          error: redactError(error).message,
        };
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.HOYO_LINK,
    withSecurity(async () => {
      try {
        requireUnlocked();
        await openHoyoLoginWindow(getMainWindow());
        try {
          const account = await validateAndLinkAccount();
          return {ok: true as const, account};
        } catch (error) {
          // Login window already persisted cookies; roll back on failed validate
          // so Settings does not show "Linked" with a broken session.
          clearHoyoCookie();
          throw error;
        }
      } catch (error) {
        return {ok: false as const, error: redactError(error).message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.HOYO_UNLINK,
    withSecurity(() => {
      try {
        requireUnlocked();
        clearHoyoCookie();
        return {ok: true as const};
      } catch (error) {
        return {ok: false as const, error: redactError(error).message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.DATA_OVERVIEW,
    withSecurity(async () => {
      try {
        requireUnlocked();
        if (!hasHoyoCookie()) {
          return {ok: false as const, error: NOT_LINKED};
        }
        const [records, dailyNoteResult] = await Promise.all([
          fetchGameRecord(),
          fetchDailyNoteResult(),
        ]);
        return {
          ok: true as const,
          account: getAccount(),
          records,
          dailyNote: dailyNoteResult.ok ? dailyNoteResult.data : null,
          dailyNoteError: dailyNoteResult.ok ? null : dailyNoteResult.error,
        };
      } catch (error) {
        return {ok: false as const, error: redactError(error).message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.DATA_CHARACTERS,
    withSecurity(async () => {
      try {
        requireUnlocked();
        if (!hasHoyoCookie()) {
          return {ok: false as const, error: NOT_LINKED};
        }
        const list = await fetchCharacters();
        const names = list
          .map((c) => c.name)
          .filter((n): n is string => Boolean(n));
        const enrichment = await enrichCharacters(names);
        return {
          ok: true as const,
          characters: list,
          enrichment,
        };
      } catch (error) {
        return {ok: false as const, error: redactError(error).message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.DATA_ABYSS,
    withSecurity(async (_event, scheduleType: unknown) => {
      try {
        requireUnlocked();
        if (!hasHoyoCookie()) {
          return {ok: false as const, error: NOT_LINKED};
        }
        const schedule = abyssScheduleSchema.parse(scheduleType ?? 1);
        const abyss = await fetchSpiralAbyss(schedule);
        return {ok: true as const, abyss};
      } catch (error) {
        return {ok: false as const, error: redactError(error).message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.WINDOW_MINIMIZE,
    withSecurity(() => {
      getMainWindow()?.minimize();
    }),
  );

  ipcMain.handle(
    IpcChannels.WINDOW_MAXIMIZE,
    withSecurity(() => {
      const window = getMainWindow();
      if (!window) {
        return false;
      }
      if (window.isMaximized()) {
        window.unmaximize();
        return false;
      }
      window.maximize();
      return true;
    }),
  );

  ipcMain.handle(
    IpcChannels.WINDOW_CLOSE,
    withSecurity(() => {
      getMainWindow()?.close();
    }),
  );

  ipcMain.handle(
    IpcChannels.WINDOW_IS_MAXIMIZED,
    withSecurity(() => getMainWindow()?.isMaximized() ?? false),
  );
}
