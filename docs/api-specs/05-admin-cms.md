# API Spec: Admin Lean CMS

**Scope:** EPIC 06 (`US-014` – `US-016`)  
**Milestone:** Milestone 2  
**Auth Requirement:** Wajib `session.role === "ADMIN"` (`401` jika belum login, `403` jika role `PARENT`).

---

## 1. Categories (`US-014`)

- **`GET /api/v1/admin/categories`:** Semua kategori (`isActive` true & false) beserta jumlah materi terkait.
- **`POST /api/v1/admin/categories`:** `{ name, slug, description?, isActive? }` (`409` jika `slug` duplikat).
- **`PATCH /api/v1/admin/categories/:categoryId`:** Update nama, slug, deskripsi, atau toggle `isActive`.
- **`DELETE /api/v1/admin/categories/:categoryId` (`AC-014.2`):** Jika kategori dirujuk >= 1 baris di `materials`, tolak dengan `422` (`CATEGORY_IN_USE`: _"Kategori masih memiliki materi terkait. Nonaktifkan kategori alih-alih menghapus."_).

## 2. Materials & Sequential Sections (`US-015`)

- **`GET /api/v1/admin/materials`:** Daftar materi (`DRAFT`, `PUBLISHED`, `ARCHIVED`) dengan hitungan `sectionCount` dan `questionCount`.
- **`POST /api/v1/admin/materials`:** Buat materi baru (`status` awal `DRAFT`). Body: `{ title, slug, categoryId, difficultyLevel, learningObjective, estimatedMinutes, coverImageUrl? }`.
- **`GET /api/v1/admin/materials/:materialId`:** Detail materi + `sections` (`sectionIndex` ascending) + `questions` (`questionOrder` ascending).
- **`PATCH /api/v1/admin/materials/:materialId`:** Perbarui metadata materi.
- **`PUT /api/v1/admin/materials/:materialId/sections`:** Ganti/sinkronkan daftar `material_sections` secara berurutan (`0..N-1`) dalam satu `db.transaction`.
- **`POST /api/v1/admin/materials/:materialId/status` (`AC-015.3`):**
  - Body: `{ "status": "DRAFT" | "PUBLISHED" | "ARCHIVED" }`.
  - **Guardrail Wajib:** Jika target `PUBLISHED`, server memverifikasi `sectionCount >= 1` dan `questionCount >= 3`. Jika gagal, kembalikan `422` (`CMS_PUBLISH_GUARDRAIL`) dengan rincian kekurangan (`missingSections`, `missingQuestions`).

## 3. Questions (`US-016`)

- **`GET /api/v1/admin/materials/:materialId/questions`:** Daftar soal terurut.
- **`POST /api/v1/admin/materials/:materialId/questions`:** Body `{ questionOrder, questionText, options (min 3, max 4), correctOptionIndex (0..options.length-1), explanation, skillCategory }`.
- **`PATCH /api/v1/admin/materials/:materialId/questions/:questionId`:** Perbarui soal.
- **`DELETE /api/v1/admin/materials/:materialId/questions/:questionId`:** Hapus soal (catatan: jika materi berstatus `PUBLISHED` dan penghapusan membuat jumlah soal `< 3`, tolak atau minta turunkan status ke `DRAFT` terlebih dahulu agar guardrail tetap konsisten).
