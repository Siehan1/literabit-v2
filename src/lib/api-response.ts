import { NextResponse } from "next/server";
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
