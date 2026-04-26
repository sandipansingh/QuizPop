import axios, { type AxiosRequestConfig } from 'axios';
import { clientEnv } from '../config/env';
import { apiPaths } from './endpoints';
import { clearAuthTokens, writeAuthTokens } from './token-storage';
import { normalizeApiError } from './response';
import { readCookie } from './api.interceptors';

const API_BASE_URL = clientEnv.apiBaseUrl;
const CSRF_COOKIE_NAME = clientEnv.csrfCookieName;

let isRefreshing = false;
let waitingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const flushQueue = (error: unknown, accessToken?: string): void => {
  waitingQueue.forEach((entry) => {
    if (error) {
      entry.reject(error);
      return;
    }
    entry.resolve(accessToken!);
  });
  waitingQueue = [];
};

const dispatchAuthExpired = (reason: string): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('auth:expired', { detail: { reason } }));
};

export const shouldSkipRefresh = (url = ''): boolean =>
  [
    apiPaths.auth.login,
    apiPaths.auth.register,
    apiPaths.auth.refresh,
    apiPaths.auth.logout,
  ].some((path) => url.includes(path));

export const handleTokenRefresh = async (
  api: ReturnType<typeof axios.create>,
  originalRequest: AxiosRequestConfig & { _retry?: boolean }
): Promise<unknown> => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      waitingQueue.push({ resolve, reject });
    })
      .then((accessToken) => {
        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as Record<string, string>).Authorization =
          `Bearer ${accessToken}`;
        return api(originalRequest);
      })
      .catch((queueError: unknown) =>
        Promise.reject(normalizeApiError(queueError))
      );
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const refreshResponse = await axios.post(
      `${API_BASE_URL}${apiPaths.auth.refresh}`,
      {},
      {
        withCredentials: true,
        headers: { 'X-CSRF-Token': readCookie(CSRF_COOKIE_NAME) ?? '' },
      }
    );
    const refreshed = refreshResponse?.data?.data as
      | { access_token?: string }
      | undefined;
    if (!refreshed?.access_token)
      throw new Error('Invalid refresh token response.');
    writeAuthTokens({ accessToken: refreshed.access_token });
    flushQueue(null, refreshed.access_token);
    originalRequest.headers = originalRequest.headers ?? {};
    (originalRequest.headers as Record<string, string>).Authorization =
      `Bearer ${refreshed.access_token}`;
    return api(originalRequest);
  } catch (refreshError: unknown) {
    flushQueue(refreshError);
    clearAuthTokens();
    dispatchAuthExpired('Session expired. Please login again.');
    return Promise.reject(normalizeApiError(refreshError));
  } finally {
    isRefreshing = false;
  }
};
