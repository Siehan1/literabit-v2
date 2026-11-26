---
name: Explore Codebase
description: Navigate and understand Literabit with focused architecture and dependency tracing
---

# Explore Codebase

Explore the codebase from its architecture toward the smallest relevant implementation area. Do not infer a module, endpoint, or business behavior before checking the authoritative Literabit docs.

## Exploration Steps

1. Read `CLAUDE.md` / `GEMINI.md`, then identify the relevant source of truth:
   - Product scope, rules, and ACs: `docs/PRD.md` and `docs/business/`.
   - API contracts: `docs/api-specs/`.
   - Architecture, data model, auth, UI, and testing: `docs/technical-specs/` and `docs/ENGINEERING_BASELINE.md`.
   - Active cards: `docs/TASK_BREAKDOWN.md`, `docs/TASK_BREAKDOWN_BE.md`, `docs/TASK_BREAKDOWN_FE.md`.
2. Start with the repository shape, then narrow to the relevant layer:
   - UI & Route Handlers: `src/app/` (`/auth`, `/profiles`, `/student`, `/parent`, `/admin`, `/api/v1/*`) and `src/components/`.
   - Domain modules: `src/modules/` (`auth`, `learning`, `assessment`, `gamification`, `cms`).
   - Platform helpers: `src/lib/` (`env.ts`, `crypto.ts`, `session.ts`, `guards.ts`, `rate-limit.ts`, `storage.ts`, `api-response.ts`, `api-client.ts`).
   - Persistence & local infra: `src/db/` (`schema/`, `migrations/`, `seed.ts`) and `infra/local/`.
   - Tests: `test/unit/`, `test/integration/`, and `test/helpers/`.
3. Search precise terms: route path, error code (`PARENT_GATE_REQUIRED`, `CMS_PUBLISH_GUARDRAIL`, `CATEGORY_IN_USE`), cookie name, table/column, or acceptance-criterion ID (`AC-*`, `NFR-*`).
4. Trace the applicable flow:
   - API: `src/app/api/v1/.../route.ts` -> `src/lib/guards.ts` -> `src/modules/<domain>/schemas.ts` -> `service.ts` / `rules.ts` -> `src/db/schema/`.
   - UI: `src/app/<route>/page.tsx` -> `<Suspense>` / Client Component -> `src/modules/<domain>/schemas.ts` + `src/lib/api-client.ts` -> `/api/v1/...`.
5. Read existing tests and the nearest comparable implementation (e.g., `src/modules/auth/` and `src/app/api/v1/auth/register/route.ts`) before proposing a change.
6. State the observed architecture, entry point, dependency path, and open questions with file-path evidence.

## Optional Knowledge-Graph Tools

Use graph tooling only when it exists in the active environment. Start with `get_minimal_context(task="<task>")` and `detail_level="minimal"`.

Suggested sequence:

1. `list_graph_stats` and `get_architecture_overview` for a broad map.
2. `list_communities` and `get_community` for the relevant domain module.
3. `semantic_search_nodes` for a route, function, schema, or domain term.
4. `query_graph` with callers, callees, imports, or children patterns.
5. `list_flows` and `get_flow` for full execution paths.

Never report graph findings when no graph tool was available. Use focused file searches, file reads, and Git history as the fallback evidence.

## Efficiency Rules

- Start broad only long enough to choose the right layer/domain, then narrow.
- Request minimal context/output first and expand only when it changes the decision.
- Read relevant files, not entire folders.
- Distinguish implemented Milestone 0 / completed cards from planned Milestone 1–5 MVP and P1 backlog (`US-017`–`US-019`).
