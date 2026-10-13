import {NOT_LINKED} from '../../domain/account/errors';
import {loadConfig} from '../../infrastructure/config/load';
import {requireUnlocked} from '../../infrastructure/auth/session';
import {appConfigPort} from '../../infrastructure/config/app-config-port';
import {catalogPort} from '../../infrastructure/genshin-dev/client';
import {hoyoRecordsPort} from '../../infrastructure/hoyolab/client';
import {vaultPort} from '../../infrastructure/vault/vault';
import {getCached, setCached} from '../cache/ttl-cache';
import {resolveHoyoCredentials} from '../hoyo/credentials';

export interface DataFetchOptions {
  force?: boolean;
}

function requireLinked(): void {
  requireUnlocked();
  if (!vaultPort.hasHoyoCookie()) {
    throw new Error(NOT_LINKED);
  }
}

function ttlMs(): number {
  return loadConfig().hoyo.cacheTtlMs;
}

export async function getOverview(options: DataFetchOptions = {}) {
  requireLinked();
  const cacheKey = 'overview';
  if (!options.force) {
    const hit = getCached<Awaited<ReturnType<typeof fetchOverview>>>(cacheKey);
    if (hit) {
      return hit;
    }
  }
  const result = await fetchOverview();
  setCached(cacheKey, result, ttlMs());
  return result;
}

async function fetchOverview() {
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

export async function getCharacters(options: DataFetchOptions = {}) {
  requireLinked();
  const cacheKey = 'characters';
  if (!options.force) {
    const hit = getCached<Awaited<ReturnType<typeof fetchCharacters>>>(
      cacheKey,
    );
    if (hit) {
      return hit;
    }
  }
  const result = await fetchCharacters();
  setCached(cacheKey, result, ttlMs());
  return result;
}

async function fetchCharacters() {
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

export async function getAbyss(
  scheduleType: 1 | 2,
  options: DataFetchOptions = {},
) {
  requireLinked();
  const cacheKey = `abyss:${scheduleType}`;
  if (!options.force) {
    const hit = getCached<Awaited<ReturnType<typeof fetchAbyss>>>(cacheKey);
    if (hit) {
      return hit;
    }
  }
  const result = await fetchAbyss(scheduleType);
  setCached(cacheKey, result, ttlMs());
  return result;
}

async function fetchAbyss(scheduleType: 1 | 2) {
  const credentials = resolveHoyoCredentials(vaultPort, appConfigPort);
  const abyss = await hoyoRecordsPort.fetchSpiralAbyss(
    credentials,
    scheduleType,
  );
  return {ok: true as const, abyss};
}
