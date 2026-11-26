# AI Agent Instructions: Literabit

> **Critical:** These rules apply to every task. If context is compacted, re-read this file and
> `GEMINI.md` before continuing. Do not mark work complete until `bun run complete-check` passes
> (or blocked checks are explicitly recorded).

> **Source of truth:** Product requirements live in `docs/PRD.md` & `docs/business/`; API contracts
> in `docs/api-specs/`; architecture, data model, auth, UI, and testing rules in
> `docs/technical-specs/` & `docs/ENGINEERING_BASELINE.md`; implementation standards in
> `docs/CODING_STANDARD.md`; task cards in `docs/TASK_BREAKDOWN.md`, `docs/TASK_BREAKDOWN_BE.md`,
> and `docs/TASK_BREAKDOWN_FE.md`; operational guidance in `docs/ONBOARDING_GUIDE.md`,
> `docs/DEVELOPMENT_GUIDE.md`, `docs/CODE_REVIEW_CHECKLIST.md`, and `docs/TROUBLESHOOTING_GUIDE.md`;
> full index in `docs/_index.md`.

## Project Overview

**Literabit** is a web-based reading comprehension platform for children aged 6–12, parents, and
administrators. **Milestone 0 (Shared Foundation & Database)** is complete; product features for
**EPIC 01 through EPIC 06 (`US-001`–`US-016`)** are delivered across **Milestones 1–5** in separate
Backend (`BE-M1`–`BE-M5`) and Frontend (`FE-M1`–`FE-M5`) tracks. Post-MVP backlog items
(`US-017`–`US-019`) and resolved exclusions (audio narration, placement tests, parental content
control, multi-role editorial approval) remain out of MVP scope unless explicitly approved.

| Layer          | Technology                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------- |
| Runtime & PM   | Bun `1.4.2`                                                                                  |
| Framework      | Next.js `16.4.6` (App Router, `cacheComponents: true`, `partialPrefetching: true`)           |
| UI & Styling   | React `19.3.0`, Tailwind CSS `4.3.3` (`@tailwindcss/turbopack`), `shadcn/ui`, `lucide-react` |
| Language       | TypeScript `5.9` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)          |
| Database & ORM | PostgreSQL 16 + Drizzle ORM (`postgres` driver)                                              |
| Validation     | Zod v4 (shared browser-safe schemas in `src/modules/*/schemas.ts`)                           |
| Auth & Crypto  | `jose` (signed HTTP-only cookies) + `bcryptjs`                                               |
| Quality Gates  | `tsc --noEmit`, `oxlint`, `oxfmt`, `bun:test`, `next build`                                  |

## Delivery Tracks & Synchronization

1. Always read `docs/PRD.md` before planning or implementing any feature.
2. **Milestone 0 (Shared + DB)** provides the 5 `pgEnum`s, 10 MVP tables, migrations, seed, env/auth
   helpers, API envelope utilities, and `shadcn/ui` base.
3. **Backend (`docs/TASK_BREAKDOWN_BE.md`)** and **Frontend (`docs/TASK_BREAKDOWN_FE.md`)** work in
   parallel against the shared contracts in `docs/api-specs/*.md` and `src/modules/*/schemas.ts`.
4. Any request/response contract change must update `docs/api-specs/*.md` first.
5. Never fake persistence, session isolation, Parent PIN Gate checks, quiz scoring, or XP
   calculation in the browser.

## Local Skills and Commands

Before taking implementation, review, debug, or refactor action, match the task to the local
resources below (under `.claude/skills/`, `.claude/commands/`, and `.agents/skills/`).

1. Read the matching skill `SKILL.md` completely before using it.
2. Read the matching `.claude/commands/<command>.md` before following its workflow.
3. Use the smallest set of resources that covers the task; prefer the more specific skill first.
4. Local skills and commands supplement this file; they never override `GEMINI.md`, `AGENTS.md`,
   `CLAUDE.md`, assigned task scope, or the authoritative Literabit documentation in `docs/`.
5. If a third-party/copied skill mentions another framework or foreign project (e.g., Hono, Vite,
   React Router, BullMQ, MinIO), ignore those foreign details and follow Literabit's Next.js 16,
   Bun, Drizzle, and `docs/` contracts.

