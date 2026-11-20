# 04 — Authentication, Cookies & Security

---

## 1. Signed HTTP-Only Cookie Architecture

Semua cookie wajib memakai `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, `secure: process.env.NODE_ENV === "production"`, dan ditandatangani dengan `AUTH_SECRET` (`jose`).

| Cookie                  | Payload                        | TTL & Aturan                                                                                                                                       |
| :---------------------- | :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| `literabit_session`     | `{ userId, role, exp }`        | Login utama `PARENT` / `ADMIN` (mis. 7 hari).                                                                                                      |
| `literabit_student`     | `{ studentId, parentId, exp }` | Di-set saat Parent memilih profil di `/profiles`. Setiap request `/student/*` wajib memvalidasi `student.parentId === session.userId` di database. |
| `literabit_parent_gate` | `{ userId, verifiedAt, exp }`  | TTL pendek (**15 menit**). Terbit hanya setelah verifikasi 4-digit PIN terhadap `users.parent_pin_hash`.                                           |

Logout wajib menghapus ketiga cookie secara serentak.

---

## 2. Route Authorization Matrix

| Prefix Rute  | Syarat Sesi Wajib                                           | Perilaku Jika Tidak Memenuhi                                                                                 |
| :----------- | :---------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `/auth/*`    | Publik                                                      | Redirect ke `/profiles` atau `/admin` jika sudah login                                                       |
| `/profiles`  | `session.role === 'PARENT'`                                 | Redirect `/auth/login` (atau `/admin` jika `ADMIN`). Ganti profil dari `/student` wajib `parent_gate` valid. |
| `/student/*` | `session.role === 'PARENT'` + `literabit_student` valid     | Redirect `/auth/login` atau `/profiles`                                                                      |
| `/parent/*`  | `session.role === 'PARENT'` + `literabit_parent_gate` aktif | Tampilkan/redirect ke modal **Parent PIN Gate**                                                              |
| `/admin/*`   | `session.role === 'ADMIN'`                                  | Redirect `/auth/login` atau `403 Forbidden`                                                                  |

---

## 3. Database Isolation & Zod Validation Rules

- **Wajib filter kepemilikan:** Dilarang melakukan `WHERE id = :studentId` tanpa `AND parent_id = :sessionUserId`.
- **Jangan percaya client ID:** Mutasi `/student/*` wajib mengambil `studentId` dari `requireStudentSession()`.
- **Validasi Zod (`src/modules/*/schemas.ts`):**
  - Registrasi Parent: `fullName` (>= 2 char), `email` (lowercase valid), `password` (>= 8 char), `parentPin` (`/^\d{4}$/`).
  - Profil Anak: `displayName` (1–40 char), `birthYear` (`currentYear - 18` s.d. `currentYear - 4`), `avatar` (whitelist), `recommendedLevel` (`LEVEL_1`–`LEVEL_3`).
  - Soal Kuis: `options` (array string non-kosong panjang 3–4), `correctOptionIndex` (`0 <= idx < options.length`), `explanation` (non-kosong), `skillCategory` (`LITERAL` | `INFERENTIAL` | `VOCABULARY` | `MAIN_IDEA`).
