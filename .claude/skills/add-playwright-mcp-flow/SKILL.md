---
name: add-playwright-mcp-flow
description: Run and record an approved Literabit UI acceptance flow through the Playwright MCP.
---

# Run a Literabit Acceptance Flow with Playwright MCP

Use this skill for acceptance criteria in `docs/business/acceptance-criteria.md` or `docs/TASK_BREAKDOWN_FE.md` that require browser-visible behavior. Literabit runs as a single Next.js 16 full-stack app (`bun run dev` on `http://localhost:3000`) backed by local PostgreSQL (`127.0.0.1:5433`).

## Setup & Rules

- Install and verify the Playwright MCP first (see the **"E2E: Playwright MCP (instalasi lokal)"** section in `CLAUDE.md`).
- Start the local stack with documented commands before running flows:

  ```powershell
  bun run infra:up
  bun run db:migrate
  bun run db:seed
  bun run dev
  ```

- Use only local/non-production accounts:
  - Seeded local Admin account from `src/db/seed.ts` (defaults to `admin@literabit.local` / `AdminLiterabit123!` unless overridden via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
  - Local Parent and Student profiles created via `/auth/register` and `/parent/profiles` on the local development database. Never use production credentials or run destructive resets on any non-local database.
- Assert user-visible Bahasa Indonesia text, route protection (Parent PIN Gate, `/profiles`, `/student/*`, `/parent/*`, `/admin/*`), responsive reflow (`NFR-002`), reader typography & **"Lihat Bacaan"** drawer answer preservation (`NFR-001`, `AC-007.2`), and persisted database outcomes across page reloads (including retake `0 XP` on `AC-009.2`).
- Record evidence under `docs/screenshots/<CARD-ID>/`: a screenshot for each step that carries the AC plus observed results (environment, role/persona, input data, expected result, and observed result).
- Include negative/error paths when the AC requires them (invalid PIN, unanswered quiz question, CMS publish guardrail `< 1` section / `< 3` questions, `CATEGORY_IN_USE`).
- Mark a flow **Blocked**, not **Pass**, when Playwright MCP or local infrastructure is unavailable. Never mark any flow passed without recorded evidence.

After completing code changes, run `bun run complete-check` and document any unavailable dependency as unverified, not passed.
