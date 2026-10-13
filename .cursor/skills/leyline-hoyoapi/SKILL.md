---
name: leyline-hoyoapi
description: >-
  Fetch Genshin player data with hoyoapi in Leyline Reader. Use when changing
  account sync, records, characters, daily note, or Spiral Abyss.
---

# HoYoAPI usage

- Client (Infrastructure): `electron/infrastructure/hoyolab/client.ts` (`hoyoRecordsPort`).
- Cookie normalize (Domain): `electron/domain/hoyo/cookies.ts`.
- Credentials are assembled in Application (`electron/application/hoyo/credentials.ts`) from the vault — never hardcode.
- HoYoLab issues `ltoken_v2` / `ltuid_v2`; hoyoapi@1.x still requires `ltoken` / `ltuid`. Always normalize before constructing the client.
- Prefer `GenshinImpact` with UID when known; use `GenshinImpact.create` only when linking.
- Language and BBS API URLs come from config (`hoyo.bbsApiBase`, `hoyo.characterListPath`) via `AppConfigPort`.
- Surface sanitized DTOs through Application use cases → IPC (`DATA_OVERVIEW`, `DATA_CHARACTERS`, `DATA_ABYSS`).
- **Inventory bag is not HoYoLab.** Full artifacts/weapons/materials use local GOOD JSON import in Settings (`GOOD_INVENTORY_*`, `electron/domain/good/inventory.ts`). Icons resolve via Enka (+ HoYoLab fallback), not Battle Chronicle. Do not add undocumented bag/materials game-record calls.

## Endpoint quirks (do not regress)

- **Characters:** HoYoLab moved the roster to `POST …/character/list` (`data.list`). hoyoapi@1.x still calls legacy `/character` (`data.avatars`). Leyline hits the modern path first via `client.request`, then falls back to legacy + index avatars. Modern list often omits weapon type — merge `weapon.type_name` / `weapon_type_name` from legacy when missing so Characters weapon filter works without genshin.dev.
- **Daily note:** Often fails with “Data is not public” until the user enables Real-Time Notes in the HoYoLAB app (Battle Chronicle). Never swallow this — return `dailyNoteError` for the Overview alert, and link `hoyo.realTimeNotesUrl` from public config (opens via allowlisted external navigation).
- **Abyss:** `schedule_type` 1 = current, 2 = previous. Empty previous cycles (`0-0` / locked) are valid when the player did not play that half.
