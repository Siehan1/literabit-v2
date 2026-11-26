---
name: Start Task Safely
description: Analyze a Literabit request, verify Git state, and define the task before implementation
---

# Start Task Safely

Use this workflow before implementing any developer request, especially when the request is vague, contains only a task sentence, or includes a design/screenshot reference.

## 1. Understand the Request

1. Read `CLAUDE.md`, `GEMINI.md`, `AGENTS.md`, and `docs/PRD.md`, and classify whether the request is a bug, feature, refactor, documentation, infrastructure, or review task.
2. Locate the matching approved user story (`US-001`–`US-016`), acceptance criteria (`AC-*`, `NFR-*`), API spec (`docs/api-specs/`), technical spec (`docs/technical-specs/`), and task row in `docs/TASK_BREAKDOWN.md`, `docs/TASK_BREAKDOWN_BE.md`, or `docs/TASK_BREAKDOWN_FE.md`.
3. For Frontend work with a Figma link or screenshot, inspect the supplied design first. Record screens, responsive behavior (`NFR-002`), reader/quiz accessibility (`NFR-001`, `AC-006.4`, `AC-007.2`), UI states, Bahasa Indonesia copy, and required `/api/v1/*` contracts.
4. For Backend work, trace the `/api/v1/*` contract, 10-table Drizzle schema (`src/db/schema/`), session & `parentId`/`studentId` ownership isolation, Parent PIN Gate, `db.transaction` / XP idempotency, CMS guardrails, and dependent Frontend behavior before proposing implementation.
5. If no approved card exists (or the request touches P1 backlog `US-017`–`US-019` or resolved out-of-scope decisions in `docs/PRD.md` Section 6), produce a proposed card with scope, AC, dependencies, files, and verification plan. Do not silently invent an official Task ID or implement out-of-scope features.

## 2. Verify Git State Before Coding

Run read-only checks first:

```powershell
git status --short --branch
git branch --show-current
git log -1 --oneline --decorate
git remote -v
```

Then:

1. Confirm the current branch matches the task. Implementation must not happen directly on `dev` or `main`.
2. If an `origin` remote and upstream exist, fetch/prune and compare the branch with its upstream and `origin/dev`. If there is no remote, no commit, or no upstream, state that freshness cannot be verified; never claim the branch is current.
3. If the developer forgot to switch branches and the worktree is clean, create/switch to the correctly named task branch. If the worktree is dirty, do not switch, stash, reset, or discard; report the files and ask for direction.
4. If the branch is behind or diverged, stop and report the exact relationship. Do not silently merge, rebase, or resolve conflicts.

## 3. Branch Naming

Use the Task/Card ID followed by a short imperative kebab-case title (aligned with `docs/DEVELOPMENT_GUIDE.md` and `docs/TASK_BREAKDOWN*.md`):

```text
M0-01-Setup-bun-foundation
DB-M0-01-Setup-drizzle-schema
BE-M1-02-Implement-login-logout
BE-M4-01-Implement-idempotent-xp-quiz
FE-M3-02-Build-guided-section-reader
```

Start the branch name with the exact Card ID (`M0-*`, `DB-M0-*`, `BE-M*`, or `FE-M*`). Use ASCII letters, numbers, and hyphens only. Do not use `feature/`, `fix/`, or arbitrary prefixes unless the repository owner explicitly adopts that convention.

## 4. Analysis Handoff

Before writing implementation code, report:

- Current branch, remote/upstream freshness, and any dirty files.
- Task ID, track (`Shared`/`DB`/`BE`/`FE`), User Story, AC/NFR, and intended branch name.
- Relevant design/API/data/security dependencies and affected flow.
- Planned files and unit/integration tests.
- Risks, open decisions, and whether implementation is blocked.

Proceed only when the request is scoped and the Git state is safe. Use `.claude/commands/commit-and-push.md` for the later commit/push gate.
