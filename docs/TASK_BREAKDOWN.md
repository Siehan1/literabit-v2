# Task Breakdown (Shared M0 + Index Track BE & FE)

Dokumen ini menjadi pusat koordinasi tugas:

1. **Milestone 0 (Shared Foundation & Database)** — diselesaikan bersama terlebih dahulu, termasuk **seluruh task Database (`DB-M0-*`)**.
2. **Backend Track (`BE-M1` – `BE-M5`)** — dipisah di [TASK_BREAKDOWN_BE.md](TASK_BREAKDOWN_BE.md).
3. **Frontend Track (`FE-M1` – `FE-M5`)** — dipisah di [TASK_BREAKDOWN_FE.md](TASK_BREAKDOWN_FE.md).

---

## Milestone 0 — Platform, Infrastructure & Database Foundation (Shared)

| Card ID    | Area    | Title                                 | Description                                                                                                                                     | Reference                                                                                      | Status   |
| :--------- | :------ | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- | :------- |
| `M0-01`    | Infra   | Bootstrap Bun & Quality Gates         | Setup Bun, `oxlint`, `oxfmt`, strict `tsconfig.json`, Husky, `lint-staged`, dan CI.                                                             | [CODING_STANDARD.md](CODING_STANDARD.md)                                                       | **Done** |
| `M0-02`    | Infra   | Local PostgreSQL & Test DB Guard      | Docker Compose PostgreSQL 16 (`infra/local/`), `init-test-db.sql`, `prepare-test-db.ts`, guard disposable DB.                                   | [technical-specs/06-environment-and-testing.md](technical-specs/06-environment-and-testing.md) | **Done** |
| `DB-M0-01` | DB      | Drizzle Schema & Client Setup         | Skema `pgEnum` + 10 tabel (`src/db/schema/`), `drizzle.config.ts`, `src/db/index.ts`, `migrate.ts`, `seed.ts`.                                  | [technical-specs/02-data-model.md](technical-specs/02-data-model.md)                           | **Done** |
| `DB-M0-02` | DB      | Initial Migration & Seed Verification | Jalankan `bun run db:generate`, tinjau SQL di `src/db/migrations/`, terapkan `db:migrate` & `db:seed` ke PostgreSQL lokal dan `literabit_test`. | [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)                                                   | **Done** |
| `M0-03`    | BE Base | Server Env, Crypto, Session & Guards  | `src/lib/env.ts`, `crypto.ts`, `session.ts`, `guards.ts`, `storage.ts`, `api-response.ts`, & `GET /api/v1/health`.                              | [technical-specs/04-auth-and-security.md](technical-specs/04-auth-and-security.md)             | **Done** |
| `M0-04`    | FE Base | Setup shadcn/ui, Font & API Client    | Inisialisasi `shadcn/ui`, layout dasar, tipografi ramah baca (`NFR-001`), dan `src/lib/api-client.ts`.                                          | [technical-specs/05-ui-and-a11y.md](technical-specs/05-ui-and-a11y.md)                         | **Done** |

---

## Track Terpisah (Milestone 1 – Milestone 5)

| Track        | File Breakdown                               | Fokus                                                                                                 |
| :----------- | :------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **Backend**  | [TASK_BREAKDOWN_BE.md](TASK_BREAKDOWN_BE.md) | `BE-M1` s.d. `BE-M5` (Modules, Auth/PIN, Route Handlers `/api/v1/*`, Transaksi XP, Integration Tests) |
| **Frontend** | [TASK_BREAKDOWN_FE.md](TASK_BREAKDOWN_FE.md) | `FE-M1` s.d. `FE-M5` (`shadcn/ui` Pages, Reader NFR-001, Drawer Lihat Bacaan, Parent Dashboard, A11y) |
