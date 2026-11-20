# LITERABIT — Product Requirements Document (PRD)

- **Document Version:** 0.2 (Lean MVP)
- **Status:** Approved for Development
- **Product Type:** Web-Based Reading Comprehension Platform
- **Target Users:** Children aged 6–12 (with basic reading fluency), Parents, Administrators

---

## 1. Product Overview

### 1.1 Product Description

Literabit adalah platform pembelajaran digital berbasis web yang berfokus secara spesifik pada **peningkatan pemahaman bacaan (_reading comprehension_)** bagi anak usia 6–12 tahun yang sudah memiliki kemampuan membaca dasar (_decoding_). Platform ini menggabungkan bacaan mandiri berjenjang, evaluasi pemahaman berbasis kategori kognitif, pembahasan jawaban langsung, serta gamifikasi berbasis kualitas pemahaman. Orang tua dapat memantau riwayat dan hasil evaluasi anak melalui dashboard terpisah, sementara Administrator mengelola kurikulum mandiri dan bank soal.

### 1.2 Product Goals

1. Meningkatkan ketelitian dan pemahaman anak terhadap isi bacaan (literal, inferensial, kosakata, dan gagasan utama).
2. Menyediakan umpan balik evaluatif instan melalui pembahasan jawaban setelah pengerjaan kuis.
3. Mendorong kebiasaan membaca yang teliti (mencegah perilaku asal menebak) melalui aturan XP berbasis percobaan pertama dan akurasi.
4. Memberikan visibilitas perkembangan evaluasi bacaan anak kepada orang tua.
5. Menyediakan sistem pengelolaan materi mandiri yang ringkas, tervalidasi, dan terstruktur bagi administrator.

### 1.3 User Roles & Access Model

| Role        | Deskripsi                                                                          | Mekanisme Autentikasi & Otorisasi                                                                   |
| :---------- | :--------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Parent**  | Pemilik akun keluarga yang mengelola profil anak dan memantau hasil belajar.       | Login standar (`email` + `password`) dan **Parent PIN (4 digit)** untuk membuka akses ke `/parent`. |
| **Student** | Anak usia 6–12 tahun yang membaca materi dan mengerjakan kuis pemahaman.           | Memilih kartu profil anak pada perangkat yang sudah login tanpa memerlukan email/password anak.     |
| **Admin**   | Pengelola materi mandiri, kategori, penjenjangan tingkat kesulitan, dan soal kuis. | Login standar (`email` + `password`) dengan role `ADMIN` untuk mengakses `/admin`.                  |

### 1.4 Standar Penjenjangan Materi Mandiri (Content Tiering)

Literabit tidak menggunakan asesmen penempatan awal maupun kurikulum formal eksternal. Seluruh materi mandiri dikelompokkan oleh Admin ke dalam **3 Tingkat Kesulitan** (`difficulty_level`):

| Tingkat (`difficulty_level`) | Rekomendasi Usia | Karakteristik Bacaan                                                | Fokus Evaluasi Kuis                                                  |
| :--------------------------- | :--------------- | :------------------------------------------------------------------ | :------------------------------------------------------------------- |
| **LEVEL_1 (Dasar)**          | 6–8 tahun        | 100–250 kata, kalimat tunggal/majemuk sederhana, alur linear.       | Dominan pemahaman literal & pengenalan kosakata dasar.               |
| **LEVEL_2 (Menengah)**       | 9–10 tahun       | 250–500 kata, paragraf deskriptif/naratif dengan konflik ringan.    | Kombinasi pemahaman literal, gagasan utama, dan urutan kejadian.     |
| **LEVEL_3 (Mahir)**          | 11–12 tahun      | 500–800 kata, teks informasi/narasi kompleks dengan makna tersirat. | Dominan pemahaman inferensial, gagasan utama, dan analisis kosakata. |

---

## 2. Core System Business Rules

Aturan berikut bersifat mengikat pada seluruh lapisan aplikasi (database, backend logic, dan UI):

1. **Aturan Pemberian XP (_First-Attempt Proportional XP_):**
   - XP hanya diberikan pada **pengerjaan kuis pertama** untuk setiap materi per profil anak.
   - Rumus XP: `(Jumlah Jawaban Benar × 10 XP) + Bonus Kelulusan (20 XP jika skor ≥ 70%)`.
   - Pengerjaan ulang kuis (_retake_) diizinkan tanpa batas untuk latihan dan perbaikan skor terbaik, tetapi menghasilkan **`0 XP`**.
   - Transaksi XP bersifat **idempoten** (dijamin oleh _unique constraint_ pada `(student_id, material_id)`).
