import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";
import { getServerEnv } from "./env";

export const LITERABIT_SESSION_COOKIE = "literabit_session";
export const LITERABIT_STUDENT_COOKIE = "literabit_student";
export const LITERABIT_PARENT_GATE_COOKIE = "literabit_parent_gate";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const PARENT_GATE_TTL_SECONDS = 60 * 15; // 15 minutes

const sessionPayloadSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["PARENT", "ADMIN"]),
});

const studentSessionPayloadSchema = z.object({
  studentId: z.string().uuid(),
  parentId: z.string().uuid(),
});

const parentGatePayloadSchema = z.object({
  userId: z.string().uuid(),
  verifiedAt: z.number().int().positive(),
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;
export type StudentSessionPayload = z.infer<typeof studentSessionPayloadSchema>;
export type ParentGatePayload = z.infer<typeof parentGatePayloadSchema>;

function getSigningKey(): Uint8Array {
  return new TextEncoder().encode(getServerEnv().AUTH_SECRET);
}

export function getCookieOptions(maxAgeSeconds: number): {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  secure: boolean;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: getServerEnv().APP_ENV === "production",
    maxAge: maxAgeSeconds,
  };
}

async function signPayload(
  payload: Record<string, unknown>,
  maxAgeSeconds: number,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSigningKey());
}

async function verifyPayload<T>(token: string, schema: z.ZodType<T>): Promise<T | null> {
  if (token.length === 0) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSigningKey(), { algorithms: ["HS256"] });
    const parsed = schema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return signPayload(payload, SESSION_TTL_SECONDS);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  return verifyPayload(token, sessionPayloadSchema);
}

export async function signStudentToken(payload: StudentSessionPayload): Promise<string> {
  return signPayload(payload, SESSION_TTL_SECONDS);
}

export async function verifyStudentToken(token: string): Promise<StudentSessionPayload | null> {
  return verifyPayload(token, studentSessionPayloadSchema);
}

export async function signParentGateToken(payload: ParentGatePayload): Promise<string> {
  return signPayload(payload, PARENT_GATE_TTL_SECONDS);
}

export async function verifyParentGateToken(token: string): Promise<ParentGatePayload | null> {
  return verifyPayload(token, parentGatePayloadSchema);
}

export async function getActiveSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LITERABIT_SESSION_COOKIE)?.value;
  if (token === undefined) {
    return null;
  }
  return verifySessionToken(token);
}

export async function getActiveStudentCookie(): Promise<StudentSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LITERABIT_STUDENT_COOKIE)?.value;
  if (token === undefined) {
    return null;
  }
  return verifyStudentToken(token);
}

export async function getActiveParentGate(): Promise<ParentGatePayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LITERABIT_PARENT_GATE_COOKIE)?.value;
  if (token === undefined) {
    return null;
  }
  return verifyParentGateToken(token);
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const cookieStore = await cookies();
  const token = await signSessionToken(payload);
  cookieStore.set(LITERABIT_SESSION_COOKIE, token, getCookieOptions(SESSION_TTL_SECONDS));
}

export async function setStudentCookie(payload: StudentSessionPayload): Promise<void> {
  const cookieStore = await cookies();
  const token = await signStudentToken(payload);
  cookieStore.set(LITERABIT_STUDENT_COOKIE, token, getCookieOptions(SESSION_TTL_SECONDS));
}

export async function setParentGateCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const token = await signParentGateToken({ userId, verifiedAt: Date.now() });
  cookieStore.set(LITERABIT_PARENT_GATE_COOKIE, token, getCookieOptions(PARENT_GATE_TTL_SECONDS));
}

type CookieResponseTarget = {
  cookies: {
    set: (name: string, value: string, options: ReturnType<typeof getCookieOptions>) => unknown;
  };
};

export async function attachSessionCookie(
  response: CookieResponseTarget,
  payload: SessionPayload,
): Promise<void> {
  const token = await signSessionToken(payload);
  response.cookies.set(LITERABIT_SESSION_COOKIE, token, getCookieOptions(SESSION_TTL_SECONDS));
}

export function clearSecondaryAuthCookies(response: CookieResponseTarget): void {
  const expiredOptions = getCookieOptions(0);
  response.cookies.set(LITERABIT_STUDENT_COOKIE, "", expiredOptions);
  response.cookies.set(LITERABIT_PARENT_GATE_COOKIE, "", expiredOptions);
}

export async function clearAllAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(LITERABIT_SESSION_COOKIE);
  cookieStore.delete(LITERABIT_STUDENT_COOKIE);
  cookieStore.delete(LITERABIT_PARENT_GATE_COOKIE);
}
