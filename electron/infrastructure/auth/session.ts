import bcrypt from 'bcryptjs';
import {assertPasswordPolicy} from '../../domain/auth/password-policy';
import {APP_LOCKED} from '../../domain/account/errors';
import type {AppConfigPort} from '../../domain/ports/config';
import type {VaultPort} from '../../domain/ports/vault';
import {appConfigPort} from '../config/app-config-port';
import {vaultPort} from '../vault/vault';

interface SessionState {
  unlocked: boolean;
  unlockedAt: number | null;
  failedUnlockAttempts: number;
  lockoutUntil: number | null;
}

const session: SessionState = {
  unlocked: false,
  unlockedAt: null,
  failedUnlockAttempts: 0,
  lockoutUntil: null,
};

function isSessionExpired(config: AppConfigPort): boolean {
  if (!session.unlocked || session.unlockedAt === null) {
    return true;
  }
  return Date.now() - session.unlockedAt > config.sessionIdleTimeoutMs();
}

function assertNotLockedOut(config: AppConfigPort): void {
  if (session.lockoutUntil !== null && Date.now() < session.lockoutUntil) {
    const seconds = Math.ceil((session.lockoutUntil - Date.now()) / 1000);
    throw new Error(`Too many failed attempts. Try again in ${seconds}s`);
  }
  if (session.lockoutUntil !== null && Date.now() >= session.lockoutUntil) {
    session.lockoutUntil = null;
    session.failedUnlockAttempts = 0;
  }
}

function registerFailedUnlock(config: AppConfigPort): void {
  session.failedUnlockAttempts += 1;
  if (session.failedUnlockAttempts >= config.maxFailedAttempts()) {
    session.lockoutUntil = Date.now() + config.lockoutMs();
    session.failedUnlockAttempts = 0;
  }
}

export function getAuthStatus(
  vault: VaultPort = vaultPort,
  config: AppConfigPort = appConfigPort,
): {
  hasPassword: boolean;
  unlocked: boolean;
} {
  if (session.unlocked && isSessionExpired(config)) {
    lockSession();
  }
  return {
    hasPassword: vault.hasPassword(),
    unlocked: session.unlocked && !isSessionExpired(config),
  };
}

export function requireUnlocked(
  vault: VaultPort = vaultPort,
  config: AppConfigPort = appConfigPort,
): void {
  const status = getAuthStatus(vault, config);
  if (!status.unlocked) {
    throw new Error(APP_LOCKED);
  }
}

export async function setupPassword(
  password: string,
  vault: VaultPort = vaultPort,
  config: AppConfigPort = appConfigPort,
): Promise<void> {
  if (vault.hasPassword()) {
    throw new Error('Password already configured');
  }
  assertPasswordPolicy(password, config.passwordPolicy());
  const hash = await bcrypt.hash(password, config.bcryptRounds());
  vault.setPasswordHash(hash);
  session.unlocked = true;
  session.unlockedAt = Date.now();
  session.failedUnlockAttempts = 0;
  session.lockoutUntil = null;
}

export async function unlock(
  password: string,
  vault: VaultPort = vaultPort,
  config: AppConfigPort = appConfigPort,
): Promise<boolean> {
  assertNotLockedOut(config);
  const hash = vault.getPasswordHash();
  if (!hash) {
    throw new Error('No password configured');
  }
  const ok = await bcrypt.compare(password, hash);
  if (!ok) {
    registerFailedUnlock(config);
    return false;
  }
  session.unlocked = true;
  session.unlockedAt = Date.now();
  session.failedUnlockAttempts = 0;
  session.lockoutUntil = null;
  return true;
}

export function lockSession(): void {
  session.unlocked = false;
  session.unlockedAt = null;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  vault: VaultPort = vaultPort,
  config: AppConfigPort = appConfigPort,
): Promise<void> {
  requireUnlocked(vault, config);
  assertNotLockedOut(config);
  const hash = vault.getPasswordHash();
  if (!hash) {
    throw new Error('No password configured');
  }
  const ok = await bcrypt.compare(currentPassword, hash);
  if (!ok) {
    registerFailedUnlock(config);
    throw new Error('Current password is incorrect');
  }
  assertPasswordPolicy(newPassword, config.passwordPolicy());
  vault.setPasswordHash(await bcrypt.hash(newPassword, config.bcryptRounds()));
  session.unlockedAt = Date.now();
  session.failedUnlockAttempts = 0;
  session.lockoutUntil = null;
}

/** Wipe in-memory session state on process exit / lock. */
export function clearSensitiveSessionState(): void {
  lockSession();
  session.failedUnlockAttempts = 0;
  session.lockoutUntil = null;
}
