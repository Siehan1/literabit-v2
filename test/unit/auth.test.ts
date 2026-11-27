import { describe, expect, spyOn, test } from "bun:test";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { LiterabitSchema } from "../../src/db";
import {
  apiSuccess,
  apiValidationError,
  handleApiRouteError,
  NO_STORE_HEADERS,
  parseJsonBody,
} from "../../src/lib/api-response";
import { hashSecret } from "../../src/lib/crypto";
import { GuardError } from "../../src/lib/guards";
import { loginSchema } from "../../src/modules/auth/schemas";
import {
  AuthError,
  authenticateUser,
  getAuthSessionContext,
  getLoginRedirectPath,
} from "../../src/modules/auth/service";

function createFakeSelectDb(resultQueue: unknown[][]): {
  db: PostgresJsDatabase<LiterabitSchema>;
  queryCount: () => number;
} {
  let count = 0;

  const fakeDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            const rows = resultQueue[count] ?? [];
            count += 1;
            return rows;
          },
        }),
      }),
    }),
  };

  return {
    db: fakeDb as unknown as PostgresJsDatabase<LiterabitSchema>,
    queryCount: () => count,
  };
}

describe("auth loginSchema", () => {
  test("normalizes email and preserves password spaces", () => {
    const parsed = loginSchema.safeParse({
      email: "  Admin@Literabit.Local  ",
      password: " pass with spaces ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        email: "admin@literabit.local",
        password: " pass with spaces ",
      });
    }
  });

  test("rejects missing, invalid, wrong-type, non-object, and over-72-byte inputs in Indonesian", () => {
    const nonObject = loginSchema.safeParse(null);
    expect(nonObject.success).toBe(false);
    if (!nonObject.success) {
      expect(nonObject.error.issues[0]?.message).toBe("Body permintaan harus berupa objek JSON.");
    }

    const missingFields = loginSchema.safeParse({});
    expect(missingFields.success).toBe(false);
    if (!missingFields.success) {
      const byField = Object.fromEntries(
        missingFields.error.issues.map((issue) => [issue.path.join("."), issue.message]),
      );
      expect(byField.email).toBe("Email wajib diisi.");
      expect(byField.password).toBe("Kata sandi wajib diisi.");
    }

    const wrongTypes = loginSchema.safeParse({ email: 123, password: true });
    expect(wrongTypes.success).toBe(false);
    if (!wrongTypes.success) {
      const byField = Object.fromEntries(
        wrongTypes.error.issues.map((issue) => [issue.path.join("."), issue.message]),
      );
      expect(byField.email).toBe("Format email tidak valid.");
      expect(byField.password).toBe("Kata sandi harus berupa teks.");
    }

    const emptyParsed = loginSchema.safeParse({ email: "   ", password: "" });
    expect(emptyParsed.success).toBe(false);
    if (!emptyParsed.success) {
      const fields = emptyParsed.error.issues.map((issue) => issue.path.join("."));
      expect(fields).toContain("email");
      expect(fields).toContain("password");
    }

    const badEmail = loginSchema.safeParse({ email: "bukan-email", password: "password123" });
    expect(badEmail.success).toBe(false);
    if (!badEmail.success) {
      expect(badEmail.error.issues[0]?.path).toEqual(["email"]);
      expect(badEmail.error.issues[0]?.message).toBe("Format email tidak valid.");
    }

    expect(
      loginSchema.safeParse({ email: "budi@example.com", password: "a".repeat(72) }).success,
    ).toBe(true);

    const over72Ascii = loginSchema.safeParse({
      email: "budi@example.com",
      password: "a".repeat(73),
    });
    expect(over72Ascii.success).toBe(false);
    if (!over72Ascii.success) {
      expect(over72Ascii.error.issues[0]?.message).toBe("Kata sandi maksimal 72 byte.");
    }

    const over72Utf8 = loginSchema.safeParse({
      email: "budi@example.com",
      password: "😀".repeat(19),
    });
    expect(over72Utf8.success).toBe(false);
  });
});

