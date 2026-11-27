import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { POST } from "../../src/app/api/v1/auth/register/route";
import { closeDatabase, createDatabaseClient, users } from "../../src/db";
import type { DatabaseClient } from "../../src/db";
import { verifySecret } from "../../src/lib/crypto";
import { resetServerEnvCacheForTests } from "../../src/lib/env";
import { resetAllRateLimitersForTests } from "../../src/lib/rate-limit";
import {
  LITERABIT_PARENT_GATE_COOKIE,
  LITERABIT_SESSION_COOKIE,
  LITERABIT_STUDENT_COOKIE,
  verifySessionToken,
} from "../../src/lib/session";
import { AuthError, registerParent } from "../../src/modules/auth/service";
import { assertDisposableTestDatabase } from "../helpers/disposable-database";

const shouldRunIntegration = Bun.env.RUN_INTEGRATION_TESTS === "1";
const describeIntegration = shouldRunIntegration ? describe : describe.skip;

function extractCookieValue(setCookieHeaders: string[], name: string): string | null {
  const prefix = `${name}=`;
  for (const header of setCookieHeaders) {
    if (header.startsWith(prefix)) {
      const valuePart = header.slice(prefix.length).split(";")[0];
      return valuePart ?? "";
    }
  }
  return null;
}

describeIntegration("parent registration integration", () => {
  const originalEnv = { ...process.env };
  const globalForDb = globalThis as unknown as {
    literabitDbClient?: DatabaseClient;
  };
  let client: DatabaseClient;

  beforeAll(async () => {
    const databaseUrl = Bun.env.TEST_DATABASE_URL ?? Bun.env.DATABASE_URL;
    if (databaseUrl === undefined || databaseUrl.length === 0) {
      throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for integration tests");
    }
    assertDisposableTestDatabase(databaseUrl);

    if (globalForDb.literabitDbClient !== undefined) {
      await closeDatabase(globalForDb.literabitDbClient);
      delete globalForDb.literabitDbClient;
    }

    process.env.APP_ENV = "test";
    process.env.DATABASE_URL = databaseUrl;
    process.env.AUTH_SECRET =
      process.env.AUTH_SECRET !== undefined && process.env.AUTH_SECRET.length >= 32
        ? process.env.AUTH_SECRET
        : "0123456789abcdef0123456789abcdef";
    resetServerEnvCacheForTests();
    resetAllRateLimitersForTests();

    client = createDatabaseClient(databaseUrl);
    globalForDb.literabitDbClient = client;
  });

  afterAll(async () => {
    if (globalForDb.literabitDbClient === client) {
      delete globalForDb.literabitDbClient;
    }
    await closeDatabase(client);
    process.env = { ...originalEnv };
    resetServerEnvCacheForTests();
    resetAllRateLimitersForTests();
  });

  test("registers parent, hashes password & PIN, and rejects concurrent duplicates with CONFLICT", async () => {
    const email = `parent-race-${crypto.randomUUID()}@literabit.test`;

    try {
      const results = await Promise.allSettled([
        registerParent(
          {
            fullName: "  Budi Santoso  ",
            email: email.toUpperCase(),
            password: "password123",
            parentPin: "1234",
          },
          { db: client.db },
        ),
        registerParent(
          {
            fullName: "Budi Santoso",
            email,
            password: "password123",
            parentPin: "1234",
          },
          { db: client.db },
        ),
      ]);

      const fulfilled = results.filter((result) => result.status === "fulfilled");
      const rejected = results.filter((result) => result.status === "rejected");

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const firstRejected = rejected[0];
      expect(firstRejected?.reason).toBeInstanceOf(AuthError);
      if (firstRejected?.reason instanceof AuthError) {
        expect(firstRejected.reason.code).toBe("CONFLICT");
      }

      const [stored] = await client.db.select().from(users).where(eq(users.email, email)).limit(1);

      expect(stored).toBeDefined();
      if (stored === undefined) {
        throw new Error("Expected registered user row in PostgreSQL");
      }

      expect(stored.fullName).toBe("Budi Santoso");
      expect(stored.email).toBe(email);
      expect(stored.role).toBe("PARENT");
      expect(stored.passwordHash).not.toBe("password123");
      expect(stored.parentPinHash).not.toBe("1234");
      expect(await verifySecret("password123", stored.passwordHash)).toBe(true);
      expect(await verifySecret("1234", stored.parentPinHash ?? "")).toBe(true);
    } finally {
      await client.db.delete(users).where(eq(users.email, email));
    }
  });

  test("POST /api/v1/auth/register returns 201 + signed session cookie, then 409 on duplicate email", async () => {
    const email = `parent-http-${crypto.randomUUID()}@literabit.test`;

    try {
      const createdRes = await POST(
        new Request("http://localhost/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: "Dewi Lestari",
            email: `  ${email.toUpperCase()}  `,
            password: "password123",
            parentPin: "0987",
            role: "ADMIN",
          }),
        }),
      );

      expect(createdRes.status).toBe(201);
      const createdJson = (await createdRes.json()) as {
        success: true;
        data: {
          user: {
            id: string;
            fullName: string;
            email: string;
            role: string;
            passwordHash?: string;
            parentPinHash?: string;
          };
        };
      };

      expect(createdJson.success).toBe(true);
      expect(createdJson.data.user.fullName).toBe("Dewi Lestari");
      expect(createdJson.data.user.email).toBe(email);
      expect(createdJson.data.user.role).toBe("PARENT");
      expect(createdJson.data.user.passwordHash).toBeUndefined();
      expect(createdJson.data.user.parentPinHash).toBeUndefined();

      const setCookies = createdRes.headers.getSetCookie();
      const sessionToken = extractCookieValue(setCookies, LITERABIT_SESSION_COOKIE);
      expect(sessionToken).not.toBeNull();
      expect(await verifySessionToken(sessionToken ?? "")).toEqual({
        userId: createdJson.data.user.id,
        role: "PARENT",
      });
      expect(extractCookieValue(setCookies, LITERABIT_STUDENT_COOKIE)).toBe("");
      expect(extractCookieValue(setCookies, LITERABIT_PARENT_GATE_COOKIE)).toBe("");

      const duplicateRes = await POST(
        new Request("http://localhost/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: "Dewi Lain",
            email,
            password: "password123",
            parentPin: "4321",
          }),
        }),
      );

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.headers.getSetCookie()).toEqual([]);
      expect(await duplicateRes.json()).toEqual({
        success: false,
        error: {
          code: "CONFLICT",
          message: "Email sudah terdaftar.",
          details: [{ field: "email", message: "Email sudah terdaftar." }],
        },
      });
    } finally {
      await client.db.delete(users).where(eq(users.email, email));
    }
  });
});
