# LITERABIT — Engineering Baseline

- **Referensi PRD:** [PRD.md](./PRD.md) (v0.2 — Lean MVP)
- **Aturan Arsitektur:** [GEMINI.md](../GEMINI.md) & [AGENTS.md](../AGENTS.md)
- **Status:** Baseline Awal Sebelum Implementasi Fitur

Dokumen ini menetapkan fondasi teknis, batasan arsitektur, kontrak data, keamanan sesi, serta standar kualitas implementasi yang harus diikuti oleh seluruh perubahan kode pada fase MVP.

---

## 1. Status Repositori Saat Ini & Setup Foundation (Bun + Milestone 0)

### 1.1 Terpasang & Dikonfigurasi Saat Ini (`package.json`)

- **Runtime & Package Manager:** Bun `1.4.2` (`bunfig.toml`, `bun.lock`).
- **Framework:** Next.js `16.4.6` (App Router) dengan `cacheComponents: true` dan `partialPrefetching: true` di `next.config.ts`.
- **Runtime UI:** React `19.3.0`, React DOM `19.3.0`, ikon `lucide-react`.
- **Styling:** Tailwind CSS `4.3.3` via `@tailwindcss/turbopack`.
- **Bahasa & Quality Gates:** TypeScript `^5.9.0` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, path alias `@/*` -> `./src/*`), `oxlint` (`.oxlintrc.json`), `oxfmt` (`.oxfmtrc.json`), serta Husky + `lint-staged`.
- **Database, Validasi & Auth Deps (Milestone 0):** `drizzle-orm`, `postgres`, `drizzle-kit` (`drizzle.config.ts`, kerangka `src/db/`), `zod` (`src/lib/env.ts`), `jose`, dan `bcryptjs`.
- **Testing & Infrastruktur Lokal:** `bun:test` (`test/unit/`, `test/integration/`, `test/helpers/disposable-database.ts`) dan Docker Compose PostgreSQL 16 (`infra/local/docker-compose.yml`).

### 1.2 Kesiapan Milestone 0 Sebelum Masuk Fitur (EPIC 01–06)

1. **UI Components:** `shadcn/ui` terinisialisasi (`components.json`, `src/components/ui/button.tsx`, `src/lib/utils.ts`, serta kelas `.reading-prose` di `src/app/globals.css`).
2. **Auth, Storage & API Envelope Utilities:** `src/lib/crypto.ts`, `src/lib/session.ts`, `src/lib/guards.ts`, `src/lib/storage.ts`, `src/lib/api-response.ts`, `src/lib/api-client.ts`, dan `GET /api/v1/health`.
3. **Database & Environment (`.env` dari `.env.example`):**
   - `DATABASE_URL` — Connection string PostgreSQL (`postgres://literabit:local-postgres-password@localhost:5433/literabit`).
   - `TEST_DATABASE_URL` — Connection string disposable database uji (`postgres://literabit:local-postgres-password@localhost:5433/literabit_test`).
   - `AUTH_SECRET` — Secret minimal 32 karakter untuk menandatangani cookie sesi, student picker, dan Parent Gate.

---

## 2. Arsitektur Aplikasi & Konvensi Next.js 16

### 2.1 Struktur Direktori Baku

Mengacu pada `GEMINI.md` dan NFR-005 (pemisahan domain):

