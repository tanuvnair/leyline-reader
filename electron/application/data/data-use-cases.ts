import {NOT_LINKED} from '../../domain/account/errors';
import {requireUnlocked} from '../../infrastructure/auth/session';
import {appConfigPort} from '../../infrastructure/config/app-config-port';
import {catalogPort} from '../../infrastructure/genshin-dev/client';
import {hoyoRecordsPort} from '../../infrastructure/hoyolab/client';
import {vaultPort} from '../../infrastructure/vault/vault';
import {resolveHoyoCredentials} from '../hoyo/credentials';

function requireLinked(): void {
  requireUnlocked();
  if (!vaultPort.hasHoyoCookie()) {
    throw new Error(NOT_LINKED);
  }
}

export async function getOverview() {
  requireLinked();
  const credentials = resolveHoyoCredentials(vaultPort, appConfigPort);
  const [records, dailyNoteResult] = await Promise.all([
    hoyoRecordsPort.fetchGameRecord(credentials),
    hoyoRecordsPort.fetchDailyNote(credentials),
  ]);
  return {
    ok: true as const,
    account: vaultPort.getAccount(),
    records,
    dailyNote: dailyNoteResult.ok ? dailyNoteResult.data : null,
    dailyNoteError: dailyNoteResult.ok ? null : dailyNoteResult.error,
  };
}

export async function getCharacters() {
  requireLinked();
  const credentials = resolveHoyoCredentials(vaultPort, appConfigPort);
  const list = await hoyoRecordsPort.fetchCharacters(credentials);
  const names = list
    .map((c) => c.name)
    .filter((n): n is string => Boolean(n));
  const enrichment = await catalogPort.enrichCharacters(names);
  return {
    ok: true as const,
    characters: list,
    enrichment,
  };
}

export async function getAbyss(scheduleType: 1 | 2) {
  requireLinked();
  const credentials = resolveHoyoCredentials(vaultPort, appConfigPort);
  const abyss = await hoyoRecordsPort.fetchSpiralAbyss(
    credentials,
    scheduleType,
  );
  return {ok: true as const, abyss};
}
