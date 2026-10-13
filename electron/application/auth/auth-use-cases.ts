import {
  changePassword as changePasswordSession,
  getAuthStatus as getAuthStatusSession,
  lockSession,
  setupPassword as setupPasswordSession,
  unlock as unlockSession,
} from '../../infrastructure/auth/session';
import {clearHoyoDataCache} from '../cache/ttl-cache';

export function getAuthStatus() {
  return getAuthStatusSession();
}

export async function setupPassword(password: string) {
  await setupPasswordSession(password);
  return {ok: true as const};
}

export async function unlock(password: string) {
  const ok = await unlockSession(password);
  return {ok};
}

export function lock() {
  lockSession();
  clearHoyoDataCache();
  return {ok: true as const};
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  await changePasswordSession(currentPassword, newPassword);
  return {ok: true as const};
}
