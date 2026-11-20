## Task Reference

- Task ID: <!-- e.g. M0-01 or M1-02 -->
- EPIC / User Story: <!-- e.g. EPIC 01 / US-001 -->
- Acceptance Criteria: <!-- e.g. AC-001.1, AC-001.2 -->

## Target Branch

- [ ] `dev` - integration and internal verification
- [ ] `main` - production release

## What Changed

-
-

## Why

<!-- Link relevant docs (PRD.md / ENGINEERING_BASELINE.md / TASK_BREAKDOWN.md). -->

## How to Test

1.
2.

## Impact

- Migration impact: <!-- None, or migration name and forward-fix notes -->
- Environment/config impact: <!-- None, or required variables -->
- Security & isolation impact: <!-- Verify parentId / studentId session isolation if applicable -->
- Documentation updated: <!-- List docs, or N/A with reason -->

## Pre-PR Checklist

- [ ] Scope matches the assigned task and [`docs/PRD.md`](../blob/main/docs/PRD.md).
- [ ] Self-reviewed against [`docs/CODE_REVIEW_CHECKLIST.md`](../blob/main/docs/CODE_REVIEW_CHECKLIST.md).
- [ ] `bun run complete-check` passes locally (or blocked check and reason recorded).
- [ ] Student/parent queries strictly filter by verified session `parentId` / `studentId`.
- [ ] Quiz submission & XP calculation run inside `db.transaction` with `uniqueIndex(student_id, material_id)`.
- [ ] No `.env`, `*.pem`, credentials, or sensitive session secrets are committed or logged.
- [ ] Migration files, if any, were generated cleanly and reviewed.
