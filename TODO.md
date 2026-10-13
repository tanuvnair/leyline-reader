# Leyline Reader — backlog

Tracked follow-ups outside the current polish pass.

## Materials & inventory

### Current: Settings GOOD import

Shared inventory comes from a local **GOOD** JSON import in **Settings**, not HoYoLab.

- IPC: `GOOD_INVENTORY_STATUS` / `GOOD_INVENTORY_IMPORT` / `GOOD_INVENTORY_CLEAR` (unlock-gated; no HoYo link required)
- Vault: encrypted `encryptedGoodInventory` via `safeStorage` (legacy `encryptedGoodArtifacts` migrated on read)
- Config: `inventory.goodMaxBytes` (default 8_000_000)
- Browse: `#/artifacts`, `#/weapons`, `#/materials`

| Data | Status |
| --- | --- |
| **Full artifact inventory** | **Via GOOD import** (Settings → Artifacts browse) |
| **Full weapons inventory** | **Via GOOD `weapons[]`** (Settings → Weapons browse) |
| **Materials bag** | **Optional** community `materials` map in GOOD; empty when absent |
| **Equipped relics via HoYoLab** | Retired (probe removed); optional future Build section could re-add character detail only |

### Follow-ups

1. Talent / weapon ascension grind planner (weekday books, boss mats, resin-aware tips) — inspired by progression tools alongside [Genshin Optimizer](https://frzyc.github.io/genshin-optimizer/) / [Irminsul](https://github.com/konkers/irminsul/releases).
2. Refresh Ambr/yatta-derived catalogs (`scripts/generate-good-catalogs.mjs`) when new weapons/materials ship.
3. Optional character-detail “Build” using equipped gear from HoYo character detail (not the bag).
4. Do not re-investigate undocumented bag/materials HoYo endpoints without a reviewed official surface or Enka product decision.

## Other ideas

- **Enka.Network API** (uid showcase / builds) as an alternate account data source — separate product/privacy decision; do not add without an explicit choice. *(Enka **CDN** icons are already the primary image source for avatars/relics/weapons.)*
- Theme persistence in the Electron vault (currently `next-themes` local storage only).
- Official miHoYo element SVG assets — out of scope; stick to Phosphor + Moegirl-aligned color tokens.