```text
src/
├── app/                        # Routing & UI pages (Server/Client Components, Route Handlers)
│   ├── (public)/               # Landing / redirect entry
│   ├── auth/                   # Login, Register Parent, Logout
│   ├── profiles/               # Netflix-style Student Profile Picker (atau /student/profiles)
│   ├── student/                # Ruang belajar anak (katalog, reader, quiz, result, progress)
│   ├── parent/                 # Dashboard orang tua & kelola profil anak (wajib Parent Gate)
│   └── admin/                  # Lean CMS (kategori, materi, section, bank soal)
├── db/
│   ├── schema/                 # Pemisahan enums.ts, tables.ts, relations.ts (diekspor oleh schema.ts)
│   ├── index.ts                # Pool postgres & instance drizzle(client, { schema })
│   ├── schema.ts               # Entrypoint ekspor seluruh pgEnum, pgTable, index, uniqueIndex, relations
│   ├── migrations.ts           # Helper migrator Drizzle
│   ├── migrate.ts              # CLI entrypoint `bun run db:migrate`
│   ├── seed.ts                 # Seeder awal (Admin default & kategori contoh)
│   └── migrations/             # Output migrasi Drizzle Kit (`bun run db:generate`)
├── modules/                    # Logika bisnis per domain (tanpa ketergantungan UI)
│   ├── auth/                   # Register, login, profile switch, parent gate verification
│   ├── learning/               # Katalog published, pembacaan section, simpan reading progress
│   ├── assessment/             # Pengambilan soal quiz, submit & grading, attempt history
│   ├── gamification/           # Kalkulasi XP first-attempt, level threshold, statistik profil
│   └── cms/                    # CRUD kategori, materi, sections, questions + publish guardrail
└── lib/
    ├── env.ts                  # Validasi Zod untuk server environment variables
    ├── session.ts              # Baca/tulis/hapus signed HTTP-only cookies
    ├── crypto.ts               # Password & 4-digit PIN hashing/verification
    ├── guards.ts               # Server-side session & ownership assertions
    └── storage.ts              # Validasi/utilitas URL gambar sampul & ilustrasi bagian
```

### 2.2 Aturan Ketergantungan Antar Lapisan

- `src/app/` (Pages, Server Actions, Route Handlers) **hanya** memanggil fungsi domain di `src/modules/` dan guard di `src/lib/`. Jangan menulis query Drizzle mentah langsung di komponen UI.
- `src/modules/*` berisi:
  - `schemas.ts` — Skema Zod (dipakai bersama oleh form client dan handler server).
  - `service.ts` — Query & mutasi bisnis terisolasi per domain.
  - `rules.ts` (jika perlu) — Pure functions deterministik (mis. rumus XP, level, routing rekomendasi).
- `src/modules/assessment` memanggil `src/modules/gamification` di dalam **satu transaksi DB yang sama** saat submit kuis (lihat Bagian 4.2).

### 2.3 Catatan Khusus Next.js 16 (`cacheComponents: true`)

Karena `next.config.ts` mengaktifkan `cacheComponents: true` dan `partialPrefetching: true`:

- Pembacaan `cookies()`, `headers()`, dan data sesi/user pada Server Component bersifat **request-time dynamic**. Komponen yang mengakses sesi atau data spesifik anak/orang tua harus berada di dalam `<Suspense>` boundary yang jelas (atau dirender dinamis) agar tidak memicu error prerender saat `next build`.
- Data katalog bacaan publik (`PUBLISHED`) dapat dipisahkan dari status progres pribadi siswa agar bagian katalog mudah di-cache/revalidasi (`revalidateTag`) saat Admin memublikasikan atau mengarsipkan materi.
- Seluruh API `cookies()`, `headers()`, `params`, dan `searchParams` bersifat **asinkron (`await`)**.

---

## 3. Baseline Skema Database (PostgreSQL + Drizzle ORM)

Seluruh enum, tabel, dan indeks didefinisikan di `src/db/schema.ts`.

### 3.1 `pgEnum` Domain

| Enum Name          | Values                                                      | Keterangan                                                        |
| :----------------- | :---------------------------------------------------------- | :---------------------------------------------------------------- |
| `role`             | `'PARENT'`, `'ADMIN'`                                       | Role akun login utama. Student adalah sub-profil di bawah Parent. |
| `difficulty_level` | `'LEVEL_1'`, `'LEVEL_2'`, `'LEVEL_3'`                       | Penjenjangan materi & rekomendasi usia (6–8, 9–10, 11–12).        |
| `material_status`  | `'DRAFT'`, `'PUBLISHED'`, `'ARCHIVED'`                      | Siklus hidup materi CMS.                                          |
| `skill_category`   | `'LITERAL'`, `'INFERENTIAL'`, `'VOCABULARY'`, `'MAIN_IDEA'` | Kategori kognitif soal & analitik P1.                             |
| `reading_status`   | `'NOT_STARTED'`, `'IN_PROGRESS'`, `'COMPLETED'`             | Status pengerjaan materi oleh siswa.                              |

### 3.2 Desain Tabel & Relasi Inti

