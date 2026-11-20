import { and, eq } from "drizzle-orm";
import { getDb, students } from "../db";
import type { SessionPayload } from "./session";
import { getActiveParentGate, getActiveSession, getActiveStudentCookie } from "./session";

export class GuardError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "GuardError";
    this.status = status;
    this.code = code;
  }
}

export type VerifiedStudentContext = {
  parentSession: SessionPayload & { role: "PARENT" };
  student: {
    id: string;
    parentId: string;
    displayName: string;
    recommendedLevel: "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
    totalXp: number;
    level: number;
  };
};

export async function requireAuthSession(): Promise<SessionPayload> {
  const session = await getActiveSession();
  if (session === null) {
    throw new GuardError(401, "UNAUTHORIZED", "Silakan masuk terlebih dahulu.");
  }
  return session;
}

export async function requireRoleSession<R extends "PARENT" | "ADMIN">(
  requiredRole: R,
): Promise<SessionPayload & { role: R }> {
  const session = await requireAuthSession();
  if (session.role !== requiredRole) {
    throw new GuardError(403, "FORBIDDEN", "Anda tidak memiliki izin untuk mengakses fitur ini.");
  }
  return session as SessionPayload & { role: R };
}

export async function requireParentGateSession(): Promise<SessionPayload & { role: "PARENT" }> {
  const session = await requireRoleSession("PARENT");
  const gate = await getActiveParentGate();

  if (gate === null || gate.userId !== session.userId) {
    throw new GuardError(
      403,
      "PARENT_GATE_REQUIRED",
      "Verifikasi PIN orang tua diperlukan untuk melanjutkan.",
    );
  }

  return session;
}

export async function requireStudentSession(): Promise<VerifiedStudentContext> {
  const session = await requireRoleSession("PARENT");
  const studentCookie = await getActiveStudentCookie();

  if (studentCookie === null || studentCookie.parentId !== session.userId) {
    throw new GuardError(403, "STUDENT_PROFILE_REQUIRED", "Pilih profil anak terlebih dahulu.");
  }

  const db = getDb();
  const rows = await db
    .select({
      id: students.id,
      parentId: students.parentId,
      displayName: students.displayName,
      recommendedLevel: students.recommendedLevel,
      totalXp: students.totalXp,
      level: students.level,
    })
    .from(students)
    .where(and(eq(students.id, studentCookie.studentId), eq(students.parentId, session.userId)))
    .limit(1);

  const student = rows[0];
  if (student === undefined) {
    throw new GuardError(
      403,
      "STUDENT_PROFILE_REQUIRED",
      "Profil anak tidak valid atau tidak ditemukan.",
    );
  }

  return {
    parentSession: session,
    student,
  };
}
