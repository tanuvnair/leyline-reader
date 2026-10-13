# Leyline Reader — backlog

Tracked follow-ups that are **not** in the current Characters / dashboard polish pass.

## Materials & artifacts (feasibility spike)

**Goal:** Retrieve the linked account’s **materials** (bag / inventory) and **artifacts** (relics), if the HoYoLab API allows it.

### Preliminary research (confirm in the spike)

| Data | Likely feasible? | Notes |
| --- | --- | --- |
| **Equipped artifacts + weapon on a character** | Plausible | hoyoapi documents `reliquaries` + `weapon` on full character avatars; also `charactersSummary(characterIds)`. Modern roster uses `character/list` (often lighter) — may need a detail/summary call per character or a different path. Privacy / Battle Chronicle settings may gate fields. |
| **Full artifact inventory (unequipped bag)** | Unlikely via Battle Chronicle | No documented hoyoapi / `game_record/genshin/api/*` inventory endpoint in the public wrapper routes (`index`, `character`, `avatarBasicInfo`, `spiralAbyss`, `dailyNote`). |
| **Materials / crafting bag** | Unlikely via Battle Chronicle | Same — not exposed on documented HoYoLab game-record APIs. Would require an undocumented endpoint or another official surface (if any), which we should not assume. |

### Spike tasks

1. Inspect live responses from `character/list`, legacy `character`, and `charactersSummary` / detail for `weapon` + `reliquaries` (and whether empty under current privacy).
2. Search HoYoLab BBS / app traffic docs or community Enka-style notes for any **bag/materials** endpoint — document findings (yes/no + URL if yes).
3. If only equipped gear is available: plan character-detail “Build” section (weapon + 5 relics) as a follow-up feature; keep materials out or mark blocked.
4. If nothing usable: close with a short ADR-style note here / in `docs/` so we don’t re-investigate blindly.

## Other ideas

- **Enka.Network** (or similar) as an alternate public showcase source — separate product/privacy decision; do not add without an explicit choice.
- Theme persistence in the Electron vault (currently `next-themes` local storage only).
- Official miHoYo element SVG assets — out of scope; stick to Phosphor + Moegirl-aligned color tokens.
