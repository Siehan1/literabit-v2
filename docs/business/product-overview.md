# Product Overview

**Product:** Literabit — Web-Based Reading Comprehension Platform  
**Source of Truth:** [../PRD.md](../PRD.md) (v0.2 — Lean MVP)  
**Target Users:** Anak usia 6–12 tahun (_Student_), Orang Tua (_Parent_), Administrator (_Admin_)

---

## 1. Product Description & Goals

Literabit adalah platform pembelajaran digital berbasis web yang berfokus pada **peningkatan pemahaman bacaan (_reading comprehension_)** bagi anak usia 6–12 tahun yang sudah memiliki kemampuan membaca dasar (_decoding_).

Tujuan utama produk:

1. Meningkatkan ketelitian dan pemahaman anak (literal, inferensial, kosakata, dan gagasan utama).
2. Memberikan umpan balik evaluatif instan melalui pembahasan tiap soal setelah kuis.
3. Mendorong kebiasaan membaca teliti melalui gamifikasi XP berbasis percobaan pertama dan akurasi.
4. Memberikan visibilitas hasil evaluasi anak kepada orang tua.
5. Menyediakan CMS mandiri yang ringkas, tervalidasi, dan terstruktur bagi administrator.

---

## 2. User Roles & Access Model

| Role        | Deskripsi                                                                    | Mekanisme Autentikasi & Otorisasi                                                                                                    |
| :---------- | :--------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Parent**  | Pemilik akun keluarga yang mengelola profil anak dan memantau hasil belajar. | Login standar (`email` + `password`) dan **Parent PIN 4 digit** untuk membuka akses `/parent` atau mengganti profil dari `/student`. |
| **Student** | Anak usia 6–12 tahun yang membaca materi dan mengerjakan kuis pemahaman.     | Memilih kartu profil anak di `/profiles` pada perangkat yang sudah login tanpa email/password anak.                                  |
| **Admin**   | Pengelola kategori, materi bacaan berjenjang, dan bank soal.                 | Login standar (`email` + `password`) dengan role `ADMIN` untuk mengakses `/admin`.                                                   |

---

## 3. Content Tiering (`difficulty_level`)

| Tingkat              | Rekomendasi Usia | Karakteristik Bacaan                                                | Fokus Evaluasi Kuis                                          |
| :------------------- | :--------------- | :------------------------------------------------------------------ | :----------------------------------------------------------- |
| `LEVEL_1` (Dasar)    | 6–8 tahun        | 100–250 kata, kalimat tunggal/majemuk sederhana, alur linear.       | Pemahaman literal & pengenalan kosakata dasar.               |
| `LEVEL_2` (Menengah) | 9–10 tahun       | 250–500 kata, paragraf deskriptif/naratif dengan konflik ringan.    | Pemahaman literal, gagasan utama, dan urutan kejadian.       |
| `LEVEL_3` (Mahir)    | 11–12 tahun      | 500–800 kata, teks informasi/narasi kompleks dengan makna tersirat. | Pemahaman inferensial, gagasan utama, dan analisis kosakata. |

---

## 4. Core System Business Rules (Binding)

1. **First-Attempt Proportional XP:** XP hanya diberikan pada percobaan kuis pertama per `(student_id, material_id)` dengan rumus `(correctCount × 10) + (score >= 70 ? 20 : 0)`. _Retake_ diizinkan tanpa batas tetapi menghasilkan `0 XP`.
2. **Static Level Threshold:** `Level N` membutuhkan `(N - 1) × 100` XP kumulatif (Level 1 mulai 0 XP, Level 2 pada 100 XP, Level 3 pada 200 XP, dst.). Tidak dikelola lewat CMS.
3. **Granular Evaluation Logging:** Setiap pengiriman kuis menyimpan jawaban per butir soal di `attempt_answers` beserta `skill_category` untuk mendukung analitik P1.
4. **Rule-Based Next-Step Routing:**
   - `score < 60`: _"Baca Ulang Materi / Coba Bacaan Lain di Tingkat Ini"_
   - `60 <= score <= 79`: _"Ulangi Kuis untuk Latihan"_ atau _"Kembali ke Katalog"_
   - `score >= 80`: _"Lanjut ke Bacaan Berikutnya"_
5. **CMS Publish Guardrail:** Materi hanya dapat diubah menjadi `PUBLISHED` jika memiliki minimal `1` `material_sections` dan `3` `questions`.

---

## 5. Resolved Product Decisions (Out of MVP Scope)

- Tidak ada _audio narration_ dan tidak ada _placement test_ awal.
- Tidak ada alur _multi-role editorial approval_ (Admin mempublikasikan konten langsung).
- Orang tua tidak mengelola konten materi bacaan (hanya profil anak dan pemantauan progres).
