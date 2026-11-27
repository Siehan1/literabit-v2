import {
  apiError,
  apiSuccess,
  apiValidationError,
  handleApiRouteError,
  parseJsonBody,
} from "@/lib/api-response";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { attachSessionCookie, clearSecondaryAuthCookies } from "@/lib/session";
import { registerParentSchema } from "@/modules/auth/schemas";
import { AuthError, registerParent } from "@/modules/auth/service";
import type { AuthErrorCode } from "@/modules/auth/service";

const AUTH_ERROR_STATUS: Record<AuthErrorCode, number> = {
  CONFLICT: 409,
  INVALID_CREDENTIALS: 401,
  UNAUTHORIZED: 401,
};

const REGISTER_RATE_LIMITER = createRateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
});

export async function POST(request: Request): Promise<Response> {
  const rateLimit = REGISTER_RATE_LIMITER.consume(getClientIp(request));
  if (!rateLimit.allowed) {
    const response = apiError(
      429,
      "RATE_LIMIT_EXCEEDED",
      "Terlalu banyak percobaan registrasi. Silakan coba lagi beberapa saat lagi.",
    );
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  const body = await parseJsonBody(request);
  if (!body.ok) {
    return body.response;
  }

  const parsed = registerParentSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  try {
    const user = await registerParent(parsed.data);
    const response = apiSuccess({ user }, { status: 201 });

    await attachSessionCookie(response, { userId: user.id, role: user.role });
    clearSecondaryAuthCookies(response);

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(AUTH_ERROR_STATUS[error.code], error.code, error.message, error.details);
    }
    return handleApiRouteError(error);
  }
}
