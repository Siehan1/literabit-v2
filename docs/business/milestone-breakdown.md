# Milestone Breakdown (Shared M0 + Separate Backend & Frontend Tracks)

Dokumen ini memetakan urutan pengerjaan **Milestone 0 (Shared + Database)** diikuti oleh **Backend Milestones (`BE-M1`–`BE-M5`)** dan **Frontend Milestones (`FE-M1`–`FE-M5`)** yang berjalan paralel berdasarkan kontrak [../api-specs/\_index.md](../api-specs/_index.md).

---

## 1. Shared Foundation (Milestone 0)

| Milestone                | Fokus Utama                                                                                                                                                       | Status   |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| **Milestone 0 (Shared)** | Bootstrap Bun, `oxlint`/`oxfmt`, Docker PostgreSQL, **seluruh setup skema & migrasi Database (`DB-M0-*`)**, env/session helpers (`M0-03`), dan UI base (`M0-04`). | **Done** |

---

## 2. Backend vs Frontend Milestone Matrix

| Milestone       | Scope Produk                                                   | Backend Milestone                                                                               | Frontend Milestone                                                                              |
| :-------------- | :------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Milestone 1** | Auth, Parent PIN Gate, Family Profiles (`US-001` – `US-004`)   | `BE-M1`: Register, login, logout, PIN gate API, CRUD profil anak & profile select               | `FE-M1`: Pages `/auth/*`, Netflix-style `/profiles`, Parent Gate modal & `/parent/profiles`     |
| **Milestone 2** | Admin Lean CMS (`US-014` – `US-016`)                           | `BE-M2`: Categories API (delete guard), Materials + sections + publish guardrail, Questions API | `FE-M2`: `/admin/categories`, `/admin/materials` section editor & question bank UI              |
| **Milestone 3** | Student Catalog & Guided Reader (`US-005` – `US-006`)          | `BE-M3`: Catalog `PUBLISHED` + filter API, detail reader & save `last_section_index`            | `FE-M3`: `/student` katalog & filter, `/student/materials/[slug]` reader NFR-001                |
| **Milestone 4** | Quiz, Idempotent XP, Leveling & Progress (`US-007` – `US-011`) | `BE-M4`: Fetch soal, transaksi submit kuis + `xp_transactions` unique + progress summary API    | `FE-M4`: Layar kuis + drawer **"Lihat Bacaan"**, layar hasil + pembahasan + `/student/progress` |
| **Milestone 5** | Parent Dashboard & Hardening (`US-012` – `US-013`, NFR)        | `BE-M5`: Parent summary API, attention flag `< 60%`, & integration tests isolasi/idempotensi    | `FE-M5`: `/parent` switcher & evaluasi, penanda pendampingan, audit WCAG AA & responsivitas     |

---

## 3. Aturan Sinkronisasi Paralel

1. **Database diselesaikan di Milestone 0:** Seluruh 10 tabel, `pgEnum`, migrasi awal, dan seeder di `src/db/` disiapkan di M0 agar `BE-M1`–`BE-M5` langsung membangun di atas skema final MVP.
2. **Kontrak API menjadi pagar bersama:** Tim Frontend membangun UI dan validasi form berdasarkan `docs/api-specs/*.md` serta Zod schema di `src/modules/*/schemas.ts` tanpa perlu menunggu implementasi server selesai.
3. **Perubahan kontrak:** Setiap perubahan field request/response wajib memperbarui `docs/api-specs/*.md` terlebih dahulu sebelum PR digabungkan.
