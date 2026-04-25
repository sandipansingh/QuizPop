export interface ApiError {
  status: number;
  message: string;
  details: unknown;
  raw?: unknown;
}

export interface ApiResponse<T = unknown> {
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export const normalizeApiError = (error: unknown): ApiError => {
  const err = error as Record<string, unknown>;
  const response = err?.response as Record<string, unknown> | undefined;
  const responseData = response?.data as Record<string, unknown> | undefined;
  const meta = responseData?.meta as Record<string, unknown> | undefined;

  const status = (response?.status as number) ?? (err?.status as number) ?? 500;
  const details = meta?.details ?? null;
  const message =
    (responseData?.message as string) ??
    (err?.message as string) ??
    'Something went wrong. Please try again.';

  return { status, message, details, raw: error };
};

export const parseApiResponse = <T = unknown>(response: {
  status: number;
  data: unknown;
}): ApiResponse<T> => {
  const payload = response?.data as Record<string, unknown> | undefined;

  if (!payload) {
    throw { status: 500, message: 'Invalid API response payload.' };
  }

  if (payload.success === false) {
    const meta = payload.meta as Record<string, unknown> | undefined;
    throw {
      status: response.status,
      message: (payload.message as string) || 'Request failed.',
      details: meta?.details ?? null,
    };
  }

  return {
    message: (payload.message as string) || 'OK',
    data: payload.data as T,
    meta: payload.meta as Record<string, unknown> | undefined,
  };
};
