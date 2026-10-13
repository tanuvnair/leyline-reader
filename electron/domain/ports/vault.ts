import type {HoyoCookiePayload, LinkedAccountMeta} from '../account/types';
import type {GoodArtifactsInventory} from '../good/artifacts';

/** Persistence port for vault secrets and linked-account metadata. */
export interface VaultPort {
  getPasswordHash(): string | null;
  setPasswordHash(hash: string): void;
  hasPassword(): boolean;
  saveHoyoCookie(payload: HoyoCookiePayload): void;
  loadHoyoCookie(): HoyoCookiePayload | null;
  clearHoyoCookie(): void;
  hasHoyoCookie(): boolean;
  saveAccount(account: LinkedAccountMeta): void;
  getAccount(): LinkedAccountMeta | null;
  saveGoodArtifacts(inventory: GoodArtifactsInventory): void;
  loadGoodArtifacts(): GoodArtifactsInventory | null;
  clearGoodArtifacts(): void;
  hasGoodArtifacts(): boolean;
}
