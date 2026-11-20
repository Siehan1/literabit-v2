# Onboarding Guide

Panduan hari pertama untuk developer yang baru bergabung mengerjakan **Literabit**.

---

## 1. Prasyarat Lokal (Windows PowerShell)

| Tool           | Wajib | Keterangan                                                   |
| :------------- | :---- | :----------------------------------------------------------- |
| Bun (`1.4.2`)  | Ya    | Runtime, package manager, dan test runner (`bun --version`). |
| Docker Desktop | Ya    | Menjalankan PostgreSQL 16 lokal untuk development dan test.  |
| Git            | Ya    | Manajemen branch dan Husky commit hooks.                     |

Rekomendasi ekstensi VS Code:

- `ms-vscode.vscode-typescript-next`
- `bradlc.vscode-tailwindcss`
- `oxc.oxc-vscode` (opsional, untuk integrasi `oxlint`/`oxfmt` di editor)

---

## 2. Langkah Setup Pertama Kali

1. Pastikan Docker Desktop sudah berjalan.
2. Di root repositori, install dependensi:

   ```powershell
   bun install
   ```

3. Salin file environment contoh:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Jalankan database PostgreSQL lokal:

   ```powershell
   bun run infra:up
   ```

5. Generate migrasi awal (jika folder `src/db/migrations/` belum berisi migrasi), jalankan migrasi, lalu seed data awal:

   ```powershell
   bun run db:generate
   bun run db:migrate
   bun run db:seed
   ```

6. Verifikasi seluruh gerbang kualitas lokal:

   ```powershell
   bun run complete-check
   ```

7. Jalankan server development:

   ```powershell
   bun run dev
   ```

---

## 3. Urutan Baca Wajib Sebelum Mulai Coding

1. [PRD.md](PRD.md) — Pahami persona (`Parent`, `Student`, `Admin`), aturan XP & level, serta Acceptance Criteria.
2. [ENGINEERING_BASELINE.md](ENGINEERING_BASELINE.md) — Pahami skema 10 tabel, cookie architecture, dan aturan Next.js 16.
3. [CODING_STANDARD.md](CODING_STANDARD.md) — Pahami aturan TypeScript strict, batas 300 baris, dan isolasi query DB.
4. [TASK_BREAKDOWN.md](TASK_BREAKDOWN.md) — Pilih/kerjakan task sesuai milestone aktif.

---

## 4. Anti-Pattern yang Harus Dihindari Sejak Hari Pertama

- Jangan memakai `npm` atau `npx` untuk proyek ini; gunakan `bun` dan `bunx` agar `bun.lock` tetap sinkron.
- Jangan menulis query `WHERE id = :studentId` tanpa `AND parent_id = :sessionUserId`.
- Jangan menghitung atau menerima nilai `score` atau `xpAwarded` dari client.
- Jangan membaca `process.env` langsung di komponen UI atau service domain; gunakan `getServerEnv()`.
- Jangan mengubah database lokal/bersama secara manual tanpa migrasi Drizzle.