1. **`users`**
   - `id`: `uuid` PK (`defaultRandom()`)
   - `full_name`: `text` NOT NULL
   - `email`: `text` NOT NULL (`uniqueIndex`)
   - `password_hash`: `text` NOT NULL
   - `parent_pin_hash`: `text` NULL (wajib terisi untuk `role = 'PARENT'`, null untuk `'ADMIN'`)
   - `role`: `role` enum NOT NULL (`default('PARENT')`)
   - `created_at`, `updated_at`: `timestamp with timezone`

2. **`students`**
   - `id`: `uuid` PK (`defaultRandom()`)
   - `parent_id`: `uuid` NOT NULL FK -> `users.id` (`onDelete: 'cascade'`)
   - `display_name`: `text` NOT NULL
   - `birth_year`: `integer` NOT NULL (atau `age` — baseline merekomendasikan `birth_year` agar usia tidak basi per tahun, dan dapat menampilkan estimasi umur di UI)
   - `avatar`: `text` NOT NULL (key/identifier avatar)
   - `recommended_level`: `difficulty_level` NOT NULL (`default('LEVEL_1')`)
   - `total_xp`: `integer` NOT NULL (`default(0)`)
   - `level`: `integer` NOT NULL (`default(1)`)
   - `created_at`, `updated_at`: `timestamp with timezone`
   - _Index:_ `index(parent_id)`

3. **`categories`**
   - `id`: `uuid` PK (`defaultRandom()`)
   - `name`: `text` NOT NULL
   - `slug`: `text` NOT NULL (`uniqueIndex`)
   - `description`: `text` NULL
   - `is_active`: `boolean` NOT NULL (`default(true)`)
   - `created_at`, `updated_at`: `timestamp with timezone`

4. **`materials`**
   - `id`: `uuid` PK (`defaultRandom()`)
   - `category_id`: `uuid` NOT NULL FK -> `categories.id` (`onDelete: 'restrict'`) — _mendukung AC-014.2: kategori yang memiliki materi tidak bisa dihapus permanen_
   - `title`: `text` NOT NULL
   - `slug`: `text` NOT NULL (`uniqueIndex`)
   - `difficulty_level`: `difficulty_level` NOT NULL
   - `learning_objective`: `text` NOT NULL
   - `estimated_minutes`: `integer` NOT NULL
   - `cover_image_url`: `text` NULL
   - `status`: `material_status` NOT NULL (`default('DRAFT')`)
   - `published_at`: `timestamp with timezone` NULL
   - `created_at`, `updated_at`: `timestamp with timezone`
   - _Index:_ `index(status, difficulty_level, category_id)`

5. **`material_sections`** (Wajib terpisah per halaman; dilarang satu rich-text blob)
   - `id`: `uuid` PK (`defaultRandom()`)
   - `material_id`: `uuid` NOT NULL FK -> `materials.id` (`onDelete: 'cascade'`)
   - `section_index`: `integer` NOT NULL (0-based atau 1-based konsisten; **baseline: 0-based `0..N-1`**)
   - `content`: `text` NOT NULL
   - `image_url`: `text` NULL
   - _Constraint:_ `uniqueIndex(material_id, section_index)`

6. **`questions`**
   - `id`: `uuid` PK (`defaultRandom()`)
   - `material_id`: `uuid` NOT NULL FK -> `materials.id` (`onDelete: 'cascade'`)
   - `question_order`: `integer` NOT NULL (`default(0)`)
   - `question_text`: `text` NOT NULL
   - `options`: `jsonb` (`$type<string[]>()`) NOT NULL (3–4 opsi jawaban)
   - `correct_option_index`: `integer` NOT NULL (`0 <= idx < options.length`)
   - `explanation`: `text` NOT NULL
   - `skill_category`: `skill_category` NOT NULL
   - _Index:_ `index(material_id, question_order)`

7. **`reading_progress`**
   - `id`: `uuid` PK (`defaultRandom()`)
   - `student_id`: `uuid` NOT NULL FK -> `students.id` (`onDelete: 'cascade'`)
   - `material_id`: `uuid` NOT NULL FK -> `materials.id` (`onDelete: 'cascade'`)
   - `status`: `reading_status` NOT NULL (`default('IN_PROGRESS')`)
   - `last_section_index`: `integer` NOT NULL (`default(0)`)
   - `first_score`: `integer` NULL (skor percobaan pertama, untuk Parent Dashboard AC-013.1)
   - `best_score`: `integer` NULL (skor tertinggi, untuk Student & Parent Dashboard)
   - `attempt_count`: `integer` NOT NULL (`default(0)`)
   - `completed_at`: `timestamp with timezone` NULL
   - `updated_at`: `timestamp with timezone`
   - _Constraint:_ `uniqueIndex(student_id, material_id)`

