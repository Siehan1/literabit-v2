# Coding Standard

## Literabit: Web-Based Reading Comprehension Platform

**Version:** 1.0.0  
**Status:** Enforced  
**Reference:** [GEMINI.md](../GEMINI.md) & [ENGINEERING_BASELINE.md](ENGINEERING_BASELINE.md)

---

## 1. General Principles

1. Baca [PRD.md](PRD.md) dan [ENGINEERING_BASELINE.md](ENGINEERING_BASELINE.md) sebelum merencanakan atau mengubah fitur.
2. Ikuti pemisahan domain (`auth`, `learning`, `assessment`, `gamification`, `cms`) sesuai NFR-005.
3. Jangan membuat duplikasi logika validasi, otorisasi, atau perhitungan XP/level di lebih dari satu tempat.
4. Jaga file produksi tetap ringkas (< 300 baris per file sesuai aturan `max-lines` di `.oxlintrc.json`).

---

## 2. TypeScript Standards

- `tsconfig.json` mengaktifkan `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, dan `verbatimModuleSyntax`.
- **Dilarang** menggunakan `any`, `@ts-ignore`, `@ts-nocheck`, atau non-null assertion (`!`).
- Gunakan `import type` untuk impor tipe.
- Fungsi yang diekspor wajib memiliki **explicit return type** (`typescript/explicit-module-boundary-types`).
- Gunakan `type` daripada `interface` secara konsisten (`typescript/consistent-type-definitions`).
- Gunakan `pgEnum`, string literal union, atau `z.enum(...)`; jangan gunakan TypeScript `enum`.
- Validasi seluruh input eksternal (form, Server Actions, Route Handlers, env) dengan **Zod**.

---

## 3. Next.js 16 App Router Standards

- Selalu cek panduan versi terpasang di `node_modules/next/dist/docs/` sebelum menulis API Next.js baru.
- `cookies()`, `headers()`, `params`, dan `searchParams` bersifat **asinkron (`await`)**.
- Karena `cacheComponents: true` dan `partialPrefetching: true` aktif di `next.config.ts`, komponen yang membaca sesi/cookie request-time wajib dibungkus `<Suspense>` atau ditandai dinamis secara tepat agar `bun run build` tetap bersih.
- Komponen `src/app/` tidak boleh memanggil Drizzle (`db`) secara langsung; delegasikan ke `src/modules/*` dan `src/lib/*`.
- Jangan membaca `process.env` atau `Bun.env` di dalam `src/modules/` atau `src/app/`; gunakan `getServerEnv()` dari `src/lib/env.ts`.

---

## 4. Database Standards (PostgreSQL + Drizzle ORM)

- Seluruh definisi enum, tabel, indeks, dan relasi berada di `src/db/schema/` (diekspor ulang oleh `src/db/schema.ts`).
- Gunakan `pgEnum` untuk seluruh nilai domain tetap (`role`, `difficulty_level`, `material_status`, `skill_category`, `reading_status`).
- Perubahan skema wajib melalui migrasi Drizzle yang dikomit (`bun run db:generate` -> review SQL -> `bun run db:migrate`). Jangan mengubah skema database secara manual.
- **Aturan Isolasi Wajib:** Setiap kueri data anak/orang tua wajib memfilter `parentId` atau `studentId` dari sesi server terverifikasi (`WHERE id = :studentId AND parent_id = :sessionUserId`).
- **Aturan Transaksi Wajib:** Submit kuis, pencatatan `quiz_attempts`, `attempt_answers`, `xp_transactions`, pembaruan `reading_progress`, serta pembaruan `students.total_xp` & `level` wajib berjalan dalam satu `await db.transaction(async (tx) => { ... })`.
- Materi bacaan wajib disimpan per halaman di `material_sections` (bukan satu kolom rich-text besar).

---

## 5. Testing Standards

- Gunakan runner bawaan Bun (`bun:test`).
- Unit test ditempatkan di `test/unit/` atau di dekat modul (`*.test.ts`).
- Integration test yang menyentuh PostgreSQL ditempatkan di `test/integration/` dan wajib melewati guard `assertDisposableTestDatabase()` agar tidak pernah menghapus database development/produksi.
- Aturan bisnis kritis yang wajib diuji: idempotensi XP (`0 XP` saat retake/double-submit), kalkulasi level, guardrail publikasi CMS (`>= 1` section & `>= 3` soal), dan isolasi kepemilikan `parentId`/`studentId`.

---

## 6. Formatting, Linting & Quality Gate

- Formatter: `oxfmt` (`.oxfmtrc.json`)
- Linter: `oxlint` (`.oxlintrc.json`)
- Type checker: `tsc --noEmit`
- Pre-commit hook: Husky + `lint-staged`

Jalankan gerbang lengkap sebelum menganggap pekerjaan selesai atau membuka PR:

```powershell
bun run complete-check
```

---

## 7. Git & Commit Workflow

- Format pesan commit mengikuti **Conventional Commits** (divalidasi oleh `.husky/commit-msg`):
  `<type>(<scope>): <subject>` (maksimal 80 karakter, tanpa trailer `Co-Authored-By:`).
  Tipe yang diizinkan: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`.
- Contoh: `feat(auth): implement parent registration and pin hashing`

---

## 8. Localization & UI Copy

- Seluruh teks UI, pesan error yang tampil ke pengguna, dan konten edukasi menggunakan **Bahasa Indonesia** yang ramah anak/orang tua.
- Identifier kode, nama tabel/kolom DB, dan enum teknis menggunakan **Bahasa Inggris**.
- Ukuran font bacaan mematuhi NFR-001 (`>= 18px` untuk `LEVEL_1`, `>= 16px` untuk `LEVEL_2`/`LEVEL_3`, `line-height >= 1.6`, kontras WCAG AA).