2. **Aturan Kenaikan Level (Statis):**
   - Ambang batas XP per level ditetapkan secara statis di kode aplikasi: `Level N membutuhkan N × 100 XP kumulatif` (Level 1 mulai dari 0 XP, Level 2 pada 100 XP, Level 3 pada 200 XP, dst.).
   - Konfigurasi XP dan level tidak dikelola melalui Admin CMS.
3. **Pencatatan Data Evaluasi Granular (_Future-Proof Logging_):**
   - Setiap pengiriman kuis wajib menyimpan rekaman jawaban per butir soal (`attempt_id`, `question_id`, `skill_category`, `selected_option`, `is_correct`) selain menyimpan skor total pada `quiz_attempts`.
   - Data granular ini menjadi fondasi analitik kategori pemahaman pada fase P1 tanpa memerlukan migrasi ulang skema database.
4. **Rekomendasi Langkah Berikutnya (_Rule-Based Routing_):**
   - Skor akhir **`< 60%`**: Layar hasil menampilkan rekomendasi _"Baca Ulang Materi / Coba Bacaan Lain di Tingkat Ini"_.
   - Skor akhir **`60% – 79%`**: Layar hasil menampilkan opsi _"Ulangi Kuis untuk Latihan"_ atau _"Kembali ke Katalog"_.
   - Skor akhir **`≥ 80%`**: Layar hasil menampilkan rekomendasi _"Lanjut ke Bacaan Berikutnya"_.
5. **Validasi Publikasi Materi (CMS Guardrail):**
   - Materi hanya dapat diubah statusnya menjadi `PUBLISHED` apabila memiliki minimal **1 bagian bacaan (`material_sections`)** dan minimal **3 pertanyaan kuis (`questions`)**.

---

## 3. Functional Requirements — MVP (Priority: P0)

### EPIC 01 — Authentication & Family Profile Management

#### US-001: Registrasi Akun Orang Tua

- **As a** Parent, **I want to** mendaftarkan akun keluarga dan menetapkan PIN pengaman, **so that** saya dapat mengelola profil belajar anak dengan aman.
- **Acceptance Criteria:**
  - **AC-001.1:** Formulir registrasi menerima `full_name`, `email`, `password`, dan `parent_pin` (4 digit angka).
  - **AC-001.2:** Sistem memvalidasi format email, keunikan email, panjang password minimal 8 karakter, dan format tepat 4 digit angka untuk PIN.
  - **AC-001.3:** Sistem menyimpan `password` dan `parent_pin` dalam bentuk _cryptographic hash_.

#### US-002: Login & Isolasi Sesi Orang Tua (_Parent Gate_)

- **As a** Parent or Admin, **I want to** masuk ke akun saya dan melindungi akses dashboard orang tua dengan PIN, **so that** anak tidak dapat mengubah pengaturan akun saat menggunakan perangkat yang sama.
- **Acceptance Criteria:**
  - **AC-002.1:** Sistem memvalidasi kredensial `email` dan `password` untuk role `PARENT` dan `ADMIN`.
  - **AC-002.2:** Saat sesi berada di ruang belajar anak (`/student`), akses menuju `/parent` atau layar ganti profil mewajibkan verifikasi **Parent PIN 4 digit**.
  - **AC-002.3:** Status verifikasi _Parent Gate_ disimpan dalam _signed HTTP-only cookie_ dengan masa berlaku terbatas.
  - **AC-002.4:** Pengguna dapat melakukan logout untuk menghapus seluruh cookie sesi aktif.

#### US-003: Mengelola Profil Anak

- **As a** Parent, **I want to** membuat dan mengelola profil untuk setiap anak, **so that** riwayat bacaan dan skor evaluasi masing-masing anak terpisah.
- **Acceptance Criteria:**
  - **AC-003.1:** Orang tua dapat menambah, mengubah, dan menghapus profil anak (`display_name`, `birth_year` atau `age`, `avatar`, dan `recommended_level`).
  - **AC-003.2:** Data progres bacaan, riwayat kuis, XP, dan level setiap profil anak terisolasi sepenuhnya.
  - **AC-003.3:** Seluruh kueri profil anak wajib memverifikasi kepemilikan `parent_id` di sisi server.

