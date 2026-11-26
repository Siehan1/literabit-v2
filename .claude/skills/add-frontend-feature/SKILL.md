---
name: add-frontend-feature
description: Build a Next.js 16 App Router feature in Literabit with real API-backed behavior and child-friendly accessibility.
---

# Add a Literabit Frontend Feature

Literabit uses Next.js 16 (App Router with `cacheComponents: true` and `partialPrefetching: true`), React 19, TypeScript (strict), Tailwind CSS v4, `shadcn/ui`, `lucide-react`, and Zod.

## Structure & Boundaries

- Routes and pages live under `src/app/`:
  - `/auth/*` — Login, Parent Registration
  - `/profiles` — Netflix-style Student Profile Picker
  - `/student/*` — Catalog, Guided Section Reader (`/student/materials/[slug]`), Quiz, Result, Progress
  - `/parent/*` — Parent Dashboard, Evaluation Summary, Manage Child Profiles (protected by Parent PIN Gate)
  - `/admin/*` — Lean CMS (Categories, Materials, Sequential Sections, Question Bank)
- Reusable UI primitives live in `src/components/ui/` (`shadcn/ui`) and shared feature components in `src/components/`.
- Client API requests go through `apiFetch` in `src/lib/api-client.ts` (never scatter untyped raw `fetch` error handling).
- Reuse browser-safe Zod validation schemas from `src/modules/<domain>/schemas.ts` instead of duplicating validation rules.
- **Strict boundary rules:** Never import Drizzle (`src/db/`) or read `process.env` / `Bun.env` inside `src/app/` or `src/components/`.

## Next.js 16 & Domain Rules

1. Read `node_modules/next/dist/docs/` before using unfamiliar Next.js 16 APIs.
2. Always `await` async request APIs (`cookies()`, `headers()`, `params`, `searchParams`).
3. Wrap Server Components that read request-time session cookies or family-specific data in `<Suspense>` boundaries so `bun run build` passes with `cacheComponents: true`.
4. Use **Bahasa Indonesia** copy that is warm, clear, and appropriate for children (aged 6–12) and parents. Never invent out-of-scope features (no audio narration, placement test, or P1 backlog widgets unless assigned).
5. Never fake persistence, authorization, scoring, or XP calculation in the browser; always rely on `/api/v1/*` responses.

## Workflow

1. Read `docs/PRD.md`, the assigned card in `docs/TASK_BREAKDOWN_FE.md`, `docs/technical-specs/05-ui-and-a11y.md`, and the matching contract in `docs/api-specs/`.
2. Inspect `src/app/layout.tsx`, `src/app/globals.css`, `src/components/ui/`, and `src/lib/api-client.ts` before adding components or tokens.
3. Implement `loading`, `empty`, `error` (with retry action), `disabled`, `success`, keyboard navigation, and mobile-to-desktop responsive (`320px+`, `NFR-002`) states.
4. Enforce Literabit reader and quiz UX contracts where applicable:
   - Typography (`NFR-001`): use `.reading-prose` (`>= 18px`, `line-height >= 1.65`, `65ch`) for `LEVEL_1` and `.reading-prose-standard` (`>= 16px`, `line-height >= 1.6`, `65ch`) for `LEVEL_2`/`LEVEL_3`, with WCAG AA contrast (`>= 4.5:1`).
   - Quiz unlock (`AC-006.4`): keep **"Mulai Kuis Pemahaman"** disabled until the student reaches the final section or the material is already `COMPLETED`.
   - Reference drawer (`AC-007.2`): **"Lihat Bacaan"** must be a slide-over/drawer on desktop and full-height sheet on mobile, and opening/closing it must never reset selected quiz answers.
   - Quiz validation (`AC-007.3`): block submission if any question is unanswered and highlight missing question numbers.
5. Add tests covering acceptance criteria and run `bun run complete-check`.

## Checklist

- [ ] Route has meaningful metadata/title and honors route guards (`/auth`, `/profiles`, `/student`, `/parent` + Parent Gate, `/admin`).
- [ ] `cookies()` / `headers()` / `params` / `searchParams` are awaited and dynamic session reads sit inside `<Suspense>`.
- [ ] API errors display clear Bahasa Indonesia feedback via `ApiClientError` without leaking server internals.
- [ ] Primary actions are keyboard accessible, have visible focus rings, and stay disabled while pending.
- [ ] No foreign-project terminology, mock persistence, or production files > 300 lines remain.
