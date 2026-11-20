# Code Review Checklist

Gunakan checklist ini untuk self-review sebelum membuka PR dan saat meninjau perubahan kode di Literabit.

---

## 1. Scope & Product Alignment

- [ ] Perubahan sesuai dengan user story / acceptance criteria di [PRD.md](PRD.md) dan tidak menambah _scope creep_ di luar keputusan produk.
- [ ] Tugas terkait diperbarui status/referensinya bila relevan dengan [TASK_BREAKDOWN.md](TASK_BREAKDOWN.md).

## 2. Security, Privacy & Session Isolation (NFR-004)

- [ ] Seluruh query database untuk data `students`, `reading_progress`, `quiz_attempts`, atau `xp_transactions` memfilter `parentId` / `studentId` yang berasal dari sesi server terverifikasi (`literabit_session` / `literabit_student`).
- [ ] Tidak ada endpoint atau Server Action yang mempercayai `studentId`, `parentId`, `score`, atau `xpAwarded` dari input body/query client.
- [ ] Akses `/parent/*` dan pergantian profil dari `/student/*` mewajibkan cookie `literabit_parent_gate` yang valid dan belum kedaluwarsa.
- [ ] Tidak ada rahasia, `.env`, `AUTH_SECRET`, hash password/PIN, atau cookie mentah yang dikomit atau dicatat di log.

## 3. Data Integrity & Business Rules (NFR-003)

- [ ] Submit kuis, penilaian skor, `quiz_attempts`, `attempt_answers`, `xp_transactions`, `reading_progress`, serta pembaruan `students.total_xp` & `level` berjalan dalam satu `await db.transaction(async (tx) => { ... })`.
- [ ] `xp_transactions` menggunakan `uniqueIndex(student_id, material_id)` + `onConflictDoNothing()` sehingga _retake_ dan klik ganda selalu menghasilkan `0 XP`.
- [ ] Materi tidak bisa diubah ke `PUBLISHED` jika `< 1` `material_sections` atau `< 3` `questions`.
- [ ] Kategori yang masih memiliki materi ditolak saat penghapusan permanen (arahkan ke `is_active = false`).
- [ ] Teks bacaan disimpan per bagian di `material_sections`, bukan satu blob rich-text.

## 4. Architecture & Code Quality

- [ ] `src/app/` tidak memanggil Drizzle (`db`) secara langsung; semua logika domain berada di `src/modules/`.
- [ ] Tidak ada pembacaan `process.env` / `Bun.env` langsung di `src/modules/` atau `src/app/` (gunakan `getServerEnv()`).
- [ ] Tidak ada `any`, `@ts-ignore`, `!` (_non-null assertion_), atau file produksi > 300 baris.
- [ ] Fungsi yang diekspor memiliki _explicit return type_; input divalidasi dengan Zod.
- [ ] Komponen Next.js 16 yang mengakses `cookies()` / `headers()` / `params` / `searchParams` menggunakan `await` dan dibungkus `<Suspense>` dengan benar untuk `cacheComponents: true`.

## 5. UI/UX & Accessibility (NFR-001 & NFR-002)

- [ ] Seluruh copy UI berbahasa Indonesia yang jelas dan ramah anak/orang tua.
- [ ] Tipografi bacaan memenuhi ukuran minimal (`>= 18px` `LEVEL_1`, `>= 16px` `LEVEL_2`/`LEVEL_3`), `line-height >= 1.6`, dan kontras WCAG AA.
- [ ] State loading, empty, error, dan disabled (misal tombol kuis sebelum halaman akhir bacaan) ditangani dengan baik.

## 6. Verification Gates

- [ ] `bun run complete-check` (`type-check`, `lint`, `fmt`, `test`, `build`) lolos tanpa error.
- [ ] Jika menyentuh database/migrasi: `bun run db:migrate` dan `bun run test:integration` (jika tersedia) sudah dijalankan dan diverifikasi.
