# Frontend Task Breakdown (`FE-M1` – `FE-M5`)

Dokumen ini berisi seluruh milestone khusus tim **Frontend** setelah **Milestone 0 (Shared + Database)** di [TASK_BREAKDOWN.md](TASK_BREAKDOWN.md) selesai.  
Kontrak request/response yang dikonsumsi UI mengacu pada [api-specs/\_index.md](api-specs/_index.md).

---

## Frontend Milestone 1 — Auth, Profile Picker & Parent Gate UI (EPIC 01)

| Card ID    | Title                                                              | US / AC        | Contract                                                               | Status  |
| :--------- | :----------------------------------------------------------------- | :------------- | :--------------------------------------------------------------------- | :------ |
| `FE-M1-01` | Register Parent & Login Pages (`/auth/register`, `/auth/login`)    | US-001, US-002 | [api-specs/02-auth-and-profiles.md](api-specs/02-auth-and-profiles.md) | Planned |
| `FE-M1-02` | Netflix-Style Profile Picker (`/profiles`) & Logout Control        | US-002, US-004 | [api-specs/02-auth-and-profiles.md](api-specs/02-auth-and-profiles.md) | Planned |
| `FE-M1-03` | Parent PIN Gate Modal & Manage Child Profiles (`/parent/profiles`) | US-002, US-003 | [api-specs/02-auth-and-profiles.md](api-specs/02-auth-and-profiles.md) | Planned |

---

## Frontend Milestone 2 — Admin Lean CMS UI (EPIC 06)

| Card ID    | Title                                                             | US / AC        | Contract                                               | Status  |
| :--------- | :---------------------------------------------------------------- | :------------- | :----------------------------------------------------- | :------ |
| `FE-M2-01` | Admin Categories Manager (`/admin/categories`)                    | US-014         | [api-specs/05-admin-cms.md](api-specs/05-admin-cms.md) | Planned |
| `FE-M2-02` | Admin Materials & Sequential Sections Editor (`/admin/materials`) | US-015         | [api-specs/05-admin-cms.md](api-specs/05-admin-cms.md) | Planned |
| `FE-M2-03` | Admin Question Bank & Publish Guardrail Feedback UI               | US-015, US-016 | [api-specs/05-admin-cms.md](api-specs/05-admin-cms.md) | Planned |

---

## Frontend Milestone 3 — Student Catalog & Guided Reader UI (EPIC 02)

| Card ID    | Title                                                                                 | US / AC         | Contract                                                                           | Status  |
| :--------- | :------------------------------------------------------------------------------------ | :-------------- | :--------------------------------------------------------------------------------- | :------ |
| `FE-M3-01` | Student Catalog, Difficulty/Category Filters & Status Badges (`/student`)             | US-005          | [api-specs/03-learning-and-assessment.md](api-specs/03-learning-and-assessment.md) | Planned |
| `FE-M3-02` | Guided Section Reader, Typography NFR-001 & Quiz Unlock (`/student/materials/[slug]`) | US-006, NFR-001 | [technical-specs/05-ui-and-a11y.md](technical-specs/05-ui-and-a11y.md)             | Planned |

---

## Frontend Milestone 4 — Quiz, Results & Student Progress UI (EPIC 03 & EPIC 04)

| Card ID    | Title                                                             | US / AC                | Contract                                                                           | Status  |
| :--------- | :---------------------------------------------------------------- | :--------------------- | :--------------------------------------------------------------------------------- | :------ |
| `FE-M4-01` | Quiz Runner Screen & Responsive Drawer **"Lihat Bacaan"**         | US-007, NFR-002        | [technical-specs/05-ui-and-a11y.md](technical-specs/05-ui-and-a11y.md)             | Planned |
| `FE-M4-02` | Quiz Result, Answer Explanations, Level-Up Banner & Next-Step CTA | US-008, US-009, US-010 | [api-specs/03-learning-and-assessment.md](api-specs/03-learning-and-assessment.md) | Planned |
| `FE-M4-03` | Student Progress & Reading History Page (`/student/progress`)     | US-011                 | [api-specs/03-learning-and-assessment.md](api-specs/03-learning-and-assessment.md) | Planned |

---

## Frontend Milestone 5 — Parent Dashboard & Responsive/A11y Polish (EPIC 05)

| Card ID    | Title                                                                   | US / AC          | Contract                                                             | Status  |
| :--------- | :---------------------------------------------------------------------- | :--------------- | :------------------------------------------------------------------- | :------ |
| `FE-M5-01` | Parent Dashboard, Student Switcher & Activity Log (`/parent`)           | US-012           | [api-specs/04-parent-dashboard.md](api-specs/04-parent-dashboard.md) | Planned |
| `FE-M5-02` | Parent Evaluation Table & _"Perlu Pendampingan / Baca Ulang"_ Indicator | US-013           | [api-specs/04-parent-dashboard.md](api-specs/04-parent-dashboard.md) | Planned |
| `FE-M5-03` | Responsive Audit, WCAG AA Contrast & End-to-End Integration Check       | NFR-001, NFR-002 | [CODE_REVIEW_CHECKLIST.md](CODE_REVIEW_CHECKLIST.md)                 | Planned |
