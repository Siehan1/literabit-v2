# 01 — Architecture & Layering (Next.js 16)

**Reference:** [../ARCHITECTURE.md](../ARCHITECTURE.md) & [../ENGINEERING_BASELINE.md](../ENGINEERING_BASELINE.md)

---

## 1. Repository & Directory Structure

```text
src/
├── app/
│   ├── (public)/          # Landing / redirect entry
│   ├── auth/              # Login, Register Parent, Logout UI
│   ├── profiles/          # Netflix-style Student Profile Picker
│   ├── student/           # Ruang belajar anak (katalog, reader, quiz, result, progress)
│   ├── parent/            # Dashboard orang tua & kelola profil anak (wajib Parent Gate)
│   ├── admin/             # Lean CMS (kategori, materi, section, bank soal)
│   └── api/v1/            # Route Handlers sesuai kontrak docs/api-specs/
├── db/
│   ├── schema/            # enums.ts, tables.ts, relations.ts
│   ├── schema.ts          # Entrypoint ekspor seluruh skema
│   ├── index.ts           # PostgresJs pool & instance Drizzle
│   ├── migrations.ts      # Helper migrator
│   ├── migrate.ts         # CLI `bun run db:migrate`
│   ├── seed.ts            # Seeder awal
│   └── migrations/        # SQL migrasi Drizzle Kit
├── modules/               # Domain logic (zero UI dependencies)
│   ├── auth/              # schemas.ts, service.ts
│   ├── learning/          # schemas.ts, service.ts
│   ├── assessment/        # schemas.ts, service.ts, rules.ts
│   ├── gamification/      # rules.ts, service.ts
│   └── cms/               # schemas.ts, service.ts
└── lib/
    ├── env.ts             # Zod-validated server env (`getServerEnv()`)
    ├── crypto.ts          # Password & PIN hashing/verification
    ├── session.ts         # Signed HTTP-only cookies (`jose`)
    ├── guards.ts          # Server-side session & ownership assertions
    └── storage.ts         # Validasi URL sampul & ilustrasi bagian
```

---

## 2. Layer Dependency Rules

1. **Presentation (`src/app/`)**: Pages, Client Components, Server Actions, dan Route Handlers hanya memanggil fungsi di `src/modules/` dan `src/lib/`. Dilarang menulis query Drizzle mentah langsung di komponen UI.
2. **Domain (`src/modules/*`)**:
   - `schemas.ts`: Skema Zod bersama (dapat diimpor untuk validasi form client dan validasi server).
   - `service.ts`: Query & mutasi bisnis terisolasi per domain.
   - `rules.ts`: _Pure functions_ deterministik (kalkulasi skor, XP, level, routing rekomendasi).
3. **Cross-Domain Boundary**: `src/modules/assessment` memanggil `src/modules/gamification` di dalam **satu transaksi DB yang sama** saat submit kuis.

---

## 3. Next.js 16 (`cacheComponents: true`) Rules

- `next.config.ts` mengaktifkan `cacheComponents: true` dan `partialPrefetching: true`.
- Seluruh API `cookies()`, `headers()`, `params`, dan `searchParams` bersifat **asinkron (`await`)**.
- Pembacaan cookie/sesi atau data spesifik keluarga bersifat _request-time dynamic_ dan harus berada di dalam `<Suspense>` boundary agar `bun run build` tidak gagal pada tahap prerender.
- Katalog bacaan publik (`PUBLISHED`) dapat dipisahkan dari progres pribadi siswa sehingga katalog dapat di-cache/revalidasi (`revalidateTag`) saat Admin memublikasikan atau mengarsipkan materi.
