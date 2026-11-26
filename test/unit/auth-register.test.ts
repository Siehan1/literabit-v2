import { afterEach, describe, expect, test } from "bun:test";
import { NextResponse } from "next/server";
import { POST } from "../../src/app/api/v1/auth/register/route";
import { apiValidationError, handleApiRouteError, parseJsonBody } from "../../src/lib/api-response";
import { verifySecret } from "../../src/lib/crypto";
import { resetServerEnvCacheForTests } from "../../src/lib/env";
import {
  createRateLimiter,
  getClientIp,
  resetAllRateLimitersForTests,
} from "../../src/lib/rate-limit";
import {
  attachSessionCookie,
  clearSecondaryAuthCookies,
  LITERABIT_PARENT_GATE_COOKIE,
  LITERABIT_SESSION_COOKIE,
  LITERABIT_STUDENT_COOKIE,
  verifySessionToken,
} from "../../src/lib/session";
import { registerParentSchema } from "../../src/modules/auth/schemas";
import {
  AuthError,
  isUniqueConstraintViolation,
  registerParent,
} from "../../src/modules/auth/service";
import type { AuthDatabase } from "../../src/modules/auth/service";

type StubInsertedUser = {
  fullName: string;
  email: string;
  passwordHash: string;
  parentPinHash: string | null;
  role: "PARENT" | "ADMIN";
};

function createStubAuthDb(options?: {
  existingIds?: { id: string }[];
  insertError?: unknown;
  returnedId?: string;
}): {
  db: AuthDatabase;
  insertedValues: StubInsertedUser[];
} {
  const insertedValues: StubInsertedUser[] = [];
  const returnedId = options?.returnedId ?? "11111111-1111-4111-8111-111111111111";

  const stubDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => options?.existingIds ?? [],
        }),
      }),
    }),
    insert: () => ({
      values: (value: StubInsertedUser) => {
        insertedValues.push(value);
        return {
          returning: async () => {
            if (options?.insertError !== undefined) {
              throw options.insertError;
            }
            return [
              {
                id: returnedId,
                fullName: value.fullName,
                email: value.email,
                role: value.role,
              },
            ];
          },
        };
      },
    }),
  } as unknown as AuthDatabase;

  return { db: stubDb, insertedValues };
}

