import { afterEach, describe, expect, test } from "bun:test";
import { apiError, apiSuccess } from "../../src/lib/api-response";
import { hashSecret, verifySecret } from "../../src/lib/crypto";
import { resetServerEnvCacheForTests } from "../../src/lib/env";
import {
  signParentGateToken,
  signSessionToken,
  signStudentToken,
  verifyParentGateToken,
  verifySessionToken,
  verifyStudentToken,
} from "../../src/lib/session";
import { isValidMediaUrl, normalizeMediaUrl } from "../../src/lib/storage";

describe("crypto password & pin hashing", () => {
  test("hashes and verifies secret values", async () => {
    const hashed = await hashSecret("1234");
    expect(hashed).not.toBe("1234");
    expect(await verifySecret("1234", hashed)).toBe(true);
    expect(await verifySecret("9999", hashed)).toBe(false);
    expect(await verifySecret("", hashed)).toBe(false);
  });
});

describe("signed session tokens", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    resetServerEnvCacheForTests();
  });

  function setupTestEnv(): void {
    process.env.APP_ENV = "test";
    process.env.DATABASE_URL = "postgres://literabit:pass@localhost:5432/literabit_test";
    process.env.AUTH_SECRET = "0123456789abcdef0123456789abcdef";
    resetServerEnvCacheForTests();
  }

  test("signs and verifies parent session token", async () => {
    setupTestEnv();
    const userId = "11111111-1111-4111-8111-111111111111";
    const token = await signSessionToken({ userId, role: "PARENT" });
    const verified = await verifySessionToken(token);

    expect(verified).toEqual({ userId, role: "PARENT" });
  });

  test("signs and verifies student & parent gate tokens", async () => {
    setupTestEnv();
    const parentId = "11111111-1111-4111-8111-111111111111";
    const studentId = "22222222-2222-4222-8222-222222222222";

    const studentToken = await signStudentToken({ studentId, parentId });
    expect(await verifyStudentToken(studentToken)).toEqual({ studentId, parentId });

    const gateToken = await signParentGateToken({ userId: parentId, verifiedAt: 1700000000000 });
    expect(await verifyParentGateToken(gateToken)).toEqual({
      userId: parentId,
      verifiedAt: 1700000000000,
    });
  });

  test("rejects tampered tokens", async () => {
    setupTestEnv();
    expect(await verifySessionToken("invalid.token.value")).toBeNull();
  });
});

describe("storage media URL validation", () => {
  test("accepts relative paths and http(s) URLs while rejecting unsafe protocols", () => {
    expect(isValidMediaUrl("/images/cover.png")).toBe(true);
    expect(isValidMediaUrl("https://cdn.literabit.id/cover.png")).toBe(true);
    expect(isValidMediaUrl("javascript:alert(1)")).toBe(false);
    expect(isValidMediaUrl("//evil.example.com/a.png")).toBe(false);
    expect(normalizeMediaUrl("  ")).toBeNull();
    expect(() => normalizeMediaUrl("data:text/html,<script>")).toThrow();
  });
});

describe("api response envelope helpers", () => {
  test("formats standard success and error envelopes", async () => {
    const okRes = apiSuccess({ status: "ok" }, { status: 201 });
    expect(okRes.status).toBe(201);
    expect(await okRes.json()).toEqual({ success: true, data: { status: "ok" } });

    const errRes = apiError(422, "CMS_PUBLISH_GUARDRAIL", "Materi belum siap.", [
      { field: "questions", message: "Minimal 3 soal." },
    ]);
    expect(errRes.status).toBe(422);
    expect(await errRes.json()).toEqual({
      success: false,
      error: {
        code: "CMS_PUBLISH_GUARDRAIL",
        message: "Materi belum siap.",
        details: [{ field: "questions", message: "Minimal 3 soal." }],
      },
    });
  });
});
