import { AppError } from '../errors/AppError';
import { ErrorCodes } from '../errors/error-codes';

export interface ApiError {
  status: number;
  message: string;
  details: unknown;
  code?: string;
  raw?: unknown;
}

export interface ApiResponse<T = unknown> {
  message: string;
  data: T;
  meta?: {
    code?: string;
    timestamp?: string;
    path?: string;
    details?: unknown;
    [key: string]: unknown;
  };
}

export const normalizeApiError = (error: unknown): ApiError => {
  const err = error as Record<string, unknown>;
  const response = err?.response as Record<string, unknown> | undefined;
  const responseData = response?.data as Record<string, unknown> | undefined;
  const meta = responseData?.meta as Record<string, unknown> | undefined;

  const status = (response?.status as number) ?? (err?.status as number) ?? 500;
  const code = (meta?.code as string) ?? ErrorCodes.UNKNOWN_ERROR;
  const details = meta?.details ?? null;
  const message =
    (responseData?.message as string) ??
    (err?.message as string) ??
    'Something went wrong. Please try again.';

  if (err?.code === 'ERR_NETWORK') {
    return {
      status: 0,
      message: 'Network error. Please check your connection.',
      details: null,
      code: ErrorCodes.NETWORK_ERROR,
      raw: error,
    };
  }

  if (err?.code === 'ECONNABORTED') {
    return {
      status: 0,
      message: 'Request timed out. Please try again.',
      details: null,
      code: ErrorCodes.NETWORK_TIMEOUT,
      raw: error,
    };
  }

  if (!navigator.onLine) {
    return {
      status: 0,
      message: 'You are offline. Please check your internet connection.',
      details: null,
      code: ErrorCodes.NETWORK_OFFLINE,
      raw: error,
    };
  }

  return { status, message, details, code, raw: error };
};

export const parseApiResponse = <T = unknown>(response: {
  status: number;
  data: unknown;
}): ApiResponse<T> => {
  const payload = response?.data as Record<string, unknown> | undefined;

  if (!payload) {
    throw AppError.unknownError('Invalid API response payload.');
  }

  if (payload.success === false) {
    const meta = payload.meta as Record<string, unknown> | undefined;
    const apiError: ApiError = {
      status: response.status,
      message: (payload.message as string) || 'Request failed.',
      details: meta?.details ?? null,
      code: (meta?.code as string) ?? ErrorCodes.UNKNOWN_ERROR,
    };
    throw AppError.fromApiError(apiError);
  }

  return {
    message: (payload.message as string) || 'OK',
    data: payload.data as T,
    meta: payload.meta as ApiResponse<T>['meta'],
  };
};