describe("registerParentSchema validation", () => {
  test("accepts valid input, trims fullName, normalizes email, and strips extra fields", () => {
    const parsed = registerParentSchema.safeParse({
      fullName: "  Budi Santoso  ",
      email: "  Budi.Santoso@Example.COM ",
      password: " password123 ",
      parentPin: "0412",
      role: "ADMIN",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      throw new Error("Expected valid registration input to parse");
    }

    expect(parsed.data).toEqual({
      fullName: "Budi Santoso",
      email: "budi.santoso@example.com",
      password: " password123 ",
      parentPin: "0412",
    });
    expect("role" in parsed.data).toBe(false);
  });

  test("rejects invalid fullName, email, password, and parentPin values", () => {
    const parsed = registerParentSchema.safeParse({
      fullName: " A ",
      email: "not-an-email",
      password: "short",
      parentPin: "12ab",
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) {
      throw new Error("Expected invalid registration input to fail");
    }

    const fields = new Set(parsed.error.issues.map((issue) => issue.path.join(".")));
    expect(fields.has("fullName")).toBe(true);
    expect(fields.has("email")).toBe(true);
    expect(fields.has("password")).toBe(true);
    expect(fields.has("parentPin")).toBe(true);
  });

  test("rejects non-4-digit or numeric parentPin and non-object payloads", () => {
    expect(
      registerParentSchema.safeParse({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        password: "password123",
        parentPin: "123",
      }).success,
    ).toBe(false);

    expect(
      registerParentSchema.safeParse({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        password: "password123",
        parentPin: "12345",
      }).success,
    ).toBe(false);

    expect(
      registerParentSchema.safeParse({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        password: "password123",
        parentPin: 1234,
      }).success,
    ).toBe(false);

    expect(registerParentSchema.safeParse(null).success).toBe(false);
  });

  test("enforces bcrypt 72-byte UTF-8 maximum password length", () => {
    expect(
      registerParentSchema.safeParse({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        password: "a".repeat(72),
        parentPin: "1234",
      }).success,
    ).toBe(true);

    expect(
      registerParentSchema.safeParse({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        password: "a".repeat(73),
        parentPin: "1234",
      }).success,
    ).toBe(false);

    // 25 four-byte emojis have length 50 in UTF-16 code units but 100 UTF-8 bytes.
    expect(
      registerParentSchema.safeParse({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        password: "🔐".repeat(25),
        parentPin: "1234",
      }).success,
    ).toBe(false);
  });
});

describe("isUniqueConstraintViolation", () => {
  test("detects direct and cause-wrapped PostgreSQL 23505 email violations", () => {
    expect(
      isUniqueConstraintViolation(
        { code: "23505", constraint_name: "users_email_uidx" },
        "users_email_uidx",
      ),
    ).toBe(true);

    expect(
      isUniqueConstraintViolation(
        new Error("Failed query", {
          cause: { code: "23505", constraint_name: "users_email_uidx" },
        }),
        "users_email_uidx",
      ),
    ).toBe(true);

    expect(
      isUniqueConstraintViolation(
        { code: "23505", constraint_name: "categories_slug_uidx" },
        "users_email_uidx",
      ),
    ).toBe(false);

    expect(isUniqueConstraintViolation({ code: "22P02" }, "users_email_uidx")).toBe(false);
    expect(isUniqueConstraintViolation("string error", "users_email_uidx")).toBe(false);
  });
});

describe("registerParent service", () => {
  test("hashes password and parentPin with hashSecret and inserts PARENT role", async () => {
    const { db, insertedValues } = createStubAuthDb();

    const user = await registerParent(
      {
        fullName: "  Siti Aminah  ",
        email: "Siti@Example.COM",
        password: "password123",
        parentPin: "0421",
      },
      { db },
    );

    expect(user).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      fullName: "Siti Aminah",
      email: "siti@example.com",
      role: "PARENT",
    });

    const persisted = insertedValues[0];
    expect(persisted).toBeDefined();
    if (persisted === undefined) {
      throw new Error("Expected insert values to be recorded");
    }

    expect(persisted.role).toBe("PARENT");
    expect(persisted.email).toBe("siti@example.com");
    expect(persisted.passwordHash).not.toBe("password123");
    expect(persisted.parentPinHash).not.toBe("0421");
    expect(await verifySecret("password123", persisted.passwordHash)).toBe(true);
    expect(await verifySecret("0421", persisted.parentPinHash ?? "")).toBe(true);
  });

  test("throws AuthError CONFLICT when email already exists without hashing", async () => {
    let hashCalls = 0;
    const { db, insertedValues } = createStubAuthDb({
      existingIds: [{ id: "existing-user-id" }],
    });

    await expect(
      registerParent(
        {
          fullName: "Budi Santoso",
          email: "budi@example.com",
          password: "password123",
          parentPin: "1234",
        },
        {
          db,
          hashFn: async (value) => {
            hashCalls += 1;
            return `hashed:${value}`;
          },
        },
      ),
    ).rejects.toThrow(AuthError);

    expect(hashCalls).toBe(0);
    expect(insertedValues.length).toBe(0);
  });

  test("maps concurrent PostgreSQL 23505 unique email errors to AuthError CONFLICT", async () => {
    const { db } = createStubAuthDb({
      insertError: new Error("Failed query", {
        cause: { code: "23505", constraint_name: "users_email_uidx" },
      }),
    });

    try {
      await registerParent(
        {
          fullName: "Budi Santoso",
          email: "budi@example.com",
          password: "password123",
          parentPin: "1234",
        },
        {
          db,
          hashFn: async (value) => `hashed:${value}`,
        },
      );
      throw new Error("Expected registerParent to throw AuthError");
    } catch (error) {
      expect(error).toBeInstanceOf(AuthError);
      if (error instanceof AuthError) {
        expect(error.code).toBe("CONFLICT");
        expect(error.details).toEqual([{ field: "email", message: "Email sudah terdaftar." }]);
      }
    }
  });
});

