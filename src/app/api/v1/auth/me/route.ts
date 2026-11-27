import { connection } from "next/server";
import { apiError, apiSuccess, handleApiRouteError, NO_STORE_HEADERS } from "@/lib/api-response";
import { requireAuthSession } from "@/lib/guards";
import { getActiveParentGate, getActiveStudentCookie } from "@/lib/session";
import { AuthError, getAuthSessionContext } from "@/modules/auth/service";
import type { AuthErrorCode } from "@/modules/auth/service";

const AUTH_ERROR_STATUS: Record<AuthErrorCode, number> = {
  CONFLICT: 409,
  INVALID_CREDENTIALS: 401,
  UNAUTHORIZED: 401,
};

export async function GET(): Promise<Response> {
  await connection();

  try {
    const session = await requireAuthSession();
    const [studentCookie, parentGate] = await Promise.all([
      getActiveStudentCookie(),
      getActiveParentGate(),
    ]);

    const result = await getAuthSessionContext({
      session,
      studentCookie,
      parentGate,
    });

    return apiSuccess(result, { headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return apiError(
        AUTH_ERROR_STATUS[error.code],
        error.code,
        error.message,
        error.details,
        NO_STORE_HEADERS,
      );
    }
    return handleApiRouteError(error, NO_STORE_HEADERS);
  }
}