#### US-004: Masuk ke Ruang Belajar Anak

- **As a** Student, **I want to** memilih profil saya dari layar pemilihan profil, **so that** saya bisa langsung mulai membaca tanpa perlu mengetik email atau kata sandi.
- **Acceptance Criteria:**
  - **AC-004.1:** Setelah akun orang tua berhasil login, sistem mengarahkan ke layar pemilihan profil anak (_Netflix-style profile picker_).
  - **AC-004.2:** Memilih kartu profil anak mengeset `active_student_id` di cookie server dan membuka beranda `/student` tanpa mengekspos kredensial orang tua.

---

### EPIC 02 — Reading & Learning Experience

#### US-005: Menjelajahi Katalog Bacaan

- **As a** Student, **I want to** melihat daftar bacaan yang dikelompokkan berdasarkan tingkat kesulitan dan kategori, **so that** saya dapat memilih bacaan yang sesuai.
- **Acceptance Criteria:**
  - **AC-005.1:** Sistem hanya menampilkan materi berstatus `PUBLISHED` dari kategori dengan `is_active = true`.
  - **AC-005.2:** Setiap kartu materi menampilkan Judul, Ilustrasi sampul, Kategori, Tingkat Kesulitan (`LEVEL_1`, `LEVEL_2`, `LEVEL_3`), Estimasi durasi baca, dan Status pengerjaan (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`).
  - **AC-005.3:** Anak dapat memfilter katalog berdasarkan Tingkat Kesulitan dan Kategori.

#### US-006: Membaca Materi & Menyimpan Progres

- **As a** Student, **I want to** membaca teks bacaan dengan tampilan yang nyaman dan melanjutkan bacaan jika terhenti, **so that** saya dapat memahami isi teks secara utuh.
- **Acceptance Criteria:**
  - **AC-006.1:** Halaman baca menampilkan ringkasan tujuan pembelajaran (`learning_objective`) di bagian awal sebelum teks utama.
  - **AC-006.2:** Teks bacaan disajikan per bagian/halaman (`material_sections`) dengan tipografi ramah anak, kontras tinggi, dan gambar pendukung (opsional per bagian).
  - **AC-006.3:** Sistem menyediakan tombol navigasi _Sebelumnya / Berikutnya_ serta menyimpan `last_section_index` ke database agar anak dapat melanjutkan dari halaman terakhir.
  - **AC-006.4:** Tombol **"Mulai Kuis Pemahaman"** aktif setelah anak mencapai bagian akhir bacaan.

---

### EPIC 03 — Comprehension Assessment & Evaluation

#### US-007: Mengerjakan Kuis Pemahaman Bacaan

- **As a** Student, **I want to** menjawab pertanyaan pemahaman setelah selesai membaca, **so that** saya dapat menguji pemahaman saya terhadap teks.
- **Acceptance Criteria:**
  - **AC-007.1:** Sistem menampilkan seluruh soal pilihan ganda yang terhubung dengan materi tersebut.
  - **AC-007.2:** Anak dapat membuka kembali teks bacaan melalui panel/modal referensi (**"Lihat Bacaan"**) selama mengerjakan kuis untuk melatih pencarian bukti tekstual.
  - **AC-007.3:** Sistem mencegah pengiriman kuis apabila masih ada pertanyaan yang belum dijawab.
  - **AC-007.4:** Sistem menghitung skor akhir (0–100) dan menyimpan log jawaban per butir soal beserta `skill_category` (`LITERAL`, `INFERENTIAL`, `VOCABULARY`, `MAIN_IDEA`).

#### US-008: Melihat Hasil Evaluasi, Pembahasan & Rekomendasi

- **As a** Student, **I want to** melihat nilai, pembahasan setiap jawaban, dan saran langkah berikutnya, **so that** saya mengetahui letak kesalahan pemahaman saya.
- **Acceptance Criteria:**
  - **AC-008.1:** Layar hasil menampilkan skor akhir (0–100%), jumlah jawaban benar/salah, dan jumlah XP yang diperoleh.
  - **AC-008.2:** Sistem menampilkan daftar pertanyaan beserta pilihan jawaban anak, kunci jawaban benar, dan teks pembahasan singkat (`explanation`).
  - **AC-008.3:** Sistem menampilkan tombol rekomendasi langkah berikutnya sesuai ambang skor pada Aturan Bisnis #4.

#### US-009: Mengulang Kuis untuk Latihan

- **As a** Student, **I want to** mengerjakan ulang kuis pada materi yang sudah pernah saya selesaikan, **so that** saya dapat memperbaiki pemahaman dan skor evaluasi saya.
- **Acceptance Criteria:**
  - **AC-009.1:** Anak dapat mengulang kuis pada materi yang sudah memiliki riwayat pengerjaan.
  - **AC-009.2:** Hasil pengulangan tercatat sebagai baris baru di `quiz_attempts` dan memperbarui skor terbaik (`best_score`) jika lebih tinggi, tetapi sistem memberikan **`0 XP`**.

---

### EPIC 04 — Student Progress & Gamification

#### US-010: Mendapatkan XP Proporsional & Naik Level

- **As a** Student, **I want to** mendapatkan XP dari jawaban benar pada percobaan kuis pertama dan naik level, **so that** saya termotivasi membaca dengan teliti.
- **Acceptance Criteria:**
  - **AC-010.1:** Sistem menghitung dan memberikan XP hanya pada percobaan pertama kuis berdasarkan Aturan Bisnis #1.
  - **AC-010.2:** Perhitungan XP, pencatatan `xp_transactions`, dan pembaruan `total_xp` serta `level` siswa dijalankan dalam satu transaksi database atomik (_idempotent_).
  - **AC-010.3:** Apabila `total_xp` mencapai ambang batas level berikutnya, `level` anak otomatis meningkat disertai indikator visual kenaikan level di layar hasil.

#### US-011: Melihat Ringkasan Progres Belajar Anak

- **As a** Student, **I want to** melihat level, jumlah XP, dan daftar bacaan yang sudah saya selesaikan, **so that** saya mengetahui pencapaian belajar saya.
- **Acceptance Criteria:**
  - **AC-011.1:** Halaman profil/progres anak menampilkan Level saat ini, _progress bar_ menuju level berikutnya, total bacaan selesai, dan rata-rata skor terbaik kuis.
  - **AC-011.2:** Sistem menampilkan daftar riwayat bacaan beserta status pengerjaan dan skor terbaiknya.

---

### EPIC 05 — Parent Dashboard

#### US-012: Memantau Ringkasan Aktivitas Belajar Anak

- **As a** Parent, **I want to** melihat aktivitas membaca setiap anak yang terhubung dengan akun saya, **so that** saya dapat memantau konsistensi belajar mereka.
- **Acceptance Criteria:**
  - **AC-012.1:** Dashboard menyediakan pemilih profil anak (_student switcher_) apabila orang tua memiliki lebih dari satu anak.
  - **AC-012.2:** Sistem menampilkan jumlah bacaan selesai, jumlah bacaan yang sedang berlangsung, level saat ini, dan log aktivitas pengerjaan kuis berdasarkan tanggal.

#### US-013: Memantau Hasil Evaluasi Pemahaman Anak

- **As a** Parent, **I want to** melihat daftar skor kuis dan riwayat percobaan anak, **so that** saya mengetahui materi mana yang masih sulit dipahami anak.
- **Acceptance Criteria:**
  - **AC-013.1:** Dashboard menampilkan tabel/daftar materi yang pernah dikerjakan anak beserta skor percobaan pertama, skor terbaik, dan jumlah percobaan.
  - **AC-013.2:** Sistem memberikan penanda visual khusus (_"Perlu Pendampingan / Baca Ulang"_) pada materi dengan skor terbaik **`< 60%`**.

---

### EPIC 06 — Lean Admin Content Management System

#### US-014: Mengelola Kategori Bacaan

- **As an** Admin, **I want to** membuat dan mengatur status kategori bacaan, **so that** katalog materi terorganisasi dengan rapi.
- **Acceptance Criteria:**
  - **AC-014.1:** Admin dapat membuat, mengubah nama/deskripsi, dan mengubah status (`is_active`) kategori.
  - **AC-014.2:** Kategori yang masih memiliki materi terkait tidak dapat dihapus permanen, melainkan dinonaktifkan (`is_active = false`).

#### US-015: Mengelola Materi Bacaan Mandiri

- **As an** Admin, **I want to** membuat, menyunting, dan memublikasikan materi bacaan berjenjang, **so that** konten bacaan tersedia bagi siswa.
- **Acceptance Criteria:**
  - **AC-015.1:** Admin dapat mengisi `title`, `slug`, `category_id`, `difficulty_level` (`LEVEL_1`/`LEVEL_2`/`LEVEL_3`), `learning_objective`, `estimated_minutes`, `cover_image_url`, dan daftar `material_sections` secara berurutan.
  - **AC-015.2:** Materi dapat disimpan sebagai `DRAFT`, dipublikasikan (`PUBLISHED`), atau diarsipkan (`ARCHIVED`).
  - **AC-015.3:** Sistem menolak perubahan status menjadi `PUBLISHED` apabila materi memiliki kurang dari 1 bagian bacaan atau kurang dari 3 pertanyaan kuis.

#### US-016: Mengelola Kuis & Kategori Kemampuan Soal

- **As an** Admin, **I want to** membuat pertanyaan pemahaman dan melabeli setiap pertanyaan dengan kategori kemampuan, **so that** evaluasi terukur secara akurat.
- **Acceptance Criteria:**
  - **AC-016.1:** Admin dapat menambah, mengubah, dan menghapus pertanyaan pilihan ganda pada suatu materi.
  - **AC-016.2:** Setiap pertanyaan wajib memiliki `question_text`, array `options` (3–4 pilihan jawaban), `correct_option_index`, `explanation` (pembahasan), dan `skill_category` (`LITERAL`, `INFERENTIAL`, `VOCABULARY`, atau `MAIN_IDEA`).

---

## 4. Post-MVP Backlog (Priority: P1)

Fitur berikut berada di luar lingkup rilis awal, namun skema datanya sudah dipersiapkan sejak MVP:

- **US-017 (P1) — Analitik Kemampuan per Kategori Pemahaman:** Menampilkan grafik persentase akurasi anak berdasarkan 4 kategori (`LITERAL`, `INFERENTIAL`, `VOCABULARY`, `MAIN_IDEA`) pada dashboard anak dan orang tua menggunakan tabel log granular `attempt_answers` dari US-007.
- **US-018 (P1) — Koleksi Badge Pencapaian:** Memberikan lencana visual untuk pencapaian tertentu (contoh: _Menyelesaikan 5 Bacaan Tingkat 1_, _Meraih Skor 100% Pertama Kali_).
- **US-019 (P1) — Target Bacaan Mingguan Orang Tua:** Orang tua dapat menetapkan target jumlah bacaan per minggu untuk memantau konsistensi belajar anak.

---

## 5. Non-Functional Requirements (NFR)

- **NFR-001 (Readability & Child Usability):** Ukuran font teks bacaan minimal `18px` untuk `LEVEL_1` dan `16px` untuk `LEVEL_2`–`LEVEL_3` dengan _line-height_ minimal `1.6` serta rasio kontras warna memenuhi standar WCAG AA.
- **NFR-002 (Responsive Design):** Antarmuka pembaca, modal referensi kuis, dan dashboard responsif pada layar desktop, tablet, dan smartphone.
- **NFR-003 (Data Integrity & Idempotency):** Pengiriman hasil kuis dan kalkulasi XP wajib menggunakan transaksi database atomik (`db.transaction`) dan `uniqueIndex` untuk mencegah duplikasi XP akibat klik ganda atau gangguan jaringan.
- **NFR-004 (Authorization & Child Data Privacy):** Seluruh endpoint server/API wajib memverifikasi kepemilikan `parent_id` dan `student_id` dari sesi aktif sehingga data antar-keluarga tidak dapat diakses secara silang.
- **NFR-005 (Maintainability):** Pemisahan logika bisnis yang tegas berdasarkan domain (`auth`, `learning`, `assessment`, `gamification`, `cms`).

---

## 6. Resolved Product Decisions Log

Keputusan berikut telah dikunci untuk mencegah pelebaran ruang lingkup (_scope creep_) selama pengembangan MVP:

1. **Fokus Produk:** Murni pada _reading comprehension_ dengan asumsi anak sudah bisa membaca teknis; fitur _audio narration_ dan _placement test_ awal dikeluarkan dari proyek.
2. **Kurikulum & Validasi Konten:** Menggunakan materi mandiri yang disusun dan dipublikasikan langsung oleh Admin tanpa alur _multi-role editorial approval_.
3. **Kontrol Materi oleh Orang Tua:** Dikeluarkan dari MVP; orang tua berperan sebagai pemantau perkembangan dan pengelola profil anak.
4. **Keseimbangan Gamifikasi:** XP diberikan hanya pada percobaan pertama secara proporsional terhadap jawaban benar; aturan XP dan level bersifat statis di kode aplikasi.
