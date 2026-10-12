# Leyline Reader

Electron dashboard for Genshin Impact players. Link a HoYoverse account in-app, sync personal records with [HoYoAPI](https://vermaysha.github.io/hoyoapi/docs/guide/genshin-impact), and enrich the UI with static game data from [genshin.dev](https://genshin.dev/).

## Stack

- Electron + Vite (`vite-plugin-electron`)
- React 19 + React Router v7 (HashRouter for packaged `file://` loads)
- Tailwind CSS v4 + shadcn/ui
- `@shadcn/lint` (all rules enabled)
- Local encrypted vault (`electron-store` + `safeStorage`)

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server + Electron with HMR |
| `npm run build` | Typecheck + production Vite/Electron build |
| `npm run package` | Build and create platform installer |
| `npm run package:dir` | Build unpacked app directory |
| `npm run lint` | ESLint + shadcn/lint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | lint + typecheck |
| `npm run clean` | Remove `dist`, `dist-electron`, `release` |

## Configuration

All runtime knobs live in [`config/default.json`](config/default.json) (schema in [`config/schema.ts`](config/schema.ts)).

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

Native window chrome is disabled by default (`window.frame: false`). The React title bar in `src/components/title-bar.tsx` handles drag, minimize, maximize, and close. Set `window.customTitleBar` / `window.frame` in config to change that.

## Data storage

User data is stored under Electron `userData` (default folder name from config: `leyline-reader`):

- Windows: `%APPDATA%\leyline-reader\`
- macOS: `~/Library/Application Support/leyline-reader/`
- Linux: `~/.config/leyline-reader/`

HoYoverse cookies are encrypted with OS `safeStorage` before write. The renderer never receives cookie values.

## Security notes

Mandatory rules for contributors/agents are in [`AGENTS.md`](AGENTS.md) (OWASP Top 10, ASVS-aligned auth/crypto, TCASVS, Electron security checklist).

Highlights:

- Sandboxed renderers, context isolation, no Node integration
- Trusted IPC sender checks + Zod payload validation
- Navigation / `openExternal` host allowlists
- Session CSP headers, denied sensitive permissions
- bcrypt + lockout + idle timeout for the local vault
- HoYo cookies encrypted with OS `safeStorage`; never sent to the renderer
- Login uses an isolated session partition cleared after capture