describe("api-response helpers for auth boundaries", () => {
  test("parseJsonBody and apiValidationError propagate Cache-Control: no-store headers", async () => {
    const validRequest = new Request("http://localhost/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "Budi@Example.com", password: "password123" }),
    });
    const parsedBody = await parseJsonBody(validRequest, undefined, NO_STORE_HEADERS);
    expect(parsedBody).toEqual({
      ok: true,
      data: { email: "Budi@Example.com", password: "password123" },
    });

    const malformed = await parseJsonBody(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad-json",
      }),
      undefined,
      NO_STORE_HEADERS,
    );
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) {
      expect(malformed.response.status).toBe(400);
      expect(malformed.response.headers.get("Cache-Control")).toBe("no-store");
      expect((await malformed.response.json()).error.code).toBe("VALIDATION_ERROR");
    }

    const oversized = await parseJsonBody(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": "99999" },
        body: "{}",
      }),
      1024,
      NO_STORE_HEADERS,
    );
    expect(oversized.ok).toBe(false);
    if (!oversized.ok) {
      expect(oversized.response.status).toBe(413);
      expect(oversized.response.headers.get("Cache-Control")).toBe("no-store");
      expect((await oversized.response.json()).error.code).toBe("PAYLOAD_TOO_LARGE");
    }

    const invalidResult = loginSchema.safeParse(null);
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      const validationRes = apiValidationError(invalidResult.error, NO_STORE_HEADERS);
      expect(validationRes.status).toBe(400);
      expect(validationRes.headers.get("Cache-Control")).toBe("no-store");
      expect(await validationRes.json()).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data yang dikirim tidak valid.",
          details: [{ field: "body", message: "Body permintaan harus berupa objek JSON." }],
        },
      });
    }
  });

  test("maps GuardError and logs unexpected errors safely without leaking messages", async () => {
    const okRes = apiSuccess({ loggedOut: true }, { headers: NO_STORE_HEADERS });
    expect(okRes.headers.get("Cache-Control")).toBe("no-store");

    const guardErrRes = handleApiRouteError(
      new GuardError(401, "UNAUTHORIZED", "Silakan masuk terlebih dahulu."),
      NO_STORE_HEADERS,
    );
    expect(guardErrRes.status).toBe(401);
    expect(guardErrRes.headers.get("Cache-Control")).toBe("no-store");

    const consoleSpy = spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const dbError = Object.assign(new Error("postgres password leaked"), { code: "08006" });
      const unknownErrRes = handleApiRouteError(dbError, NO_STORE_HEADERS);
      expect(unknownErrRes.status).toBe(500);
      expect(unknownErrRes.headers.get("Cache-Control")).toBe("no-store");
      expect(await unknownErrRes.json()).toEqual({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Terjadi kesalahan pada server. Silakan coba lagi.",
        },
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const loggedPayload = String(consoleSpy.mock.calls[0]?.[0] ?? "");
      expect(loggedPayload).not.toContain("postgres password leaked");
      expect(JSON.parse(loggedPayload)).toEqual({
        level: "error",
        event: "api_route_unexpected_error",
        errorName: "Error",
        errorCode: "08006",
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

describe("auth service login and session context", () => {
  test("maps role to expected redirect path", () => {
    expect(getLoginRedirectPath("PARENT")).toBe("/profiles");
    expect(getLoginRedirectPath("ADMIN")).toBe("/admin");
  });

  test("authenticates PARENT and ADMIN users without exposing hashes", async () => {
    const passwordHash = await hashSecret("Rahasia123!");
    const parentId = "11111111-1111-4111-8111-111111111111";
    const adminId = "22222222-2222-4222-8222-222222222222";

    const parentDb = createFakeSelectDb([
      [
        {
          id: parentId,
          fullName: "Budi Santoso",
          email: "budi@example.com",
          role: "PARENT",
          passwordHash,
        },
      ],
    ]);

    const parentResult = await authenticateUser(
      { email: "BUDI@EXAMPLE.COM", password: "Rahasia123!" },
      parentDb.db,
    );
    expect(parentResult).toEqual({
      user: {
        id: parentId,
        fullName: "Budi Santoso",
        email: "budi@example.com",
        role: "PARENT",
      },
      redirectTo: "/profiles",
    });
    expect("passwordHash" in parentResult.user).toBe(false);

    const adminDb = createFakeSelectDb([
      [
        {
          id: adminId,
          fullName: "Admin Literabit",
          email: "admin@literabit.local",
          role: "ADMIN",
          passwordHash,
        },
      ],
    ]);

    const adminResult = await authenticateUser(
      { email: "admin@literabit.local", password: "Rahasia123!" },
      adminDb.db,
    );
    expect(adminResult).toEqual({
      user: {
        id: adminId,
        fullName: "Admin Literabit",
        email: "admin@literabit.local",
        role: "ADMIN",
      },
      redirectTo: "/admin",
    });
  });

  test("rejects wrong password and unknown email with identical AuthError INVALID_CREDENTIALS", async () => {
    const passwordHash = await hashSecret("Benar123!");

    const wrongPasswordDb = createFakeSelectDb([
      [
        {
          id: "11111111-1111-4111-8111-111111111111",
          fullName: "Budi Santoso",
          email: "budi@example.com",
          role: "PARENT",
          passwordHash,
        },
      ],
    ]);

    await expect(
      authenticateUser(
        { email: "budi@example.com", password: "SalahPassword" },
        wrongPasswordDb.db,
      ),
    ).rejects.toBeInstanceOf(AuthError);
    await expect(
      authenticateUser(
        { email: "budi@example.com", password: "SalahPassword" },
        createFakeSelectDb([
          [
            {
              id: "11111111-1111-4111-8111-111111111111",
              fullName: "Budi Santoso",
              email: "budi@example.com",
              role: "PARENT",
              passwordHash,
            },
          ],
        ]).db,
      ),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Email atau kata sandi salah.",
    });

    const unknownEmailDb = createFakeSelectDb([[]]);
    await expect(
      authenticateUser({ email: "tidakada@example.com", password: "Benar123!" }, unknownEmailDb.db),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Email atau kata sandi salah.",
    });
  });

  test("resolves activeStudent and parentGateVerified for PARENT session", async () => {
    const parentId = "11111111-1111-4111-8111-111111111111";
    const studentId = "33333333-3333-4333-8333-333333333333";

    const fake = createFakeSelectDb([
      [
        {
          id: parentId,
          fullName: "Budi Santoso",
          email: "budi@example.com",
          role: "PARENT",
        },
      ],
      [
        {
          id: studentId,
          displayName: "Alya",
          avatar: "owl",
          recommendedLevel: "LEVEL_1",
          totalXp: 120,
          level: 2,
        },
      ],
    ]);

    const result = await getAuthSessionContext(
      {
        session: { userId: parentId, role: "PARENT" },
        studentCookie: { studentId, parentId },
        parentGate: { userId: parentId, verifiedAt: Date.now() },
      },
      fake.db,
    );

    expect(result).toEqual({
      user: {
        id: parentId,
        fullName: "Budi Santoso",
        email: "budi@example.com",
        role: "PARENT",
      },
      activeStudent: {
        id: studentId,
        displayName: "Alya",
        avatar: "owl",
        recommendedLevel: "LEVEL_1",
        totalXp: 120,
        level: 2,
      },
      parentGateVerified: true,
    });
    expect(fake.queryCount()).toBe(2);
  });

  test("returns null activeStudent when selected student was deleted from DB", async () => {
    const parentId = "11111111-1111-4111-8111-111111111111";
    const deletedStudentId = "66666666-6666-4666-8666-666666666666";

    const fake = createFakeSelectDb([
      [
        {
          id: parentId,
          fullName: "Budi Santoso",
          email: "budi@example.com",
          role: "PARENT",
        },
      ],
      [],
    ]);

    const result = await getAuthSessionContext(
      {
        session: { userId: parentId, role: "PARENT" },
        studentCookie: { studentId: deletedStudentId, parentId },
        parentGate: null,
      },
      fake.db,
    );

    expect(result.activeStudent).toBeNull();
    expect(result.parentGateVerified).toBe(false);
    expect(fake.queryCount()).toBe(2);
  });

  test("ignores foreign student and parent gate cookies without querying foreign student", async () => {
    const parentId = "11111111-1111-4111-8111-111111111111";
    const otherParentId = "44444444-4444-4444-8444-444444444444";
    const foreignStudentId = "55555555-5555-4555-8555-555555555555";

    const fake = createFakeSelectDb([
      [
        {
          id: parentId,
          fullName: "Budi Santoso",
          email: "budi@example.com",
          role: "PARENT",
        },
      ],
    ]);

    const result = await getAuthSessionContext(
      {
        session: { userId: parentId, role: "PARENT" },
        studentCookie: { studentId: foreignStudentId, parentId: otherParentId },
        parentGate: { userId: otherParentId, verifiedAt: Date.now() },
      },
      fake.db,
    );

    expect(result.activeStudent).toBeNull();
    expect(result.parentGateVerified).toBe(false);
    expect(fake.queryCount()).toBe(1);
  });

  test("returns null activeStudent and false parentGateVerified for ADMIN even with stale cookies", async () => {
    const adminId = "22222222-2222-4222-8222-222222222222";
    const fake = createFakeSelectDb([
      [
        {
          id: adminId,
          fullName: "Admin Literabit",
          email: "admin@literabit.local",
          role: "ADMIN",
        },
      ],
    ]);

    const result = await getAuthSessionContext(
      {
        session: { userId: adminId, role: "ADMIN" },
        studentCookie: {
          studentId: "33333333-3333-4333-8333-333333333333",
          parentId: adminId,
        },
        parentGate: { userId: adminId, verifiedAt: Date.now() },
      },
      fake.db,
    );

    expect(result).toEqual({
      user: {
        id: adminId,
        fullName: "Admin Literabit",
        email: "admin@literabit.local",
        role: "ADMIN",
      },
      activeStudent: null,
      parentGateVerified: false,
    });
    expect(fake.queryCount()).toBe(1);
  });

  test("throws AuthError UNAUTHORIZED when session user is missing or role changed", async () => {
    const missingUserDb = createFakeSelectDb([[]]);
    await expect(
      getAuthSessionContext(
        {
          session: { userId: "11111111-1111-4111-8111-111111111111", role: "PARENT" },
          studentCookie: null,
          parentGate: null,
        },
        missingUserDb.db,
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const roleMismatchDb = createFakeSelectDb([
      [
        {
          id: "11111111-1111-4111-8111-111111111111",
          fullName: "User",
          email: "user@example.com",
          role: "ADMIN",
        },
      ],
    ]);
    await expect(
      getAuthSessionContext(
        {
          session: { userId: "11111111-1111-4111-8111-111111111111", role: "PARENT" },
          studentCookie: null,
          parentGate: null,
        },
        roleMismatchDb.db,
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
