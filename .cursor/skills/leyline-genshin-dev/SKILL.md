---
name: leyline-genshin-dev
description: >-
  Enrich Leyline Reader UI with static game data from genshin.dev. Use when
  changing catalog fetches, icons, or character enrichment.
---

# genshin.dev client

- Implementation: `electron/infrastructure/genshin-dev/client.ts` (`catalogPort`).
- Base URL, timeout, and cache TTL come from config (`genshinDev.*`).
- Use list/detail endpoints like `characters` and `characters/{id}`; icons via `characters/{id}/icon`.
- Enrichment must tolerate missing catalog entries for new characters.
