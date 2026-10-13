# Leyline Reader

Desktop dashboard for Genshin Impact players. Link a HoYoverse account in-app, sync personal Battle Chronicle data, enrich the roster with static catalog metadata, and browse Overview / Characters / Spiral Abyss with a light–dark theme.

## Features

- Local vault password (bcrypt) before any account data is accessible
- In-app HoYoverse login window; cookies encrypted with OS `safeStorage`
- Overview: resin / commissions / expeditions / achievements + world progress
- Characters: searchable roster, URL-synced filters, detail route, CDN avatars
- Spiral Abyss: current / previous cycle metrics
- Settings: Appearance (light / dark / system), account link, password change
- In-memory TTL caches (main process + renderer roster session cache)

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

### Game / account data sources

| Source | Role | Links |
| --- | --- | --- |
| HoYoLab / HoYoAPI | Linked account records, roster, daily note, Spiral Abyss | [hoyoapi docs](https://vermaysha.github.io/hoyoapi/docs/guide/genshin-impact) · [npm hoyoapi](https://www.npmjs.com/package/hoyoapi) · [HoYoLAB](https://www.hoyolab.com/) |
| genshin.dev | Optional character catalog enrichment (title, vision, weapon, nation, description) | [genshin.dev](https://genshin.dev/) · [API](https://api.genshin.dev/) |
| miHoYo CDN | Character avatar PNGs (`UI_AvatarIcon_*`) via `hoyo.characterIconBaseUrl` | Config default: `upload-os-bbs.mihoyo.com` |
| Moegirl `Genshincolor` | Element / rarity accent palette (community wiki tokens, not official HoYoverse design tokens) | [Moegirl Genshin Wiki](https://zh.moegirl.org.cn/Genshin_Impact) |

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
electron/application/        Use cases + HoYo TTL cache
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
- `hoyo.characterIconBaseUrl` — avatar CDN directory
- `hoyo.bbsApiBase` + `hoyo.characterListPath` — modern roster endpoint
- `genshinDev.*` — catalog base URL, timeout, cache TTL
- `security.allowedExternalHosts` — `shell.openExternal`
- `security.allowedImageHosts` — CSP `img-src` (supports `*.` wildcards)
- `auth.passwordPolicy` / lockout / idle timeout / bcrypt rounds

Native window chrome is off by default (`window.frame: false`). The React title bar handles drag and window controls.

## Data storage

Under Electron `userData` (folder name from `userDataDirName`, default `leyline-reader`):

- Windows: `%APPDATA%\leyline-reader\`
- macOS: `~/Library/Application Support/leyline-reader/`
- Linux: `~/.config/leyline-reader/`

HoYoverse cookies are encrypted with OS `safeStorage` before write. The renderer never receives cookie values. UI theme preference is stored in localStorage (`leyline-theme`) via `next-themes`, not in the vault.

## Security

Contributor rules: [`AGENTS.md`](AGENTS.md). Aligns with:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP TCASVS](https://owasp.org/TCASVS/)
- [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security)

Highlights: sandboxed renderers, context isolation, no Node in the renderer, trusted IPC + Zod, navigation / external-open allowlists, session CSP, bcrypt vault + lockout + idle lock, isolated HoYo login partition cleared after capture.

## Documentation & agent skills

| Doc / skill | Purpose |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Mandatory conventions + security for humans and coding agents |
| [`docs/architecture.md`](docs/architecture.md) | Layered architecture + cache notes |
| [`TODO.md`](TODO.md) | Backlog (materials/artifacts spike, etc.) |
| [`.agents/skills/shadcn`](.agents/skills/shadcn/SKILL.md) | shadcn/ui composition and lint rules |
| [`.cursor/skills/leyline-hoyoapi`](.cursor/skills/leyline-hoyoapi/SKILL.md) | HoYoLab / hoyoapi quirks |
| [`.cursor/skills/leyline-genshin-dev`](.cursor/skills/leyline-genshin-dev/SKILL.md) | genshin.dev enrichment |
| [`.cursor/skills/leyline-electron-ipc`](.cursor/skills/leyline-electron-ipc/SKILL.md) | IPC, vault, login window |

## License

MIT — see [`package.json`](package.json).
