# API Spec: Parent Dashboard

**Scope:** EPIC 05 (`US-012`, `US-013`)  
**Milestone:** Milestone 5  
**Auth Requirement:** Wajib `session.role === "PARENT"` **dan** `literabit_parent_gate` aktif (`403 PARENT_GATE_REQUIRED` jika belum verifikasi PIN).

---

## 1. `GET /api/v1/parent/dashboard` (`AC-012.1`)

- **Behavior:** Mengembalikan daftar seluruh anak milik `session.userId` untuk _student switcher_ beserta ringkasan awal anak pertama (atau anak yang dipilih lewat query `?studentId=uuid`).
- **Security:** Query filter wajib `WHERE id = :studentId AND parent_id = :sessionUserId`.

## 2. `GET /api/v1/parent/students/:studentId/summary` (`US-012`, `US-013`)

- **Security:** Jika `studentId` bukan milik `session.userId`, kembalikan `404` (`NOT_FOUND`).
- **Response `200`:**
  ```json
  {
    "student": {
      "id": "uuid",
      "displayName": "Alya",
      "avatar": "owl",
      "recommendedLevel": "LEVEL_1",
      "level": 2,
      "totalXp": 140
    },
    "stats": {
      "completedCount": 3,
      "inProgressCount": 1
    },
    "materialEvaluations": [
      {
        "materialId": "uuid",
        "title": "Kancil dan Buaya",
        "difficultyLevel": "LEVEL_1",
        "firstScore": 40,
        "bestScore": 50,
        "attemptCount": 2,
        "needsAttention": true,
        "attentionLabel": "Perlu Pendampingan / Baca Ulang",
        "lastAttemptAt": "2026-11-20T05:00:00.000Z"
      }
    ],
    "recentActivityLogs": [
      {
        "attemptId": "uuid",
        "materialTitle": "Kancil dan Buaya",
        "score": 50,
        "xpAwarded": 0,
        "isFirstAttempt": false,
        "createdAt": "2026-11-20T05:00:00.000Z"
      }
    ]
  }
  ```
- **Rule (`AC-013.2`):** `needsAttention = bestScore !== null && bestScore < 60`.