8. **`quiz_attempts`**
   - `id`: `uuid` PK (`defaultRandom()`)
   - `student_id`: `uuid` NOT NULL FK -> `students.id` (`onDelete: 'cascade'`)
   - `material_id`: `uuid` NOT NULL FK -> `materials.id` (`onDelete: 'cascade'`)
   - `score`: `integer` NOT NULL (`0..100`)
   - `correct_count`: `integer` NOT NULL
   - `total_questions`: `integer` NOT NULL
   - `xp_awarded`: `integer` NOT NULL (`default(0)`)
   - `is_first_attempt`: `boolean` NOT NULL
   - `created_at`: `timestamp with timezone`
   - _Index:_ `index(student_id, created_at)` dan `index(student_id, material_id)`

9. **`attempt_answers`** (Granular Logging untuk P1 US-017)
   - `id`: `uuid` PK (`defaultRandom()`)
   - `attempt_id`: `uuid` NOT NULL FK -> `quiz_attempts.id` (`onDelete: 'cascade'`)
   - `question_id`: `uuid` NOT NULL FK -> `questions.id` (`onDelete: 'cascade'`)
   - `skill_category`: `skill_category` NOT NULL (disimpan sebagai snapshot saat kuis dikerjakan)
   - `selected_option_index`: `integer` NOT NULL
   - `is_correct`: `boolean` NOT NULL
   - _Constraint:_ `uniqueIndex(attempt_id, question_id)`

10. **`xp_transactions`** (Penjamin Idempotensi XP)
    - `id`: `uuid` PK (`defaultRandom()`)
    - `student_id`: `uuid` NOT NULL FK -> `students.id` (`onDelete: 'cascade'`)
    - `material_id`: `uuid` NOT NULL FK -> `materials.id` (`onDelete: 'cascade'`)
    - `attempt_id`: `uuid` NOT NULL FK -> `quiz_attempts.id` (`onDelete: 'cascade'`)
    - `amount`: `integer` NOT NULL
    - `created_at`: `timestamp with timezone`
    - _Constraint Kritis:_ **`uniqueIndex(student_id, material_id)`**

---

## 4. Kontrak Logika Bisnis Inti (Binding Rules)

Seluruh aturan di bawah ini bersifat mengikat di backend (`src/modules/`), bukan hanya di UI:

### 4.1 Perhitungan Skor Kuis

- Setiap pertanyaan memiliki bobot sama:
  $$\text{score} = \text{Math.round}\left(\frac{\text{correctCount}}{\text{totalQuestions}} \times 100\right)$$
- Validasi server wajib memastikan jumlah jawaban yang dikirim sama dengan jumlah soal aktif pada materi tersebut dan setiap `question_id` milik `material_id` terkait (AC-007.3).

### 4.2 Pemberian XP Proporsional & Idempoten (`assessment` + `gamification`)

Seluruh proses submit kuis berjalan dalam **satu `await db.transaction(async (tx) => { ... })`**:

1. Kunci/baca `students` dan validasi `student.parentId === session.userId` serta materi berstatus `PUBLISHED` dan kategorinya `is_active = true`.
2. Hitung `correctCount` dan `score` di server (jangan pernah percaya kalkulasi skor dari client).
3. Cek apakah sudah pernah ada transaksi XP atau percobaan sebelumnya; tentukan kandidat XP:
   - Rumus XP dasar: `(correctCount * 10) + (score >= 70 ? 20 : 0)`.
