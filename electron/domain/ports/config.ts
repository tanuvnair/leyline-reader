import type {PasswordPolicy} from '../auth/password-policy';

/** Non-secret config slices needed by Application / Domain rules. */
export interface AppConfigPort {
  passwordPolicy(): PasswordPolicy;
  bcryptRounds(): number;
  sessionIdleTimeoutMs(): number;
  maxFailedAttempts(): number;
  lockoutMs(): number;
  hoyoLanguage(): string;
  bbsApiBase(): string;
  characterListPath(): string;
  artifactIconBaseUrl(): string;
  artifactIconFallbackBaseUrl(): string;
  characterIconBaseUrl(): string;
  characterIconFallbackBaseUrl(): string;
  weaponIconBaseUrl(): string;
  weaponIconFallbackBaseUrl(): string;
  materialIconBaseUrl(): string;
  materialIconFallbackBaseUrl(): string;
  goodInventoryMaxBytes(): number;
}
