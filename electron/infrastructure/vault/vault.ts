import {safeStorage, app} from 'electron';
import Store from 'electron-store';
import path from 'node:path';
import type {HoyoCookiePayload, LinkedAccountMeta} from '../../domain/account/types';
import type {VaultPort} from '../../domain/ports/vault';
import {loadConfig} from '../config/load';

export type {HoyoCookiePayload, LinkedAccountMeta};

interface VaultSchema {
  passwordHash: string | null;
  encryptedHoyoCookie: string | null;
  account: LinkedAccountMeta | null;
}

let store: Store<VaultSchema> | null = null;

function getStore(): Store<VaultSchema> {
  if (store) {
    return store;
  }

  const config = loadConfig();
  if (config.storage.userDataDirOverride) {
    app.setPath('userData', config.storage.userDataDirOverride);
  } else {
    const base = app.getPath('appData');
    app.setPath('userData', path.join(base, config.userDataDirName));
  }

  store = new Store<VaultSchema>({
    name: config.storage.storeFileName,
    defaults: {
      passwordHash: null,
      encryptedHoyoCookie: null,
      account: null,
    },
  });
  return store;
}

function encrypt(plaintext: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS secure storage is not available on this system');
  }
  return safeStorage.encryptString(plaintext).toString('base64');
}

function decrypt(ciphertext: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS secure storage is not available on this system');
  }
  return safeStorage.decryptString(Buffer.from(ciphertext, 'base64'));
}

export function getPasswordHash(): string | null {
  return getStore().get('passwordHash');
}

export function setPasswordHash(hash: string): void {
  getStore().set('passwordHash', hash);
}

export function hasPassword(): boolean {
  return Boolean(getPasswordHash());
}

export function saveHoyoCookie(payload: HoyoCookiePayload): void {
  const encrypted = encrypt(JSON.stringify(payload));
  getStore().set('encryptedHoyoCookie', encrypted);
}

export function loadHoyoCookie(): HoyoCookiePayload | null {
  const encrypted = getStore().get('encryptedHoyoCookie');
  if (!encrypted) {
    return null;
  }
  try {
    const json = decrypt(encrypted);
    return JSON.parse(json) as HoyoCookiePayload;
  } catch {
    return null;
  }
}

export function clearHoyoCookie(): void {
  getStore().set('encryptedHoyoCookie', null);
  getStore().set('account', null);
}

export function hasHoyoCookie(): boolean {
  return Boolean(getStore().get('encryptedHoyoCookie'));
}

export function saveAccount(account: LinkedAccountMeta): void {
  getStore().set('account', account);
}

export function getAccount(): LinkedAccountMeta | null {
  return getStore().get('account');
}

export function getVaultPath(): string {
  return getStore().path;
}

/** VaultPort adapter over electron-store + safeStorage. */
export const vaultPort: VaultPort = {
  getPasswordHash,
  setPasswordHash,
  hasPassword,
  saveHoyoCookie,
  loadHoyoCookie,
  clearHoyoCookie,
  hasHoyoCookie,
  saveAccount,
  getAccount,
};
