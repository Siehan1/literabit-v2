# 02 — Data Model (PostgreSQL + Drizzle ORM)

**Implementation Location:** `src/db/schema/` (`enums.ts`, `tables.ts`, `relations.ts`)  
**Source Baseline:** [../ENGINEERING_BASELINE.md](../ENGINEERING_BASELINE.md) #3

---

## 1. `pgEnum` Domain Values

| Enum               | Values                                                      |
| :----------------- | :---------------------------------------------------------- |
| `role`             | `'PARENT'`, `'ADMIN'`                                       |
| `difficulty_level` | `'LEVEL_1'`, `'LEVEL_2'`, `'LEVEL_3'`                       |
| `material_status`  | `'DRAFT'`, `'PUBLISHED'`, `'ARCHIVED'`                      |
| `skill_category`   | `'LITERAL'`, `'INFERENTIAL'`, `'VOCABULARY'`, `'MAIN_IDEA'` |
| `reading_status`   | `'NOT_STARTED'`, `'IN_PROGRESS'`, `'COMPLETED'`             |

---

## 2. Tables, Foreign Keys & Critical Constraints

| Table               | Key Columns & Relations                                                                                                                                                      | Critical Index / Constraint                                         |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| `users`             | `id`, `full_name`, `email`, `password_hash`, `parent_pin_hash`, `role`                                                                                                       | `uniqueIndex(email)`                                                |
| `students`          | `id`, `parent_id -> users.id (cascade)`, `display_name`, `birth_year`, `avatar`, `recommended_level`, `total_xp`, `level`                                                    | `index(parent_id)`                                                  |
| `categories`        | `id`, `name`, `slug`, `description`, `is_active`                                                                                                                             | `uniqueIndex(slug)`                                                 |
| `materials`         | `id`, `category_id -> categories.id (restrict)`, `title`, `slug`, `difficulty_level`, `learning_objective`, `estimated_minutes`, `cover_image_url`, `status`, `published_at` | `uniqueIndex(slug)`, `index(status, difficulty_level, category_id)` |
| `material_sections` | `id`, `material_id -> materials.id (cascade)`, `section_index` (`0..N-1`), `content`, `image_url`                                                                            | `uniqueIndex(material_id, section_index)`                           |
| `questions`         | `id`, `material_id -> materials.id (cascade)`, `question_order`, `question_text`, `options (jsonb string[])`, `correct_option_index`, `explanation`, `skill_category`        | `index(material_id, question_order)`                                |
| `reading_progress`  | `id`, `student_id`, `material_id`, `status`, `last_section_index`, `first_score`, `best_score`, `attempt_count`, `completed_at`                                              | `uniqueIndex(student_id, material_id)`                              |
| `quiz_attempts`     | `id`, `student_id`, `material_id`, `score`, `correct_count`, `total_questions`, `xp_awarded`, `is_first_attempt`                                                             | `index(student_id, created_at)`, `index(student_id, material_id)`   |
| `attempt_answers`   | `id`, `attempt_id`, `question_id`, `skill_category`, `selected_option_index`, `is_correct`                                                                                   | `uniqueIndex(attempt_id, question_id)`                              |
| `xp_transactions`   | `id`, `student_id`, `material_id`, `attempt_id`, `amount`                                                                                                                    | **`uniqueIndex(student_id, material_id)`**                          |

---

## 3. Structural Rules

1. **Dilarang satu rich-text blob:** Teks bacaan wajib disimpan per halaman berurutan di `material_sections`.
2. **Proteksi hapus kategori:** `materials.category_id` menggunakan `onDelete: "restrict"`.
3. **Idempotensi XP:** `xp_transactions` mengandalkan `uniqueIndex(student_id, material_id)` sebagai penjaga terakhir terhadap _retake_ maupun _double-click race condition_.
