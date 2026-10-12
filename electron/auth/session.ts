import bcrypt from 'bcryptjs';
import {loadConfig} from '../config/load';
import {
  getPasswordHash,
  hasPassword,
  setPasswordHash,
} from '../store/vault';

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

function assertPasswordPolicy(password: string): void {
  const policy = loadConfig().auth.passwordPolicy;
  if (password.length < policy.minLength) {
    throw new Error(
      `Password must be at least ${policy.minLength} characters`,
    );
  }
  if (policy.requireLetter && !/[A-Za-z]/.test(password)) {
    throw new Error('Password must include a letter');
  }
  if (policy.requireNumber && !/\d/.test(password)) {
    throw new Error('Password must include a number');
  }
  if (
    policy.requireSpecial &&
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
  ) {
    throw new Error('Password must include a special character');
  }
}

function isSessionExpired(): boolean {
  if (!session.unlocked || session.unlockedAt === null) {
    return true;
  }
  const {sessionIdleTimeoutMs} = loadConfig().auth;
  return Date.now() - session.unlockedAt > sessionIdleTimeoutMs;
}

function assertNotLockedOut(): void {
  if (session.lockoutUntil !== null && Date.now() < session.lockoutUntil) {
    const seconds = Math.ceil((session.lockoutUntil - Date.now()) / 1000);
    throw new Error(`Too many failed attempts. Try again in ${seconds}s`);
  }
  if (session.lockoutUntil !== null && Date.now() >= session.lockoutUntil) {
    session.lockoutUntil = null;
    session.failedUnlockAttempts = 0;
  }
}

function registerFailedUnlock(): void {
  const {maxFailedAttempts, lockoutMs} = loadConfig().auth;
  session.failedUnlockAttempts += 1;
  if (session.failedUnlockAttempts >= maxFailedAttempts) {
    session.lockoutUntil = Date.now() + lockoutMs;
    session.failedUnlockAttempts = 0;
  }
}

export function getAuthStatus(): {
  hasPassword: boolean;
  unlocked: boolean;
} {
  if (session.unlocked && isSessionExpired()) {
    lockSession();
  }
  return {
    hasPassword: hasPassword(),
    unlocked: session.unlocked && !isSessionExpired(),
  };
}

export function requireUnlocked(): void {
  const status = getAuthStatus();
  if (!status.unlocked) {
    throw new Error('Application is locked');
  }
}

export async function setupPassword(password: string): Promise<void> {
  if (hasPassword()) {
    throw new Error('Password already configured');
  }
  assertPasswordPolicy(password);
  const rounds = loadConfig().auth.bcryptRounds;
  const hash = await bcrypt.hash(password, rounds);
  setPasswordHash(hash);
  session.unlocked = true;
  session.unlockedAt = Date.now();
  session.failedUnlockAttempts = 0;
  session.lockoutUntil = null;
}

export async function unlock(password: string): Promise<boolean> {
  assertNotLockedOut();
  const hash = getPasswordHash();
  if (!hash) {
    throw new Error('No password configured');
  }
  const ok = await bcrypt.compare(password, hash);
  if (!ok) {
    registerFailedUnlock();
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
): Promise<void> {
  requireUnlocked();
  assertNotLockedOut();
  const hash = getPasswordHash();
  if (!hash) {
    throw new Error('No password configured');
  }
  const ok = await bcrypt.compare(currentPassword, hash);
  if (!ok) {
    registerFailedUnlock();
    throw new Error('Current password is incorrect');
  }
  assertPasswordPolicy(newPassword);
  const rounds = loadConfig().auth.bcryptRounds;
  setPasswordHash(await bcrypt.hash(newPassword, rounds));
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
