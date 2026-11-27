import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as actualNextServer from "next/server";

type RecordedCookie = {
  value: string;
  options: Record<string, unknown> | undefined;
};

const cookieJar = new Map<string, RecordedCookie>();

const fakeCookieStore = {
  get(name: string): { name: string; value: string } | undefined {
    const entry = cookieJar.get(name);
    if (entry === undefined) {
      return undefined;
    }
    return { name, value: entry.value };
  },
  set(name: string, value: string, options?: Record<string, unknown>): void {
    cookieJar.set(name, { value, options });
  },
  delete(name: string): void {
    cookieJar.delete(name);
  },
};

mock.module("next/headers", () => ({
  cookies: async () => fakeCookieStore,
}));

mock.module("next/server", () => ({
  ...actualNextServer,
  connection: async () => undefined,
}));

const { resetServerEnvCacheForTests } = await import("../../src/lib/env");
const { resetAllRateLimitersForTests } = await import("../../src/lib/rate-limit");
const {
  attachSessionCookie,
  clearSecondaryAuthCookies,
  LITERABIT_PARENT_GATE_COOKIE,
  LITERABIT_SESSION_COOKIE,
  LITERABIT_STUDENT_COOKIE,
  SESSION_TTL_SECONDS,
  verifySessionToken,
} = await import("../../src/lib/session");
const { POST: loginPost } = await import("../../src/app/api/v1/auth/login/route");
const { POST: logoutPost } = await import("../../src/app/api/v1/auth/logout/route");
const { GET: meGet } = await import("../../src/app/api/v1/auth/me/route");

