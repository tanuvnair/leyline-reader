# Leyline Reader — backlog

Tracked follow-ups outside the current polish pass.

## Materials & artifacts

### Current: GOOD artifact import

Artifacts inventory comes from a local **GOOD** JSON import (`#/artifacts`), not HoYoLab.

- IPC: `ARTIFACTS_STATUS` / `ARTIFACTS_IMPORT` / `ARTIFACTS_CLEAR` (unlock-gated; no HoYo link required)
- Vault: encrypted `encryptedGoodArtifacts` via `safeStorage`
- Config: `artifacts.goodMaxBytes` (default 8_000_000)
| Data | Status |
| --- | --- |
| **Full artifact inventory** | **Via GOOD import** (Artifacts page) |
| **Equipped relics via HoYoLab** | Retired (probe removed); optional future Build section could re-add character detail only |
| **Full weapons inventory** | **Blocked** on Battle Chronicle; GOOD `weapons[]` planned |
| **Materials / crafting bag** | **Blocked** on Battle Chronicle; planned via GOOD / other export if available |

### Follow-ups

1. Move GOOD import to **Settings** and parse shared inventory (Artifacts, Weapons, Materials, and more as needed) for browse pages — do not keep import UX only on Artifacts long-term.
2. Optional character-detail “Build” using equipped gear from HoYo character detail (not the bag).
3. Do not re-investigate undocumented bag/materials HoYo endpoints without a reviewed official surface or Enka product decision.

## Other ideas

- **Enka.Network API** (uid showcase / builds) as an alternate account data source — separate product/privacy decision; do not add without an explicit choice. *(Enka **CDN** icons are already the primary image source for avatars/relics.)*
- Theme persistence in the Electron vault (currently `next-themes` local storage only).
- Official miHoYo element SVG assets — out of scope; stick to Phosphor + Moegirl-aligned color tokens.
