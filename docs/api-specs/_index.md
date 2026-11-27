# API Specification Index

## Literabit: Web-Based Reading Comprehension Platform

**Version:** 1.0.0  
**Base URL:** `/api/v1` (Next.js App Router Route Handlers di `src/app/api/v1/`)  
**Status:** Foundation active — seluruh endpoint bisnis berstatus `PLANNED` sebagai kontrak paralel tim Frontend & Backend.

Legend:

- `OK`: diimplementasikan dan teruji.
- `PLANNED`: disepakati di PRD & Engineering Baseline, menunggu implementasi milestone terkait.
- `TECHNICAL`: kapabilitas infrastruktur/kesehatan sistem.

---

## Endpoint Status Tracker

### System ([01-conventions.md](01-conventions.md))

```text
OK      GET  /api/v1/health
```

### Auth, Parent Gate & Family Profiles ([02-auth-and-profiles.md](02-auth-and-profiles.md))

```text
OK      POST   /api/v1/auth/register
OK      POST   /api/v1/auth/login
OK      POST   /api/v1/auth/logout
OK      GET    /api/v1/auth/me
PLANNED POST   /api/v1/auth/parent-gate/verify
PLANNED GET    /api/v1/profiles
PLANNED POST   /api/v1/profiles/select
PLANNED POST   /api/v1/parent/students
PLANNED PATCH  /api/v1/parent/students/:studentId
PLANNED DELETE /api/v1/parent/students/:studentId
```

### Student Catalog, Reader, Quiz & Progress ([03-learning-and-assessment.md](03-learning-and-assessment.md))

```text
PLANNED GET  /api/v1/student/materials
PLANNED GET  /api/v1/student/materials/:slug
PLANNED PUT  /api/v1/student/materials/:materialId/progress
PLANNED GET  /api/v1/student/materials/:materialId/quiz
PLANNED POST /api/v1/student/materials/:materialId/quiz/submit
PLANNED GET  /api/v1/student/progress
```

### Parent Dashboard ([04-parent-dashboard.md](04-parent-dashboard.md))

```text
PLANNED GET /api/v1/parent/dashboard
PLANNED GET /api/v1/parent/students/:studentId/summary
```

### Admin Lean CMS ([05-admin-cms.md](05-admin-cms.md))

```text
PLANNED GET    /api/v1/admin/categories
PLANNED POST   /api/v1/admin/categories
PLANNED PATCH  /api/v1/admin/categories/:categoryId
PLANNED DELETE /api/v1/admin/categories/:categoryId

PLANNED GET    /api/v1/admin/materials
PLANNED POST   /api/v1/admin/materials
PLANNED GET    /api/v1/admin/materials/:materialId
PLANNED PATCH  /api/v1/admin/materials/:materialId
PLANNED POST   /api/v1/admin/materials/:materialId/status
PLANNED PUT    /api/v1/admin/materials/:materialId/sections

PLANNED GET    /api/v1/admin/materials/:materialId/questions
PLANNED POST   /api/v1/admin/materials/:materialId/questions
PLANNED PATCH  /api/v1/admin/materials/:materialId/questions/:questionId
PLANNED DELETE /api/v1/admin/materials/:materialId/questions/:questionId
```
