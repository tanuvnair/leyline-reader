import {app, BrowserWindow, Menu} from 'electron';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {clearHoyoDataCache} from '../application/cache/ttl-cache';
import {clearSensitiveSessionState} from '../infrastructure/auth/session';
import {loadConfig} from '../infrastructure/config/load';
import {hardenDefaultSession} from '../infrastructure/security/session';
import {attachMainWindowGuards} from '../infrastructure/security/window';
import {IpcChannels} from '../ipc/channels';
import {registerIpcHandlers} from '../ipc/register';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '../..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

if (process.platform === 'win32' && os.release().startsWith('6.1')) {
  app.disableHardwareAcceleration();
}

if (process.platform === 'win32') {
  app.setAppUserModelId(app.getName());
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, '../preload/index.mjs');
const indexHtml = path.join(RENDERER_DIST, 'index.html');

function wireWindowStateEvents(window: BrowserWindow): void {
  const emitMaximized = () => {
    window.webContents.send(
      IpcChannels.WINDOW_MAXIMIZED_CHANGED,
      window.isMaximized(),
    );
  };
  window.on('maximize', emitMaximized);
  window.on('unmaximize', emitMaximized);
}

async function createWindow(): Promise<void> {
  const config = loadConfig();
  const isDev = Boolean(VITE_DEV_SERVER_URL) && !app.isPackaged;

  win = new BrowserWindow({
    title: config.productName,
    width: config.window.main.width,
    height: config.window.main.height,
    minWidth: config.window.main.minWidth,
    minHeight: config.window.main.minHeight,
    frame: config.window.frame,
    autoHideMenuBar: true,
    titleBarStyle: config.window.frame ? 'default' : 'hidden',
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    backgroundColor: '#f5f8fa',
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  });

  wireWindowStateEvents(win);
  attachMainWindowGuards(win);

  if (isDev) {
    await win.loadURL(VITE_DEV_SERVER_URL!);
    if (config.window.devTools) {
      win.webContents.openDevTools({mode: 'detach'});
    }
  } else {
    await win.loadFile(indexHtml);
  }
}

app.whenReady().then(() => {
  try {
    const isDev = Boolean(VITE_DEV_SERVER_URL) && !app.isPackaged;
    hardenDefaultSession(isDev);
    Menu.setApplicationMenu(null);
    registerIpcHandlers(() => win);
    void createWindow().catch((error: unknown) => {
      console.error('[leyline] failed to create window', error);
    });
  } catch (error) {
    console.error('[leyline] startup failed', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  clearSensitiveSessionState();
  clearHoyoDataCache();
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  clearSensitiveSessionState();
  clearHoyoDataCache();
});

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    void createWindow();
  }
});
