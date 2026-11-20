# Acceptance Criteria & NFR Index

**Source of Truth:** [../PRD.md](../PRD.md) (v0.2 — Lean MVP)

---

## 1. Acceptance Criteria per User Story

### EPIC 01 — Auth & Family Profiles

| AC ID      | Story  | Kriteria Penerimaan                                                                                                                |
| :--------- | :----- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `AC-001.1` | US-001 | Formulir registrasi menerima `full_name`, `email`, `password`, dan `parent_pin` (4 digit angka).                                   |
| `AC-001.2` | US-001 | Validasi format email, keunikan email, password min 8 karakter, dan PIN tepat 4 digit angka.                                       |
| `AC-001.3` | US-001 | `password` dan `parent_pin` disimpan dalam bentuk _cryptographic hash_.                                                            |
| `AC-002.1` | US-002 | Validasi kredensial `email` + `password` untuk role `PARENT` dan `ADMIN`.                                                          |
| `AC-002.2` | US-002 | Akses `/parent` atau layar ganti profil dari `/student` mewajibkan verifikasi Parent PIN 4 digit.                                  |
| `AC-002.3` | US-002 | Status verifikasi _Parent Gate_ disimpan dalam _signed HTTP-only cookie_ berdurasi terbatas.                                       |
| `AC-002.4` | US-002 | Logout menghapus seluruh cookie sesi aktif secara serentak.                                                                        |
| `AC-003.1` | US-003 | Orang tua dapat menambah, mengubah, dan menghapus profil anak (`display_name`, `birth_year`/`age`, `avatar`, `recommended_level`). |
| `AC-003.2` | US-003 | Progres bacaan, riwayat kuis, XP, dan level tiap anak terisolasi sepenuhnya.                                                       |
| `AC-003.3` | US-003 | Seluruh kueri profil anak memverifikasi kepemilikan `parent_id` di sisi server.                                                    |
| `AC-004.1` | US-004 | Setelah Parent login, sistem mengarahkan ke `/profiles` (_Netflix-style profile picker_).                                          |
| `AC-004.2` | US-004 | Memilih kartu anak mengeset `literabit_student` cookie dan membuka `/student` tanpa mengekspos kredensial orang tua.               |

### EPIC 02 — Reading & Learning Experience

| AC ID      | Story  | Kriteria Penerimaan                                                                                                                         |
| :--------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `AC-005.1` | US-005 | Hanya menampilkan materi `PUBLISHED` dari kategori dengan `is_active = true`.                                                               |
| `AC-005.2` | US-005 | Kartu materi menampilkan Judul, Sampul, Kategori, Tingkat Kesulitan, Estimasi durasi, dan Status (`NOT_STARTED`/`IN_PROGRESS`/`COMPLETED`). |
| `AC-005.3` | US-005 | Filter katalog berdasarkan Tingkat Kesulitan dan Kategori berfungsi akurat.                                                                 |
| `AC-006.1` | US-006 | Halaman baca menampilkan `learning_objective` di awal sebelum teks utama.                                                                   |
| `AC-006.2` | US-006 | Teks disajikan per `material_sections` dengan tipografi ramah anak, kontras tinggi, dan gambar opsional.                                    |
| `AC-006.3` | US-006 | Navigasi _Sebelumnya / Berikutnya_ menyimpan `last_section_index` ke database untuk resume bacaan.                                          |
| `AC-006.4` | US-006 | Tombol **"Mulai Kuis Pemahaman"** aktif setelah mencapai bagian akhir bacaan.                                                               |

### EPIC 03 & EPIC 04 — Assessment & Gamification

