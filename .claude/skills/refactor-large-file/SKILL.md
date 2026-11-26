---
name: refactor-large-file
description: Split an oversized Literabit source file under 300 lines without changing behavior.
---

# Refactor a Literabit Large File

`.oxlintrc.json` enforces `max-lines: 300` (excluding blank lines and comments) on production files. Split proactively around 250 lines after confirming responsibilities and callers. Preserve public contracts and keep each extracted module focused.

## Steps

1. Record current behavior and run the existing targeted tests (`bun test ...`).
2. Extract pure helpers (`rules.ts`), Zod schemas (`schemas.ts`), focused UI subcomponents (`src/components/`), or helper functions before altering control flow.
3. Preserve Literabit layer boundaries (`docs/technical-specs/01-architecture-and-layers.md`):
   - Keep pages and Route Handlers thin in `src/app/` (no direct Drizzle calls).
   - Keep reusable UI components in `src/components/`.
   - Keep domain schemas (browser-safe), pure rules, and DB services in `src/modules/<domain>/`.
   - Keep cross-cutting platform utilities in `src/lib/` and Drizzle definitions in `src/db/schema/`.
4. Keep explicit return types on all exported functions and avoid `any`, `@ts-ignore`, or `!`.
5. Update imports and tests together; do not move files solely to mimic another project's folder structure.
6. Run `bun run complete-check` (and `bun run test:integration` when DB/auth boundaries are touched) and inspect the diff for unintended contract or business-rule changes.

Do not expand refactoring into unapproved P1/post-MVP scope (`US-017`–`US-019`).
