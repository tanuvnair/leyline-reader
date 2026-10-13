import {app, type IpcMainInvokeEvent} from 'electron';
import {loadConfig} from '../config/load';

const DEV_HOST_ALLOWLIST = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isHttpsUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isTrustedRendererUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol === 'file:') {
      return true;
    }
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return DEV_HOST_ALLOWLIST.has(url.hostname);
    }
    return false;
  } catch {
    return false;
  }
}

export function assertTrustedIpcSender(event: IpcMainInvokeEvent): void {
  if (event.sender.isDestroyed()) {
    throw new Error('IPC sender is destroyed');
  }
  const frameUrl = event.senderFrame?.url ?? '';
  const senderUrl = event.sender.getURL?.() ?? '';
  const candidate = frameUrl || senderUrl;
  if (!candidate || !isTrustedRendererUrl(candidate)) {
    throw new Error('Untrusted IPC sender');
  }
}

export function isAllowedExternalUrl(raw: string): boolean {
  if (!isHttpsUrl(raw)) {
    return false;
  }
  const host = new URL(raw).hostname.toLowerCase();
  const config = loadConfig();
  const allowed = config.security.allowedExternalHosts.map((h) =>
    h.replace(/^\./, '').toLowerCase(),
  );
  return allowed.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

export function isAllowedHoyoNavigation(raw: string): boolean {
  if (!isHttpsUrl(raw)) {
    return false;
  }
  const host = new URL(raw).hostname.toLowerCase();
  const config = loadConfig();
  const domains = config.hoyo.cookieDomains
    .map((d) => d.replace(/^\./, '').toLowerCase())
    .concat(
      config.hoyo.successUrlPatterns.map((p) =>
        p.replace(/^\./, '').toLowerCase(),
      ),
    );
  try {
    domains.push(new URL(config.hoyo.loginUrl).hostname.toLowerCase());
  } catch {
    // ignore
  }
  return domains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

export function isAllowedMainNavigation(raw: string): boolean {
  if (raw === 'about:blank') {
    return true;
  }
  try {
    const url = new URL(raw);
    if (url.protocol === 'file:') {
      return true;
    }
    if (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      DEV_HOST_ALLOWLIST.has(url.hostname)
    ) {
      return !app.isPackaged;
    }
    return false;
  } catch {
    return false;
  }
}

function cspHttpsHostSources(hosts: string[]): string {
  return hosts
    .map((host) => {
      const cleaned = host.trim().toLowerCase().replace(/^https?:\/\//, '');
      if (!cleaned) {
        return '';
      }
      return `https://${cleaned}`;
    })
    .filter(Boolean)
    .join(' ');
}

export function contentSecurityPolicy(isDev: boolean): string {
  const config = loadConfig();
  const imgSrc = cspHttpsHostSources(config.security.allowedImageHosts);
  const genshinConnect = cspHttpsHostSources([
    new URL(config.genshinDev.baseUrl).host,
    '*.genshin.dev',
  ]);

  if (isDev) {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: ${imgSrc}`,
      `connect-src 'self' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:* ${genshinConnect}`,
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join('; ');
  }
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${imgSrc}`,
    `connect-src 'self' ${genshinConnect}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}
