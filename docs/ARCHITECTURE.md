# Literabit Architecture

**Version:** 1.0.0  
**Status:** Milestone 0 Foundation Active  
**Reference:** [PRD.md](PRD.md) & [ENGINEERING_BASELINE.md](ENGINEERING_BASELINE.md)

Literabit dibangun sebagai **Next.js 16 App Router modular monolith** di atas **Bun** dan **PostgreSQL (Drizzle ORM)**.

---

## 1. Architectural Style & Layering

```text
+-------------------------------------------------------------------+
|                        src/app/ (Presentation)                    |
|   Server Components, Client Components, Server Actions, Routes    |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                   src/modules/ (Domain Services)                  |
|    auth  |  learning  |  assessment  |  gamification  |  cms      |
|    (schemas.ts, service.ts, rules.ts — zero UI dependencies)      |
+---------------------------------+---------------------------------+
                                  |
             +--------------------+--------------------+
             v                                         v
+-------------------------+               +-------------------------+
|   src/lib/ (Platform)   |               |   src/db/ (Persistence)   |
| env, crypto, session,   |               | PostgresJs + Drizzle    |
| guards, storage         |               | schema, migrations,     |
+-------------------------+               | seed                    |
                                          +-------------------------+
```

### Dependency Direction Rules

1. `src/app/` hanya memanggil `src/modules/` dan `src/lib/` (seperti `guards.ts`). Komponen UI dan Route Handler dilarang menulis query Drizzle mentah secara langsung.
2. `src/modules/<domain>/` mengisolasi aturan bisnis, skema Zod (`schemas.ts`), fungsi murni (`rules.ts`), dan akses DB (`service.ts`).
3. `src/modules/assessment` memanggil `src/modules/gamification` di dalam **satu transaksi DB atomik** (`await db.transaction(...)`) saat pengiriman kuis.
4. `src/db/` hanya berisi definisi skema (`pgEnum`, `pgTable`, `relations`), client koneksi, migrator, dan seeder.

---

## 2. Session & Access Isolation Architecture

Literabit menggunakan tiga **signed HTTP-only cookies** (`jose`, ditandatangani dengan `AUTH_SECRET`):

| Cookie                  | Payload                        | Scope & Guard                                                                                                       |
| :---------------------- | :----------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| `literabit_session`     | `{ userId, role, exp }`        | Login utama akun `PARENT` atau `ADMIN`.                                                                             |
| `literabit_student`     | `{ studentId, parentId, exp }` | Profil anak aktif; setiap akses `/student/*` wajib memverifikasi `student.parentId === session.userId` di database. |
| `literabit_parent_gate` | `{ userId, verifiedAt, exp }`  | Verifikasi Parent PIN 4-digit (masa berlaku singkat, mis. 15 menit) untuk `/parent/*` dan ganti profil.             |

Seluruh kueri kepemilikan anak wajib memfilter `parentId` / `studentId` dari sesi server terverifikasi, bukan dari parameter/body client.

---

## 3. Data & Idempotency Model

Skema PostgreSQL di `src/db/schema/` memodelkan:

- **Identitas & Keluarga:** `users`, `students`
- **Kurikulum & Bacaan:** `categories`, `materials`, `material_sections` (per halaman, berurutan `0..N-1`), `questions`
- **Evaluasi & Gamifikasi:** `reading_progress`, `quiz_attempts`, `attempt_answers` (log granular per butir soal), `xp_transactions`

**Jaminan Integritas Kritis:**

- `xp_transactions` memiliki `uniqueIndex(student_id, material_id)` sehingga _retake_ atau _double-submit_ tidak pernah menggandakan XP (`0 XP` setelah percobaan pertama).
- `categories` -> `materials` memakai `onDelete: "restrict"` untuk mencegah penghapusan kategori yang masih memiliki materi.
