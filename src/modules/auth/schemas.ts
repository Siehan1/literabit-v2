import { z } from "zod";

const MAX_BCRYPT_PASSWORD_BYTES = 72;

function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export const registerParentSchema = z.object(
  {
    fullName: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "Nama lengkap wajib diisi."
            : "Nama lengkap harus berupa teks.",
      })
      .trim()
      .min(2, { error: "Nama lengkap minimal 2 karakter." })
      .max(120, { error: "Nama lengkap maksimal 120 karakter." }),
    email: z
      .string({
        error: (issue) =>
          issue.input === undefined ? "Email wajib diisi." : "Format email tidak valid.",
      })
      .trim()
      .toLowerCase()
      .min(1, { error: "Email wajib diisi." })
      .max(254, { error: "Email maksimal 254 karakter." })
      .pipe(z.email({ error: "Format email tidak valid." })),
    password: z
      .string({
        error: (issue) =>
          issue.input === undefined ? "Kata sandi wajib diisi." : "Kata sandi harus berupa teks.",
      })
      .min(8, { error: "Kata sandi minimal 8 karakter." })
      .refine((value) => getUtf8ByteLength(value) <= MAX_BCRYPT_PASSWORD_BYTES, {
        error: "Kata sandi maksimal 72 byte.",
      }),
    parentPin: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "PIN orang tua wajib diisi."
            : "PIN orang tua harus terdiri dari 4 digit angka.",
      })
      .regex(/^\d{4}$/, { error: "PIN orang tua harus terdiri dari 4 digit angka." }),
  },
  { error: "Body permintaan harus berupa objek JSON." },
);

export type RegisterParentInput = z.infer<typeof registerParentSchema>;

export type RegisteredParentUser = {
  id: string;
  fullName: string;
  email: string;
  role: "PARENT";
};
