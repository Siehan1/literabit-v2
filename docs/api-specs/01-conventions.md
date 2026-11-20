# API Conventions

Kontrak bersama antara tim **Frontend** (`src/app/`) dan **Backend** (`src/app/api/v1/` + `src/modules/`).

---

## 1. Base URL

Seluruh Route Handler HTTP berada di bawah:

```text
/api/v1
```

---

## 2. Success Envelope

```json
{
  "success": true,
  "data": {}
}
```

Dengan pagination (jika diperlukan pada katalog/daftar):

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

---

## 3. Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid.",
    "details": [
      {
        "field": "parentPin",
        "message": "PIN orang tua harus terdiri dari 4 digit angka."
      }
    ]
  }
}
```

---

## 4. Binding Contract Rules

1. **Error `code`:** English uppercase identifier yang stabil (`UNAUTHORIZED`, `FORBIDDEN`, `PARENT_GATE_REQUIRED`, `VALIDATION_ERROR`, `CMS_PUBLISH_GUARDRAIL`, `CATEGORY_IN_USE`, `NOT_FOUND`, `CONFLICT`).
2. **Error `message`:** Bahasa Indonesia yang jelas untuk ditampilkan atau dipetakan oleh Frontend.
3. **Session & Ownership:** Backend tidak pernah menerima `parentId`, `studentId`, `score`, atau `xpAwarded` dari body/query client untuk ruang belajar anak (`studentId` diambil eksklusif dari signed cookie `literabit_student` yang tervalidasi terhadap `session.userId`).
4. **Sanitized Errors:** Handler tidak boleh membocorkan stack trace, SQL query, hash password/PIN, atau `AUTH_SECRET`.

---

## 5. Standard HTTP Status Codes

| Status | Makna                                                                                          |
| :----- | :--------------------------------------------------------------------------------------------- |
| `200`  | Sukses membaca/memperbarui resource                                                            |
| `201`  | Sukses membuat resource baru                                                                   |
| `400`  | Request tidak valid / malformasi JSON                                                          |
| `401`  | Belum login (`literabit_session` tidak ada atau kedaluwarsa)                                   |
| `403`  | Role tidak berhak, kepemilikan keluarga tidak cocok, atau `PARENT_GATE_REQUIRED`               |
| `404`  | Resource tidak ditemukan (termasuk jika tidak dimiliki `parentId` terkait)                     |
| `409`  | Konflik unik (mis. `email` atau `slug` sudah terdaftar)                                        |
| `422`  | Aturan bisnis gagal (mis. publish materi `< 1` section / `< 3` soal, hapus kategori bermateri) |
| `500`  | Kesalahan server internal                                                                      |
