---
name: developer-pre-pr-checklist
description: Verify Literabit changes before opening a pull request.
---

# Literabit Pre-PR Checklist

Normal milestone work targets `dev`; `main` is release-only. Fill out `.github/pull_request_template.md` and self-review against `docs/CODE_REVIEW_CHECKLIST.md` before requesting review.

## Required Checks

Run from the repository root:

```powershell
bun run complete-check
```

This runs `type-check` (`next typegen && tsc --noEmit`), `lint` (`oxlint .`), `fmt` (`oxfmt --check .`), `test` (`bun test ./src ./test/unit`), and `build` (`next build`).

For database, migration, auth/session, or transactional changes, also run against local PostgreSQL (`127.0.0.1:5433`):

```powershell
bun run infra:up
bun run db:migrate
bun run test:integration
```

## Self-Review

- [ ] Task ID (`M0-*`, `DB-M0-*`, `BE-M*`, `FE-M*`), EPIC/User Story, and Acceptance Criteria are referenced in the PR.
- [ ] Diff is scoped to the assigned card; no `.env`, `*.pem`, `AUTH_SECRET`, password/PIN hashes, raw cookies, or build output are committed.
- [ ] Every student/parent query strictly filters by verified session `parentId` / `studentId`, and `/parent/*` enforces `literabit_parent_gate` (`NFR-004`).
- [ ] `studentId`, `parentId`, `score`, and `xpAwarded` are never trusted from client body/query.
- [ ] Quiz submission + XP calculation run inside `db.transaction` with `uniqueIndex(student_id, material_id)` (`0 XP` on retake/double-submit, `NFR-003`).
- [ ] CMS publish guardrail (`>= 1` section & `>= 3` questions) and category delete guardrail (`CATEGORY_IN_USE`) are enforced server-side.
- [ ] `src/app/` does not call Drizzle directly; `src/app/` and `src/modules/` use `getServerEnv()` rather than `process.env` / `Bun.env`.
- [ ] Next.js 16 async request APIs are awaited and request-time dynamic components sit inside `<Suspense>`.
- [ ] UI uses Bahasa Indonesia copy, meets `NFR-001` typography / WCAG AA contrast, handles loading/empty/error/disabled/success states, and uses real API persistence.
- [ ] Migration protocol (`src/db/migrations/`) was followed if schema changed.
- [ ] Relevant status/docs (`docs/TASK_BREAKDOWN*.md`, `docs/api-specs/_index.md`) are updated if applicable.
- [ ] CI checks are green before requesting review.

Push only your feature/task branch and open a PR into `dev`; never push directly to protected `dev` or `main`.
