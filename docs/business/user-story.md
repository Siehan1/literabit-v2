# User Stories

**Source of Truth:** [../PRD.md](../PRD.md) (v0.2 — Lean MVP)

---

## EPIC 01 — Authentication & Family Profile Management

- **US-001 — Registrasi Akun Orang Tua:** Sebagai _Parent_, saya ingin mendaftarkan akun keluarga (`full_name`, `email`, `password`, `parent_pin` 4 digit) agar dapat mengelola profil belajar anak dengan aman.
- **US-002 — Login & Isolasi Sesi Orang Tua (_Parent Gate_):** Sebagai _Parent_ atau _Admin_, saya ingin masuk ke akun saya dan melindungi `/parent` serta pergantian profil dengan PIN 4 digit agar anak tidak dapat mengubah pengaturan akun.
- **US-003 — Mengelola Profil Anak:** Sebagai _Parent_, saya ingin membuat, mengubah, dan menghapus profil tiap anak (`display_name`, `birth_year`, `avatar`, `recommended_level`) dengan data belajar terisolasi.
- **US-004 — Masuk ke Ruang Belajar Anak:** Sebagai _Student_, saya ingin memilih kartu profil saya (_Netflix-style profile picker_) di `/profiles` agar langsung masuk ke `/student` tanpa mengetik email/password.

---

## EPIC 02 — Reading & Learning Experience

- **US-005 — Menjelajahi Katalog Bacaan:** Sebagai _Student_, saya ingin melihat daftar bacaan `PUBLISHED` dari kategori aktif serta memfilternya berdasarkan tingkat kesulitan dan kategori.
- **US-006 — Membaca Materi & Menyimpan Progres:** Sebagai _Student_, saya ingin melihat `learning_objective`, membaca teks per bagian (`material_sections`), melanjutkan dari `last_section_index` terakhir, dan membuka tombol **"Mulai Kuis Pemahaman"** setelah mencapai bagian akhir.

---

## EPIC 03 — Comprehension Assessment & Evaluation

- **US-007 — Mengerjakan Kuis Pemahaman Bacaan:** Sebagai _Student_, saya ingin menjawab seluruh soal pilihan ganda dengan panel referensi **"Lihat Bacaan"** yang tetap menjaga pilihan jawaban saya, lalu mengirim kuis setelah seluruh soal terjawab.
- **US-008 — Melihat Hasil Evaluasi, Pembahasan & Rekomendasi:** Sebagai _Student_, saya ingin melihat skor akhir (0–100%), jumlah benar/salah, XP yang diperoleh, pembahasan tiap soal, serta tombol rekomendasi langkah berikutnya.
- **US-009 — Mengulang Kuis untuk Latihan:** Sebagai _Student_, saya ingin mengulang kuis pada materi yang sudah pernah dikerjakan untuk memperbaiki `best_score` dengan perolehan `0 XP`.

---

## EPIC 04 — Student Progress & Gamification

- **US-010 — Mendapatkan XP Proporsional & Naik Level:** Sebagai _Student_, saya ingin mendapatkan XP pada percobaan kuis pertama secara atomik/idempoten dan naik level otomatis saat ambang batas tercapai.
- **US-011 — Melihat Ringkasan Progres Belajar Anak:** Sebagai _Student_, saya ingin melihat Level saat ini, _progress bar_ menuju level berikutnya, total bacaan selesai, rata-rata skor terbaik, dan riwayat bacaan.

---

## EPIC 05 — Parent Dashboard

- **US-012 — Memantau Ringkasan Aktivitas Belajar Anak:** Sebagai _Parent_, saya ingin memilih anak via _student switcher_ serta melihat jumlah bacaan selesai, sedang berlangsung, level saat ini, dan log aktivitas kuis.
- **US-013 — Memantau Hasil Evaluasi Pemahaman Anak:** Sebagai _Parent_, saya ingin melihat skor percobaan pertama vs skor terbaik, jumlah percobaan, dan penanda _"Perlu Pendampingan / Baca Ulang"_ untuk `best_score < 60%`.

---

## EPIC 06 — Lean Admin Content Management System

- **US-014 — Mengelola Kategori Bacaan:** Sebagai _Admin_, saya ingin membuat, mengubah, dan menonaktifkan kategori (`is_active`), dengan proteksi agar kategori bermateri tidak dapat dihapus permanen.
- **US-015 — Mengelola Materi Bacaan Mandiri:** Sebagai _Admin_, saya ingin membuat, menyunting `material_sections` secara berurutan, dan mengubah status (`DRAFT`, `PUBLISHED`, `ARCHIVED`) dengan guardrail publikasi.
- **US-016 — Mengelola Kuis & Kategori Kemampuan Soal:** Sebagai _Admin_, saya ingin mengelola soal pilihan ganda (3–4 opsi, kunci jawaban, pembahasan, dan `skill_category`).

---

## Post-MVP Backlog (Priority: P1)

- **US-017 (P1):** Analitik kemampuan per kategori pemahaman (`LITERAL`, `INFERENTIAL`, `VOCABULARY`, `MAIN_IDEA`) menggunakan `attempt_answers`.
- **US-018 (P1):** Koleksi badge pencapaian anak.
- **US-019 (P1):** Target bacaan mingguan yang ditetapkan orang tua.