describe("API validation and session response helpers", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    resetServerEnvCacheForTests();
  });

  test("formats Zod validation errors and malformed JSON according to API conventions", async () => {
    const parsed = registerParentSchema.safeParse({
      fullName: "Budi Santoso",
      email: "budi@example.com",
      password: "password123",
      parentPin: "abcd",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const response = apiValidationError(parsed.error);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Data yang dikirim tidak valid.",
          details: [
            {
              field: "parentPin",
              message: "PIN orang tua harus terdiri dari 4 digit angka.",
            },
          ],
        },
      });
    }

    const malformed = await parseJsonBody(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not-json",
      }),
    );
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) {
      expect(malformed.response.status).toBe(400);
      expect(await malformed.response.json()).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Format JSON pada body permintaan tidak valid.",
        },
      });
    }
  });

  test("attaches signed literabit_session cookie and expires secondary auth cookies", async () => {
    process.env.APP_ENV = "test";
    process.env.DATABASE_URL = "postgres://literabit:pass@localhost:5433/literabit_test";
    process.env.AUTH_SECRET = "0123456789abcdef0123456789abcdef";
    resetServerEnvCacheForTests();

    const response = NextResponse.json({ success: true });
    await attachSessionCookie(response, {
      userId: "11111111-1111-4111-8111-111111111111",
      role: "PARENT",
    });
    clearSecondaryAuthCookies(response);

    const sessionCookie = response.cookies.get(LITERABIT_SESSION_COOKIE);
    expect(sessionCookie).toBeDefined();
    expect(await verifySessionToken(sessionCookie?.value ?? "")).toEqual({
      userId: "11111111-1111-4111-8111-111111111111",
      role: "PARENT",
    });

    const studentCookie = response.cookies.get(LITERABIT_STUDENT_COOKIE);
    const parentGateCookie = response.cookies.get(LITERABIT_PARENT_GATE_COOKIE);
    expect(studentCookie?.value).toBe("");
    expect(parentGateCookie?.value).toBe("");

    const setCookies = response.headers.getSetCookie().join("\n");
    expect(setCookies).toContain("HttpOnly");
    expect(setCookies).toContain("SameSite=lax");
    expect(setCookies).toContain("Path=/");
    expect(setCookies).not.toContain("Secure");
  });

  test("sets Secure attribute on auth cookies when APP_ENV is production", async () => {
    process.env.APP_ENV = "production";
    process.env.DATABASE_URL = "postgres://literabit:pass@localhost:5433/literabit_test";
    process.env.AUTH_SECRET = "0123456789abcdef0123456789abcdef";
    resetServerEnvCacheForTests();

    const response = NextResponse.json({ success: true });
    await attachSessionCookie(response, {
      userId: "11111111-1111-4111-8111-111111111111",
      role: "PARENT",
    });
    clearSecondaryAuthCookies(response);

    const setCookies = response.headers.getSetCookie();
    expect(setCookies.length).toBe(3);
    for (const cookieHeader of setCookies) {
      expect(cookieHeader).toContain("Secure");
      expect(cookieHeader).toContain("HttpOnly");
    }
  });

  test("rejects oversized JSON payloads with 413 and sanitizes unexpected 500 errors", async () => {
    const oversizedWithHeader = await parseJsonBody(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "999999",
        },
        body: JSON.stringify({ a: 1 }),
      }),
      64,
    );
    expect(oversizedWithHeader.ok).toBe(false);
    if (!oversizedWithHeader.ok) {
      expect(oversizedWithHeader.response.status).toBe(413);
      expect(await oversizedWithHeader.response.json()).toEqual({
        success: false,
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Ukuran body permintaan melebihi batas yang diizinkan.",
        },
      });
    }

    const oversizedBody = await parseJsonBody(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ padding: "x".repeat(128) }),
      }),
      64,
    );
    expect(oversizedBody.ok).toBe(false);
    if (!oversizedBody.ok) {
      expect(oversizedBody.response.status).toBe(413);
    }

    const internalRes = handleApiRouteError(
      new Error("SQL failed: password_hash=$2b$10$secretvalue"),
    );
    expect(internalRes.status).toBe(500);
    const internalText = await internalRes.text();
    expect(internalText).not.toContain("SQL failed");
    expect(internalText).not.toContain("password_hash");
    expect(JSON.parse(internalText)).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Terjadi kesalahan pada server. Silakan coba lagi.",
      },
    });
  });
});

