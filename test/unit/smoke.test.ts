import { afterEach, describe, expect, test } from "bun:test";
import { getServerEnv, resetServerEnvCacheForTests } from "../../src/lib/env";
import { isDisposableTestDatabase, sanitizeCredentials } from "../helpers/disposable-database";

describe("disposable test database guard", () => {
  test("accepts explicit local test database URLs", () => {
    expect(
      isDisposableTestDatabase(
        "postgres://literabit:local-postgres-password@localhost:5432/literabit_test",
      ),
    ).toBe(true);
    expect(
      isDisposableTestDatabase("postgresql://literabit:secret@127.0.0.1:5432/test_literabit"),
    ).toBe(true);
  });

  test("rejects development, production, and remote database URLs", () => {
    expect(
      isDisposableTestDatabase(
        "postgres://literabit:local-postgres-password@localhost:5432/literabit",
      ),
    ).toBe(false);
    expect(isDisposableTestDatabase("postgres://user:pass@localhost:5432/literabit_prod")).toBe(
      false,
    );
    expect(
      isDisposableTestDatabase("postgres://user:pass@db.example.com:5432/literabit_test"),
    ).toBe(false);
  });

  test("redacts database password in logs", () => {
    expect(sanitizeCredentials("postgres://literabit:supersecret@localhost:5432/literabit")).toBe(
      "postgres://literabit:***@localhost:5432/literabit",
    );
  });
});

describe("server environment validation", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    resetServerEnvCacheForTests();
  });

  test("parses valid server environment", () => {
    process.env.APP_ENV = "test";
    process.env.APP_VERSION = "0.1.0";
    process.env.DATABASE_URL = "postgres://literabit:pass@localhost:5432/literabit_test";
    process.env.AUTH_SECRET = "0123456789abcdef0123456789abcdef";
    resetServerEnvCacheForTests();

    const env = getServerEnv();
    expect(env.APP_ENV).toBe("test");
    expect(env.APP_VERSION).toBe("0.1.0");
  });

  test("throws when AUTH_SECRET is too short", () => {
    process.env.DATABASE_URL = "postgres://literabit:pass@localhost:5432/literabit_test";
    process.env.AUTH_SECRET = "too-short";
    resetServerEnvCacheForTests();

    expect(() => getServerEnv()).toThrow("AUTH_SECRET");
  });
});
