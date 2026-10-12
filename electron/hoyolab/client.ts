import {
  GenshinImpact,
  LanguageEnum,
  SpiralAbyssScheduleEnum,
} from 'hoyoapi';
import {loadConfig} from '../config/load';
import {isHttpsUrl} from '../security/trust';
import {
  getAccount,
  loadHoyoCookie,
  saveAccount,
  saveHoyoCookie,
  type LinkedAccountMeta,
} from '../store/vault';
import {normalizeCookieString} from './cookies';

/** Sanitized character row for the renderer (no cookie/token fields). */
export interface CharacterDto {
  id?: number;
  name?: string;
  element?: string;
  level?: number;
  rarity?: number;
  fetter?: number;
  actived_constellation_num?: number;
  icon?: string;
}

export type DailyNoteResult =
  | {ok: true; data: Awaited<ReturnType<GenshinImpact['record']['dailyNote']>>}
  | {ok: false; error: string};

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

function cookieForHoyoapi(): string {
  const payload = loadHoyoCookie();
  if (!payload?.cookie) {
    throw new Error('HoYoverse account is not linked');
  }
  const normalized = normalizeCookieString(payload.cookie);
  if (normalized !== payload.cookie) {
    // Upgrade vault payloads captured before v2→v1 aliasing.
    saveHoyoCookie({
      cookie: normalized,
      capturedAt: payload.capturedAt,
    });
  }
  return normalized;
}

async function createClient(): Promise<GenshinImpact> {
  const cookie = cookieForHoyoapi();
  const config = loadConfig();
  const existing = getAccount();
  if (existing?.uid) {
    return new GenshinImpact({
      cookie,
      lang: resolveLanguage(config.hoyo.language),
      uid: existing.uid,
    });
  }
  return GenshinImpact.create({
    cookie,
    lang: resolveLanguage(config.hoyo.language),
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function pickCharacterList(payload: unknown): unknown[] {
  const root = asRecord(payload);
  if (!root) {
    return [];
  }
  for (const key of ['list', 'avatars', 'characters'] as const) {
    const value = root[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

function normalizeCharacter(raw: unknown): CharacterDto | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const base = asRecord(row.base) ?? row;
  const name = typeof base.name === 'string' ? base.name : undefined;
  const id = typeof base.id === 'number' ? base.id : undefined;
  if (!name && id === undefined) {
    return null;
  }
  return {
    id,
    name,
    element: typeof base.element === 'string' ? base.element : undefined,
    level: typeof base.level === 'number' ? base.level : undefined,
    rarity: typeof base.rarity === 'number' ? base.rarity : undefined,
    fetter: typeof base.fetter === 'number' ? base.fetter : undefined,
    actived_constellation_num:
      typeof base.actived_constellation_num === 'number'
        ? base.actived_constellation_num
        : undefined,
    icon: typeof base.icon === 'string' ? base.icon : undefined,
  };
}

function characterListUrl(): string {
  const config = loadConfig();
  const base = config.hoyo.bbsApiBase.replace(/\/$/, '');
  if (!isHttpsUrl(base)) {
    throw new Error('HoYoLab BBS API base must be HTTPS');
  }
  return `${base}${config.hoyo.characterListPath}`;
}

/**
 * HoYoLab moved the roster from `/character` (avatars) to `/character/list`
 * (list). hoyoapi@1.x still calls the legacy path, so we hit the new endpoint
 * with the same authenticated request helper.
 */
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
  const {response: res} = await request.send(characterListUrl(), 'POST');
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

function friendlyDailyNoteError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes('not public') ||
    lower.includes('data is not public') ||
    lower.includes('real-time')
  ) {
    return 'Real-Time Notes are not enabled. In the HoYoLAB app, open Battle Chronicle, turn on Real-Time Notes, then refresh here.';
  }
  return message;
}

export async function validateAndLinkAccount(): Promise<LinkedAccountMeta> {
  const client = await createClient();
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
  saveAccount(meta);
  return meta;
}

export async function fetchGameRecord() {
  const client = await createClient();
  return client.record.records();
}

export async function fetchCharacters(): Promise<CharacterDto[]> {
  const client = await createClient();

  try {
    const modern = await fetchCharacterListModern(client);
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

export async function fetchDailyNoteResult(): Promise<DailyNoteResult> {
  try {
    const client = await createClient();
    const data = await client.record.dailyNote();
    return {ok: true, data};
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load daily note';
    return {ok: false, error: friendlyDailyNoteError(message)};
  }
}

export async function fetchSpiralAbyss(scheduleType: 1 | 2 = 1) {
  const client = await createClient();
  const schedule =
    scheduleType === 2
      ? SpiralAbyssScheduleEnum.PREVIOUS
      : SpiralAbyssScheduleEnum.CURRENT;
  return client.record.spiralAbyss(schedule);
}
