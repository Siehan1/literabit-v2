---
name: codebase-navigation
description: Navigate the Literabit Next.js 16 modular monolith and trace responsibilities safely.
---

# Literabit Codebase Navigation

Start with `docs/_index.md`, `docs/PRD.md`, and `docs/technical-specs/01-architecture-and-layers.md`, then follow the existing owner of each responsibility.

| Area                                                                                      | Location                                                         |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Pages, layouts & `/api/v1/*` Route Handlers                                               | `src/app/`                                                       |
| Reusable `shadcn/ui` & shared UI components                                               | `src/components/` (`src/components/ui/`)                         |
| Domain logic (`auth`, `learning`, `assessment`, `gamification`, `cms`)                    | `src/modules/<domain>/` (`schemas.ts`, `service.ts`, `rules.ts`) |
| Platform helpers (env, crypto, session, guards, rate-limit, storage, API envelope/client) | `src/lib/`                                                       |
| PostgreSQL / Drizzle schema, migrations & seed                                            | `src/db/` (`schema/`, `migrations/`, `index.ts`, `seed.ts`)      |
| Local PostgreSQL Docker & test DB setup                                                   | `infra/local/`                                                   |
| Unit, integration & disposable DB helpers                                                 | `test/unit/`, `test/integration/`, `test/helpers/`               |
| Product, API, technical & task docs                                                       | `docs/`                                                          |

## Trace a Request

### API Request (`/api/v1/*`)

1. Locate the Route Handler in `src/app/api/v1/<resource>/route.ts`.
2. Check rate limiting (`src/lib/rate-limit.ts`), session/role/gate/student guards (`src/lib/guards.ts`), and JSON parsing (`src/lib/api-response.ts`).
3. Follow input validation in `src/modules/<domain>/schemas.ts`.
4. Follow business logic, ownership filtering (`parentId` / `studentId`), and transactions in `src/modules/<domain>/service.ts` (and pure functions in `rules.ts`).
5. Inspect tables, constraints, and relations in `src/db/schema/` and tests in `test/unit/` & `test/integration/`.

### UI Flow (`/auth`, `/profiles`, `/student`, `/parent`, `/admin`)

1. Start from `src/app/layout.tsx` and the route's `page.tsx` / `layout.tsx` (check `<Suspense>` boundaries for `cacheComponents: true`).
2. Follow Client Components in `src/app/` or `src/components/`.
3. Check form validation in `src/modules/<domain>/schemas.ts` and HTTP calls in `src/lib/api-client.ts` (`apiFetch`).

Never assume a file exists or copy conventions from another project. Distinguish completed Milestone 0 / delivered cards from planned Milestone 1–5 MVP and P1 backlog (`US-017`–`US-019`). Run `bun run complete-check` after implementation.
