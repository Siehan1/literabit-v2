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

export function apiSuccess<T>(
  data: T,
  options?: {
    status?: number;
    meta?: { page: number; limit: number; total: number };
  },
): NextResponse<ApiSuccessEnvelope<T>> {
  const body: ApiSuccessEnvelope<T> =
    options?.meta !== undefined
      ? { success: true, data, meta: options.meta }
      : { success: true, data };
  return NextResponse.json(body, { status: options?.status ?? 200 });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: ApiErrorDetail[],
): NextResponse<ApiErrorEnvelope> {
  const errorBody: ApiErrorEnvelope["error"] =
    details !== undefined ? { code, message, details } : { code, message };
  return NextResponse.json({ success: false, error: errorBody }, { status });
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

export function apiValidationError(error: z.ZodError): NextResponse<ApiErrorEnvelope> {
  return apiError(
    400,
    "VALIDATION_ERROR",
    "Data yang dikirim tidak valid.",
    formatZodErrorDetails(error),
  );
}

const DEFAULT_MAX_JSON_BYTES = 16 * 1024;

export async function parseJsonBody(
  request: Request,
  maxBytes: number = DEFAULT_MAX_JSON_BYTES,
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
      response: apiError(400, "VALIDATION_ERROR", "Format JSON pada body permintaan tidak valid."),
    };
  }

  if (new TextEncoder().encode(rawText).length > maxBytes) {
    return {
      ok: false,
      response: apiError(
        413,
        "PAYLOAD_TOO_LARGE",
        "Ukuran body permintaan melebihi batas yang diizinkan.",
      ),
    };
  }

  try {
    const data: unknown = JSON.parse(rawText);
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: apiError(400, "VALIDATION_ERROR", "Format JSON pada body permintaan tidak valid."),
    };
  }
}

export function handleApiRouteError(error: unknown): NextResponse<ApiErrorEnvelope> {
  if (error instanceof GuardError) {
    return apiError(error.status, error.code, error.message);
  }

  return apiError(
    500,
    "INTERNAL_SERVER_ERROR",
    "Terjadi kesalahan pada server. Silakan coba lagi.",
  );
}
