# Architecture — Leyline Reader

Leyline Reader uses a **layered (N-tier) architecture** on the Electron main process, with the React renderer as Presentation.

## Layers

| Layer | Responsibility | Location |
| --- | --- | --- |
| **Presentation** | UI, IPC transport, Zod payload format checks | `src/`, `electron/preload/`, `electron/ipc/` |
| **Application** | Use-case orchestration, unlock gates, DTO shaping | `electron/application/` |
| **Domain** | Pure rules, types, port interfaces (no Electron / hoyoapi) | `electron/domain/` |
| **Infrastructure** | Vault, HoYo HTTP/login, genshin.dev, config, security, auth session | `electron/infrastructure/` |

Composition root: [`electron/main/index.ts`](../electron/main/index.ts) wires adapters and registers IPC.

```mermaid
flowchart TB
  UI[Presentation src] --> Preload[Presentation preload]
  Preload --> IPC[Presentation ipc]
  IPC --> App[Application use cases]
  App --> Domain[Domain types rules ports]
  App --> Infra[Infrastructure adapters]
  Infra -.->|implements| Domain
```

## Dependency rules

- Presentation → Application (Infrastructure only when a use case would be an empty proxy — e.g. window controls, public config read).
- Application → Domain (types + ports). Implementations are injected or imported from Infrastructure at the composition / use-case wiring edge.
- Domain → **only** `electron/domain/**` (no `electron`, `hoyoapi`, Node filesystem).
- Infrastructure → Domain + Electron/npm libraries.

Enforced by `dependency-cruiser` (`npm run lint:deps`) as part of `npm run check`.

## Security boundary

Process isolation is orthogonal to layering:

- Renderer never receives HoYoverse cookies or tokens.
- Every `ipcMain.handle` validates the sender and Zod-parses payloads (see `AGENTS.md`).
- Domain ports return sanitized DTOs only.

## Use cases (Application)

| Use case | IPC channel(s) |
| --- | --- |
| Auth status / setup / unlock / lock / change password | `AUTH_*` |
| HoYo status / link / unlink | `HOYO_*` |
| Overview / characters / abyss | `DATA_*` |

Window minimize/maximize/close stay in Presentation → Electron APIs (no Application proxy).
