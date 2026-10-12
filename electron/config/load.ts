import {readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  appConfigSchema,
  type AppConfig,
  type PublicAppConfig,
} from '../../config/schema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveConfigRoot(): string {
  // Dev / unpackaged: project config/. Packaged: extraResources → resources/config
  const candidates = [
    path.join(process.env.APP_ROOT ?? '', 'config'),
    path.join(__dirname, '../../config'),
    path.join(__dirname, '../../../config'),
    typeof process.resourcesPath === 'string'
      ? path.join(process.resourcesPath, 'config')
      : '',
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'default.json'))) {
      return candidate;
    }
  }
  throw new Error('Unable to locate config/default.json');
}

function readJsonFile(filePath: string): unknown {
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as unknown;
}

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Record<string, unknown>,
): T {
  const result: Record<string, unknown> = {...base};
  for (const [key, value] of Object.entries(override)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

function envOverrides(): Record<string, unknown> {
  const overrides: Record<string, unknown> = {};
  const storage: Record<string, unknown> = {};
  const hoyo: Record<string, unknown> = {};
  const genshinDev: Record<string, unknown> = {};
  const windowCfg: Record<string, unknown> = {};

  if (process.env.LEYLINE_USER_DATA_DIR) {
    storage['userDataDirOverride'] = process.env.LEYLINE_USER_DATA_DIR;
  }
  if (process.env.LEYLINE_STORE_NAME) {
    storage['storeFileName'] = process.env.LEYLINE_STORE_NAME;
  }
  if (process.env.LEYLINE_HOYO_LOGIN_URL) {
    hoyo['loginUrl'] = process.env.LEYLINE_HOYO_LOGIN_URL;
  }
  if (process.env.LEYLINE_GENSHIN_DEV_BASE_URL) {
    genshinDev['baseUrl'] = process.env.LEYLINE_GENSHIN_DEV_BASE_URL;
  }
  if (process.env.LEYLINE_DEV_TOOLS !== undefined) {
    windowCfg['devTools'] = process.env.LEYLINE_DEV_TOOLS === 'true';
  }

  if (Object.keys(storage).length > 0) {
    overrides['storage'] = storage;
  }
  if (Object.keys(hoyo).length > 0) {
    overrides['hoyo'] = hoyo;
  }
  if (Object.keys(genshinDev).length > 0) {
    overrides['genshinDev'] = genshinDev;
  }
  if (Object.keys(windowCfg).length > 0) {
    overrides['window'] = windowCfg;
  }
  if (process.env.LEYLINE_PRODUCT_NAME) {
    overrides['productName'] = process.env.LEYLINE_PRODUCT_NAME;
  }
  if (process.env.LEYLINE_APP_NAME) {
    overrides['appName'] = process.env.LEYLINE_APP_NAME;
  }

  return overrides;
}

let cachedConfig: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configRoot = resolveConfigRoot();
  const defaults = readJsonFile(path.join(configRoot, 'default.json'));
  let merged = defaults as Record<string, unknown>;

  const localPath = path.join(configRoot, 'local.json');
  if (existsSync(localPath)) {
    const local = readJsonFile(localPath) as Record<string, unknown>;
    merged = deepMerge(merged, local);
  }

  merged = deepMerge(merged, envOverrides());
  cachedConfig = appConfigSchema.parse(merged);
  return cachedConfig;
}

export function getPublicConfig(config: AppConfig = loadConfig()): PublicAppConfig {
  return {
    appName: config.appName,
    productName: config.productName,
    features: config.features,
    i18n: config.i18n,
    genshinDev: {
      baseUrl: config.genshinDev.baseUrl,
      timeoutMs: config.genshinDev.timeoutMs,
      cacheTtlMs: config.genshinDev.cacheTtlMs,
    },
    window: {
      customTitleBar: config.window.customTitleBar,
      titleBarHeight: config.window.titleBarHeight,
    },
    auth: {
      passwordPolicy: config.auth.passwordPolicy,
    },
    hoyo: {
      realTimeNotesUrl: config.hoyo.realTimeNotesUrl,
    },
  };
}

export function resetConfigCacheForTests(): void {
  cachedConfig = null;
}
