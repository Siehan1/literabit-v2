# Documentation Index

## Literabit: Web-Based Reading Comprehension Platform

Dokumentasi ini menjadi sumber kebenaran bersama (_single source of truth_) bagi tim **Frontend**, **Backend**, dan verifikasi penerimaan (_acceptance_).

## Start Here

| Document                                                           | Purpose                                                  |
| :----------------------------------------------------------------- | :------------------------------------------------------- |
| [../README.md](../README.md)                                       | Ringkasan proyek dan panduan setup cepat                 |
| [ONBOARDING_GUIDE.md](ONBOARDING_GUIDE.md)                         | Panduan hari pertama (_first-hour onboarding_)           |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)                       | Alur kerja lokal, migrasi DB, dan aturan branch/commit   |
| [business/milestone-breakdown.md](business/milestone-breakdown.md) | Pembagian paralel kerja Frontend & Backend per milestone |

## Product & Business (`docs/business/`)

| Document                                                           | Purpose                                                        |
| :----------------------------------------------------------------- | :------------------------------------------------------------- |
| [business/product-overview.md](business/product-overview.md)       | Gambaran produk, role, content tiering, dan aturan bisnis inti |
| [business/user-story.md](business/user-story.md)                   | Daftar User Stories EPIC 01–06 dan backlog P1                  |
| [business/acceptance-criteria.md](business/acceptance-criteria.md) | Matriks Acceptance Criteria (`AC-*`) dan NFR (`NFR-*`)         |
| [business/milestone-breakdown.md](business/milestone-breakdown.md) | Urutan delivery Milestone 0–5 & batas kerja FE/BE              |
| [PRD.md](PRD.md)                                                   | Dokumen induk PRD v0.2 (Lean MVP)                              |

## API Contracts (`docs/api-specs/`)

Kontrak bersama agar Frontend dan Backend dapat bekerja paralel:

| Document                                                                           | Purpose                                                  |
| :--------------------------------------------------------------------------------- | :------------------------------------------------------- |
| [api-specs/\_index.md](api-specs/_index.md)                                        | Daftar & status tracker seluruh endpoint `/api/v1/*`     |
| [api-specs/01-conventions.md](api-specs/01-conventions.md)                         | Envelope response, status code, dan aturan keamanan API  |
| [api-specs/02-auth-and-profiles.md](api-specs/02-auth-and-profiles.md)             | Kontrak Auth, Parent PIN Gate, dan Family Profiles       |
| [api-specs/03-learning-and-assessment.md](api-specs/03-learning-and-assessment.md) | Kontrak Katalog, Reader, Kuis, XP Idempoten, dan Progres |
| [api-specs/04-parent-dashboard.md](api-specs/04-parent-dashboard.md)               | Kontrak Parent Dashboard & Student Switcher              |
| [api-specs/05-admin-cms.md](api-specs/05-admin-cms.md)                             | Kontrak Admin CMS (Kategori, Materi, Sections, Soal)     |

## Technical Specifications (`docs/technical-specs/`)

| Document                                                                                       | Purpose                                                          |
| :--------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| [technical-specs/\_index.md](technical-specs/_index.md)                                        | Daftar isi spesifikasi teknis terpecah                           |
| [technical-specs/01-architecture-and-layers.md](technical-specs/01-architecture-and-layers.md) | Struktur direktori Next.js 16 & batas dependensi antar lapisan   |
| [technical-specs/02-data-model.md](technical-specs/02-data-model.md)                           | Skema PostgreSQL + Drizzle ORM (`pgEnum` & 10 tabel)             |
| [technical-specs/03-business-contracts.md](technical-specs/03-business-contracts.md)           | Kontrak skor, transaksi XP, leveling, routing, & guardrail CMS   |
| [technical-specs/04-auth-and-security.md](technical-specs/04-auth-and-security.md)             | Signed HTTP-only cookies, matriks rute, isolasi query & Zod      |
| [technical-specs/05-ui-and-a11y.md](technical-specs/05-ui-and-a11y.md)                         | Standar tipografi pembaca, modal "Lihat Bacaan", & aksesibilitas |
| [technical-specs/06-environment-and-testing.md](technical-specs/06-environment-and-testing.md) | Validasi env, disposable test DB, dan strategi `bun:test`        |
| [ENGINEERING_BASELINE.md](ENGINEERING_BASELINE.md)                                             | Dokumen induk Engineering Baseline                               |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                                             | Ringkasan arsitektur tingkat tinggi                              |
| [CODING_STANDARD.md](CODING_STANDARD.md)                                                       | Standar implementasi kode & `oxlint`/`oxfmt`                     |
| [CODE_REVIEW_CHECKLIST.md](CODE_REVIEW_CHECKLIST.md)                                           | Checklist self-review sebelum membuka PR                         |

## Operations & Execution

| Document                                             | Purpose                                                |
| :--------------------------------------------------- | :----------------------------------------------------- |
| [TASK_BREAKDOWN.md](TASK_BREAKDOWN.md)               | Milestone 0 (Shared + DB) & indeks track terpisah      |
| [TASK_BREAKDOWN_BE.md](TASK_BREAKDOWN_BE.md)         | Milestone 1–5 khusus tim Backend (`BE-M1`–`BE-M5`)     |
| [TASK_BREAKDOWN_FE.md](TASK_BREAKDOWN_FE.md)         | Milestone 1–5 khusus tim Frontend (`FE-M1`–`FE-M5`)    |
| [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) | Diagnosis kendala Bun, Docker, Drizzle, dan Next.js 16 |
