export type ApiErrorDetail = {
  field: string;
  message: string;
};

export type ApiResponseMeta = {
  page: number;
  limit: number;
  total: number;
};

type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: ApiResponseMeta;
};

type ApiErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[] | undefined;

  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options?: ApiFetchOptions,
): Promise<{ data: T; meta?: ApiResponseMeta }> {
  const headers = new Headers(options?.headers);
  if (options?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const requestInit: RequestInit = {
    ...options,
    headers,
    credentials: "include",
    body: options?.body === undefined ? null : JSON.stringify(options.body),
  };

  const response = await fetch(`/api/v1${path.startsWith("/") ? path : `/${path}`}`, requestInit);

  let payload: ApiSuccessEnvelope<T> | ApiErrorEnvelope | null = null;
  try {
    payload = (await response.json()) as ApiSuccessEnvelope<T> | ApiErrorEnvelope;
  } catch {
    payload = null;
  }

  if (!response.ok || payload === null || !payload.success) {
    const code = payload !== null && !payload.success ? payload.error.code : "REQUEST_FAILED";
    const message =
      payload !== null && !payload.success
        ? payload.error.message
        : "Permintaan gagal diproses. Silakan coba lagi.";
    const details = payload !== null && !payload.success ? payload.error.details : undefined;
    throw new ApiClientError(response.status, code, message, details);
  }

  return payload.meta !== undefined
    ? { data: payload.data, meta: payload.meta }
    : { data: payload.data };
}
