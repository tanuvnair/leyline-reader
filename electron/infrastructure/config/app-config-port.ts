import type {AppConfigPort} from '../../domain/ports/config';
import {loadConfig} from './load';

export const appConfigPort: AppConfigPort = {
  passwordPolicy: () => loadConfig().auth.passwordPolicy,
  bcryptRounds: () => loadConfig().auth.bcryptRounds,
  sessionIdleTimeoutMs: () => loadConfig().auth.sessionIdleTimeoutMs,
  maxFailedAttempts: () => loadConfig().auth.maxFailedAttempts,
  lockoutMs: () => loadConfig().auth.lockoutMs,
  hoyoLanguage: () => loadConfig().hoyo.language,
  bbsApiBase: () => loadConfig().hoyo.bbsApiBase,
  characterListPath: () => loadConfig().hoyo.characterListPath,
  artifactIconBaseUrl: () => loadConfig().hoyo.artifactIconBaseUrl,
  artifactIconFallbackBaseUrl: () =>
    loadConfig().hoyo.artifactIconFallbackBaseUrl,
  characterIconBaseUrl: () => loadConfig().hoyo.characterIconBaseUrl,
  characterIconFallbackBaseUrl: () =>
    loadConfig().hoyo.characterIconFallbackBaseUrl,
  goodArtifactsMaxBytes: () => loadConfig().artifacts.goodMaxBytes,
};
