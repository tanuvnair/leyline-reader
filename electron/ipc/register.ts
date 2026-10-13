import {ipcMain, type BrowserWindow, type IpcMainInvokeEvent} from 'electron';
import {z} from 'zod';
import {redactError} from '../application/errors';
import {
  changePassword,
  getAuthStatus,
  lock,
  setupPassword,
  unlock,
} from '../application/auth/auth-use-cases';
import {
  clearGoodInventory,
  getGoodInventoryStatus,
  importGoodInventory,
} from '../application/inventory/good-inventory-use-cases';
import {
  getAbyss,
  getCharacters,
  getOverview,
} from '../application/data/data-use-cases';
import {
  getHoyoStatus,
  linkHoyoAccount,
  unlinkHoyoAccount,
} from '../application/hoyo/hoyo-use-cases';
import {NOT_LINKED} from '../domain/account/errors';
import {getPublicConfig, loadConfig} from '../infrastructure/config/load';
import {assertTrustedIpcSender} from '../infrastructure/security/trust';
import {IpcChannels} from './channels';

const passwordSchema = z.string().min(1).max(256);
const abyssScheduleSchema = z.union([z.literal(1), z.literal(2)]).default(1);
const dataFetchOptionsSchema = z
  .object({
    force: z.boolean().optional(),
  })
  .default({});
const goodJsonSchema = z.string().min(1).max(32_000_000);

function withSecurity<TArgs extends unknown[], TResult>(
  handler: (event: IpcMainInvokeEvent, ...args: TArgs) => TResult | Promise<TResult>,
) {
  return async (event: IpcMainInvokeEvent, ...args: TArgs): Promise<TResult> => {
    assertTrustedIpcSender(event);
    return handler(event, ...args);
  };
}

function asErrorResult(error: unknown) {
  const message = redactError(error).message;
  return {ok: false as const, error: message};
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
        return await setupPassword(value);
      } catch (error) {
        return asErrorResult(error);
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.AUTH_UNLOCK,
    withSecurity(async (_event, password: unknown) => {
      try {
        const value = passwordSchema.parse(password);
        return await unlock(value);
      } catch (error) {
        return {ok: false, error: redactError(error).message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.AUTH_LOCK,
    withSecurity(() => lock()),
  );

  ipcMain.handle(
    IpcChannels.AUTH_CHANGE_PASSWORD,
    withSecurity(async (_event, currentPassword: unknown, newPassword: unknown) => {
      try {
        const current = passwordSchema.parse(currentPassword);
        const next = passwordSchema.parse(newPassword);
        return await changePassword(current, next);
      } catch (error) {
        return asErrorResult(error);
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.HOYO_STATUS,
    withSecurity(() => {
      try {
        return getHoyoStatus();
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
        return await linkHoyoAccount(getMainWindow());
      } catch (error) {
        return asErrorResult(error);
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.HOYO_UNLINK,
    withSecurity(() => {
      try {
        return unlinkHoyoAccount();
      } catch (error) {
        return asErrorResult(error);
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.DATA_OVERVIEW,
    withSecurity(async (_event, options: unknown) => {
      try {
        const {force} = dataFetchOptionsSchema.parse(options ?? {});
        return await getOverview({force});
      } catch (error) {
        const message = redactError(error).message;
        if (message === NOT_LINKED) {
          return {ok: false as const, error: NOT_LINKED};
        }
        return {ok: false as const, error: message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.DATA_CHARACTERS,
    withSecurity(async (_event, options: unknown) => {
      try {
        const {force} = dataFetchOptionsSchema.parse(options ?? {});
        return await getCharacters({force});
      } catch (error) {
        const message = redactError(error).message;
        if (message === NOT_LINKED) {
          return {ok: false as const, error: NOT_LINKED};
        }
        return {ok: false as const, error: message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.DATA_ABYSS,
    withSecurity(async (_event, scheduleType: unknown, options: unknown) => {
      try {
        const schedule = abyssScheduleSchema.parse(scheduleType ?? 1);
        const {force} = dataFetchOptionsSchema.parse(options ?? {});
        return await getAbyss(schedule, {force});
      } catch (error) {
        const message = redactError(error).message;
        if (message === NOT_LINKED) {
          return {ok: false as const, error: NOT_LINKED};
        }
        return {ok: false as const, error: message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.GOOD_INVENTORY_STATUS,
    withSecurity(() => {
      try {
        return getGoodInventoryStatus();
      } catch (error) {
        return {ok: false as const, error: redactError(error).message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.GOOD_INVENTORY_IMPORT,
    withSecurity((_event, jsonText: unknown) => {
      try {
        const payload = goodJsonSchema.parse(jsonText);
        return importGoodInventory(payload);
      } catch (error) {
        return {ok: false as const, error: redactError(error).message};
      }
    }),
  );

  ipcMain.handle(
    IpcChannels.GOOD_INVENTORY_CLEAR,
    withSecurity(() => {
      try {
        return clearGoodInventory();
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
