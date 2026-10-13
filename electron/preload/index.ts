import {contextBridge, ipcRenderer} from 'electron';
import {IpcChannels} from '../ipc/channels';

const leylineApi = {
  getPublicConfig: () => ipcRenderer.invoke(IpcChannels.GET_PUBLIC_CONFIG),
  auth: {
    status: () => ipcRenderer.invoke(IpcChannels.AUTH_STATUS),
    setup: (password: string) =>
      ipcRenderer.invoke(IpcChannels.AUTH_SETUP, password),
    unlock: (password: string) =>
      ipcRenderer.invoke(IpcChannels.AUTH_UNLOCK, password),
    lock: () => ipcRenderer.invoke(IpcChannels.AUTH_LOCK),
    changePassword: (currentPassword: string, newPassword: string) =>
      ipcRenderer.invoke(
        IpcChannels.AUTH_CHANGE_PASSWORD,
        currentPassword,
        newPassword,
      ),
  },
  hoyo: {
    status: () => ipcRenderer.invoke(IpcChannels.HOYO_STATUS),
    link: () => ipcRenderer.invoke(IpcChannels.HOYO_LINK),
    unlink: () => ipcRenderer.invoke(IpcChannels.HOYO_UNLINK),
  },
  data: {
    overview: (options?: {force?: boolean}) =>
      ipcRenderer.invoke(IpcChannels.DATA_OVERVIEW, options),
    characters: (options?: {force?: boolean}) =>
      ipcRenderer.invoke(IpcChannels.DATA_CHARACTERS, options),
    abyss: (scheduleType?: 1 | 2, options?: {force?: boolean}) =>
      ipcRenderer.invoke(IpcChannels.DATA_ABYSS, scheduleType, options),
  },
  inventory: {
    status: () => ipcRenderer.invoke(IpcChannels.GOOD_INVENTORY_STATUS),
    import: (jsonText: string) =>
      ipcRenderer.invoke(IpcChannels.GOOD_INVENTORY_IMPORT, jsonText),
    clear: () => ipcRenderer.invoke(IpcChannels.GOOD_INVENTORY_CLEAR),
  },
  window: {
    minimize: () => ipcRenderer.invoke(IpcChannels.WINDOW_MINIMIZE),
    maximize: () =>
      ipcRenderer.invoke(IpcChannels.WINDOW_MAXIMIZE) as Promise<boolean>,
    close: () => ipcRenderer.invoke(IpcChannels.WINDOW_CLOSE),
    isMaximized: () =>
      ipcRenderer.invoke(IpcChannels.WINDOW_IS_MAXIMIZED) as Promise<boolean>,
    onMaximizedChanged: (listener: (maximized: boolean) => void) => {
      const handler = (_event: unknown, maximized: boolean) => {
        listener(maximized);
      };
      ipcRenderer.on(IpcChannels.WINDOW_MAXIMIZED_CHANGED, handler);
      return () => {
        ipcRenderer.removeListener(
          IpcChannels.WINDOW_MAXIMIZED_CHANGED,
          handler,
        );
      };
    },
  },
};

contextBridge.exposeInMainWorld('leyline', leylineApi);

export type LeylineApi = typeof leylineApi;
