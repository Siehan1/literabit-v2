# Troubleshooting Guide

Panduan diagnosis cepat untuk kendala umum pada **Bun**, **Docker PostgreSQL**, **Drizzle ORM**, **Next.js 16**, dan **Quality Gates** di Windows PowerShell.

---

## 1. Bun & Dependency Issues

### `bun install` gagal atau lockfile tidak sinkron

- **Penyebab:** Sisa `node_modules` dari `npm` atau jaringan terputus.
- **Solusi:**
  ```powershell
  bun install --frozen-lockfile
  ```
  Jika masih bermasalah akibat sisa instalasi lama, hapus `node_modules` lalu jalankan `bun install`.

---

## 2. Docker & PostgreSQL Issues

### `bun run infra:up` gagal terhubung ke Docker

- **Penyebab:** Docker Desktop belum berjalan.
- **Solusi:** Jalankan Docker Desktop terlebih dahulu, tunggu hingga engine ready, lalu jalankan ulang `bun run infra:up`.

### Port `5433` bentrok dengan PostgreSQL lain

- **Penyebab:** Ada service atau container lain yang memakai port `5433`.
- **Solusi:** Cek container aktif dengan `docker ps` atau service Windows. Hentikan instance lain yang tidak dipakai, lalu jalankan ulang `bun run infra:up`.

### `db:test:prepare` menolak URL database

- **Penyebab:** `assertDisposableTestDatabase` menolak URL yang bukan database test lokal (`*_test` / `test_*` di `localhost`/`127.0.0.1`).
- **Solusi:** Pastikan `TEST_DATABASE_URL` di `.env` mengarah ke `localhost:5433/literabit_test`, bukan ke `literabit` atau host remote.

---

## 3. Drizzle & Migration Issues

### `DATABASE_URL is required for Drizzle commands`

- **Penyebab:** File `.env` belum dibuat dari `.env.example` atau dijalankan tanpa flag `--env-file=.env`.
- **Solusi:** Jalankan `Copy-Item .env.example .env` dan pastikan seluruh perintah DB dijalankan lewat skrip `bun run db:*`.

### `bun run db:migrate` menampilkan "No Drizzle migrations found yet"

- **Penyebab:** Skema sudah ada di `src/db/schema/`, tetapi file SQL migrasi belum di-generate.
- **Solusi:** Jalankan `bun run db:generate` terlebih dahulu, periksa hasil SQL di `src/db/migrations/`, lalu jalankan `bun run db:migrate`.

---

## 4. Next.js 16 (`cacheComponents: true`) Issues

### Error prerender terkait `cookies()` / `headers()` saat `bun run build`

- **Penyebab:** Membaca data dinamis per-request di Server Component tanpa `<Suspense>` boundary.
- **Solusi:** Bungkus komponen yang mengakses sesi/cookie dengan `<Suspense>` atau baca panduan `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`.

---

## 5. Quality Gates (`oxlint`, `oxfmt`, `tsc`)

### `oxlint` gagal karena `Missing return type on function` atau `max-lines`

- **Solusi:** Tambahkan _explicit return type_ pada semua fungsi yang diekspor (mis. `: React.JSX.Element`, `: Promise<void>`), atau pecah file yang mendekati 300 baris menjadi helper kecil.

### `oxfmt --check .` gagal sebelum commit

- **Solusi:** Jalankan `bun run fmt:fix` lalu stage ulang file yang berubah.
