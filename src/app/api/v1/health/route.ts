import { connection } from "next/server";
import { checkDatabase, getDbClient } from "../../../../db";
import { apiError, apiSuccess } from "../../../../lib/api-response";
import { getServerEnv } from "../../../../lib/env";

export async function GET(): Promise<Response> {
  await connection();

  try {
    const env = getServerEnv();
    const client = getDbClient();
    await checkDatabase(client);

    return apiSuccess({
      status: "ok",
      version: env.APP_VERSION,
      database: "connected",
    });
  } catch {
    return apiError(503, "SERVICE_UNAVAILABLE", "Layanan database belum siap.");
  }
}
