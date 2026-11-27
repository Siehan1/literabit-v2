import { apiSuccess, handleApiRouteError, NO_STORE_HEADERS } from "@/lib/api-response";
import { clearAllAuthCookies } from "@/lib/session";
import type { LogoutResult } from "@/modules/auth/schemas";

export async function POST(): Promise<Response> {
  try {
    await clearAllAuthCookies();

    const payload: LogoutResult = { loggedOut: true };
    return apiSuccess(payload, { headers: NO_STORE_HEADERS });
  } catch (error: unknown) {
    return handleApiRouteError(error, NO_STORE_HEADERS);
  }
}
