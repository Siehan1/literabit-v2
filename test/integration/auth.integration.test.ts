import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { eq } from "drizzle-orm";
import * as actualNextServer from "next/server";
import { closeDatabase, createDatabaseClient, students, users } from "../../src/db";
import type { DatabaseClient } from "../../src/db";
import { hashSecret } from "../../src/lib/crypto";
import { resetServerEnvCacheForTests } from "../../src/lib/env";
import { resetAllRateLimitersForTests } from "../../src/lib/rate-limit";
import {
  LITERABIT_PARENT_GATE_COOKIE,
  LITERABIT_SESSION_COOKIE,
  LITERABIT_STUDENT_COOKIE,
  SESSION_TTL_SECONDS,
  signParentGateToken,
  signStudentToken,
  verifySessionToken,
} from "../../src/lib/session";
import { authenticateUser, getAuthSessionContext } from "../../src/modules/auth/service";
import { assertDisposableTestDatabase } from "../helpers/disposable-database";

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

const { POST: loginPost } = await import("../../src/app/api/v1/auth/login/route");
const { POST: logoutPost } = await import("../../src/app/api/v1/auth/logout/route");
const { GET: meGet } = await import("../../src/app/api/v1/auth/me/route");

function extractSetCookieValue(response: Response, name: string): string {
  const header = response.headers.getSetCookie().find((entry) => entry.startsWith(`${name}=`));
  if (header === undefined) {
    return "";
  }
  return header.slice(name.length + 1).split(";")[0] ?? "";
}

function expectCookieClearedHeader(response: Response, name: string): void {
  const header = response.headers.getSetCookie().find((entry) => entry.startsWith(`${name}=`));
  expect(header).toBeDefined();
  const lower = header?.toLowerCase() ?? "";
  expect(lower).toContain("max-age=0");
  expect(lower).toContain("httponly");
  expect(lower).toContain("samesite=lax");
  expect(lower).toContain("path=/");
}

const shouldRunIntegration = Bun.env.RUN_INTEGRATION_TESTS === "1";
const describeIntegration = shouldRunIntegration ? describe : describe.skip;

