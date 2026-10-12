import {
  GenshinImpact,
  LanguageEnum,
  SpiralAbyssScheduleEnum,
} from 'hoyoapi';
import {
  normalizeCharacter,
  pickCharacterList,
} from '../../domain/hoyo/character';
import {
  friendlyDailyNoteError,
  type CharacterDto,
  type DailyNoteResult,
} from '../../domain/hoyo/types';
import type {LinkedAccountMeta} from '../../domain/account/types';
import {normalizeCookieString} from '../../domain/hoyo/cookies';
import type {
  HoyoRecordsCredentials,
  HoyoRecordsPort,
} from '../../domain/ports/hoyo-records';
import {isHttpsUrl} from '../security/trust';

function resolveLanguage(code: string): LanguageEnum {
  const normalized = code.toLowerCase().replace('_', '-');
  const map: Record<string, LanguageEnum> = {
    'en-us': LanguageEnum.ENGLISH,
    en: LanguageEnum.ENGLISH,
    'zh-cn': LanguageEnum.SIMPLIFIED_CHINESE,
    'zh-tw': LanguageEnum.TRADIIONAL_CHINESE,
    ja: LanguageEnum.JAPANESE,
    'ja-jp': LanguageEnum.JAPANESE,
    ko: LanguageEnum.KOREAN,
    'ko-kr': LanguageEnum.KOREAN,
  };
  return map[normalized] ?? LanguageEnum.ENGLISH;
}

async function createClient(
  credentials: HoyoRecordsCredentials,
): Promise<GenshinImpact> {
  const cookie = normalizeCookieString(credentials.cookie);
  if (credentials.uid) {
    return new GenshinImpact({
      cookie,
      lang: resolveLanguage(credentials.language),
      uid: credentials.uid,
    });
  }
  return GenshinImpact.create({
    cookie,
    lang: resolveLanguage(credentials.language),
  });
}

function characterListUrl(credentials: HoyoRecordsCredentials): string {
  const base = credentials.bbsApiBase.replace(/\/$/, '');
  if (!isHttpsUrl(base)) {
    throw new Error('HoYoLab BBS API base must be HTTPS');
  }
  return `${base}${credentials.characterListPath}`;
}

/** hoyoapi marks `request` private in .d.ts but exposes it at runtime. */
interface HoyoHttpRequest {
  setBody: (data: Record<string, unknown>) => HoyoHttpRequest;
  setDs: (flag?: boolean) => HoyoHttpRequest;
  send: (
    url: string,
    method?: string,
  ) => Promise<{
    response: {retcode: number; message?: string; data: unknown};
  }>;
}

function hoyoRequest(client: GenshinImpact): HoyoHttpRequest {
  return (client as unknown as {request: HoyoHttpRequest}).request;
}

async function fetchCharacterListModern(
  client: GenshinImpact,
  credentials: HoyoRecordsCredentials,
): Promise<CharacterDto[]> {
  if (!client.region || !client.uid) {
    throw new Error('UID parameter is missing or failed to be filled');
  }
  const request = hoyoRequest(client);
  request
    .setBody({
      server: client.region,
      role_id: client.uid,
    })
    .setDs(true);
  const {response: res} = await request.send(
    characterListUrl(credentials),
    'POST',
  );
  if (res.retcode !== 0) {
    throw new Error(
      res.message ||
        'Failed to retrieve characters; check the linked UID and HoYoLab privacy.',
    );
  }
  return pickCharacterList(res.data)
    .map(normalizeCharacter)
    .filter((row): row is CharacterDto => row !== null);
}

async function validateAndLink(
  credentials: HoyoRecordsCredentials,
): Promise<LinkedAccountMeta> {
  const client = await createClient(credentials);
  const records = await client.record.records();
  const role = records.role;
  const uid = client.uid ?? 0;
  const meta: LinkedAccountMeta = {
    uid,
    nickname: role.nickname || 'Traveler',
    level: role.level,
    region: role.region || client.region || '',
    linkedAt: new Date().toISOString(),
  };
  if (!meta.uid) {
    throw new Error('Unable to resolve Genshin UID from HoYoverse account');
  }
  return meta;
}

async function fetchGameRecord(
  credentials: HoyoRecordsCredentials,
): Promise<unknown> {
  const client = await createClient(credentials);
  return client.record.records();
}

async function fetchCharacters(
  credentials: HoyoRecordsCredentials,
): Promise<CharacterDto[]> {
  const client = await createClient(credentials);

  try {
    const modern = await fetchCharacterListModern(client, credentials);
    if (modern.length > 0) {
      return modern;
    }
  } catch {
    // Fall through to legacy / index sources.
  }

  try {
    const legacy = await client.record.characters();
    const fromLegacy = pickCharacterList(legacy)
      .map(normalizeCharacter)
      .filter((row): row is CharacterDto => row !== null);
    if (fromLegacy.length > 0) {
      return fromLegacy;
    }
  } catch {
    // Fall through to index avatars (often only featured characters).
  }

  const records = await client.record.records();
  return pickCharacterList(records)
    .map(normalizeCharacter)
    .filter((row): row is CharacterDto => row !== null);
}

async function fetchDailyNote(
  credentials: HoyoRecordsCredentials,
): Promise<DailyNoteResult> {
  try {
    const client = await createClient(credentials);
    const data = await client.record.dailyNote();
    return {ok: true, data: data as unknown as Record<string, unknown>};
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load daily note';
    return {ok: false, error: friendlyDailyNoteError(message)};
  }
}

async function fetchSpiralAbyss(
  credentials: HoyoRecordsCredentials,
  scheduleType: 1 | 2,
): Promise<unknown> {
  const client = await createClient(credentials);
  const schedule =
    scheduleType === 2
      ? SpiralAbyssScheduleEnum.PREVIOUS
      : SpiralAbyssScheduleEnum.CURRENT;
  return client.record.spiralAbyss(schedule);
}

export const hoyoRecordsPort: HoyoRecordsPort = {
  validateAndLink,
  fetchGameRecord,
  fetchCharacters,
  fetchDailyNote,
  fetchSpiralAbyss,
};
