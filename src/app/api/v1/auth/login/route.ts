import {
  apiError,
  apiSuccess,
  apiValidationError,
  handleApiRouteError,
  NO_STORE_HEADERS,
  parseJsonBody,
} from "@/lib/api-response";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { attachSessionCookie, clearSecondaryAuthCookies } from "@/lib/session";
import { loginSchema } from "@/modules/auth/schemas";
import { AuthError, authenticateUser } from "@/modules/auth/service";
import type { AuthErrorCode } from "@/modules/auth/service";

const AUTH_ERROR_STATUS: Record<AuthErrorCode, number> = {
  CONFLICT: 409,
  INVALID_CREDENTIALS: 401,
  UNAUTHORIZED: 401,
};

const LOGIN_RATE_LIMITER = createRateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
});

export async function POST(request: Request): Promise<Response> {
  const rateLimit = LOGIN_RATE_LIMITER.consume(getClientIp(request));
  if (!rateLimit.allowed) {
    return apiError(
      429,
      "RATE_LIMIT_EXCEEDED",
      "Terlalu banyak percobaan masuk. Silakan coba lagi beberapa saat lagi.",
      undefined,
      {
        ...NO_STORE_HEADERS,
        "Retry-After": String(rateLimit.retryAfterSeconds),
      },
    );
  }

  const body = await parseJsonBody(request, undefined, NO_STORE_HEADERS);
  if (!body.ok) {
    return body.response;
  }

  const parsed = loginSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiValidationError(parsed.error, NO_STORE_HEADERS);
  }

  try {
    const result = await authenticateUser(parsed.data);
    const response = apiSuccess(result, { headers: NO_STORE_HEADERS });

    await attachSessionCookie(response, {
      userId: result.user.id,
      role: result.user.role,
    });
    clearSecondaryAuthCookies(response);

    return response;
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
