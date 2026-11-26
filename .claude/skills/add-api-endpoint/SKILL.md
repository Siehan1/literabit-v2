---
name: add-api-endpoint
description: Add a Next.js 16 Route Handler API endpoint under /api/v1 in Literabit.
---

# Add a Literabit API endpoint

Use this skill only after reading `docs/PRD.md`, the assigned task card (`docs/TASK_BREAKDOWN_BE.md`), and the matching API contract in `docs/api-specs/`. Literabit is a Bun + Next.js 16 App Router modular monolith backed by PostgreSQL and Drizzle ORM.

## Structure

Keep HTTP transport thin in Next.js Route Handlers and put domain logic in `src/modules/`:

```text
src/app/api/v1/<resource>/route.ts        # HTTP transport, rate limit, session guard, Zod parse, response envelope
src/modules/<domain>/schemas.ts           # Browser-safe Zod validation schemas & DTO types
src/modules/<domain>/service.ts           # Domain queries, authorization checks, and db.transaction() boundaries
src/modules/<domain>/rules.ts             # Pure deterministic business rules (scoring, XP, leveling, routing)
test/unit/<feature>.test.ts               # Unit tests for Zod schemas, pure rules, and route/service behavior
test/integration/<feature>.integration.test.ts  # PostgreSQL integration tests (with disposable DB guard)
```

Domains are `auth`, `learning`, `assessment`, `gamification`, and `cms` (`NFR-005`).

## Shared Helpers (`src/lib/`)

- `src/lib/api-response.ts`: `apiSuccess`, `apiError`, `apiValidationError`, `parseJsonBody`, `handleApiRouteError`.
- `src/lib/guards.ts`: `requireAuthSession`, `requireRoleSession`, `requireParentGateSession`, `requireStudentSession`.
- `src/lib/session.ts`: signed HTTP-only cookies (`literabit_session`, `literabit_student`, `literabit_parent_gate`).
- `src/lib/rate-limit.ts`: `createRateLimiter`, `getClientIp` (use on auth and Parent PIN verification routes).
- `src/lib/env.ts`: `getServerEnv()` (never read `process.env` or `Bun.env` directly in `src/app/` or `src/modules/`).

## Required Workflow

1. Read `docs/PRD.md`, the matching card in `docs/TASK_BREAKDOWN_BE.md`, and the contract in `docs/api-specs/`.
2. Inspect existing endpoints (e.g., `src/app/api/v1/auth/register/route.ts`) and `src/modules/` before adding abstractions.
3. Enforce authentication, role (`PARENT` or `ADMIN`), Parent PIN Gate (`literabit_parent_gate`), or verified student ownership (`requireStudentSession()`) server-side.
4. Parse `params` / `searchParams` with `await` (Next.js 16 async APIs) and parse JSON via `parseJsonBody(request)`. Validate input with Zod from `src/modules/<domain>/schemas.ts` and return `apiValidationError(parsed.error)` on failure.
5. Map domain errors to documented uppercase English error `code`s and clear Bahasa Indonesia `message`s via `apiError(...)`; catch unexpected errors with `handleApiRouteError(error)`. Never leak stack traces, SQL queries, password/PIN hashes, or `AUTH_SECRET`.
6. Wrap multi-table or idempotent mutations (such as quiz submission + `xp_transactions` + `reading_progress` + `students` XP/level, or section synchronization) in `await db.transaction(async (tx) => { ... })`.
7. Add unit tests in `test/unit/` (and integration tests in `test/integration/` guarded by `assertDisposableTestDatabase()` when touching PostgreSQL) covering success, validation failure, authorization/cross-family isolation, and conflict/guardrail paths.
8. Update `docs/api-specs/_index.md` status if applicable and run `bun run complete-check` (plus `bun run test:integration` when local PostgreSQL is available).

## Review Checklist

- [ ] Route lives under `src/app/api/v1/` and matches `docs/api-specs/` status codes and payloads.
- [ ] Route Handler delegates DB queries to `src/modules/<domain>/service.ts` (no direct Drizzle queries in `src/app/`).
- [ ] Every student/parent query filters by verified server-session `parentId` / `studentId` (`NFR-004`).
- [ ] `parentId`, `studentId`, `score`, and `xpAwarded` are derived server-side, never trusted from client body/query.
- [ ] Responses use `{ success: true, data, meta? }` or `{ success: false, error: { code, message, details? } }`.
- [ ] Exported functions have explicit return types and production files stay under 300 lines.
- [ ] Tests cover acceptance criteria without touching development or production databases.
