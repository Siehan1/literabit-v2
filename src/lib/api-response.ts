import { NextResponse } from "next/server";
import type { z } from "zod";
import { GuardError } from "./guards";

export type ApiErrorDetail = {
  field: string;
  message: string;
};

export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

export type ApiErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
};

export const NO_STORE_HEADERS: Readonly<Record<string, string>> = {
  "Cache-Control": "no-store",
};

export function apiSuccess<T>(
  data: T,
  options?: {
    status?: number;
    meta?: { page: number; limit: number; total: number };
    headers?: HeadersInit;
  },
): NextResponse<ApiSuccessEnvelope<T>> {
  const body: ApiSuccessEnvelope<T> =
    options?.meta !== undefined
      ? { success: true, data, meta: options.meta }
      : { success: true, data };
  const init: ResponseInit = { status: options?.status ?? 200 };
  if (options?.headers !== undefined) {
    init.headers = options.headers;
  }
  return NextResponse.json(body, init);
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: ApiErrorDetail[],
  headers?: HeadersInit,
): NextResponse<ApiErrorEnvelope> {
  const errorBody: ApiErrorEnvelope["error"] =
    details !== undefined ? { code, message, details } : { code, message };
  const init: ResponseInit = { status };
  if (headers !== undefined) {
    init.headers = headers;
  }
  return NextResponse.json({ success: false, error: errorBody }, init);
}

export type ParsedJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse<ApiErrorEnvelope> };

export function formatZodErrorDetails(error: z.ZodError): ApiErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.map(String).join(".") : "body",
    message: issue.message,
  }));
}

export function apiValidationError(
  error: z.ZodError,
  headers?: HeadersInit,
): NextResponse<ApiErrorEnvelope> {
  return apiError(
    400,
    "VALIDATION_ERROR",
    "Data yang dikirim tidak valid.",
    formatZodErrorDetails(error),
    headers,
  );
}

const DEFAULT_MAX_JSON_BYTES = 16 * 1024;

export async function parseJsonBody(
  request: Request,
  maxBytes: number = DEFAULT_MAX_JSON_BYTES,
  headers?: HeadersInit,
): Promise<ParsedJsonResult> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      return {
        ok: false,
        response: apiError(
          413,
          "PAYLOAD_TOO_LARGE",
          "Ukuran body permintaan melebihi batas yang diizinkan.",
          undefined,
          headers,
        ),
      };
    }
  }

  let rawText: string;
  try {
    rawText = await request.text();
  } catch {
    return {
      ok: false,
      response: apiError(
        400,
        "VALIDATION_ERROR",
        "Format JSON pada body permintaan tidak valid.",
        undefined,
        headers,
      ),
    };
  }

  if (new TextEncoder().encode(rawText).length > maxBytes) {
    return {
      ok: false,
      response: apiError(
        413,
        "PAYLOAD_TOO_LARGE",
        "Ukuran body permintaan melebihi batas yang diizinkan.",
        undefined,
        headers,
      ),
    };
  }

  try {
    const data: unknown = JSON.parse(rawText);
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: apiError(
        400,
        "VALIDATION_ERROR",
        "Format JSON pada body permintaan tidak valid.",
        undefined,
        headers,
      ),
    };
  }
}

function logUnexpectedRouteError(error: unknown): void {
  const errorName = error instanceof Error ? error.name : typeof error;
  let errorCode: string | undefined;
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    errorCode = error.code;
  }

  const logEntry =
    errorCode !== undefined
      ? { level: "error", event: "api_route_unexpected_error", errorName, errorCode }
      : { level: "error", event: "api_route_unexpected_error", errorName };

  // Avoid logging error.message or stack because raw driver errors can contain credentials.
  console.error(JSON.stringify(logEntry));
}

export function handleApiRouteError(
  error: unknown,
  headers?: HeadersInit,
): NextResponse<ApiErrorEnvelope> {
  if (error instanceof GuardError) {
    return apiError(error.status, error.code, error.message, undefined, headers);
  }

  logUnexpectedRouteError(error);

  return apiError(
    500,
    "INTERNAL_SERVER_ERROR",
    "Terjadi kesalahan pada server. Silakan coba lagi.",
    undefined,
    headers,
  );
}
