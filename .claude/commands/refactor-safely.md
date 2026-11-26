---
name: Refactor Safely
description: Plan and execute Literabit refactors with dependency, contract, and test evidence
---

# Refactor Safely

Refactor only with a defined behavior-preservation goal. A refactor must not silently change an API contract, database schema, `parentId`/`studentId` ownership isolation, Parent PIN Gate behavior, transactional XP idempotency, CMS publish/delete guardrails, or PRD acceptance flow.

## Plan

1. Read `CLAUDE.md` / `GEMINI.md`, the relevant `docs/` contracts (`PRD.md`, `api-specs/`, `technical-specs/`), and the existing tests.
2. Define the refactor boundary, preserved behavior, excluded scope, and success criteria.
3. Inspect direct callers, imports, tests, shared Zod schemas (`src/modules/*/schemas.ts`), `getServerEnv()` usage, `<Suspense>` boundaries, and affected DB transactions with focused searches and file reads.
4. Check `git status` and `git diff` to avoid overwriting unrelated changes.
5. For a large decomposition, split at a coherent boundary proactively around 250 lines (hard cap: 300 lines in `.oxlintrc.json`), following `docs/CODING_STANDARD.md` and `docs/technical-specs/01-architecture-and-layers.md`.

## Execute

1. Make the smallest coherent change set.
2. Keep `/api/v1/*` envelopes, error codes, and user-visible Bahasa Indonesia wording unchanged unless the task explicitly changes them and the relevant docs are updated.
3. Preserve server-side session guards (`src/lib/guards.ts`), `parentId`/`studentId` query filters, and `db.transaction` boundaries; UI changes must never bypass them.
4. Keep `src/modules/<domain>/schemas.ts` browser-safe (no DB/server imports) and keep `src/app/` free of direct Drizzle queries.
5. Use a forward migration for database changes. Never rewrite an applied shared migration under `src/db/migrations/`.
6. Update focused unit/integration tests and docs when the module shape, contract, or operational behavior changes.

## Verify

1. Re-read the changed files and inspect the focused diff.
2. Run the narrowest relevant tests first (`bun test <path>`), then `bun run complete-check` before review.
3. For changed database, auth, or transaction boundaries, run `bun run test:integration` with local PostgreSQL (`bun run infra:up`).
4. Report any unavailable dependency as **Blocked**, not **Pass**.

## Optional Knowledge-Graph Tools

When graph tooling is available, start with `get_minimal_context(task="<task>")` and `detail_level="minimal"`. Then use:

1. `refactor_tool` in `suggest` or `dead_code` mode for discovery.
2. `refactor_tool` in `rename` mode to preview every affected location.
3. `get_impact_radius`, `get_affected_flows`, and `find_large_functions` before a major change.
4. `apply_refactor_tool` only after reviewing the preview edit list.
5. `detect_changes` after the refactor.

Do not use an automatic refactor tool when its preview is incomplete or when the affected contract cannot be verified.
