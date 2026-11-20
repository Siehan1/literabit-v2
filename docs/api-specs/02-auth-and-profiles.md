# API Spec: Auth, Parent Gate & Family Profiles

**Scope:** EPIC 01 (`US-001` – `US-004`)  
**Milestone:** Milestone 1

---

## 1. `POST /api/v1/auth/register` (`US-001`)

- **Access:** Publik.
- **Request Body (Zod):**
  ```json
  {
    "fullName": "Budi Santoso",
    "email": "budi@example.com",
    "password": "password123",
    "parentPin": "1234"
  }
  ```
- **Rules:** `fullName` min 2 char, `email` lowercase valid & unik (`409` jika sudah ada), `password` min 8 char, `parentPin` `/^\d{4}$/`. Hash `password` & `parentPin` dengan `bcryptjs`. Set cookie `literabit_session` (`role: "PARENT"`).
- **Response `201`:** `{ user: { id, fullName, email, role: "PARENT" } }`.

## 2. `POST /api/v1/auth/login` (`US-002`)

- **Access:** Publik.
- **Request Body:** `{ "email": "string", "password": "string" }`
- **Rules:** Verifikasi hash password untuk `PARENT` dan `ADMIN`. Set cookie `literabit_session` (7 hari) dan hapus cookie `literabit_student` / `literabit_parent_gate` lama.
- **Response `200`:** `{ user: { id, fullName, email, role }, redirectTo: "/profiles" | "/admin" }`.

## 3. `POST /api/v1/auth/logout` (`AC-002.4`)

- **Access:** Terautentikasi atau publik (idempoten).
- **Behavior:** Menghapus `literabit_session`, `literabit_student`, dan `literabit_parent_gate` secara serentak.
- **Response `200`:** `{ loggedOut: true }`.

## 4. `GET /api/v1/auth/me`

- **Access:** `literabit_session` aktif (`401` jika tidak ada).
- **Response `200`:** `{ user: { id, fullName, email, role }, activeStudent: { id, displayName, avatar, recommendedLevel, totalXp, level } | null, parentGateVerified: boolean }`.

## 5. `POST /api/v1/auth/parent-gate/verify` (`AC-002.2`, `AC-002.3`)

- **Access:** `session.role === "PARENT"`.
- **Request Body:** `{ "parentPin": "1234" }`
- **Behavior:** Verifikasi terhadap `users.parent_pin_hash`. Jika cocok, terbitkan cookie `literabit_parent_gate` berdurasi 15 menit. Jika salah, return `403` (`INVALID_PARENT_PIN`).

## 6. `GET /api/v1/profiles` & `POST /api/v1/profiles/select` (`US-004`)

- **`GET /api/v1/profiles`:** Wajib `session.role === "PARENT"`. Mengembalikan daftar anak `WHERE parent_id = session.userId`.
- **`POST /api/v1/profiles/select`:** Body `{ "studentId": "uuid" }`. Wajib `session.role === "PARENT"`; jika sudah ada `literabit_student` aktif sebelumnya (ganti profil dari ruang anak), wajib `literabit_parent_gate` valid (`403 PARENT_GATE_REQUIRED`). Verifikasi `WHERE id = studentId AND parent_id = session.userId` (`404` jika tidak ditemukan), lalu set cookie `literabit_student`.

## 7. `POST / PATCH / DELETE /api/v1/parent/students` (`US-003`)

- **Access:** `session.role === "PARENT"` **dan** `literabit_parent_gate` aktif (`403 PARENT_GATE_REQUIRED` jika belum verifikasi PIN).
- **Body (`POST` / `PATCH`):** `{ "displayName": "Alya", "birthYear": 2017, "avatar": "owl", "recommendedLevel": "LEVEL_1" }`.
- **Security:** Seluruh query mutasi/baca menyertakan `AND parent_id = session.userId`.