| AC ID      | Story  | Kriteria Penerimaan                                                                                                      |
| :--------- | :----- | :----------------------------------------------------------------------------------------------------------------------- |
| `AC-007.1` | US-007 | Menampilkan seluruh soal pilihan ganda yang terhubung ke materi terkait.                                                 |
| `AC-007.2` | US-007 | Panel/modal **"Lihat Bacaan"** tersedia selama kuis tanpa menghapus jawaban yang sudah dipilih.                          |
| `AC-007.3` | US-007 | Mencegah pengiriman kuis jika masih ada soal belum terjawab dan memvalidasi kepemilikan soal di server.                  |
| `AC-007.4` | US-007 | Menghitung skor (0–100) di server dan menyimpan jawaban granular per butir di `attempt_answers`.                         |
| `AC-008.1` | US-008 | Layar hasil menampilkan skor (0–100%), jumlah benar/salah, dan XP yang diperoleh.                                        |
| `AC-008.2` | US-008 | Menampilkan daftar soal beserta pilihan anak, kunci benar, dan `explanation`.                                            |
| `AC-008.3` | US-008 | Menampilkan tombol rekomendasi langkah berikutnya sesuai ambang `<60%`, `60–79%`, `>=80%`.                               |
| `AC-009.1` | US-009 | Anak dapat mengulang kuis pada materi yang sudah memiliki riwayat pengerjaan.                                            |
| `AC-009.2` | US-009 | Retake membuat baris baru di `quiz_attempts`, memperbarui `best_score` jika lebih tinggi, dan memberi `0 XP`.            |
| `AC-010.1` | US-010 | XP hanya diberikan pada percobaan pertama sesuai Aturan Bisnis #1.                                                       |
| `AC-010.2` | US-010 | Perhitungan XP, `xp_transactions`, serta update `total_xp` dan `level` berjalan dalam satu `db.transaction` idempoten.   |
| `AC-010.3` | US-010 | Kenaikan `level` otomatis terjadi saat ambang batas tercapai dengan indikator visual di layar hasil.                     |
| `AC-011.1` | US-011 | Halaman progres anak menampilkan Level, progress bar level berikutnya, total bacaan selesai, dan rata-rata skor terbaik. |
| `AC-011.2` | US-011 | Menampilkan daftar riwayat bacaan beserta status dan skor terbaiknya.                                                    |

### EPIC 05 & EPIC 06 — Parent Dashboard & Admin CMS

| AC ID      | Story  | Kriteria Penerimaan                                                                                                       |
| :--------- | :----- | :------------------------------------------------------------------------------------------------------------------------ |
| `AC-012.1` | US-012 | Dashboard menyediakan _student switcher_ untuk orang tua dengan > 1 anak.                                                 |
| `AC-012.2` | US-012 | Menampilkan bacaan selesai, sedang berlangsung, level saat ini, dan log aktivitas kuis per tanggal.                       |
| `AC-013.1` | US-013 | Menampilkan daftar materi yang dikerjakan anak beserta `first_score`, `best_score`, dan `attempt_count`.                  |
| `AC-013.2` | US-013 | Menampilkan penanda _"Perlu Pendampingan / Baca Ulang"_ jika `best_score < 60%`.                                          |
| `AC-014.1` | US-014 | Admin dapat membuat, mengubah, dan toggle `is_active` kategori.                                                           |
| `AC-014.2` | US-014 | Kategori yang masih memiliki materi ditolak saat dihapus permanen (arahkan ke `is_active = false`).                       |
| `AC-015.1` | US-015 | Admin dapat mengelola metadata materi dan `material_sections` berurutan.                                                  |
| `AC-015.2` | US-015 | Status materi mendukung `DRAFT`, `PUBLISHED`, dan `ARCHIVED`.                                                             |
| `AC-015.3` | US-015 | Menolak perubahan ke `PUBLISHED` jika `< 1` section atau `< 3` soal.                                                      |
| `AC-016.1` | US-016 | Admin dapat menambah, mengubah, dan menghapus soal pilihan ganda pada materi.                                             |
| `AC-016.2` | US-016 | Setiap soal wajib memiliki `question_text`, `options` (3–4), `correct_option_index`, `explanation`, dan `skill_category`. |

---

## 2. Non-Functional Requirements (NFR)

- **NFR-001 (Readability & Child Usability):** Font minimal `18px` (`LEVEL_1`) dan `16px` (`LEVEL_2`–`LEVEL_3`), `line-height >= 1.6`, kontras WCAG AA.
- **NFR-002 (Responsive Design):** UI pembaca, modal **"Lihat Bacaan"**, dan dashboard responsif di desktop, tablet, dan smartphone.
- **NFR-003 (Data Integrity & Idempotency):** Submit kuis & XP memakai `db.transaction` + `uniqueIndex(student_id, material_id)`.
- **NFR-004 (Authorization & Child Data Privacy):** Seluruh query dan API memverifikasi kepemilikan `parent_id` / `student_id` dari sesi server aktif.
- **NFR-005 (Maintainability):** Pemisahan domain tegas (`auth`, `learning`, `assessment`, `gamification`, `cms`).