4. Sisipkan baris `quiz_attempts` terlebih dahulu (`xp_awarded = 0` sementara jika perlu, atau dihitung setelah cek insert `xp_transactions`).
5. Lakukan insert ke `xp_transactions` dengan `onConflictDoNothing({ target: [xpTransactions.studentId, xpTransactions.materialId] }).returning()`:
   - **Jika baris baru berhasil terbuat (First Attempt):**
     - `xpAwarded = (correctCount * 10) + (score >= 70 ? 20 : 0)`
     - Update `quiz_attempts.xp_awarded = xpAwarded` dan `is_first_attempt = true` (jika `xpAwarded === 0` karena semua jawaban salah pada percobaan pertama, baris `xp_transactions` tetap tercatat `amount: 0` sehingga retake berikutnya tetap terkunci `0 XP`!).
     - Update `students.total_xp = total_xp + xpAwarded` secara atomik dan hitung ulang `level`.
   - **Jika terjadi conflict (Retake / double-click race condition):**
     - `xpAwarded = 0`, `is_first_attempt = false`.
     - `students.total_xp` dan `students.level` tidak berubah.
6. Sisipkan seluruh baris `attempt_answers` secara batch.
7. Upsert `reading_progress`:
   - `status = 'COMPLETED'`
   - `attempt_count = attempt_count + 1`
   - `first_score`: set jika `NULL` (percobaan pertama), pertahankan jika sudah ada.
   - `best_score`: `GREATEST(COALESCE(best_score, 0), score)`.
   - `completed_at`: set jika `NULL`.

### 4.3 Aturan Kenaikan Level (Statis di Kode)

Mengacu pada PRD Bagian 2 #2 (`Level 1 mulai dari 0 XP, Level 2 pada 100 XP, Level 3 pada 200 XP, dst.`):

- Ambang batas masuk ke `Level N`: `(N - 1) * 100` XP kumulatif.
- Fungsi deterministik:
  - `calculateLevel(totalXp)`: `Math.floor(Math.max(0, totalXp) / 100) + 1`
  - `xpForNextLevel(level)`: `level * 100`
  - `levelProgressPercent(totalXp)`: `totalXp % 100` (dalam interval 100 XP per level).

### 4.4 Rekomendasi Langkah Berikutnya (Rule-Based Routing)

| Rentang Skor        | Pesan & Aksi Utama                                        |
| :------------------ | :-------------------------------------------------------- |
| `score < 60`        | _"Baca Ulang Materi / Coba Bacaan Lain di Tingkat Ini"_   |
| `60 <= score <= 79` | _"Ulangi Kuis untuk Latihan"_ atau _"Kembali ke Katalog"_ |
| `score >= 80`       | _"Lanjut ke Bacaan Berikutnya"_                           |

### 4.5 Guardrail CMS (Admin)

- **Publikasi Materi (`DRAFT` / `ARCHIVED` -> `PUBLISHED`):** Server wajib memverifikasi `count(material_sections) >= 1` dan `count(questions) >= 3`. Jika gagal, kembalikan error validasi terstruktur (`422` / action error) dengan rincian kekurangan.
- **Penghapusan Kategori:** Jika kategori masih dirujuk oleh minimal 1 baris di `materials`, tolak penghapusan permanen dan arahkan untuk menonaktifkan (`is_active = false`).

---

## 5. Model Autentikasi, Sesi & Keamanan Data Anak

### 5.1 Cookie Architecture (Signed HTTP-Only Cookies)

Semua cookie wajib menggunakan atribut `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`, `secure: process.env.NODE_ENV === 'production'`, dan ditandatangani dengan `AUTH_SECRET`.

1. **`literabit_session`**
   - Payload: `{ userId, role, exp }` (`PARENT` atau `ADMIN`).
   - Masa berlaku: mis. 7 hari.
2. **`literabit_student`**
   - Payload: `{ studentId, parentId, exp }`.
   - Di-set ketika `PARENT` memilih kartu profil anak di `/profiles`.
   - Setiap request ke `/student/*` wajib memverifikasi bahwa `student.parentId === session.userId` di server (dan `studentId` masih ada di tabel `students`).
3. **`literabit_parent_gate`**
   - Payload: `{ userId, verifiedAt, exp }`.
   - Masa berlaku pendek (mis. **15 menit**).
   - Diterbitkan hanya setelah verifikasi **4-digit Parent PIN** terhadap `users.parent_pin_hash`.
   - Logout menghapus ketiga cookie secara serentak.

### 5.2 Matriks Otorisasi Rute

