/**
 * HoYoLab now issues `*_v2` cookies. hoyoapi@1.x still requires `ltoken` +
 * `ltuid` in the cookie string and ignores `ltoken_v2` / `ltuid_v2` when
 * parsing. Alias v2 → v1 before handing cookies to the library.
 */

const HOYOAPI_PARSE_KEYS = [
  'ltoken',
  'ltuid',
  'account_id',
  'cookie_token',
  'account_id_v2',
  'account_mid_v2',
  'cookie_token_v2',
  'mi18nLang',
] as const;

function lowerMap(cookies: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(cookies)) {
    if (value) {
      map.set(key.toLowerCase(), value);
    }
  }
  return map;
}

export function hasMinimumAuthCookies(cookies: Record<string, string>): boolean {
  const names = lowerMap(cookies);
  const hasToken =
    names.has('ltoken') ||
    names.has('ltoken_v2') ||
    names.has('cookie_token') ||
    names.has('cookie_token_v2');
  const hasUid =
    names.has('ltuid') ||
    names.has('ltuid_v2') ||
    names.has('ltmid_v2') ||
    names.has('account_id') ||
    names.has('account_id_v2');
  return hasToken && hasUid;
}

/** Build a cookie map hoyoapi can parse (always includes ltoken + ltuid when possible). */
export function normalizeHoyoCookies(
  cookies: Record<string, string>,
): Record<string, string> {
  const src = lowerMap(cookies);
  const ltoken = src.get('ltoken') ?? src.get('ltoken_v2');
  const ltuid =
    src.get('ltuid') ??
    src.get('ltuid_v2') ??
    src.get('account_id') ??
    src.get('account_id_v2');
  const cookieToken = src.get('cookie_token') ?? src.get('cookie_token_v2');
  const accountMid =
    src.get('account_mid_v2') ?? src.get('ltmid_v2') ?? src.get('account_mid');

  if (ltoken) {
    src.set('ltoken', ltoken);
    if (!src.has('ltoken_v2')) {
      src.set('ltoken_v2', ltoken);
    }
  }
  if (ltuid) {
    src.set('ltuid', ltuid);
    src.set('account_id', src.get('account_id') ?? ltuid);
    src.set('account_id_v2', src.get('account_id_v2') ?? ltuid);
    if (!src.has('ltuid_v2')) {
      src.set('ltuid_v2', ltuid);
    }
  }
  if (cookieToken) {
    src.set('cookie_token', src.get('cookie_token') ?? cookieToken);
    src.set('cookie_token_v2', src.get('cookie_token_v2') ?? cookieToken);
  }
  if (accountMid) {
    src.set('account_mid_v2', accountMid);
  }

  const out: Record<string, string> = {};
  for (const key of HOYOAPI_PARSE_KEYS) {
    const value = src.get(key.toLowerCase());
    if (value) {
      out[key] = value;
    }
  }
  // Keep v2 names in the header for APIs that prefer them; hoyoapi ignores extras
  // when parsing, but HTTP clients that forward the raw string still benefit.
  for (const key of ['ltoken_v2', 'ltuid_v2', 'ltmid_v2'] as const) {
    const value = src.get(key);
    if (value) {
      out[key] = value;
    }
  }
  return out;
}

export function cookieMapToString(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

export function normalizeCookieString(cookie: string): string {
  const parsed: Record<string, string> = {};
  for (const part of cookie.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && value) {
      parsed[key] = value;
    }
  }
  return cookieMapToString(normalizeHoyoCookies(parsed));
}
