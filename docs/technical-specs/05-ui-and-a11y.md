# 05 — UI/UX & Accessibility Standards

**Reference:** `NFR-001`, `NFR-002`, dan `AC-006`–`AC-008` di [../business/acceptance-criteria.md](../business/acceptance-criteria.md).

---

## 1. Tipografi Pembaca Anak (`NFR-001`)

| Tingkat               | Ukuran Teks Minimal                   | Line Height                  | Batas Panjang Baris   |
| :-------------------- | :------------------------------------ | :--------------------------- | :-------------------- |
| `LEVEL_1`             | `18px` (`text-lg` atau lebih besar)   | `>= 1.6` (`leading-relaxed`) | `max-w-prose` (~65ch) |
| `LEVEL_2` & `LEVEL_3` | `16px` (`text-base` atau lebih besar) | `>= 1.6` (`leading-relaxed`) | `max-w-prose` (~65ch) |

- Seluruh kombinasi teks dan latar wajib memenuhi rasio kontras **WCAG AA** (`>= 4.5:1` untuk teks normal).

---

## 2. Interaksi Kunci yang Wajib Dijaga Frontend

1. **Tombol "Mulai Kuis Pemahaman" (`AC-006.4`):** Tetap `disabled` hingga siswa mencapai `section_index === totalSections - 1` (atau materi berstatus `COMPLETED`).
2. **Modal/Drawer "Lihat Bacaan" Saat Kuis (`AC-007.2`):**
   - Desktop: slide-over / drawer.
   - Mobile: full-height sheet / modal.
   - Membuka atau menutup panel referensi **tidak boleh** me-reset state jawaban yang sudah dipilih anak.
3. **Validasi Pengiriman Kuis (`AC-007.3`):** Tombol kirim memvalidasi seluruh pertanyaan terjawab dan menampilkan indikator nomor soal yang belum terisi.
4. **UI States (`CODE_REVIEW_CHECKLIST.md`):** Setiap halaman dan form wajib menangani state `loading`, `empty`, `error` (dengan tombol coba lagi), `disabled`, dan `success`.
5. **Bahasa UI:** Seluruh label, tombol, pesan validasi, dan instruksi menggunakan **Bahasa Indonesia** yang ramah anak dan orang tua.