| Task                                       | Use first                             | Also consult when needed                                                                   |
| ------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Start any developer task                   | `.claude/commands/start-task.md`      | `codebase-navigation`, `docs/PRD.md`, `docs/TASK_BREAKDOWN*.md`                            |
| Navigate architecture or trace an issue    | `codebase-navigation`                 | `.claude/commands/explore-codebase.md`                                                     |
| Diagnose a bug                             | `.claude/commands/debug-issue.md`     | `codebase-navigation`, `docs/TROUBLESHOOTING_GUIDE.md`                                     |
| Build a Frontend page/component            | `add-frontend-feature`                | `design-taste-frontend`, `impeccable`, `emil-design-eng`, `.agents/skills/antislop*`       |
| Design or substantially improve UI         | `design-taste-frontend`               | `high-end-visual-design`, `impeccable`, `redesign-existing-projects`                       |
| Review animation or interaction motion     | `review-animations`                   | `emil-design-eng`                                                                          |
| Add an `/api/v1/*` Route Handler           | `add-api-endpoint`                    | `.agents/skills/arx-be`, `add-shared-schema`, `add-audit-log`                              |
| Change database schema / migration         | `add-drizzle-migration`               | `docs/technical-specs/02-data-model.md`, `docs/CODING_STANDARD.md`                         |
| Add a shared client/server Zod schema      | `add-shared-schema`                   | `docs/api-specs/`, `src/db/schema/enums.ts`                                                |
| Record transactional evaluation/audit logs | `add-audit-log`                       | `docs/technical-specs/03-business-contracts.md`                                            |
| Run an acceptance E2E flow                 | `add-playwright-mcp-flow`             | `docs/business/acceptance-criteria.md`, `docs/technical-specs/05-ui-and-a11y.md`           |
| Refactor safely / split a large file       | `refactor-large-file`                 | `.claude/commands/refactor-safely.md`                                                      |
| Review a change set / pre-PR gate          | `developer-pre-pr-checklist`          | `.claude/commands/review-changes.md`, `code-review-skill`, `docs/CODE_REVIEW_CHECKLIST.md` |
| Prepare a commit                           | `git-commit`                          | `.claude/commands/commit-and-push.md`                                                      |
| Push a branch                              | `.claude/commands/commit-and-push.md` | `git-commit`                                                                               |
| Improve prose or documentation             | `stop-slop`                           | `docs/CODING_STANDARD.md`                                                                  |

## Repository Layout

```text
literabit-v2/
├── src/
│   ├── app/
│   │   ├── (public)/          Landing / redirect entry
│   │   ├── auth/              Login & Parent Registration UI
│   │   ├── profiles/          Netflix-style Student Profile Picker
│   │   ├── student/           Catalog, Guided Reader, Quiz, Result, Progress
│   │   ├── parent/            Parent Dashboard & Manage Child Profiles (Parent Gate)
│   │   ├── admin/             Lean CMS (Categories, Materials, Sections, Questions)
│   │   └── api/v1/            Next.js Route Handlers per docs/api-specs/
│   ├── components/            Reusable shadcn/ui primitives & shared UI components
│   ├── db/                    Drizzle client, schema/ (enums, tables, relations), migrations/, seed.ts
│   ├── modules/               Domain logic (auth, learning, assessment, gamification, cms)
│   └── lib/                   env, crypto, session, guards, rate-limit, storage, api-response, api-client
├── test/                      unit/, integration/, helpers/ (disposable DB guard)
├── infra/local/               Docker Compose PostgreSQL 16 (port 5433) & test DB bootstrap
├── docs/                      PRD, business, api-specs, technical-specs, task breakdowns & guides
├── .github/                   CI workflows & PR template
└── .husky/                    Pre-commit (lint-staged) & Conventional Commit hooks
```

## Architecture Laws

### Boundaries & Next.js 16 Rules

- `src/app/` (Pages, Client Components, Server Actions, Route Handlers) calls only `src/modules/`
  and `src/lib/`. **Never** write raw Drizzle queries directly in UI components or Route Handlers.
- Domain modules live under `src/modules/<domain>/` (`auth`, `learning`, `assessment`,
  `gamification`, `cms`) with:
  - `schemas.ts`: **browser-safe** Zod validation schemas and DTO types (no DB/server imports).
  - `service.ts`: isolated domain queries, ownership filters, and `db.transaction(...)` boundaries.
  - `rules.ts`: pure deterministic functions (scoring, XP, leveling, rule-based routing).
- `src/modules/assessment` invokes `src/modules/gamification` inside the **same `db.transaction`**
  during quiz submission.
- Read `node_modules/next/dist/docs/` before using unfamiliar Next.js 16 APIs.
- `cookies()`, `headers()`, `params`, and `searchParams` are **async (`await`)**.
- With `cacheComponents: true` and `partialPrefetching: true` enabled in `next.config.ts`, any
  Server Component reading cookies/session or family-specific data must be wrapped in `<Suspense>`
  so `bun run build` stays clean.
