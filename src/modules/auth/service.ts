import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getDb, users } from "@/db";
import type { LiterabitSchema } from "@/db";
import { hashSecret } from "@/lib/crypto";
import type { RegisteredParentUser, RegisterParentInput } from "./schemas";

export type AuthErrorCode = "CONFLICT";

export type AuthErrorDetail = {
  field: string;
  message: string;
};

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly details: AuthErrorDetail[] | undefined;

  constructor(code: AuthErrorCode, message: string, details?: AuthErrorDetail[]) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.details = details;
  }
}

export type AuthDatabase = PostgresJsDatabase<LiterabitSchema>;

export type RegisterParentOptions = {
  db?: AuthDatabase;
  hashFn?: (plainText: string) => Promise<string>;
};

const USERS_EMAIL_UNIQUE_INDEX = "users_email_uidx";
const EMAIL_CONFLICT_MESSAGE = "Email sudah terdaftar.";

function createEmailConflictError(): AuthError {
  return new AuthError("CONFLICT", EMAIL_CONFLICT_MESSAGE, [
    { field: "email", message: EMAIL_CONFLICT_MESSAGE },
  ]);
}

export function isUniqueConstraintViolation(error: unknown, constraintName: string): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 4 && current !== null && typeof current === "object"; depth += 1) {
    const record = current as Record<string, unknown>;
    if (record.code === "23505") {
      const pgConstraint = record.constraint_name ?? record.constraint;
      if (pgConstraint === undefined || pgConstraint === constraintName) {
        return true;
      }
    }
    current = record.cause;
  }

  return false;
}

export async function registerParent(
  input: RegisterParentInput,
  options?: RegisterParentOptions,
): Promise<RegisteredParentUser> {
  const db = options?.db ?? getDb();
  const hashValue = options?.hashFn ?? hashSecret;
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedFullName = input.fullName.trim();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    throw createEmailConflictError();
  }

  const [passwordHash, parentPinHash] = await Promise.all([
    hashValue(input.password),
    hashValue(input.parentPin),
  ]);

  try {
    const rows = await db
      .insert(users)
      .values({
        fullName: normalizedFullName,
        email: normalizedEmail,
        passwordHash,
        parentPinHash,
        role: "PARENT",
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
      });

    const created = rows[0];
    if (created === undefined) {
      throw new Error("Failed to persist registered parent account");
    }

    return {
      id: created.id,
      fullName: created.fullName,
      email: created.email,
      role: "PARENT",
    };
  } catch (error) {
    // Concurrent requests with the same email can still hit users_email_uidx after the pre-check.
    if (isUniqueConstraintViolation(error, USERS_EMAIL_UNIQUE_INDEX)) {
      throw createEmailConflictError();
    }
    throw error;
  }
}