| Prefix Rute  | Syarat Sesi Wajib                                                                 | Perilaku Jika Tidak Memenuhi                                                                                        |
| :----------- | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| `/auth/*`    | Publik (redirect jika sudah login)                                                | —                                                                                                                   |
| `/profiles`  | `session.role === 'PARENT'`                                                       | Redirect `/auth/login` (atau `/admin` jika `ADMIN`). Untuk ganti profil dari `/student`, wajib `parent_gate` valid. |
| `/student/*` | `session.role === 'PARENT'` + `active_student` tervalidasi milik `session.userId` | Redirect `/auth/login` atau `/profiles`.                                                                            |
| `/parent/*`  | `session.role === 'PARENT'` + `parent_gate` aktif & belum expired                 | Redirect/tampilkan modal **Parent PIN Gate** sebelum merender data `/parent`.                                       |
| `/admin/*`   | `session.role === 'ADMIN'`                                                        | Redirect `/auth/login` atau `403 Forbidden`.                                                                        |

### 5.3 Aturan Isolasi Query Database (NFR-004 & GEMINI.md #1)

- **Dilarang keras** melakukan `WHERE id = :studentId` tanpa menyertakan `AND parent_id = :sessionUserId`.
- **Dilarang keras** melakukan mutasi `reading_progress`, `quiz_attempts`, atau profil anak berdasarkan `studentId` yang dikirim dari body/query client; `studentId` untuk ruang belajar anak **selalu** diambil dari signed session/cookie terverifikasi (`requireStudentSession()`).
- Pada `/parent`, saat memilih anak via _student switcher_, query tetap memfilter `WHERE id = :requestedStudentId AND parent_id = :sessionUserId`.

---

## 6. Kontrak Validasi & Penanganan Error (Zod)

Semua input form, Server Actions, dan API Routes divalidasi dengan skema Zod di `src/modules/<domain>/schemas.ts`:

- **Registrasi Parent (US-001):**
  - `fullName`: string min 2 karakter, trimmed.
  - `email`: valid email, normalized lowercase.
  - `password`: string min 8 karakter.
  - `parentPin`: regex `/^\d{4}$/` (tepat 4 digit angka).
- **Profil Anak (US-003):**
  - `displayName`: string min 1–40 karakter.
  - `birthYear`: integer dalam rentang wajar (mis. `tahunSekarang - 18` s.d. `tahunSekarang - 4`).
  - `avatar`: enum/whitelist identifier avatar yang tersedia.
  - `recommendedLevel`: `z.enum(['LEVEL_1', 'LEVEL_2', 'LEVEL_3'])`.
- **Pertanyaan Kuis (US-016):**
  - `options`: `z.array(z.string().trim().min(1)).min(3).max(4)`.
  - `correctOptionIndex`: integer `>= 0` dan `< options.length` (via `.refine()`).
  - `explanation`: `z.string().trim().min(1)`.
  - `skillCategory`: `z.enum(['LITERAL', 'INFERENTIAL', 'VOCABULARY', 'MAIN_IDEA'])`.

---

## 7. Standar UI/UX & Aksesibilitas (NFR-001 & NFR-002)

1. **Tipografi Pembaca (`LEVEL_1` vs `LEVEL_2`/`LEVEL_3`):**
   - `LEVEL_1`: ukuran teks bacaan minimal **`18px`** (`text-lg` atau lebih besar), `leading-relaxed` / `line-height >= 1.6`.
   - `LEVEL_2` & `LEVEL_3`: ukuran teks bacaan minimal **`16px`** (`text-base`), `line-height >= 1.6`.
   - Panjang baris bacaan dibatasi (`max-w-prose` / ~65ch) agar nyaman dibaca anak di desktop maupun tablet.
2. **Kontras & Keterbacaan:** Seluruh kombinasi warna teks dan latar memenuhi rasio kontras **WCAG AA** (`>= 4.5:1` untuk teks normal).
3. **Referensi Teks Saat Kuis (AC-007.2):** Modal/drawer **"Lihat Bacaan"** wajib tersedia di layar kuis dan responsif (slide-over/drawer di desktop, full-height sheet/modal di mobile) tanpa menghapus jawaban kuis yang sedang dipilih anak.
4. **Tombol Mulai Kuis (AC-006.4):** Tetap `disabled` hingga anak mencapai `section_index === totalSections - 1` (atau status materi sudah pernah selesai/mencapai akhir).

