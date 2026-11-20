# API Spec: Student Catalog, Reader, Quiz & Progress

**Scope:** EPIC 02, EPIC 03, EPIC 04 (`US-005` – `US-011`)  
**Milestone:** Milestone 3 & Milestone 4  
**Auth Requirement:** Seluruh endpoint di dokumen ini mewajibkan `session.role === "PARENT"` dan cookie `literabit_student` terverifikasi (`student.parentId === session.userId`).

---

## 1. `GET /api/v1/student/materials` (`US-005`)

- **Query Params (opsional):** `level=LEVEL_1|LEVEL_2|LEVEL_3`, `categoryId=uuid`, `search=string`.
- **Rules (`AC-005.1`):** Hanya mengembalikan materi dengan `materials.status = 'PUBLISHED'` dan `categories.is_active = true`.
- **Response `200`:** Daftar kartu materi beserta status siswa saat ini (`NOT_STARTED` | `IN_PROGRESS` | `COMPLETED`), `bestScore`, dan `lastSectionIndex`.

## 2. `GET /api/v1/student/materials/:slug` (`US-006`)

- **Rules:** Materi harus `PUBLISHED` dan kategorinya `is_active = true` (`404` jika tidak).
- **Response `200`:** Detail materi (`id`, `title`, `learningObjective`, `difficultyLevel`, `estimatedMinutes`, `coverImageUrl`), array `sections` berurutan (`sectionIndex` ascending `0..N-1`, `content`, `imageUrl`), serta progres siswa (`status`, `lastSectionIndex`, `canStartQuiz`).

## 3. `PUT /api/v1/student/materials/:materialId/progress` (`AC-006.3`, `AC-006.4`)

- **Request Body:** `{ "lastSectionIndex": 2 }`
- **Rules:** Validasi `0 <= lastSectionIndex < totalSections`. Upsert `reading_progress` untuk `(activeStudentId, materialId)` (`status` tetap `'COMPLETED'` jika sudah selesai, atau `'IN_PROGRESS'` jika belum).
- **Response `200`:** `{ lastSectionIndex, status, canStartQuiz }`.

## 4. `GET /api/v1/student/materials/:materialId/quiz` (`US-007`)

- **Rules:** Materi harus `PUBLISHED`. Mengembalikan daftar soal berurutan (`id`, `questionOrder`, `questionText`, `options`, `skillCategory`) **tanpa** `correctOptionIndex` atau `explanation` sebelum disubmit!
- **Response `200`:** `{ material: { id, title, sections }, questions: [...], hasPriorAttempt: boolean }`.
- _Catatan Frontend:_ `sections` disertakan (atau dibaca dari detail materi) agar modal **"Lihat Bacaan"** tidak perlu memuat ulang halaman dan tidak menghapus state jawaban pilihan ganda anak (`AC-007.2`).

## 5. `POST /api/v1/student/materials/:materialId/quiz/submit` (`US-007` – `US-010`)

- **Request Body:**
  ```json
  {
    "answers": [{ "questionId": "uuid", "selectedOptionIndex": 1 }]
  }
  ```
- **Server Rules (`db.transaction`):**
  1. Validasi seluruh soal aktif materi terjawab (`answers.length === questions.length`, setiap `questionId` milik `materialId` terkait — `422` jika tidak lengkap).
  2. Hitung `correctCount` dan `score = Math.round((correctCount / totalQuestions) * 100)`.
  3. Insert ke `quiz_attempts` dan `attempt_answers` (snapshot `skill_category`, `selected_option_index`, `is_correct`).
  4. Insert ke `xp_transactions` dengan `onConflictDoNothing({ target: [studentId, materialId] })`:
     - Jika baris baru terbuat: `xpAwarded = (correctCount * 10) + (score >= 70 ? 20 : 0)`, `isFirstAttempt = true`, update `students.total_xp` & `students.level` (`Math.floor(totalXp / 100) + 1`).
     - Jika conflict (retake / double-submit): `xpAwarded = 0`, `isFirstAttempt = false`.
  5. Upsert `reading_progress` (`status = 'COMPLETED'`, `attemptCount + 1`, `firstScore` jika null, `bestScore = GREATEST(...)`).
- **Response `200`:**
  ```json
  {
    "attemptId": "uuid",
    "score": 80,
    "correctCount": 4,
    "totalQuestions": 5,
    "xpAwarded": 60,
    "isFirstAttempt": true,
    "leveledUp": false,
    "previousLevel": 1,
    "newLevel": 1,
    "totalXp": 60,
    "recommendation": {
      "tier": "ADVANCE",
      "label": "Lanjut ke Bacaan Berikutnya"
    },
    "review": [
      {
        "questionId": "uuid",
        "questionText": "...",
        "options": ["..."],
        "selectedOptionIndex": 1,
        "correctOptionIndex": 1,
        "isCorrect": true,
        "explanation": "..."
      }
    ]
  }
  ```

## 6. `GET /api/v1/student/progress` (`US-011`)

- **Response `200`:** Profil level (`level`, `totalXp`, `xpForNextLevel`, `levelProgressPercent`), statistik (`completedCount`, `averageBestScore`), dan riwayat materi (`materialId`, `title`, `difficultyLevel`, `status`, `bestScore`, `attemptCount`, `completedAt`).
