---
name: leyline-genshin-dev
description: >-
  Enrich Leyline Reader UI with static game data from genshin.dev. Use when
  changing catalog fetches, icons, or character enrichment.
---

# genshin.dev client

- Implementation: `electron/infrastructure/genshin-dev/client.ts` (`catalogPort`).
- Base URL, timeout, and cache TTL come from config (`genshinDev.*`).
- Use list/detail endpoints like `characters` and `characters/{id}`; icons via `characters/{id}/icon` only when the JSON fetch succeeds.
- **Primary UI icons are Enka CDN**, not genshin.dev:
  - Relics: `hoyo.artifactIconBaseUrl` (default `https://enka.network/ui`) + `UI_RelicIcon_{setId}_{slot}.png` in `electron/domain/good/icons.ts` / `set-ids.ts`; HoYoLab is `artifactIconFallbackBaseUrl`.
  - Avatars: `hoyo.characterIconBaseUrl` (Enka) + stems in `electron/domain/hoyo/icons.ts`; HoYoLab is `characterIconFallbackBaseUrl`.
- Enrichment must tolerate missing catalog entries for new characters; broken image URLs fall back to Avatar initials / CDN fallback chain.
