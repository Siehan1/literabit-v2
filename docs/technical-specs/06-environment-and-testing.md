# 06 — Environment & Testing Strategy

---

## 1. Environment Configuration (`src/lib/env.ts`)

Seluruh variabel server divalidasi menggunakan Zod melalui `getServerEnv()`:

| Variable              | Required        | Default / Local Example                                                      |
| :-------------------- | :-------------- | :--------------------------------------------------------------------------- |
| `APP_ENV`             | Tidak           | `development` (`development` \| `test` \| `production`)                      |
| `APP_VERSION`         | Tidak           | `0.1.0`                                                                      |
| `DATABASE_URL`        | Ya              | `postgres://literabit:local-postgres-password@localhost:5433/literabit`      |
| `TEST_DATABASE_URL`   | Untuk test      | `postgres://literabit:local-postgres-password@localhost:5433/literabit_test` |
| `AUTH_SECRET`         | Ya (>= 32 char) | Lihat `.env.example`                                                         |
| `NEXT_PUBLIC_APP_URL` | Tidak           | `http://localhost:3000`                                                      |

**Aturan:** Feature modules (`src/modules/`) dan UI/routes (`src/app/`) dilarang membaca `process.env` atau `Bun.env` langsung.

---

## 2. Local Database & Test Isolation

- PostgreSQL lokal berjalan via Docker Compose ([../../infra/local/docker-compose.yml](../../infra/local/docker-compose.yml)) pada `127.0.0.1:5433`.
- Database `literabit` untuk development dan `literabit_test` untuk integration tests.
- Script [../../infra/local/prepare-test-db.ts](../../infra/local/prepare-test-db.ts) dan helper [../../test/helpers/disposable-database.ts](../../test/helpers/disposable-database.ts) menolak segala URL non-lokal atau bernama `literabit` / `*prod*` agar database dev/prod tidak pernah terhapus oleh suite test.

---

## 3. Testing Pyramid (`bun:test`)

1. **Unit Tests (`bun run test` -> `test/unit/` & `src/**/\*.test.ts`):\*\*
   - Pure rules: rumus skor, kalkulasi XP first-attempt, `calculateLevel`, rule-based routing, validasi Zod, guard disposable DB.
2. **Integration Tests (`bun run test:integration` -> `test/integration/`):**
   - Dijalankan dengan `RUN_INTEGRATION_TESTS=1` terhadap PostgreSQL `literabit_test`.
   - Wajib mencakup: isolasi query `parentId`/`studentId`, race condition double-submit XP (`0 XP` retake), dan guardrail publikasi CMS (`>= 1` section & `>= 3` soal).
3. **Full Local Gate:**
   ```powershell
   bun run complete-check
   ```
