export const ALLOWED_LOCAL_TEST_HOSTS: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "postgres",
]);

const PROTECTED_DB_NAMES = new Set([
  "literabit",
  "literabit_dev",
  "development",
  "dev",
  "postgres",
]);

export function sanitizeCredentials(text: string): string {
  return text.replace(/(postgres(?:ql)?:\/\/[^:\s/]+:)[^@\s/]+@/gi, "$1***@");
}

export function isDisposableTestDatabase(databaseUrl: string): boolean {
  try {
    const parsed = new URL(databaseUrl);

    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
      return false;
    }

    if (parsed.searchParams.has("host")) {
      return false;
    }

    const normalizedHost = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (!ALLOWED_LOCAL_TEST_HOSTS.has(normalizedHost)) {
      return false;
    }

    const dbName = parsed.pathname.replace(/^\//, "");
    const lowerDbName = dbName.toLowerCase();

    if (lowerDbName.includes("prod") || lowerDbName === "production") {
      return false;
    }

    if (PROTECTED_DB_NAMES.has(lowerDbName)) {
      return false;
    }

    return (
      dbName === "test" ||
      dbName.endsWith("_test") ||
      dbName.endsWith("_disposable") ||
      dbName.startsWith("test_")
    );
  } catch {
    return false;
  }
}

export function assertDisposableTestDatabase(databaseUrl: string): void {
  if (!isDisposableTestDatabase(databaseUrl)) {
    throw new Error(
      `[test-db] Refusing non-disposable database URL: ${sanitizeCredentials(databaseUrl)}`,
    );
  }
}
