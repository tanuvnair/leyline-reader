/** IPC channel names — keep in sync with preload bridge. */
export const IpcChannels = {
  GET_PUBLIC_CONFIG: 'leyline:get-public-config',
  AUTH_STATUS: 'leyline:auth-status',
  AUTH_SETUP: 'leyline:auth-setup',
  AUTH_UNLOCK: 'leyline:auth-unlock',
  AUTH_LOCK: 'leyline:auth-lock',
  AUTH_CHANGE_PASSWORD: 'leyline:auth-change-password',
  HOYO_LINK: 'leyline:hoyo-link',
  HOYO_UNLINK: 'leyline:hoyo-unlink',
  HOYO_STATUS: 'leyline:hoyo-status',
  DATA_OVERVIEW: 'leyline:data-overview',
  DATA_CHARACTERS: 'leyline:data-characters',
  DATA_ABYSS: 'leyline:data-abyss',
  ARTIFACTS_STATUS: 'leyline:artifacts-status',
  ARTIFACTS_IMPORT: 'leyline:artifacts-import',
  ARTIFACTS_CLEAR: 'leyline:artifacts-clear',
  WINDOW_MINIMIZE: 'leyline:window-minimize',
  WINDOW_MAXIMIZE: 'leyline:window-maximize',
  WINDOW_CLOSE: 'leyline:window-close',
  WINDOW_IS_MAXIMIZED: 'leyline:window-is-maximized',
  WINDOW_MAXIMIZED_CHANGED: 'leyline:window-maximized-changed',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
