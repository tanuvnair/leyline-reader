import {BrowserWindow, session} from 'electron';
import {loadConfig} from '../config/load';
import {saveHoyoCookie, type HoyoCookiePayload} from '../store/vault';
import {hardenSession} from '../security/session';
import {attachHoyoLoginGuards} from '../security/window';
import {isAllowedHoyoNavigation} from '../security/trust';
import {
  cookieMapToString,
  hasMinimumAuthCookies,
  normalizeHoyoCookies,
} from './cookies';

function extractRelevantCookies(
  allCookies: Electron.Cookie[],
  keys: string[],
): Record<string, string> {
  const keySet = new Set(keys.map((k) => k.toLowerCase()));
  const result: Record<string, string> = {};
  for (const cookie of allCookies) {
    if (keySet.has(cookie.name.toLowerCase())) {
      result[cookie.name] = cookie.value;
    }
  }
  return result;
}

function cookieMatchesConfiguredDomain(
  cookieDomain: string,
  configuredDomains: string[],
): boolean {
  const host = cookieDomain.replace(/^\./, '').toLowerCase();
  return configuredDomains.some((domain) => {
    const normalized = domain.replace(/^\./, '').toLowerCase();
    return host === normalized || host.endsWith(`.${normalized}`);
  });
}

export async function openHoyoLoginWindow(
  parent: BrowserWindow | null,
): Promise<HoyoCookiePayload> {
  const config = loadConfig();
  if (!isAllowedHoyoNavigation(config.hoyo.loginUrl)) {
    throw new Error('Configured HoYo login URL is not allowlisted');
  }

  const partition = config.hoyo.sessionPartition;
  const ses = session.fromPartition(partition, {cache: true});
  // Permissions only — never inject the app CSP onto Hoyolab documents.
  hardenSession(ses, {injectAppCsp: false});
  await ses.clearStorageData();

  return new Promise((resolve, reject) => {
    let settled = false;

    const loginWin = new BrowserWindow({
      width: config.window.login.width,
      height: config.window.login.height,
      parent: parent ?? undefined,
      modal: Boolean(parent),
      autoHideMenuBar: true,
      title: `${config.productName} — HoYoverse Login`,
      webPreferences: {
        session: ses,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
      },
    });

    attachHoyoLoginGuards(loginWin);

    const finish = async () => {
      if (settled) {
        return;
      }
      try {
        // Collect from the whole partition, then filter — Electron's domain filter
        // misses host-only cookies when the filter uses a leading-dot domain.
        const allCookies = await ses.cookies.get({});
        const collected = allCookies.filter((cookie) =>
          cookieMatchesConfiguredDomain(
            cookie.domain ?? '',
            config.hoyo.cookieDomains,
          ),
        );

        const byName = extractRelevantCookies(collected, config.hoyo.cookieKeys);
        if (!hasMinimumAuthCookies(byName)) {
          return;
        }

        const normalized = normalizeHoyoCookies(byName);
        if (!normalized.ltoken || !normalized.ltuid) {
          return;
        }

        settled = true;
        const payload: HoyoCookiePayload = {
          cookie: cookieMapToString(normalized),
          capturedAt: new Date().toISOString(),
        };
        saveHoyoCookie(payload);
        await ses.clearStorageData();
        if (!loginWin.isDestroyed()) {
          loginWin.close();
        }
        resolve(payload);
      } catch (error) {
        settled = true;
        reject(error);
      }
    };

    loginWin.on('closed', () => {
      if (!settled) {
        settled = true;
        reject(new Error('HoYoverse login window was closed'));
      }
    });

    loginWin.webContents.on('did-navigate', (_event, url) => {
      const matched = config.hoyo.successUrlPatterns.some((pattern) =>
        url.includes(pattern),
      );
      if (matched) {
        void finish();
      }
    });

    loginWin.webContents.on('did-navigate-in-page', (_event, url) => {
      const matched = config.hoyo.successUrlPatterns.some((pattern) =>
        url.includes(pattern),
      );
      if (matched) {
        void finish();
      }
    });

    const poll = setInterval(() => {
      if (settled || loginWin.isDestroyed()) {
        clearInterval(poll);
        return;
      }
      void finish();
    }, 2000);

    loginWin.on('closed', () => clearInterval(poll));

    void loginWin.loadURL(config.hoyo.loginUrl);
  });
}