---

## 8. Tahapan Eksekusi Implementasi yang Direkomendasikan

Agar pengembangan tetap terstruktur dan mudah diverifikasi per milestone:

1. **Milestone 0 — Platform & Database Foundation:**
   - [x] Setup Bun (`bunfig.toml`, `bun.lock`), `oxlint`, `oxfmt`, Husky + `lint-staged`, Docker Compose PostgreSQL (`infra/local/`), dan GitHub Actions CI.
   - [x] Install `drizzle-orm`, `postgres`, `drizzle-kit`, `zod`, `jose`, `bcryptjs`, `lucide-react` serta buat `src/db/schema.ts` (`src/db/schema/*`), `src/db/index.ts`, `drizzle.config.ts`, `src/db/migrate.ts`, `src/db/seed.ts`, migrasi SQL awal (`src/db/migrations/`), dan `src/lib/env.ts`.
   - [x] Setup `shadcn/ui`, `src/lib/crypto.ts`, `src/lib/session.ts`, `src/lib/guards.ts`, `src/lib/storage.ts`, `src/lib/api-response.ts`, `src/lib/api-client.ts`, dan `GET /api/v1/health`.
2. **Milestone 1 — Auth, Family Profile & Parent Gate (EPIC 01):**
   - Register Parent, Login Parent/Admin, Logout.
   - Netflix-style Profile Picker (`/profiles`) + CRUD profil anak (`/parent/profiles`).
   - Parent PIN Gate (`/parent/gate` / middleware guard).
3. **Milestone 2 — Lean Admin CMS (EPIC 06):**
   - Kelola Kategori (create, edit, toggle `is_active`, proteksi hapus).
   - Kelola Materi & `material_sections` berurutan + `questions` (3–4 opsi, `skill_category`, `explanation`).
   - Guardrail status `PUBLISHED` (`>= 1` section & `>= 3` questions).
4. **Milestone 3 — Student Catalog & Guided Reader (EPIC 02):**
   - Katalog materi `PUBLISHED` + kategori aktif, filter level & kategori, badge status (`NOT_STARTED`/`IN_PROGRESS`/`COMPLETED`).
   - Reader per section dengan `learning_objective`, tipografi NFR-001, simpan `last_section_index`, dan buka kunci tombol kuis di akhir bacaan.
5. **Milestone 4 — Quiz, Granular Logging, XP Idempoten & Leveling (EPIC 03 & EPIC 04):**
   - Layar kuis + modal referensi **"Lihat Bacaan"** + validasi semua soal terjawab.
   - Transaksi submit kuis (`quiz_attempts`, `attempt_answers`, `xp_transactions` unique, update `reading_progress`, update `students.total_xp` & `level`).
   - Layar hasil: skor, pembahasan tiap soal, indikator naik level, dan tombol rekomendasi berbasis skor (`<60%`, `60–79%`, `>=80%`), serta dukungan _retake_ (`0 XP`).
   - Halaman ringkasan progres & riwayat siswa.
6. **Milestone 5 — Parent Dashboard & Hardening (EPIC 05 + Verifikasi):**
   - Student switcher, ringkasan aktivitas membaca, log kuis, skor percobaan pertama vs skor terbaik, dan penanda _"Perlu Pendampingan / Baca Ulang"_ untuk `best_score < 60%`.
   - Verifikasi akhir: `bun run complete-check` (`type-check`, `lint`, `fmt`, `test`, `build`), serta uji isolasi data antar-keluarga dan idempotensi XP.

---

## 9. Definition of Done (Checklist Sebelum Rilis MVP)

- [ ] Seluruh query student/parent terikat `parentId` / `studentId` dari sesi server terverifikasi.
- [ ] Submit kuis + kalkulasi XP berjalan dalam `db.transaction` dengan `uniqueIndex(student_id, material_id)` pada `xp_transactions`.
- [ ] Double-submit atau retake kuis terbukti menghasilkan `0 XP` tambahan.
- [ ] Materi tidak bisa dipublikasikan jika `< 1` section atau `< 3` soal.
- [ ] `bun run complete-check` (`tsc --noEmit`, `oxlint .`, `oxfmt --check .`, `bun test`, `next build`) lolos tanpa error.
