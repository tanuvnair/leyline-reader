import {session, type Session} from 'electron';
import {contentSecurityPolicy} from './trust';

const DENIED_PERMISSIONS = new Set([
  'media',
  'geolocation',
  'notifications',
  'midi',
  'midiSysex',
  'pointerLock',
  'fullscreen',
  'openExternal',
  'clipboard-read',
  'clipboard-sanitized-write',
  'idle-detection',
  'mediaKeySystem',
  'display-capture',
  'serial',
  'usb',
  'hid',
  'fileSystem',
]);

export interface HardenSessionOptions {
  /**
   * When true, rewrite main-frame CSP to the app policy. Must stay false for
   * the isolated HoYo login partition — the app CSP blocks third-party scripts
   * and forms required by Hoyolab.
   */
  injectAppCsp?: boolean;
  isDev?: boolean;
}

export function hardenSession(
  target: Session,
  options: HardenSessionOptions = {},
): void {
  const {injectAppCsp = true, isDev = false} = options;

  target.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(!DENIED_PERMISSIONS.has(permission));
  });

  if (!injectAppCsp) {
    return;
  }

  // Apply CSP only on document navigations. Mutating every subresource response
  // can stall Vite module loads and leave the UI stuck on "Loading…".
  target.webRequest.onHeadersReceived((details, callback) => {
    try {
      if (details.resourceType !== 'mainFrame') {
        callback({responseHeaders: details.responseHeaders});
        return;
      }
      const headers = {...details.responseHeaders};
      headers['Content-Security-Policy'] = [contentSecurityPolicy(isDev)];
      headers['X-Content-Type-Options'] = ['nosniff'];
      headers['Referrer-Policy'] = ['no-referrer'];
      headers['X-Frame-Options'] = ['DENY'];
      callback({responseHeaders: headers});
    } catch {
      callback({responseHeaders: details.responseHeaders});
    }
  });
}

export function hardenDefaultSession(isDev: boolean): void {
  hardenSession(session.defaultSession, {isDev, injectAppCsp: true});
}
