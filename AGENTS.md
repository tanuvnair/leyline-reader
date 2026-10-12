# AGENTS.md — Leyline Reader

Mandatory rules for humans and coding agents working in this repository.

After making changes, run `npm run check` and fix **all** errors before finishing.

---

## 1. Project conventions

- Do **not** hardcode URLs, cookie domains/keys, store names, window sizes, feature flags, password policy, lockout thresholds, or allowlists. Put them in [`config/default.json`](config/default.json), validate in [`config/schema.ts`](config/schema.ts), read via [`electron/config/load.ts`](electron/config/load.ts).
- Optional local overrides: gitignored `config/local.json`, then `LEYLINE_*` env vars.
- Prefer shadcn/ui under `src/components/ui`. Do not restyle primitives from outside that folder (`@shadcn/lint` enforces this).
- **Do not overwrite theme fonts.** Use only fonts/tokens from the active shadcn preset (`font-sans`, `font-heading`, etc.). Never add custom display fonts (e.g. Palatino) or replace Inter/preset imports unless the user explicitly changes the preset.
- **No ad-hoc color on chrome.** Page titles / title-bar labels use `font-heading` (+ size), not forced `text-primary`. Page titles are `text-3xl font-semibold tracking-tight` via `PageHeading`; card / alert / empty titles stay `font-medium`. Prefer CardFooter / FieldDescription / Badge variants over `mt-*` patches, raw `<p className="text-xs…">`, or unused custom Button variants.
- Prefer generated shadcn components and the preset’s icon library (`phosphor` for current preset) over hand-rolled UI.
- shadcn agent skills live under [`.agents/skills/shadcn`](.agents/skills/shadcn) (and Cursor copies). Read them when adding/changing UI.
- Theme/preset: `components.json` uses preset `b1Z5bbUiQ` (`radix-vega`, RTL-ready, pointer cursors). Do **not** run `shadcn init --template next` in this repo — it is Electron + Vite, not Next.js.
- `DirectionProvider` wraps the app (`ltr` by default). Keep `components.json` `"rtl": true` so new components stay RTL-compatible.
- Use npm scripts only (`dev`, `build`, `package`, `lint`, `typecheck`, `check`, `clean`). No Taskfile.
- TypeScript follows Google TS style. Commits follow Conventional Commits when creating commits.

### 1.1 App shell & page layout (mandatory)

These rules exist because mixed “centered card column” vs “full bleed” layouts kept shipping by accident.

- **Dashboard pages are full width** inside the sidebar inset. Use [`src/components/page-heading.tsx`](src/components/page-heading.tsx) `Page` + `PageHeading` on every authenticated route. Do **not** add `max-w-*` / `mx-auto` on `Page` (no centered content column).
- **Page chrome:** `PageHeading` owns title, optional description, and optional action buttons (Refresh, Retry, etc.). Do not hand-roll a separate heading row per route.
- **Inset scroll:** use shadcn `ScrollArea` in `AppShell` — not native `overflow-y-auto`. Own flex height on a wrapper (`h-0 min-h-0 flex-1 *:size-full`); do not put layout `className` on `ScrollArea` (`@shadcn/lint`). Put `p-8` on an inner `min-h-full` wrapper that is **not** `flex-1`. A padded `flex-1` child inside overflow is a Chromium bug — bottom padding is dropped from scroll height and the last card sits flush.
- **Empty / error states:** inline empties (no data in a section) stay under `PageHeading`, top-aligned. **Full-page CTAs** (e.g. account not linked) omit the heading and center in the inset with `Page` + `min-h-full flex-1 items-center justify-center`.
- **Sidebar:** primary nav in `SidebarContent`; **Lock app** (and similar account actions) only in `SidebarFooter` so they stay pinned to the bottom. Keep the height chain (`#root` → `AppFrame` → shell → `SidebarProvider` → `Sidebar`) filling the window so the footer can sit at the bottom. Use `SidebarMenuButton variant="destructive"` for Lock (no ad-hoc red text classes).
- **Title bar:** window controls use `Button` variants `titlebar` / `titlebar-close` + size `titlebar` only — equal width hit targets, no ad-hoc spacing classes on the buttons.
- **Login** (pre-shell) may stay a narrow centered card (`max-w-md`); that exception does not apply inside `AppShell`.
- **Cards / footers:** use full Card composition (`CardHeader` / `CardContent` / `CardFooter`). Primary form actions belong in `CardFooter`. Default footer has no top rule — card spacing is enough for login/settings. Reserve `CardFooter variant="border"` for denser cards that need a stronger content/actions split. Never put `border-t` / `Separator` as a bare Card child (no horizontal padding → edge-to-edge “weird divider”). `CardFooter` owns bottom padding; never restyle footer spacing from routes.
- **Forms:** always `noValidate` on `<form>`. Never rely on native browser tooltips (`required` / `minLength` constraint UI). Validate in submit handlers and show errors with `Field` + `data-invalid` + `aria-invalid` + `FieldError`. Password rules come from public config `auth.passwordPolicy` via [`src/lib/password-policy.ts`](src/lib/password-policy.ts).
- **Password fields:** use [`PasswordInput`](src/components/password-input.tsx) (`InputGroup` + `InputGroupInput` + eye toggle). Never hand-position an eye `Button` over a raw `Input`.
- **Not-linked states** use [`AccountSetupEmpty`](src/components/account-setup-empty.tsx) (Empty + Link HoYoverse CTA), not a red Alert.
- **HoYoverse link status:** [`HoyoAccountProvider`](src/hooks/use-hoyo-account.tsx) lives in `AppShell` and caches link status for the session. Linked-only routes wrap content in [`AccountGate`](src/components/account-setup-empty.tsx). While status is resolving, show `AccountSetupSkeleton` (empty-shaped). When not linked, show `AccountSetupEmpty` immediately — do **not** flash page headings / data skeletons first (that causes nav flicker).
- **Loading UX:** use `Skeleton` for content placeholders (size the **parent**; `@shadcn/lint` forbids sizing classes on `Skeleton` itself — use `variant="circle" | "pill"` for shape). Refresh / submit buttons: `disabled` while busy + `Spinner` with `data-icon="inline-start"`. Do not invent custom `animate-pulse` divs or a Button `isLoading` prop.
- **HoYoLab data quirks:** Character roster uses modern `character/list` (config `hoyo.bbsApiBase` + `hoyo.characterListPath`) because hoyoapi’s legacy `/character` often returns empty. Daily note failures (usually Real-Time Notes disabled) must surface as `dailyNoteError` on Overview — never silent `null` dashes. See [`.cursor/skills/leyline-hoyoapi/SKILL.md`](.cursor/skills/leyline-hoyoapi/SKILL.md).

