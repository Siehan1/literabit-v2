# Literabit Architecture & Coding Rules

> **Critical:** Do not mark work complete until `bun run complete-check` passes (or blocked checks are explicitly recorded).
> **Source of truth:** Product requirements live in `docs/PRD.md` & `docs/business/`, API contracts in `docs/api-specs/`, technical specifications in `docs/technical-specs/` & `docs/ENGINEERING_BASELINE.md`, implementation standards in `docs/CODING_STANDARD.md`, task cards in `docs/TASK_BREAKDOWN.md`, and documentation index in `docs/_index.md`.

## Tech Stack

- Runtime & Package Manager: Bun (`bun@1.4.2`)
- Framework: Next.js 16 (App Router, `cacheComponents: true`, `partialPrefetching: true`) + TypeScript (Strict Mode)
- Database & ORM: PostgreSQL + Drizzle ORM (`postgres` driver)
- Validation: Zod (shared schemas between client & server)
- Auth & Crypto: `jose` (signed HTTP-only cookies) + `bcryptjs`
- Styling: Tailwind CSS v4 + `shadcn/ui` + `lucide-react`
- Quality Gates: `tsc --noEmit`, `oxlint`, `oxfmt`, `bun test`, `next build`

## Folder Structure

- `src/app/` -> Routing & UI pages (`/auth`, `/profiles`, `/student`, `/parent`, `/admin`)
- `src/db/` -> `index.ts` (db client), `schema.ts` & `schema/` (Drizzle tables, enums & relations), `migrations/`, `migrate.ts`, `seed.ts`
- `src/modules/` -> Domain logic (`auth`, `learning`, `assessment`, `gamification`, `cms`)
- `src/lib/` -> Typed env (`env.ts`), auth helpers, PIN verification, guards, storage utilities
- `infra/local/` -> Local PostgreSQL Docker Compose & test database provisioning
- `test/` -> `unit/` (`bun test`), `integration/`, and `helpers/`
- `docs/` -> Product, architecture, coding standards, onboarding, and task breakdown

## Critical Business & Security Rules

1. Every database query for student or parent data MUST filter by `parentId` or `studentId` verified from the active server session.
2. Quiz submission and XP calculation MUST run inside `await db.transaction(async (tx) => { ... })` with a `uniqueIndex` on `xp_transactions(student_id, material_id)` so retakes always yield 0 XP.
3. Use `pgEnum` for fixed domain values (`role`, `difficulty_level`, `material_status`, `skill_category`, `reading_status`).
4. Never use a single rich-text blob for reading materials; store reading pages sequentially in `material_sections`.
5. Always read `@docs/PRD.md` before planning or implementing any feature.
6. Do not read `process.env` or `Bun.env` directly inside feature modules (`src/modules/` or `src/app/`); use `getServerEnv()` in `src/lib/env.ts` (except config, migration, seed, and test scripts).

## Local Commands (Bun)

```powershell
bun install
bun run infra:up
bun run db:generate
bun run db:migrate
bun run db:seed
bun run dev
bun run complete-check
```
