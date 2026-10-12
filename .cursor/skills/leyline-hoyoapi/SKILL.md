---
name: leyline-hoyoapi
description: >-
  Fetch Genshin player data with hoyoapi in Leyline Reader. Use when changing
  account sync, records, characters, daily note, or Spiral Abyss.
---

# HoYoAPI usage

- Client wrapper: `electron/hoyolab/client.ts`.
- Cookie string comes from the encrypted vault after login — never hardcode credentials.
- HoYoLab issues `ltoken_v2` / `ltuid_v2`; hoyoapi@1.x still requires `ltoken` / `ltuid`. Always normalize via `electron/hoyolab/cookies.ts` before constructing the client.
- Prefer `GenshinImpact` with UID when known; use `GenshinImpact.create` only when linking.
- Language and login / BBS API URLs come from `loadConfig()` / `config/default.json` (`hoyo.bbsApiBase`, `hoyo.characterListPath`).
- Surface sanitized DTOs through IPC (`DATA_OVERVIEW`, `DATA_CHARACTERS`, `DATA_ABYSS`).

## Endpoint quirks (do not regress)

- **Characters:** HoYoLab moved the roster to `POST …/character/list` (`data.list`). hoyoapi@1.x still calls legacy `/character` (`data.avatars`). Leyline hits the modern path first via `client.request`, then falls back to legacy + index avatars.
- **Daily note:** Often fails with “Data is not public” until the user enables Real-Time Notes in the HoYoLAB app (Battle Chronicle). Never swallow this — return `dailyNoteError` for the Overview alert, and link `hoyo.realTimeNotesUrl` from public config (opens via allowlisted external navigation).
- **Abyss:** `schedule_type` 1 = current, 2 = previous. Empty previous cycles (`0-0` / locked) are valid when the player did not play that half.
