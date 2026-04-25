const parsePositiveInteger = (
  value: string | undefined,
  fallback: number
): number => {
  const normalized = Number(value);

  if (!Number.isInteger(normalized) || normalized <= 0) {
    return fallback;
  }

  return normalized;
};

export const clientEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000',
  csrfCookieName: import.meta.env.VITE_CSRF_COOKIE_NAME || 'quizpop_csrf_token',
  apiRequestTimeoutMs: parsePositiveInteger(
    import.meta.env.VITE_API_REQUEST_TIMEOUT_MS,
    20000
  ),
  toastDurationMs: parsePositiveInteger(
    import.meta.env.VITE_TOAST_DURATION_MS,
    3600
  ),
  quizQuestionTimeLimitMs: parsePositiveInteger(
    import.meta.env.VITE_QUIZ_QUESTION_TIME_LIMIT_MS,
    30000
  ),
  roomQuestionTimeLimitMs: parsePositiveInteger(
    import.meta.env.VITE_ROOM_QUESTION_TIME_LIMIT_MS,
    25000
  ),
  defaultQuestionLimit: parsePositiveInteger(
    import.meta.env.VITE_DEFAULT_QUESTION_LIMIT,
    10
  ),
} as const;
