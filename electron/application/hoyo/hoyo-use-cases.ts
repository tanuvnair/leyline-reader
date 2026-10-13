import type {LinkedAccountMeta} from '../../domain/account/types';
import {requireUnlocked} from '../../infrastructure/auth/session';
import {appConfigPort} from '../../infrastructure/config/app-config-port';
import {hoyoLoginPort} from '../../infrastructure/hoyolab/login';
import {hoyoRecordsPort} from '../../infrastructure/hoyolab/client';
import {vaultPort} from '../../infrastructure/vault/vault';
import {clearHoyoDataCache} from '../cache/ttl-cache';
import {resolveHoyoCredentials} from './credentials';

export function getHoyoStatus() {
  requireUnlocked();
  return {
    ok: true as const,
    linked: vaultPort.hasHoyoCookie(),
    account: vaultPort.getAccount(),
  };
}

export async function linkHoyoAccount(
  parentWindow: unknown,
): Promise<{ok: true; account: LinkedAccountMeta}> {
  requireUnlocked();
  const payload = await hoyoLoginPort.captureCookies(parentWindow);
  vaultPort.saveHoyoCookie(payload);
  try {
    const credentials = resolveHoyoCredentials(vaultPort, appConfigPort);
    const account = await hoyoRecordsPort.validateAndLink(credentials);
    vaultPort.saveAccount(account);
    clearHoyoDataCache();
    return {ok: true as const, account};
  } catch (error) {
    // Roll back so Settings does not show Linked with a broken session.
    vaultPort.clearHoyoCookie();
    clearHoyoDataCache();
    throw error;
  }
}

export function unlinkHoyoAccount() {
  requireUnlocked();
  vaultPort.clearHoyoCookie();
  clearHoyoDataCache();
  return {ok: true as const};
}
