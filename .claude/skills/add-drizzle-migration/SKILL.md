---
name: add-drizzle-migration
description: Safely change the Literabit PostgreSQL schema with Drizzle ORM.
---

# Add a Literabit Drizzle Migration

Use this skill only for an approved task that changes `src/db/schema/`. Milestone 0 already defines the 5 `pgEnum`s and all 10 MVP tables in `src/db/schema/` (`docs/technical-specs/02-data-model.md`). Do not add or alter tables without an approved card and updated docs.

## Protocol

1. Start from the latest integration branch: `git checkout dev` and `git pull --ff-only origin dev` (then create or update your task branch).
2. Edit schema files under `src/db/schema/` (`enums.ts`, `tables.ts`, `relations.ts`) and confirm exports in `src/db/schema.ts`.
3. Run `bun run db:generate` once per ready PR.
4. Inspect the generated SQL in `src/db/migrations/`; never hand-edit generated migrations and never modify already-applied shared migrations (always use a forward migration).
5. Start local PostgreSQL (`127.0.0.1:5433`) and verify on clean databases:

   ```powershell
   bun run infra:up
   bun run db:migrate
   bun run db:seed
   bun run test:integration
   ```

6. If another PR merged a migration after your branch point, rebase on `origin/dev`, remove only your own unmerged generated migration files and journal entry, regenerate once with `bun run db:generate`, and re-verify.
7. Update `docs/technical-specs/02-data-model.md` (and `docs/ENGINEERING_BASELINE.md` if applicable), then run `bun run complete-check`.

## Literabit Schema Rules

- Use `pgEnum` for fixed domain values (`role`, `difficulty_level`, `material_status`, `skill_category`, `reading_status`).
- Every table needs an explicit UUID primary key, timestamps (`timestamp with timezone`), and indexes aligned with access patterns (especially `parent_id` and `student_id` ownership isolation queries).
- Encode critical invariants in PostgreSQL constraints, not only in application code:
  - `xp_transactions`: `uniqueIndex(student_id, material_id)` for idempotent first-attempt XP (`NFR-003`).
  - `materials.category_id`: `onDelete: "restrict"` so categories with materials cannot be hard-deleted (`AC-014.2`).
  - `material_sections`: `uniqueIndex(material_id, section_index)` — never store reading texts as a single rich-text blob.
  - `reading_progress`: `uniqueIndex(student_id, material_id)`.
  - `attempt_answers`: `uniqueIndex(attempt_id, question_id)`.
- Integration tests touching PostgreSQL must pass `assertDisposableTestDatabase()` (`test/helpers/disposable-database.ts`) so `literabit` development/production databases are never wiped.
- Never run migrations against production from a developer laptop.