- Client code calls `/api/v1/*` via `apiFetch` in `src/lib/api-client.ts`; Route Handlers respond
  using `apiSuccess`, `apiError`, `apiValidationError`, `parseJsonBody`, and `handleApiRouteError`
  in `src/lib/api-response.ts`.

### Core Business & Domain Rules (`docs/PRD.md`)

- **UI Language:** All user-facing UI copy, validation errors, and educational content use child-
  and parent-friendly **Bahasa Indonesia**. Code identifiers, error codes, DB names, and API fields
  use **English**.
- **Roles & Cookies:** Login roles are `PARENT` and `ADMIN` (`Student` is a sub-profile under
  `PARENT`). Three signed HTTP-only cookies (`jose` + `AUTH_SECRET`) govern sessions:
  - `literabit_session`: `{ userId, role, exp }`
  - `literabit_student`: `{ studentId, parentId, exp }` (always verified against `students.parent_id === session.userId`)
  - `literabit_parent_gate`: `{ userId, verifiedAt, exp }` (15-minute TTL after 4-digit Parent PIN verification)
- **First-Attempt Proportional XP (`NFR-003`):** `(correctCount * 10) + (score >= 70 ? 20 : 0)` on
  first attempt only. Retakes and double-submits always yield `0 XP`, enforced inside
  `await db.transaction(...)` with `uniqueIndex(student_id, material_id)` on `xp_transactions`.
- **Static Leveling:** `calculateLevel(totalXp) = Math.floor(Math.max(0, totalXp) / 100) + 1`.
- **Granular Evaluation Logging:** Every quiz submission saves per-question `attempt_answers`
  (`skill_category` snapshot) alongside `quiz_attempts`.
- **Rule-Based Next-Step Routing:** `< 60%` review, `60–79%` practice/catalog, `>= 80%` advance.
- **CMS Guardrails:** Materials require `>= 1` `material_sections` row and `>= 3` `questions` rows
  before transitioning to `PUBLISHED` (`422 CMS_PUBLISH_GUARDRAIL`). Categories still referenced by
  materials cannot be hard-deleted (`422 CATEGORY_IN_USE`; deactivate via `is_active = false`).
- **Sequential Reading Pages:** Never store reading content as a single rich-text blob; store pages
  sequentially in `material_sections` (`section_index` `0..N-1`).
- **Readability & A11y (`NFR-001`, `NFR-002`):** Reading prose must be `>= 18px` for `LEVEL_1`
  (`.reading-prose`) and `>= 16px` for `LEVEL_2`/`LEVEL_3` (`.reading-prose-standard`),
  `line-height >= 1.6`, `max-w-prose` (~65ch), WCAG AA contrast (`>= 4.5:1`), responsive `320px+`.

### Code Quality (`docs/CODING_STANDARD.md`)

- Keep production files under **300 lines** (enforced by `.oxlintrc.json`); split proactively at 250 lines.
- Strict TypeScript: no `any`, no `@ts-ignore` / `@ts-nocheck`, no non-null assertions (`!`), use
  `import type`, use `type` over `interface`, and declare explicit return types on exported functions.
- Use `pgEnum`, string literal unions, or `z.enum(...)` — never TypeScript `enum`.
- **Never** read `process.env` or `Bun.env` inside `src/modules/` or `src/app/`; use `getServerEnv()`
  from `src/lib/env.ts` (narrow exceptions: config, migration, seed, and test scripts).
- Never commit or log `.env`, `*.pem`, `AUTH_SECRET`, plaintext passwords/PINs, password/PIN hashes,
  or raw session cookies.

## Database & Security

- Every student/parent DB query **must** filter by `parentId` or `studentId` verified from the
  active server session (`src/lib/guards.ts`). Never write `WHERE id = :studentId` without
  `AND parent_id = :sessionUserId`.
- Never trust `parentId`, `studentId`, `score`, or `xpAwarded` from client body/query parameters.
- Use `pgEnum` for fixed domain values (`role`, `difficulty_level`, `material_status`,
  `skill_category`, `reading_status`).
- Change schema only in `src/db/schema/` via committed Drizzle migrations (`src/db/migrations/`).
  Never alter shared databases manually or rewrite applied migrations; always create a forward fix.
- Integration tests in `test/integration/` must pass `assertDisposableTestDatabase()`
  (`test/helpers/disposable-database.ts`) so development/production databases are never touched.

## Testing and Verification

Run the full quality gate before declaring work complete or opening a PR:

```powershell
bun run complete-check
```

Individual gates:

```powershell
bun run type-check
bun run lint
bun run fmt
bun run test
bun run build
```

For database, migration, auth, or transaction changes, also run:

```powershell
bun run infra:up
bun run db:migrate
bun run test:integration
```