describe("auth route handlers and cookie security attributes", () => {
  const originalEnv = { ...process.env };

  function setupTestEnv(appEnv: "test" | "production" = "test"): void {
    process.env.APP_ENV = appEnv;
    process.env.DATABASE_URL = "postgres://literabit:pass@localhost:5433/literabit_test";
    process.env.AUTH_SECRET = "0123456789abcdef0123456789abcdef";
    resetServerEnvCacheForTests();
  }

  beforeEach(() => {
    cookieJar.clear();
    resetAllRateLimitersForTests();
    setupTestEnv("test");
  });

  afterEach(() => {
    cookieJar.clear();
    resetAllRateLimitersForTests();
    process.env = { ...originalEnv };
    resetServerEnvCacheForTests();
  });

  test("attachSessionCookie and clearSecondaryAuthCookies enforce full Set-Cookie attributes", async () => {
    setupTestEnv("production");
    const userId = "11111111-1111-4111-8111-111111111111";
    const response = actualNextServer.NextResponse.json({ success: true });

    await attachSessionCookie(response, { userId, role: "PARENT" });
    clearSecondaryAuthCookies(response);

    const setCookies = response.headers.getSetCookie();
    const sessionHeader = setCookies.find((entry) =>
      entry.startsWith(`${LITERABIT_SESSION_COOKIE}=`),
    );
    expect(sessionHeader).toBeDefined();
    expect(sessionHeader?.toLowerCase()).toContain("httponly");
    expect(sessionHeader?.toLowerCase()).toContain("samesite=lax");
    expect(sessionHeader?.toLowerCase()).toContain("path=/");
    expect(sessionHeader?.toLowerCase()).toContain("secure");
    expect(sessionHeader?.toLowerCase()).toContain(`max-age=${SESSION_TTL_SECONDS}`);

    const sessionToken = response.cookies.get(LITERABIT_SESSION_COOKIE)?.value ?? "";
    expect(await verifySessionToken(sessionToken)).toEqual({ userId, role: "PARENT" });

    for (const cookieName of [LITERABIT_STUDENT_COOKIE, LITERABIT_PARENT_GATE_COOKIE]) {
      const header = setCookies.find((entry) => entry.startsWith(`${cookieName}=`));
      expect(header).toBeDefined();
      const lower = header?.toLowerCase() ?? "";
      expect(lower).toContain("httponly");
      expect(lower).toContain("samesite=lax");
      expect(lower).toContain("path=/");
      expect(lower).toContain("secure");
      expect(lower).toContain("max-age=0");
      expect(lower).toContain("expires=thu, 01 jan 1970 00:00:00 gmt");
    }
  });

  test("POST /api/v1/auth/logout clears all three auth cookies with security flags and is idempotent", async () => {
    cookieJar.set(LITERABIT_SESSION_COOKIE, { value: "active-session", options: undefined });
    cookieJar.set(LITERABIT_STUDENT_COOKIE, { value: "active-student", options: undefined });
    cookieJar.set(LITERABIT_PARENT_GATE_COOKIE, { value: "active-gate", options: undefined });

    const res = await logoutPost();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ success: true, data: { loggedOut: true } });

    for (const cookieName of [
      LITERABIT_SESSION_COOKIE,
      LITERABIT_STUDENT_COOKIE,
      LITERABIT_PARENT_GATE_COOKIE,
    ]) {
      expect(cookieJar.get(cookieName)).toEqual({
        value: "",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: false,
          maxAge: 0,
          expires: new Date(0),
        },
      });
    }

    cookieJar.clear();
    const publicRes = await logoutPost();
    expect(publicRes.status).toBe(200);
    expect(await publicRes.json()).toEqual({ success: true, data: { loggedOut: true } });
  });

  test("GET /api/v1/auth/me rejects missing or tampered session cookies with 401", async () => {
    const missingRes = await meGet();
    expect(missingRes.status).toBe(401);
    expect(missingRes.headers.get("Cache-Control")).toBe("no-store");
    expect(await missingRes.json()).toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Silakan masuk terlebih dahulu.",
      },
    });

    cookieJar.set(LITERABIT_SESSION_COOKIE, { value: "tampered.jwt.token", options: undefined });
    const tamperedRes = await meGet();
    expect(tamperedRes.status).toBe(401);
    expect(tamperedRes.headers.get("Cache-Control")).toBe("no-store");
  });

  test("POST /api/v1/auth/login validates JSON, payload size, and enforces rate limit per IP", async () => {
    const malformed = await loginPost(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.1" },
        body: "{not-json",
      }),
    );
    expect(malformed.status).toBe(400);
    expect(malformed.headers.get("Cache-Control")).toBe("no-store");
    expect(malformed.headers.getSetCookie()).toEqual([]);
    expect((await malformed.json()).error.code).toBe("VALIDATION_ERROR");

    const nonObject = await loginPost(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.2" },
        body: "[]",
      }),
    );
    expect(nonObject.status).toBe(400);
    expect(nonObject.headers.get("Cache-Control")).toBe("no-store");
    expect(await nonObject.json()).toEqual({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data yang dikirim tidak valid.",
        details: [{ field: "body", message: "Body permintaan harus berupa objek JSON." }],
      },
    });

    const oversized = await loginPost(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.3" },
        body: JSON.stringify({ email: "a@b.com", password: "x".repeat(20_000) }),
      }),
    );
    expect(oversized.status).toBe(413);
    expect(oversized.headers.get("Cache-Control")).toBe("no-store");
    expect((await oversized.json()).error.code).toBe("PAYLOAD_TOO_LARGE");

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const res = await loginPost(
        new Request("http://localhost/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.99" },
          body: JSON.stringify({ email: "invalid", password: "" }),
        }),
      );
      expect(res.status).toBe(400);
    }

    const rateLimited = await loginPost(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.99" },
        body: JSON.stringify({ email: "budi@example.com", password: "password123" }),
      }),
    );
    expect(rateLimited.status).toBe(429);
    expect(rateLimited.headers.get("Cache-Control")).toBe("no-store");
    expect(Number(rateLimited.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect((await rateLimited.json()).error.code).toBe("RATE_LIMIT_EXCEEDED");

    const differentIp = await loginPost(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.100" },
        body: JSON.stringify({ email: "invalid", password: "" }),
      }),
    );
    expect(differentIp.status).toBe(400);
  });
});
