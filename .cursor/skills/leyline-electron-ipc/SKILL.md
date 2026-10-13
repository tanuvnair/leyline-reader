---
name: leyline-electron-ipc
description: >-
  Work with Leyline Reader Electron IPC, cookie vault, and HoYoverse login
  window. Use when changing auth, vault storage, or preload bridge APIs.
---

# Leyline Electron IPC

- Channels live in `electron/ipc/channels.ts` and must stay aligned with `electron/preload/index.ts`.
- Register handlers in `electron/ipc/register.ts` stay thin: validate sender + Zod → call Application use cases. Never expose raw cookies to the renderer.
- Cookie capture: `electron/infrastructure/hoyolab/login.ts` (Application persists via vault).
- Vault encryption: `electron/infrastructure/vault/vault.ts` (`safeStorage`) for HoYo cookies and GOOD artifact inventory.
- Artifacts inventory: `ARTIFACTS_STATUS` / `ARTIFACTS_IMPORT` / `ARTIFACTS_CLEAR` (unlock-gated; not HoYo `DATA_*`).
- Use cases: `electron/application/`. Domain ports: `electron/domain/ports/`.
- After API changes, update `electron/preload/index.d.ts` / `window.leyline` typings.