- Never claim an AC, E2E flow, or integration check passed without current evidence.
- If a dependency (such as Docker/PostgreSQL or Playwright MCP) is unavailable, mark the check
  **Blocked**, not **Pass**.

## Development Workflow

Before editing on a new task, run `.claude/commands/start-task.md`.

### Branch Naming & Git Rules

Use `<CARD-ID>-<Imperative-kebab-title>` matching `docs/DEVELOPMENT_GUIDE.md` and
`docs/TASK_BREAKDOWN*.md`:

```text
M0-01-Setup-bun-foundation
DB-M0-01-Setup-drizzle-schema
BE-M1-02-Implement-login-logout
BE-M4-01-Implement-idempotent-xp-quiz
FE-M3-02-Build-guided-section-reader
```

- Normal task PRs target `dev`; `main` is release-only. Never push directly to `dev` or `main`.
- Conventional Commits enforced by `.husky/commit-msg`: `<type>(<scope>): <subject>` (max 80 chars,
  allowed types `feat|fix|refactor|test|docs|chore|perf`, **no `Co-Authored-By:` trailers**).
- Self-review with `docs/CODE_REVIEW_CHECKLIST.md` and `.github/pull_request_template.md`.

### Commit and Push Safety Gate

When asked to commit or push, follow `.claude/commands/commit-and-push.md`:

- Commit requests authorize only an explicit, scoped local commit after pre-commit checks.
- Push requests authorize only a normal push after remote/divergence checks.
- Never use `git add -A`, `git add .`, `git push --force`, `git push --force-with-lease`, or direct
  pushes to `dev` or `main`.
- Never silently rebase, merge, resolve conflicts, or discard uncommitted work.

## Local Commands

```powershell
bun install
bun run infra:up
bun run db:generate
bun run db:migrate
bun run db:seed
bun run db:studio
bun run dev

bun run type-check
bun run lint
bun run fmt
bun run test
bun run build
bun run complete-check
bun run test:integration
bun run infra:down
```

Local PostgreSQL runs on `127.0.0.1:5433` (`literabit` and `literabit_test`). See
`docs/ONBOARDING_GUIDE.md`, `docs/DEVELOPMENT_GUIDE.md`, and `docs/TROUBLESHOOTING_GUIDE.md`.

## E2E: Playwright MCP (instalasi lokal)

Browser-visible acceptance flows run through the Playwright MCP against local `bun run dev`
(`http://localhost:3000`).

- Requirement: Node.js 20 or newer ([playwright.dev/mcp/installation](https://playwright.dev/mcp/installation)).
  Optional: add `--headless` after `@playwright/mcp@latest`.
- Claude Code:

  ```powershell
  claude mcp add playwright npx @playwright/mcp@latest
  ```

- Codex CLI:

  ```powershell
  codex mcp add playwright npx "@playwright/mcp@latest"
  ```

- Gemini CLI / other MCP clients:

  ```json
  { "mcpServers": { "playwright": { "command": "npx", "args": ["@playwright/mcp@latest"] } } }
  ```

Record E2E evidence under `docs/screenshots/<CARD-ID>/` (screenshots plus observed results).

## Context Recovery Checklist

If context is compacted, re-confirm:

- [ ] This is **Literabit**: Bun + Next.js 16 App Router + PostgreSQL/Drizzle modular monolith.
- [ ] Read `docs/PRD.md`, `docs/ENGINEERING_BASELINE.md`, `docs/api-specs/`, and `docs/TASK_BREAKDOWN*.md` as the source of truth.
- [ ] Every student/parent query filters by verified server-session `parentId` / `studentId` (`NFR-004`).
- [ ] Quiz submit + XP calculation run in one `db.transaction` with `uniqueIndex(student_id, material_id)` on `xp_transactions` (`0 XP` on retake, `NFR-003`).
- [ ] Reading materials use sequential `material_sections` (never one rich-text blob) and CMS publish requires `>= 1` section and `>= 3` questions.
- [ ] Use `getServerEnv()` (never direct `process.env`/`Bun.env` in `src/modules/` or `src/app/`) and `<Suspense>` around request-time dynamic Server Components (`cacheComponents: true`).
- [ ] UI copy is Bahasa Indonesia; reading typography meets `NFR-001` (`>= 18px` `LEVEL_1`, `>= 16px` `LEVEL_2`/`LEVEL_3`, WCAG AA).
- [ ] Run `bun run complete-check` (and `bun run test:integration` for DB/auth/transaction work) before declaring work done.

<!-- antislop:start -->

## antislop

For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):

- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
- People: `antislop-human`: `.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `antislop-code`: `.agents/skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
