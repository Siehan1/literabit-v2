---
name: add-shared-schema
description: Add a browser-safe shared Zod contract and DTO type in Literabit without duplicating literals.
---

# Add Shared Schema

Literabit is a single-package Next.js 16 modular monolith. Shared client/server domain contracts live in `src/modules/<domain>/schemas.ts` (consumed by both `src/app/` UI forms and `src/app/api/v1/` Route Handlers + `src/modules/<domain>/service.ts`). Shared API envelope types live in `src/lib/api-response.ts` and `src/lib/api-client.ts`, while database domain enums live in `src/db/schema/enums.ts`.

## Rules

1. Confirm the task card (`docs/TASK_BREAKDOWN*.md`), `docs/PRD.md`, and API contract (`docs/api-specs/`).
2. Keep `src/modules/<domain>/schemas.ts` **strictly browser-safe**: import only `zod` and pure types. Never import Drizzle, `src/db/`, `src/lib/env.ts`, `bcryptjs`, or `jose` into `schemas.ts` so Client Components can safely import it.
3. Align domain literals with `src/db/schema/enums.ts` (`PARENT`/`ADMIN`, `LEVEL_1`–`LEVEL_3`, `DRAFT`/`PUBLISHED`/`ARCHIVED`, `LITERAL`/`INFERENTIAL`/`VOCABULARY`/`MAIN_IDEA`, `NOT_STARTED`/`IN_PROGRESS`/`COMPLETED`). Use string literal unions or `z.enum(...)`, never TypeScript `enum`, and use `type` rather than `interface`.
4. Write clear Bahasa Indonesia validation error messages (see `src/modules/auth/schemas.ts` for the project's Zod v4 `{ error: ... }` style).
5. Add unit tests in `test/unit/` for valid and invalid inputs and boundary cases.
6. Update API handlers and UI consumers together, then run `bun run complete-check`.

Do not duplicate existing literals across files, leak server-only types into client-imported schemas, or introduce unapproved P1/post-MVP fields prematurely.
