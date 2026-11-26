---
name: git-commit
description: Create a scoped Literabit commit only after verification, staged-diff review, and the project safety gate.
---

# Skill: git-commit

## When to Use

Use only after a developer explicitly asks to commit, the assigned Literabit task is complete, and the relevant verification is ready to run. For a push request, also read `.claude/commands/commit-and-push.md` and complete its pre-push gate.

## Required Pre-Commit Checks

1. Read `CLAUDE.md` / `GEMINI.md`, the assigned task card (`docs/TASK_BREAKDOWN*.md`), and linked documentation.
2. Inspect the worktree and focused changes:

   ```powershell
   git status --short
   git diff --stat
   git diff --check
   ```

3. Stop if changes are outside the requested scope, belong to another developer, or cannot be explained. Never stage every file blindly.
4. Confirm the current branch is not `dev` or `main`.
5. Stage only the intended files with explicit paths, then inspect the exact staged diff:

   ```powershell
   git add src/modules/auth src/app/api/v1/auth/register
   git add test/unit/auth-register.test.ts
   git diff --cached --stat
   git diff --cached --check
   git diff --cached
   ```

6. Ensure no `.env`, `*.pem`, `AUTH_SECRET`, password/PIN hashes, raw session cookies, `.next/` build output, or unrelated lockfile changes are staged.
7. Run the relevant gate:
   - Code, configuration, schema, or infrastructure: `bun run complete-check`.
   - Documentation-only change: `bun run fmt`.
   - Database, auth, or transaction changes: also run `bun run test:integration` when local PostgreSQL is available.
8. For a migration, confirm it was generated after syncing with `dev` and reviewed under `src/db/migrations/`.

## Commit Message

Use Conventional Commits (enforced by `.husky/commit-msg`):

```text
<type>(<scope>): <subject>
```

Allowed types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`.

Rules:

- Use imperative English and a concise subject.
- Use lowercase ASCII letters, digits, or hyphens for `<scope>`, such as `auth`, `profiles`, `learning`, `assessment`, `gamification`, `cms`, `parent`, `student`, `db`, `ui`, `foundation`, `ci`, `docs`, or `agents`.
- Keep the first line to **80 characters or fewer** (enforced by `.husky/commit-msg`).
- Include the task ID if helpful while staying within 80 characters.
- **Never** add `Co-Authored-By:` trailers (blocked by `.husky/commit-msg`).

Examples:

```text
feat(auth): implement parent registration and pin hashing
feat(assessment): add transactional quiz submit with idempotent xp
fix(learning): unlock quiz button on final reading section
docs(api-specs): clarify parent dashboard response fields
chore(ci): run next typegen before tsc type-check
```

## Commit and Verify

```powershell
git commit -m "feat(auth): implement parent registration and pin hashing"
git show --stat --oneline HEAD
```

Report the commit hash, message, branch, staged scope, and verification evidence. Do not push unless the developer explicitly requested a push; if they did, continue with `.claude/commands/commit-and-push.md`.

## Stop Conditions

- A verification command fails or is blocked.
- A migration under `src/db/migrations/` is unreviewed or stale against `dev`.
- A sensitive file or secret appears in the staged diff.
- The current branch is `dev` or `main`, the diff has unrelated work, or a conflict is present.
- A requested push is rejected or the remote branch has diverged.