describeIntegration("auth login and session context integration", () => {
  const originalEnv = { ...process.env };
  let client: DatabaseClient;

  beforeAll(() => {
    const databaseUrl = Bun.env.TEST_DATABASE_URL ?? Bun.env.DATABASE_URL;
    if (databaseUrl === undefined || databaseUrl.length === 0) {
      throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for integration tests");
    }
    assertDisposableTestDatabase(databaseUrl);
    process.env.APP_ENV = "test";
    process.env.DATABASE_URL = databaseUrl;
    process.env.AUTH_SECRET =
      Bun.env.AUTH_SECRET && Bun.env.AUTH_SECRET.length >= 32
        ? Bun.env.AUTH_SECRET
        : "0123456789abcdef0123456789abcdef";
    resetServerEnvCacheForTests();
    client = createDatabaseClient(databaseUrl);
  });

  beforeEach(() => {
    cookieJar.clear();
    resetAllRateLimitersForTests();
  });

  afterAll(async () => {
    cookieJar.clear();
    resetAllRateLimitersForTests();
    process.env = { ...originalEnv };
    resetServerEnvCacheForTests();
    await closeDatabase(client);
  });

  test("authenticates PARENT and ADMIN against PostgreSQL and rejects invalid credentials", async () => {
    const suffix = crypto.randomUUID();
    const parentPasswordHash = await hashSecret("ParentPass123!");
    const adminPasswordHash = await hashSecret("AdminPass123!");
    const pinHash = await hashSecret("1234");

    const [parent] = await client.db
      .insert(users)
      .values({
        fullName: "Ibu Sari",
        email: `parent-login-${suffix}@literabit.test`,
        passwordHash: parentPasswordHash,
        parentPinHash: pinHash,
        role: "PARENT",
      })
      .returning({ id: users.id, email: users.email });

    const [admin] = await client.db
      .insert(users)
      .values({
        fullName: "Admin Uji",
        email: `admin-login-${suffix}@literabit.test`,
        passwordHash: adminPasswordHash,
        parentPinHash: null,
        role: "ADMIN",
      })
      .returning({ id: users.id, email: users.email });

    if (parent === undefined || admin === undefined) {
      throw new Error("Failed to seed test users");
    }

    try {
      const parentLogin = await authenticateUser(
        { email: `  ${parent.email.toUpperCase()}  `, password: "ParentPass123!" },
        client.db,
      );
      expect(parentLogin).toEqual({
        user: {
          id: parent.id,
          fullName: "Ibu Sari",
          email: parent.email,
          role: "PARENT",
        },
        redirectTo: "/profiles",
      });

      const adminLogin = await authenticateUser(
        { email: admin.email, password: "AdminPass123!" },
        client.db,
      );
      expect(adminLogin).toEqual({
        user: {
          id: admin.id,
          fullName: "Admin Uji",
          email: admin.email,
          role: "ADMIN",
        },
        redirectTo: "/admin",
      });

      await expect(
        authenticateUser({ email: parent.email, password: "WrongPassword" }, client.db),
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });

      await expect(
        authenticateUser(
          { email: `missing-${suffix}@literabit.test`, password: "ParentPass123!" },
          client.db,
        ),
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    } finally {
      await client.db.delete(users).where(eq(users.id, parent.id));
      await client.db.delete(users).where(eq(users.id, admin.id));
    }
  });

  test("enforces parent ownership isolation in getAuthSessionContext", async () => {
    const suffix = crypto.randomUUID();
    const passwordHash = await hashSecret("FamilyPass123!");
    const pinHash = await hashSecret("5678");

    const [parentA] = await client.db
      .insert(users)
      .values({
        fullName: "Keluarga A",
        email: `family-a-${suffix}@literabit.test`,
        passwordHash,
        parentPinHash: pinHash,
        role: "PARENT",
      })
      .returning({ id: users.id, email: users.email });

    const [parentB] = await client.db
      .insert(users)
      .values({
        fullName: "Keluarga B",
        email: `family-b-${suffix}@literabit.test`,
        passwordHash,
        parentPinHash: pinHash,
        role: "PARENT",
      })
      .returning({ id: users.id });

    if (parentA === undefined || parentB === undefined) {
      throw new Error("Failed to insert test families");
    }

    try {
      const [studentA] = await client.db
        .insert(students)
        .values({
          parentId: parentA.id,
          displayName: "Alya",
          birthYear: 2017,
          avatar: "owl",
          recommendedLevel: "LEVEL_1",
          totalXp: 150,
          level: 2,
        })
        .returning({ id: students.id });

      const [studentB] = await client.db
        .insert(students)
        .values({
          parentId: parentB.id,
          displayName: "Bima",
          birthYear: 2015,
          avatar: "fox",
          recommendedLevel: "LEVEL_2",
          totalXp: 240,
          level: 3,
        })
        .returning({ id: students.id });

      if (studentA === undefined || studentB === undefined) {
        throw new Error("Failed to insert test students");
      }

      const ownContext = await getAuthSessionContext(
        {
          session: { userId: parentA.id, role: "PARENT" },
          studentCookie: { studentId: studentA.id, parentId: parentA.id },
          parentGate: { userId: parentA.id, verifiedAt: Date.now() },
        },
        client.db,
      );

      expect(ownContext).toEqual({
        user: {
          id: parentA.id,
          fullName: "Keluarga A",
          email: parentA.email,
          role: "PARENT",
        },
        activeStudent: {
          id: studentA.id,
          displayName: "Alya",
          avatar: "owl",
          recommendedLevel: "LEVEL_1",
          totalXp: 150,
          level: 2,
        },
        parentGateVerified: true,
      });

      // Even if a cookie paired Parent A with Student B's ID, DB filter blocks cross-family read.
      const crossFamilyContext = await getAuthSessionContext(
        {
          session: { userId: parentA.id, role: "PARENT" },
          studentCookie: { studentId: studentB.id, parentId: parentA.id },
          parentGate: null,
        },
        client.db,
      );

      expect(crossFamilyContext.activeStudent).toBeNull();
      expect(crossFamilyContext.parentGateVerified).toBe(false);
    } finally {
      await client.db.delete(users).where(eq(users.id, parentA.id));
      await client.db.delete(users).where(eq(users.id, parentB.id));
    }
  });

  test("executes full login -> me -> logout route handler flow with cookies against PostgreSQL", async () => {
    const suffix = crypto.randomUUID();
    const passwordHash = await hashSecret("FlowPass123!");
    const pinHash = await hashSecret("4321");

    const [parent] = await client.db
      .insert(users)
      .values({
        fullName: "Parent Flow",
        email: `flow-parent-${suffix}@literabit.test`,
        passwordHash,
        parentPinHash: pinHash,
        role: "PARENT",
      })
      .returning({ id: users.id, email: users.email });

    const [admin] = await client.db
      .insert(users)
      .values({
        fullName: "Admin Flow",
        email: `flow-admin-${suffix}@literabit.test`,
        passwordHash,
        parentPinHash: null,
        role: "ADMIN",
      })
      .returning({ id: users.id, email: users.email });

    if (parent === undefined || admin === undefined) {
      throw new Error("Failed to insert flow test users");
    }

    try {
      const [student] = await client.db
        .insert(students)
        .values({
          parentId: parent.id,
          displayName: "Nadia",
          birthYear: 2016,
          avatar: "cat",
          recommendedLevel: "LEVEL_2",
          totalXp: 210,
          level: 3,
        })
        .returning({ id: students.id });

      if (student === undefined) {
        throw new Error("Failed to insert flow test student");
      }

      const parentLoginRes = await loginPost(
        new Request("http://localhost/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.10" },
          body: JSON.stringify({
            email: `  ${parent.email.toUpperCase()}  `,
            password: "FlowPass123!",
          }),
        }),
      );
      expect(parentLoginRes.status).toBe(200);
      expect(parentLoginRes.headers.get("Cache-Control")).toBe("no-store");
      expect(await parentLoginRes.json()).toEqual({
        success: true,
        data: {
          user: {
            id: parent.id,
            fullName: "Parent Flow",
            email: parent.email,
            role: "PARENT",
          },
          redirectTo: "/profiles",
        },
      });

      const parentSessionToken = extractSetCookieValue(parentLoginRes, LITERABIT_SESSION_COOKIE);
      expect(await verifySessionToken(parentSessionToken)).toEqual({
        userId: parent.id,
        role: "PARENT",
      });
      const sessionHeader =
        parentLoginRes.headers
          .getSetCookie()
          .find((entry) => entry.startsWith(`${LITERABIT_SESSION_COOKIE}=`)) ?? "";
      expect(sessionHeader.toLowerCase()).toContain("httponly");
      expect(sessionHeader.toLowerCase()).toContain("samesite=lax");
      expect(sessionHeader.toLowerCase()).toContain(`max-age=${SESSION_TTL_SECONDS}`);
      expectCookieClearedHeader(parentLoginRes, LITERABIT_STUDENT_COOKIE);
      expectCookieClearedHeader(parentLoginRes, LITERABIT_PARENT_GATE_COOKIE);

      cookieJar.set(LITERABIT_SESSION_COOKIE, { value: parentSessionToken, options: undefined });
      const meBasicRes = await meGet();
      expect(meBasicRes.status).toBe(200);
      expect(await meBasicRes.json()).toEqual({
        success: true,
        data: {
          user: {
            id: parent.id,
            fullName: "Parent Flow",
            email: parent.email,
            role: "PARENT",
          },
          activeStudent: null,
          parentGateVerified: false,
        },
      });

      const studentToken = await signStudentToken({ studentId: student.id, parentId: parent.id });
      const gateToken = await signParentGateToken({ userId: parent.id, verifiedAt: Date.now() });
      cookieJar.set(LITERABIT_STUDENT_COOKIE, { value: studentToken, options: undefined });
      cookieJar.set(LITERABIT_PARENT_GATE_COOKIE, { value: gateToken, options: undefined });

      const meActiveRes = await meGet();
      expect(meActiveRes.status).toBe(200);
      expect(await meActiveRes.json()).toEqual({
        success: true,
        data: {
          user: {
            id: parent.id,
            fullName: "Parent Flow",
            email: parent.email,
            role: "PARENT",
          },
          activeStudent: {
            id: student.id,
            displayName: "Nadia",
            avatar: "cat",
            recommendedLevel: "LEVEL_2",
            totalXp: 210,
            level: 3,
          },
          parentGateVerified: true,
        },
      });

      const adminLoginRes = await loginPost(
        new Request("http://localhost/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.11" },
          body: JSON.stringify({ email: admin.email, password: "FlowPass123!" }),
        }),
      );
      expect(adminLoginRes.status).toBe(200);
      expect(await adminLoginRes.json()).toEqual({
        success: true,
        data: {
          user: {
            id: admin.id,
            fullName: "Admin Flow",
            email: admin.email,
            role: "ADMIN",
          },
          redirectTo: "/admin",
        },
      });
      expectCookieClearedHeader(adminLoginRes, LITERABIT_STUDENT_COOKIE);
      expectCookieClearedHeader(adminLoginRes, LITERABIT_PARENT_GATE_COOKIE);

      const adminSessionToken = extractSetCookieValue(adminLoginRes, LITERABIT_SESSION_COOKIE);
      cookieJar.set(LITERABIT_SESSION_COOKIE, { value: adminSessionToken, options: undefined });

      const logoutRes = await logoutPost();
      expect(logoutRes.status).toBe(200);
      expect(await logoutRes.json()).toEqual({ success: true, data: { loggedOut: true } });
      expect(cookieJar.get(LITERABIT_SESSION_COOKIE)?.value).toBe("");

      const meAfterLogoutRes = await meGet();
      expect(meAfterLogoutRes.status).toBe(401);
    } finally {
      await client.db.delete(users).where(eq(users.id, parent.id));
      await client.db.delete(users).where(eq(users.id, admin.id));
    }
  });
});
