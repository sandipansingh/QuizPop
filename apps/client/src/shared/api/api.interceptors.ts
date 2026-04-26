import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useLoadingStore } from '../../app/store/loading.store';
import { clientEnv } from '../config/env';
import { readAuthTokens } from './token-storage';
import { normalizeApiError } from './response';
import { shouldSkipRefresh, handleTokenRefresh } from './api.refresh';

const CSRF_COOKIE_NAME = clientEnv.csrfCookieName;

export const readCookie = (key: string): string | null => {
  if (typeof document === 'undefined') return null;
  const pairs = document.cookie ? document.cookie.split('; ') : [];
  const pair = pairs.find((item) => item.startsWith(`${key}=`));
  return pair ? decodeURIComponent(pair.split('=').slice(1).join('=')) : null;
};

export const attachRequestInterceptor = (
  api: ReturnType<typeof axios.create>
) => {
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      useLoadingStore.getState().begin();
      const tokens = readAuthTokens();
      if (tokens.accessToken) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      if (
        config.method &&
        !['get', 'head', 'options'].includes(config.method)
      ) {
        const csrfToken = readCookie(CSRF_COOKIE_NAME);
        if (csrfToken) {
          config.headers = config.headers ?? {};
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      }
      return config;
    },
    (error: unknown) => {
      useLoadingStore.getState().end();
      return Promise.reject(normalizeApiError(error));
    }
  );
};

export const attachResponseInterceptor = (
  api: ReturnType<typeof axios.create>
) => {
  api.interceptors.response.use(
    (response) => {
      useLoadingStore.getState().end();
      return response;
    },
    async (error: unknown) => {
      useLoadingStore.getState().end();
      const err = error as Record<string, unknown>;
      const originalRequest = (err.config ?? {}) as {
        _retry?: boolean;
        url?: string;
        headers?: Record<string, string>;
      };
      const status = (err.response as { status?: number } | undefined)?.status;

      if (
        status === 401 &&
        !originalRequest._retry &&
        !shouldSkipRefresh(originalRequest.url)
      ) {
        return handleTokenRefresh(api, originalRequest);
      }

      return Promise.reject(normalizeApiError(error));
    }
  );
};
