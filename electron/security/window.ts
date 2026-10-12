import type {BrowserWindow} from 'electron';
import {
  isAllowedExternalUrl,
  isAllowedHoyoNavigation,
  isAllowedMainNavigation,
} from './trust';
import {shell} from 'electron';

export function attachMainWindowGuards(window: BrowserWindow): void {
  window.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedMainNavigation(url)) {
      event.preventDefault();
    }
  });

  window.webContents.on('will-redirect', (event, url) => {
    if (!isAllowedMainNavigation(url)) {
      event.preventDefault();
    }
  });

  window.webContents.setWindowOpenHandler(({url}) => {
    if (isAllowedExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return {action: 'deny'};
  });

  window.webContents.on('render-process-gone', (_event, details) => {
    console.error('[security] renderer process gone', details.reason);
  });
}

export function attachHoyoLoginGuards(window: BrowserWindow): void {
  window.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedHoyoNavigation(url)) {
      event.preventDefault();
    }
  });

  window.webContents.on('will-redirect', (event, url) => {
    if (!isAllowedHoyoNavigation(url)) {
      event.preventDefault();
    }
  });

  window.webContents.setWindowOpenHandler(({url}) => {
    if (isAllowedHoyoNavigation(url)) {
      return {action: 'allow'};
    }
    return {action: 'deny'};
  });
}
