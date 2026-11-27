import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getDb, students, users } from "@/db";
import type { LiterabitSchema } from "@/db";
import { hashSecret, verifySecret } from "@/lib/crypto";
import type { ParentGatePayload, SessionPayload, StudentSessionPayload } from "@/lib/session";
import type {
  ActiveStudentDto,
  AuthMeResult,
  AuthUserRole,
  LoginInput,
  LoginRedirectPath,
  LoginResult,
  RegisteredParentUser,
  RegisterParentInput,
} from "./schemas";

export type AuthErrorCode = "CONFLICT" | "INVALID_CREDENTIALS" | "UNAUTHORIZED";

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
// Equalizes bcrypt timing when a login email does not match any user row.
const UNKNOWN_USER_PASSWORD_HASH = "$2b$10$fA7qN8xP2mK4vR9wT1yU3eL6jH0cB5dG8kM2pQ4sV7xZ9aC1eF3hK";

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

export function getLoginRedirectPath(role: AuthUserRole): LoginRedirectPath {
  return role === "ADMIN" ? "/admin" : "/profiles";
}

export async function authenticateUser(
  input: LoginInput,
  db: AuthDatabase = getDb(),
): Promise<LoginResult> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const user = rows[0];
  const candidateHash = user?.passwordHash ?? UNKNOWN_USER_PASSWORD_HASH;
  const isPasswordValid = await verifySecret(input.password, candidateHash);

  if (user === undefined || !isPasswordValid) {
    throw new AuthError("INVALID_CREDENTIALS", "Email atau kata sandi salah.");
  }

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    redirectTo: getLoginRedirectPath(user.role),
  };
}

export type AuthSessionContextInput = {
  session: SessionPayload;
  studentCookie: StudentSessionPayload | null;
  parentGate: ParentGatePayload | null;
};

export async function getAuthSessionContext(
  input: AuthSessionContextInput,
  db: AuthDatabase = getDb(),
): Promise<AuthMeResult> {
  const userRows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, input.session.userId))
    .limit(1);

  const user = userRows[0];
  if (user === undefined || user.role !== input.session.role) {
    throw new AuthError("UNAUTHORIZED", "Sesi tidak valid. Silakan masuk kembali.");
  }

  const parentGateVerified =
    user.role === "PARENT" && input.parentGate !== null && input.parentGate.userId === user.id;

  let activeStudent: ActiveStudentDto | null = null;

  if (
    user.role === "PARENT" &&
    input.studentCookie !== null &&
    input.studentCookie.parentId === user.id
  ) {
    const studentRows = await db
      .select({
        id: students.id,
        displayName: students.displayName,
        avatar: students.avatar,
        recommendedLevel: students.recommendedLevel,
        totalXp: students.totalXp,
        level: students.level,
      })
      .from(students)
      .where(and(eq(students.id, input.studentCookie.studentId), eq(students.parentId, user.id)))
      .limit(1);

    activeStudent = studentRows[0] ?? null;
  }

  return {
    user,
    activeStudent,
    parentGateVerified,
  };
}
