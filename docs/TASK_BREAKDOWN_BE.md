# Backend Task Breakdown (`BE-M1` – `BE-M5`)

Dokumen ini berisi seluruh milestone khusus tim **Backend** setelah **Milestone 0 (Shared + Database)** di [TASK_BREAKDOWN.md](TASK_BREAKDOWN.md) selesai.  
Kontrak API bersama dengan tim Frontend mengacu pada [api-specs/\_index.md](api-specs/_index.md).

---

## Backend Milestone 1 — Auth, Parent Gate & Family Profiles (EPIC 01)

| Card ID    | Title                                        | US / AC                     | Contract                                                               | Status  |
| :--------- | :------------------------------------------- | :-------------------------- | :--------------------------------------------------------------------- | :------ |
| `BE-M1-01` | Parent Registration & Password/PIN Hashing   | US-001 (AC-001.1–001.3)     | [api-specs/02-auth-and-profiles.md](api-specs/02-auth-and-profiles.md) | Planned |
| `BE-M1-02` | Login, Logout & `/api/v1/auth/me`            | US-002 (AC-002.1, AC-002.4) | [api-specs/02-auth-and-profiles.md](api-specs/02-auth-and-profiles.md) | Planned |
| `BE-M1-03` | Parent PIN Gate (`/parent-gate/verify`)      | US-002 (AC-002.2, AC-002.3) | [api-specs/02-auth-and-profiles.md](api-specs/02-auth-and-profiles.md) | Planned |
| `BE-M1-04` | Student Profiles CRUD & Profile Switcher API | US-003, US-004              | [api-specs/02-auth-and-profiles.md](api-specs/02-auth-and-profiles.md) | Planned |

---

## Backend Milestone 2 — Lean Admin CMS API (EPIC 06)

| Card ID    | Title                                             | US / AC                     | Contract                                               | Status  |
| :--------- | :------------------------------------------------ | :-------------------------- | :----------------------------------------------------- | :------ |
| `BE-M2-01` | Admin Categories API & Delete Guardrail           | US-014 (AC-014.1, AC-014.2) | [api-specs/05-admin-cms.md](api-specs/05-admin-cms.md) | Planned |
| `BE-M2-02` | Admin Materials, Sections & Publish Guardrail API | US-015 (AC-015.1–015.3)     | [api-specs/05-admin-cms.md](api-specs/05-admin-cms.md) | Planned |
| `BE-M2-03` | Admin Questions Bank API                          | US-016 (AC-016.1, AC-016.2) | [api-specs/05-admin-cms.md](api-specs/05-admin-cms.md) | Planned |

---

## Backend Milestone 3 — Student Catalog & Reader Progress API (EPIC 02)

| Card ID    | Title                                              | US / AC                 | Contract                                                                           | Status  |
| :--------- | :------------------------------------------------- | :---------------------- | :--------------------------------------------------------------------------------- | :------ |
| `BE-M3-01` | Published Catalog & Filter API                     | US-005 (AC-005.1–005.3) | [api-specs/03-learning-and-assessment.md](api-specs/03-learning-and-assessment.md) | Planned |
| `BE-M3-02` | Material Reader Detail & Save Section Progress API | US-006 (AC-006.1–006.4) | [api-specs/03-learning-and-assessment.md](api-specs/03-learning-and-assessment.md) | Planned |

---

## Backend Milestone 4 — Quiz Grading, Idempotent XP & Student Progress API (EPIC 03 & EPIC 04)

| Card ID    | Title                                                        | US / AC                | Contract                                                                             | Status  |
| :--------- | :----------------------------------------------------------- | :--------------------- | :----------------------------------------------------------------------------------- | :------ |
| `BE-M4-01` | Quiz Fetch & Transactional Submit + Idempotent XP            | US-007 – US-010        | [technical-specs/03-business-contracts.md](technical-specs/03-business-contracts.md) | Planned |
| `BE-M4-02` | Level Calculation, Rule-Based Routing & Student Progress API | US-008, US-010, US-011 | [api-specs/03-learning-and-assessment.md](api-specs/03-learning-and-assessment.md)   | Planned |

---

## Backend Milestone 5 — Parent Dashboard API & Backend Hardening (EPIC 05)

| Card ID    | Title                                                              | US / AC          | Contract                                                                                       | Status  |
| :--------- | :----------------------------------------------------------------- | :--------------- | :--------------------------------------------------------------------------------------------- | :------ |
| `BE-M5-01` | Parent Dashboard & Student Evaluation Summary API                  | US-012, US-013   | [api-specs/04-parent-dashboard.md](api-specs/04-parent-dashboard.md)                           | Planned |
| `BE-M5-02` | Integration Tests: Cross-Family Isolation, XP Race & CMS Guardrail | NFR-003, NFR-004 | [technical-specs/06-environment-and-testing.md](technical-specs/06-environment-and-testing.md) | Planned |
