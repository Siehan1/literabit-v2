# 03 — Core Business Contracts

Kontrak logika bisnis yang wajib ditegakkan di backend (`src/modules/`), bukan hanya di validasi UI.

---

## 1. Quiz Scoring

- Bobot tiap soal sama:
  $$\text{score} = \text{Math.round}\left(\frac{\text{correctCount}}{\text{totalQuestions}} \times 100\right)$$
- Server wajib memvalidasi bahwa jumlah jawaban sama dengan jumlah soal aktif pada materi dan setiap `question_id` milik `material_id` tersebut.

---

## 2. Transactional & Idempotent XP (`assessment` + `gamification`)

Seluruh alur submit kuis dijalankan dalam **satu `await db.transaction(async (tx) => { ... })`**:

1. Verifikasi kepemilikan `student.parentId === session.userId`, materi berstatus `PUBLISHED`, dan kategori `is_active = true`.
2. Hitung `correctCount` dan `score` di server.
3. Sisipkan baris `quiz_attempts` (`is_first_attempt`, `xp_awarded` sementara atau setelah cek transaksi XP).
4. Insert ke `xp_transactions` dengan `onConflictDoNothing({ target: [xpTransactions.studentId, xpTransactions.materialId] }).returning()`:
   - **Berhasil insert (First Attempt):**
     - `xpAwarded = (correctCount * 10) + (score >= 70 ? 20 : 0)`
     - Catat `amount: xpAwarded` (meski `0` jika semua salah, agar retake berikutnya tetap `0 XP`).
     - Update `students.total_xp = total_xp + xpAwarded` secara atomik dan hitung ulang `level`.
   - **Conflict (Retake / Double-submit):**
     - `xpAwarded = 0`, `is_first_attempt = false`, `students.total_xp` & `level` tidak berubah.
5. Batch insert `attempt_answers`.
6. Upsert `reading_progress`: `status = 'COMPLETED'`, `attempt_count + 1`, `first_score` (jika null), `best_score = GREATEST(COALESCE(best_score, 0), score)`, `completed_at` (jika null).

---

## 3. Static Leveling Formula

- `Level N` dimulai pada `(N - 1) * 100` XP kumulatif:
  - `calculateLevel(totalXp)` = `Math.floor(Math.max(0, totalXp) / 100) + 1`
  - `xpForNextLevel(level)` = `level * 100`
  - `levelProgressPercent(totalXp)` = `totalXp % 100`

---

## 4. Rule-Based Next-Step Routing

| Rentang Skor        | Tier       | Label UI                                                |
| :------------------ | :--------- | :------------------------------------------------------ |
| `score < 60`        | `REVIEW`   | _"Baca Ulang Materi / Coba Bacaan Lain di Tingkat Ini"_ |
| `60 <= score <= 79` | `PRACTICE` | _"Ulangi Kuis untuk Latihan"_ / _"Kembali ke Katalog"_  |
| `score >= 80`       | `ADVANCE`  | _"Lanjut ke Bacaan Berikutnya"_                         |

---

## 5. CMS Guardrails (Admin)

- **Publish (`-> PUBLISHED`):** Wajib memiliki `count(material_sections) >= 1` dan `count(questions) >= 3`.
- **Hapus Kategori:** Tolak jika masih dirujuk >= 1 baris di `materials`; arahkan ke `is_active = false`.
