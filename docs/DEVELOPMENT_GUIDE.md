# Development Guide

## 1. Local Development Workflow

1. Salin `.env.example` menjadi `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Install seluruh dependensi dengan Bun:

   ```powershell
   bun install
   ```

3. Nyalakan PostgreSQL lokal & siapkan `literabit_test`:

   ```powershell
   bun run infra:up
   ```

4. Generate migrasi (jika ada perubahan skema), jalankan migrasi, lalu isi seed awal:

   ```powershell
   bun run db:generate
   bun run db:migrate
   bun run db:seed
   ```

5. Jalankan server pengembangan Next.js:

   ```powershell
   bun run dev
   ```

6. Sebelum commit atau membuka PR, jalankan seluruh gerbang kualitas:

   ```powershell
   bun run complete-check
   ```

---

## 2. Branch & Commit Workflow

- Buat branch fitur/tugas dari `dev` menggunakan penamaan terstruktur, misalnya:
  - `M0-01-Setup-bun-foundation`
  - `M1-01-Implement-parent-auth-and-pin`
  - `M4-02-Implement-idempotent-xp-quiz`
- Pesan commit wajib mengikuti **Conventional Commits** (`feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`, `chore(scope): ...`, maks 80 karakter, tanpa `Co-Authored-By`).
- Jangan push langsung ke `dev` atau `main`; ajukan melalui PR dengan checklist [`CODE_REVIEW_CHECKLIST.md`](CODE_REVIEW_CHECKLIST.md).

---

## 3. Database & Migration Workflow

1. Ubah skema Drizzle hanya di `src/db/schema/` (dan pastikan diekspor dari `src/db/schema.ts`).
2. Rebase branch terhadap target branch (`dev`), lalu jalankan `bun run db:generate`.
3. Periksa file SQL yang dihasilkan di `src/db/migrations/` sebelum dikomit.
4. Uji penerapan migrasi di database bersih (`bun run db:migrate` dan `bun run db:test:prepare`).
5. Migrasi yang sudah dibagikan/diterapkan bersifat _immutable_; gunakan migrasi baru (_forward fix_) jika perlu koreksi.

---

## 4. Infrastructure Commands

- `bun run infra:up` — Menjalankan container PostgreSQL 16 (`literabit-postgres`) dan memastikan database `literabit_test` siap.
- `bun run infra:down` — Menghentikan container tanpa menghapus named volume `literabit_postgres_data`.
- `bun run db:studio` — Membuka Drizzle Studio pada `127.0.0.1` untuk inspeksi data lokal.

---

## 5. Recommended Reading Order

1. [../README.md](../README.md)
2. [PRD.md](PRD.md)
3. [ENGINEERING_BASELINE.md](ENGINEERING_BASELINE.md)
4. [ARCHITECTURE.md](ARCHITECTURE.md)
5. [CODING_STANDARD.md](CODING_STANDARD.md)
6. [TASK_BREAKDOWN.md](TASK_BREAKDOWN.md)
