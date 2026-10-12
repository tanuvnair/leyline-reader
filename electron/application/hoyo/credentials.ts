import {normalizeCookieString} from '../../domain/hoyo/cookies';
import type {AppConfigPort} from '../../domain/ports/config';
import type {HoyoRecordsCredentials} from '../../domain/ports/hoyo-records';
import type {VaultPort} from '../../domain/ports/vault';

/** Build API credentials from the vault + config (Application orchestration). */
export function resolveHoyoCredentials(
  vault: VaultPort,
  config: AppConfigPort,
): HoyoRecordsCredentials {
  const payload = vault.loadHoyoCookie();
  if (!payload?.cookie) {
    throw new Error('HoYoverse account is not linked');
  }
  const normalized = normalizeCookieString(payload.cookie);
  if (normalized !== payload.cookie) {
    vault.saveHoyoCookie({
      cookie: normalized,
      capturedAt: payload.capturedAt,
    });
  }
  const account = vault.getAccount();
  return {
    cookie: normalized,
    uid: account?.uid,
    language: config.hoyoLanguage(),
    bbsApiBase: config.bbsApiBase(),
    characterListPath: config.characterListPath(),
  };
}
