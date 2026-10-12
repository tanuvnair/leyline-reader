---
name: leyline-electron-ipc
description: >-
  Work with Leyline Reader Electron IPC, cookie vault, and HoYoverse login
  window. Use when changing auth, vault storage, or preload bridge APIs.
---

# Leyline Electron IPC

- Channels live in `electron/ipc/channels.ts` and must stay aligned with `electron/preload/index.ts`.
- Register handlers in `electron/ipc/register.ts`. Never expose raw cookies to the renderer.
- Cookie capture is `electron/hoyolab/login.ts` using a partitioned `BrowserWindow` and config-driven domains/keys.
- Vault encryption uses Electron `safeStorage` in `electron/store/vault.ts`.
- After API changes, update `electron/preload/index.d.ts` / `window.leyline` typings.
