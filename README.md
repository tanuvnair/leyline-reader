# Leyline Reader

Desktop dashboard for Genshin Impact players. Link a HoYoverse account in-app, sync personal Battle Chronicle data, enrich the roster with static catalog metadata, import a full artifact inventory via GOOD JSON, and browse Overview / Characters / Artifacts / Spiral Abyss with a light–dark theme.

**Unofficial fan project.** Not affiliated with, endorsed by, or connected to miHoYo / HoYoverse / Cognosphere.

## Features

- Local vault password (bcrypt) before any account data is accessible
- In-app HoYoverse login window; cookies encrypted with OS `safeStorage`
- Overview: resin / commissions / expeditions / achievements + world progress
- Characters: searchable roster, URL-synced filters, detail route, CDN avatars
- Artifacts: GOOD JSON import, vault-encrypted inventory, local filters (deferred search)
- Spiral Abyss: current / previous cycle metrics
- Settings: Appearance (light / dark / system), account link, password change
- In-memory caches (HoYo TTL + GOOD artifacts session cache; renderer roster / artifacts providers)

## Stack

| Layer | Technology | Links |
| --- | --- | --- |
| Desktop shell | Electron | [Docs](https://www.electronjs.org/docs/latest) · [Security tutorial](https://www.electronjs.org/docs/latest/tutorial/security) |
| Bundler | Vite + `vite-plugin-electron` | [Vite](https://vite.dev/) · [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron) |
| UI | React 19 + React Router v7 (HashRouter) | [React](https://react.dev/) · [React Router](https://reactrouter.com/) |
| Styling | Tailwind CSS v4 + shadcn/ui (`radix-vega` preset) | [Tailwind](https://tailwindcss.com/) · [shadcn/ui](https://ui.shadcn.com/) · [Radix](https://www.radix-ui.com/) |
| Icons | Phosphor | [@phosphor-icons/react](https://github.com/phosphor-icons/react) |
| Theme | `next-themes` | [next-themes](https://github.com/pacocoursey/next-themes) |
| Font | Inter Variable | [@fontsource-variable/inter](https://fontsource.org/fonts/inter) |
| Toasts | Sonner | [sonner](https://sonner.emilkowal.ski/) |
| Validation | Zod | [Zod](https://zod.dev/) |
| Local store | `electron-store` + OS `safeStorage` | [electron-store](https://github.com/sindresorhus/electron-store) |
| Password hashing | bcryptjs | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| Lint | ESLint + `@shadcn/lint` + dependency-cruiser | [ESLint](https://eslint.org/) · [@shadcn/lint](https://www.npmjs.com/package/@shadcn/lint) · [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) |
| Packaging | electron-builder | [electron-builder](https://www.electron.build/) |
| Language | TypeScript | [TypeScript](https://www.typescriptlang.org/) |

### Game / account data sources

| Source | Role | Links |
| --- | --- | --- |
| HoYoLab / [hoyoapi](https://www.npmjs.com/package/hoyoapi) | Linked account records, roster, daily note, Spiral Abyss | [hoyoapi docs](https://vermaysha.github.io/hoyoapi/docs/guide/genshin-impact) · [HoYoLAB](https://www.hoyolab.com/) |
| [genshin.dev](https://genshin.dev/) | Optional character catalog enrichment (title, vision, weapon, nation, description) | [API](https://api.genshin.dev/) |
| [Enka.Network](https://enka.network/) CDN | Primary character + relic PNGs (`UI_AvatarIcon_*`, `UI_RelicIcon_*`) | `https://enka.network/ui/` (HoYoLab upload CDN as fallback) |
| HoYoLab upload CDN | Fallback avatar / equip PNGs when Enka 404s | `upload-os-bbs.mihoyo.com` |
| GOOD format | Local artifact inventory import (Genshin Optimizer / scanners) | [Genshin Optimizer](https://frzyc.github.io/genshin-optimizer/) · community GOOD schema |
| Moegirl `Genshincolor` | Element / rarity accent palette (community wiki tokens, not official HoYoverse design) | [Moegirl Genshin Wiki](https://zh.moegirl.org.cn/Genshin_Impact) |

## Architecture

Main process: **Presentation → Application → Domain → Infrastructure**.

- Guide: [`docs/architecture.md`](docs/architecture.md)
- Agent / security rules: [`AGENTS.md`](AGENTS.md)
- Config: [`config/default.json`](config/default.json) + [`config/schema.ts`](config/schema.ts)
- Backlog / spikes: [`TODO.md`](TODO.md)

```text
src/                         Renderer UI (routes, hooks, shadcn)
electron/preload/            contextBridge → window.leyline
electron/ipc/                Thin Zod + trusted-sender handlers
electron/application/        Use cases + TTL / session caches
electron/domain/             Ports, DTOs, icon resolution (no Electron)
electron/infrastructure/     Vault, HoYo client/login, genshin.dev, security
```

## Getting started

```bash
npm install
npm run dev
```

Use the Electron window from `npm run dev` (not a bare browser tab) so the preload bridge is present.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite + Electron with HMR |
| `npm run build` | Typecheck + production build |
| `npm run package` | Build + platform installer (`electron-builder`) |
| `npm run package:dir` | Build unpacked app directory |
| `npm run lint` | ESLint + `@shadcn/lint` |
| `npm run lint:deps` | Layer import rules (`dependency-cruiser`) |
| `npm run typecheck` | `tsc` for app + Node/Electron projects |
| `npm run check` | lint + lint:deps + typecheck |
| `npm run clean` | Remove `dist`, `dist-electron`, `release` |

## Configuration

All runtime knobs live in [`config/default.json`](config/default.json) (validated by [`config/schema.ts`](config/schema.ts)), loaded via [`electron/infrastructure/config/load.ts`](electron/infrastructure/config/load.ts).

Merge order: `default.json` → optional gitignored `config/local.json` → `LEYLINE_*` env vars.

| Env var | Maps to |
| --- | --- |
| `LEYLINE_APP_NAME` | `appName` |
| `LEYLINE_PRODUCT_NAME` | `productName` |
| `LEYLINE_USER_DATA_DIR` | `storage.userDataDirOverride` |
| `LEYLINE_STORE_NAME` | `storage.storeFileName` |
| `LEYLINE_HOYO_LOGIN_URL` | `hoyo.loginUrl` |
| `LEYLINE_GENSHIN_DEV_BASE_URL` | `genshinDev.baseUrl` |
| `LEYLINE_DEV_TOOLS` | `window.devTools` (`true` / `false`) |

Notable config keys:

- `hoyo.cacheTtlMs` — main-process overview / characters / abyss cache
- `artifacts.goodMaxBytes` — max UTF-8 size for GOOD JSON artifact imports
- `hoyo.artifactIconBaseUrl` — primary relic CDN for `UI_RelicIcon_*.png` (Enka)
- `hoyo.artifactIconFallbackBaseUrl` — secondary relic CDN (HoYoLab)
- `hoyo.characterIconBaseUrl` — primary avatar CDN (Enka)
- `hoyo.characterIconFallbackBaseUrl` — secondary avatar CDN (HoYoLab)
- `hoyo.bbsApiBase` + `hoyo.characterListPath` — modern roster endpoint
- `genshinDev.*` — catalog base URL, timeout, cache TTL
- `security.allowedExternalHosts` — `shell.openExternal`
- `security.allowedImageHosts` — CSP `img-src` (must include `enka.network`; supports `*.` wildcards)
- `auth.passwordPolicy` / lockout / idle timeout / bcrypt rounds

Native window chrome is off by default (`window.frame: false`). The React title bar handles drag and window controls.

## Data storage

Under Electron `userData` (folder name from `userDataDirName`, default `leyline-reader`):

- Windows: `%APPDATA%\leyline-reader\`
- macOS: `~/Library/Application Support/leyline-reader/`
- Linux: `~/.config/leyline-reader/`

HoYoverse cookies and GOOD artifact inventories are encrypted with OS `safeStorage` before write. The renderer never receives cookie values. UI theme preference is stored in localStorage (`leyline-theme`) via `next-themes`, not in the vault.

## Security

Contributor rules: [`AGENTS.md`](AGENTS.md). Aligns with:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP TCASVS](https://owasp.org/TCASVS/)
- [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security)

Highlights: sandboxed renderers, context isolation, no Node in the renderer, trusted IPC + Zod, navigation / external-open allowlists, session CSP, bcrypt vault + lockout + idle lock, isolated HoYo login partition cleared after capture.

## Credits & acknowledgements

Leyline Reader is built on open-source software and community game-data resources. Thank you to the maintainers and contributors of:

### Application framework & tooling

- [Electron](https://www.electronjs.org/) — desktop shell
- [Vite](https://vite.dev/) and [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron) — bundling / HMR
- [TypeScript](https://www.typescriptlang.org/), [ESLint](https://eslint.org/), [dependency-cruiser](https://github.com/sverweij/dependency-cruiser), [electron-builder](https://www.electron.build/)

### UI

- [React](https://react.dev/) and [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) (Radix primitives, `@shadcn/lint`)
- [Phosphor Icons](https://phosphoricons.com/), [next-themes](https://github.com/pacocoursey/next-themes), [Sonner](https://sonner.emilkowal.ski/), [Inter](https://rsms.me/inter/) via Fontsource
- [class-variance-authority](https://cva.style/), [clsx](https://github.com/lukeed/clsx) / project `cn` helpers

### Local security & config

- [Zod](https://zod.dev/), [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [electron-store](https://github.com/sindresorhus/electron-store), Electron OS [`safeStorage`](https://www.electronjs.org/docs/latest/api/safe-storage)

### Genshin / HoYoverse data (unofficial)

- [hoyoapi](https://github.com/vermaysha/hoyoapi) ([VerMaySha](https://github.com/vermaysha)) — HoYoLab Battle Chronicle client used for linked-account sync
- [genshin.dev](https://genshin.dev/) — optional static character catalog enrichment
- [Enka.Network](https://enka.network/) — primary public CDN for character and relic UI icons (`/ui/UI_AvatarIcon_*`, `/ui/UI_RelicIcon_*`)
- HoYoLab / miHoYo upload hosts — fallback icon CDN and official Battle Chronicle APIs accessed via the user’s own login (not scraped accounts)
- [Genshin Optimizer](https://frzyc.github.io/genshin-optimizer/) and the wider scanner community — **GOOD** (Genshin Open Object Description) inventory interchange format used for artifact import
- [Moegirl Encyclopedia](https://zh.moegirl.org.cn/) Genshin community color references — element / rarity accent tokens in CSS (not official miHoYo assets)

Game assets and trademarks belong to their respective owners (miHoYo / HoYoverse / Cognosphere). Icon and API usage is for personal, non-commercial fan tooling.

### Security references

Guidance used when designing vault / IPC / CSP controls:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP TCASVS](https://owasp.org/TCASVS/)
- [Electron Security Tutorial](https://www.electronjs.org/docs/latest/tutorial/security)

## Documentation & agent skills

| Doc / skill | Purpose |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Mandatory conventions + security for humans and coding agents |
| [`docs/architecture.md`](docs/architecture.md) | Layered architecture + cache / icon notes |
| [`TODO.md`](TODO.md) | Backlog (materials / weapons GOOD, Settings import, etc.) |
| [`.agents/skills/shadcn`](.agents/skills/shadcn/SKILL.md) | shadcn/ui composition and lint rules |
| [`.cursor/skills/leyline-hoyoapi`](.cursor/skills/leyline-hoyoapi/SKILL.md) | HoYoLab / hoyoapi quirks |
| [`.cursor/skills/leyline-genshin-dev`](.cursor/skills/leyline-genshin-dev/SKILL.md) | genshin.dev enrichment + Enka icon resolution |
| [`.cursor/skills/leyline-electron-ipc`](.cursor/skills/leyline-electron-ipc/SKILL.md) | IPC, vault, login window |

## License

MIT — see [`package.json`](package.json). Third-party libraries retain their own licenses. Game data and imagery remain property of their respective rights holders.