describe("in-memory rate limiter", () => {
  test("extracts client IP headers and enforces request quota, window reset, and maxEntries", () => {
    expect(
      getClientIp(
        new Request("http://localhost/api/v1/auth/register", {
          headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
        }),
      ),
    ).toBe("203.0.113.10");
    expect(
      getClientIp(
        new Request("http://localhost/api/v1/auth/register", {
          headers: { "x-real-ip": "198.51.100.7" },
        }),
      ),
    ).toBe("198.51.100.7");
    expect(getClientIp(new Request("http://localhost/api/v1/auth/register"))).toBe("unknown");

    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 10_000, maxEntries: 2 });
    expect(limiter.consume("ip-1", 1000)).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: 11_000,
    });
    expect(limiter.consume("ip-1", 2000)).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: 11_000,
    });
    expect(limiter.consume("ip-1", 3000)).toEqual({
      allowed: false,
      remaining: 0,
      resetAt: 11_000,
      retryAfterSeconds: 8,
    });
    expect(limiter.consume("ip-1", 11_000)).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: 21_000,
    });

    limiter.consume("ip-2", 11_000);
    limiter.consume("ip-3", 11_000);
    expect(limiter.consume("ip-3", 11_000).allowed).toBe(true);
  });
});

describe("POST /api/v1/auth/register validation boundary", () => {
  afterEach(() => {
    resetAllRateLimitersForTests();
  });

  test("returns 400 VALIDATION_ERROR for malformed JSON without setting cookies", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad",
      }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.getSetCookie()).toEqual([]);
    const payload = (await response.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
  });

  test("returns 400 VALIDATION_ERROR with field details for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "A",
          email: "invalid",
          password: "123",
          parentPin: "12",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.getSetCookie()).toEqual([]);
    const payload = (await response.json()) as {
      success: boolean;
      error: { code: string; details?: { field: string; message: string }[] };
    };
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(payload.error.details?.map((detail) => detail.field)).toEqual([
      "fullName",
      "email",
      "password",
      "parentPin",
    ]);
  });

  test("returns 413 PAYLOAD_TOO_LARGE when request body exceeds JSON size limit", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "198.51.100.20",
        },
        body: JSON.stringify({ fullName: "x".repeat(20_000) }),
      }),
    );

    expect(response.status).toBe(413);
    expect(response.headers.getSetCookie()).toEqual([]);
    const payload = (await response.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  test("returns 429 RATE_LIMIT_EXCEEDED with Retry-After after exceeding IP quota", async () => {
    const clientIp = "198.51.100.99";

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await POST(
        new Request("http://localhost/api/v1/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": clientIp,
          },
          body: "{bad",
        }),
      );
      expect(response.status).toBe(400);
    }

    const limitedRes = await POST(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: "{bad",
      }),
    );

    expect(limitedRes.status).toBe(429);
    expect(limitedRes.headers.getSetCookie()).toEqual([]);
    expect(Number(limitedRes.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(await limitedRes.json()).toEqual({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Terlalu banyak percobaan registrasi. Silakan coba lagi beberapa saat lagi.",
      },
    });
  });
});
