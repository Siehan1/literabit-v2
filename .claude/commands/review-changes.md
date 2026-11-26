---
name: Review Changes
description: Perform a structured, risk-aware Literabit code review with evidence
---

# Review Changes

Review changes against the assigned card, Literabit contracts (`docs/PRD.md`, `docs/api-specs/`, `docs/technical-specs/`), and `docs/CODE_REVIEW_CHECKLIST.md`. A green build is necessary but does not prove session isolation, Parent PIN Gate enforcement, XP idempotency, or acceptance-criterion behavior.

## Review Steps

1. Read `CLAUDE.md` / `GEMINI.md`, the PR Task ID (`M0-*`, `DB-M0-*`, `BE-M*`, `FE-M*`), linked EPIC/User Story/ACs, and applicable docs.
2. Inspect `git status`, `git diff --stat`, and focused diffs before forming conclusions.
3. Trace changed behavior through Next.js UI/pages (`src/app/`, `src/components/`), Route Handlers (`src/app/api/v1/`), domain modules (`src/modules/`), platform utilities (`src/lib/`), and Drizzle schema/migrations (`src/db/`).
4. Verify the change preserves:
   - API envelopes (`{ success: true, data, meta? }` / `{ success: false, error: { code, message, details? } }`) and `docs/api-specs/` contracts.
   - Server-side `parentId` / `studentId` ownership isolation (`NFR-004`), `literabit_parent_gate` enforcement on `/parent/*` & profile switches, and zero client trust for `studentId`, `parentId`, `score`, or `xpAwarded`.
   - Atomic `db.transaction` + `uniqueIndex(student_id, material_id)` on `xp_transactions` (`0 XP` on retake/double-submit, `NFR-003`).
   - CMS publish guardrail (`>= 1` section & `>= 3` questions), category delete protection (`CATEGORY_IN_USE`), and sequential `material_sections` storage.
   - Layer boundaries (no raw Drizzle in `src/app/`, `getServerEnv()` instead of `process.env`/`Bun.env`, browser-safe `schemas.ts`, files <= 300 lines).
   - Next.js 16 async APIs (`await cookies()/headers()/params/searchParams`) and `<Suspense>` boundaries for `cacheComponents: true`.
   - Bahasa Indonesia UI copy, `NFR-001` reader typography & WCAG AA contrast, `NFR-002` responsive layouts, **"Lihat Bacaan"** drawer state preservation, and loading/empty/error/disabled/success states.
   - Migration immutability under `src/db/migrations/` and secret redaction (no `.env`, `AUTH_SECRET`, hashes, or raw cookies).
5. Check affected unit and integration tests. Identify missing tests by concrete behavior and acceptance criterion.
6. Run or inspect verification evidence. `bun run complete-check` is required before approving an implementation PR (plus `bun run test:integration` for DB/auth/transaction changes).

## Findings Format

Group findings by risk level:

- **High:** release blocker, data-loss risk, cross-family data leak, Parent Gate bypass, broken XP idempotency, broken contract, or unverified destructive operation.
- **Medium:** probable functional regression, missing critical test, incorrect UI/error state handling, `<Suspense>`/`cacheComponents` hazard, or migration compatibility risk.
- **Low:** maintainability, clarity, naming, or minor test/documentation improvement.

For each finding include file path and line, why it matters, evidence, and a specific remediation. End with one recommendation: **Approve**, **Approve with follow-up**, or **Request changes**.

## Optional Knowledge-Graph Tools

If graph tooling exists, begin with `get_minimal_context(task="<task>")` and use `detail_level="minimal"`. Then use `detect_changes`, `get_affected_flows`, tests-for queries, and `get_impact_radius` to focus review effort. Do not invent graph output when those tools are absent.

## Efficiency Rules

- Review the change and its direct dependencies before scanning unrelated code.
- Keep findings evidence-backed; do not report style preferences as defects without a project rule.
- Separate pre-existing issues from issues introduced by the reviewed change.