---

## 2. Security standards (strict)

This app must stay aligned with:

1. [OWASP Top 10](https://owasp.org/www-project-top-ten/)
2. [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) (auth, crypto, data protection controls that apply to local apps)
3. [OWASP TCASVS](https://owasp.org/TCASVS/) (thick-client / desktop)
4. [Electron Security Tutorial checklist](https://www.electronjs.org/docs/latest/tutorial/security)

Treat security regressions as blockers. Do not weaken controls “for convenience” without an explicit, reviewed config flag and documentation.

### 2.1 Electron process model (A01 / TCASVS architecture)

- **Never** enable `nodeIntegration` in any renderer.
- **Always** keep `contextIsolation: true`.
- **Always** keep `sandbox: true` for BrowserWindows that load UI or remote login pages.
- **Always** keep `webSecurity: true`.
- **Never** set `allowRunningInsecureContent`, `experimentalFeatures`, or dangerous Blink features.
- Expose APIs **only** through `contextBridge` in [`electron/preload/index.ts`](electron/preload/index.ts) as `window.leyline`. Do not expose `ipcRenderer`, Node, or Electron APIs raw.
- HoYoverse **cookies and tokens never leave the main process**. Renderer receives sanitized DTOs only.

### 2.2 IPC trust boundary (A01 / Electron checklist #17)

- Every `ipcMain.handle` must validate the sender with `assertTrustedIpcSender` ([`electron/security/trust.ts`](electron/security/trust.ts)).
- Validate **all** IPC payloads with Zod (or equivalent schema) before use.
- Keep channel names centralized in [`electron/ipc/channels.ts`](electron/ipc/channels.ts); keep preload in sync.
- Do not add fire-and-forget `ipcMain.on` listeners that mutate secrets without the same checks.

### 2.3 Navigation, windows, and external opens (A01 / Electron #13–15)

- Main window navigation allowlist: `file:` and (dev only) localhost Vite origins.
- HoYo login window navigation allowlist: HTTPS hosts derived from config HoYo domains.
- `setWindowOpenHandler` must **deny** by default.
- `shell.openExternal` only for HTTPS URLs whose host is in `security.allowedExternalHosts`.
- Deny sensitive Chromium permissions via `setPermissionRequestHandler` ([`electron/security/session.ts`](electron/security/session.ts)).

### 2.4 Content Security Policy (A03 / Electron #7)

- Enforce CSP via response headers in [`electron/security/session.ts`](electron/security/session.ts) on **mainFrame** responses only (not every subresource — that stalls Vite and strands the UI on Loading).
- Do not put a second strict CSP meta tag in `index.html` (multiple CSPs AND together and break Vite HMR).
- Production: `script-src 'self'` (no `'unsafe-inline'` / `'unsafe-eval'` for scripts).
- Dev may relax script/connect for Vite HMR only when `VITE_DEV_SERVER_URL` is set and app is unpackaged.
- Keep `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'none'`.
- **Never inject the app CSP into the HoYo login session partition.** That partition uses `hardenSession(..., {injectAppCsp: false})` so Hoyolab can load its own scripts/forms; isolation + navigation allowlist still apply.
- Never enable `vite-plugin-electron` `renderer: {}` Node polyfills; they conflict with sandbox + contextIsolation.

### 2.5 Authentication & session (A07 / ASVS V2)

- Local vault password is mandatory before accessing account data.
- Password policy comes from config (`auth.passwordPolicy`); default minimum length **10**, letter + number required.
- Hash with bcrypt; `auth.bcryptRounds` minimum **10**.
- Enforce unlock lockout: `maxFailedAttempts` + `lockoutMs`.
- Enforce idle lock via `sessionIdleTimeoutMs`; clear in-memory unlock state on quit / lock.
- Never log passwords, password hashes, or comparison results beyond boolean success/failure.

### 2.6 Secrets & data protection (A02 / A04 / TCASVS V3 / V5)

- Store HoYo cookies only after `safeStorage.encryptString`. Fail closed if encryption is unavailable.
- Do not write plaintext cookies/tokens to disk, logs, crash reports, or toast messages.
- Redact cookie/token patterns from IPC error strings (`redactError`).
- Use an isolated session partition for HoYo login; clear storage after capture.
- Do not sync vault secrets to cloud services.

### 2.7 Injection / SSRF / unsafe fetches (A03 / A10)

- Do not build shell commands from user or remote input.
- genshin.dev paths must pass segment allowlisting; base URL must be HTTPS; redirects rejected.
- Cap enrichment fan-out (unique names, max count) to avoid abuse / resource exhaustion.
- Never pass renderer-controlled URLs into `fetch`, `loadURL`, or `openExternal` without allowlist checks.

### 2.8 Cryptography (A02 / ASVS V6 / TCASVS V5)

- Do not invent custom crypto. Use OS `safeStorage` for secret-at-rest and bcrypt for passwords.
- Do not store reversible encryption of passwords.
- Do not weaken TLS (no custom `rejectUnauthorized: false`).

### 2.9 Logging, errors, and privacy (A09)

- No secrets in `console.log` / crash telemetry.
- Prefer generic user-facing errors; detailed errors stay redacted.
- Do not attach analytics that exfiltrate account identifiers without an explicit product decision and config flag.

### 2.10 Supply chain & configuration (A08 / TCASVS V2)

- Prefer pinned / reviewed dependency versions for security-critical packages.
- Do not commit `.env`, `config/local.json`, cookies, or vault files.
- DevTools default **off** in config; only open when unpackaged **and** `window.devTools` is true.
- Do not disable security features behind undocumented env vars.

---

## 3. OWASP Top 10 mapping (quick reference)

| OWASP Top 10 | Leyline controls |
| --- | --- |
| A01 Broken Access Control | Unlock gate on sensitive IPC; trusted IPC sender checks; navigation allowlists |
| A02 Cryptographic Failures | bcrypt password hashes; `safeStorage` for cookies; HTTPS-only remote calls |
| A03 Injection | Zod IPC validation; path allowlists; no shelling out on untrusted input |
| A04 Insecure Design | Main/preload/renderer separation; cookies never in renderer; threat boundaries in this file |
| A05 Security Misconfiguration | Sandbox, CSP, denied permissions, no Node in renderer, DevTools off by default |
| A06 Vulnerable Components | Keep Electron/deps updated; run `npm audit` when changing deps |
| A07 Identification & Auth Failures | Password policy, lockout, idle timeout, bcrypt |
| A08 Software/Data Integrity | Config schema validation; no remote code execution channels |
| A09 Security Logging Failures | Redacted errors; no secret logging |
| A10 SSRF | HTTPS + host allowlists; no open redirects on outbound fetch |

---

## 4. Where security code lives

| Area | Path |
| --- | --- |
| Trust / allowlists / CSP strings | `electron/security/trust.ts` |
| Session headers & permissions | `electron/security/session.ts` |
| Navigation / window.open guards | `electron/security/window.ts` |
| IPC handlers | `electron/ipc/register.ts` |
| Auth / lockout | `electron/auth/session.ts` |
| Encrypted vault | `electron/store/vault.ts` |
| HoYo login capture | `electron/hoyolab/login.ts` |
| Preload bridge | `electron/preload/index.ts` |

---

## 5. Agent workflow checklist

Before finishing a change that touches Electron, IPC, auth, networking, or config:

1. Confirm no new plaintext secret storage or renderer exposure of cookies.
2. Confirm new IPC channels validate sender + payload schema.
3. Confirm new URLs/hosts are config-driven and allowlisted.
4. Confirm CSP / sandbox / contextIsolation were not weakened.
5. Run `npm run check`.
6. Update this file if you introduce a new security boundary or control.
