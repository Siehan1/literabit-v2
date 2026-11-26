---
name: add-audit-log
description: Record transactional evaluation/activity logs or approved audit records safely in Literabit.
---

# Literabit Transactional Activity & Audit Logging

Literabit MVP (`docs/PRD.md`) does **not** include a generic `audit_logs` table. Do not invent an audit table outside an approved task card and PRD/technical-spec update.

For MVP, historical evaluation and reward accountability is recorded atomically via:

- `quiz_attempts` — every quiz submission (`score`, `correct_count`, `total_questions`, `xp_awarded`, `is_first_attempt`).
- `attempt_answers` — granular per-question log (`attempt_id`, `question_id`, `skill_category`, `selected_option_index`, `is_correct`) supporting P1 analytics (`US-017`).
- `xp_transactions` — idempotent first-attempt XP ledger guarded by `uniqueIndex(student_id, material_id)`.

## Rules for Evaluation Logs & Any Approved Future Audit Table

1. **Same database transaction:** Write activity/evaluation or audit rows inside the exact same `await db.transaction(async (tx) => { ... })` as the business mutation under `src/modules/<domain>/service.ts`. If the mutation rolls back, no log row may remain.
2. **Trusted server context only:** Derive `userId`, `parentId`, `studentId`, `role`, `score`, `isCorrect`, and `xpAwarded` strictly from verified server session cookies (`src/lib/guards.ts`) and server-side database state. Never accept actor, ownership, or calculated evaluation fields from a client body.
3. **Strict redaction:** Never store or log plaintext passwords, 4-digit Parent PINs, `password_hash`, `parent_pin_hash`, `AUTH_SECRET`, or raw session cookie tokens.
4. **Immutable snapshots:** Record `skill_category` and attempt outcomes as point-in-time snapshots so later CMS edits do not corrupt historical accuracy records.
5. **Verification:** Add unit and PostgreSQL integration tests covering success, transaction rollback (no orphan log row), cross-family authorization denial (`NFR-004`), and idempotency/double-submit (`0 XP` on retake, `NFR-003`). Update `docs/technical-specs/02-data-model.md` and `docs/api-specs/` if a new table or field is approved, then run `bun run complete-check`.
