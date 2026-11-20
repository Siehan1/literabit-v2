# Literabit

Literabit is a web-based reading comprehension platform for children aged 6–12, parents, and administrators. This repository contains the **Milestone 0 Engineering Foundation**: Next.js 16 App Router, Bun runtime & package manager, PostgreSQL + Drizzle ORM schema and migration tooling, strict TypeScript/lint/format quality gates, local Docker infrastructure, CI workflow, and project documentation.

Product features from EPIC 01 through EPIC 06 (`docs/PRD.md`) are planned in `docs/TASK_BREAKDOWN.md` and implemented per milestone.

---

## Quick Onboard Guide

Prerequisites: **Bun `1.4.2`**, **Docker Desktop** (with Docker Compose), and **Git**.

### 1. Install dependencies

```powershell
bun install
```

### 2. Create the local environment file

```powershell
Copy-Item .env.example .env
```

Update `AUTH_SECRET` in `.env` if needed (minimum 32 characters). Local PostgreSQL uses port `5433`.

### 3. Start local infrastructure

```powershell
bun run infra:up
```

This starts PostgreSQL (`literabit` and `literabit_test`) and verifies the disposable test database.

### 4. Generate & apply database migrations + seed

```powershell
bun run db:generate
bun run db:migrate
bun run db:seed
```

### 5. Start the development server

```powershell
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Stack

| Layer         | Technology                                                                            |
| :------------ | :------------------------------------------------------------------------------------ |
| Runtime & PM  | Bun `1.4.2`                                                                           |
| Framework     | Next.js `16.4.6` (App Router, `cacheComponents`, `partialPrefetching`)                |
| UI & Styling  | React `19.3.0`, Tailwind CSS `4.3.3`, `lucide-react`, `shadcn/ui`                     |
| Language      | TypeScript `5.9` (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) |
| Database      | PostgreSQL 16 + Drizzle ORM (`postgres` driver)                                       |
| Validation    | Zod                                                                                   |
| Auth & Crypto | `jose` (signed HTTP-only cookies) + `bcryptjs`                                        |
| Lint & Format | `oxlint` + `oxfmt`                                                                    |
| Testing       | `bun:test`                                                                            |
| CI            | GitHub Actions (`quality`, `unit-and-build`, `integration`)                           |

---

## Repository Structure

```text
literabit-v2/
├── .github/                 CI workflows & PR template
├── .husky/                  Pre-commit (lint-staged) & Conventional Commit hooks
├── docs/                    PRD, Engineering Baseline, Architecture, Coding Standard & guides
├── infra/
│   └── local/               Local PostgreSQL Docker Compose & test DB bootstrap
├── src/
│   ├── app/                 Next.js App Router pages, layouts, and route handlers
│   ├── db/                  Drizzle client, schema (enums/tables/relations), migrations & seed
│   ├── lib/                 Server env config, session cookies, crypto, guards & utilities
│   └── modules/             Domain logic (auth, learning, assessment, gamification, cms)
└── test/
    ├── helpers/             Disposable test database guards & sanitizers
    ├── unit/                Fast unit tests (`bun test`)
    └── integration/         PostgreSQL integration tests (`RUN_INTEGRATION_TESTS=1`)
```
