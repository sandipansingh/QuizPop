import axios from 'axios';
import { useLoadingStore } from '../../app/store/loading.store.js';
import { clientEnv } from '../config/env.js';
import { apiPaths } from './endpoints.js';
import {
  clearAuthTokens,
  readAuthTokens,
  writeAuthTokens,
} from './token-storage.js';
import { normalizeApiError } from './response.js';

const API_BASE_URL = clientEnv.apiBaseUrl;

const CSRF_COOKIE_NAME = clientEnv.csrfCookieName;

const readCookie = (key) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const pairs = document.cookie ? document.cookie.split('; ') : [];
  const pair = pairs.find((item) => item.startsWith(`${key}=`));
  return pair ? decodeURIComponent(pair.split('=').slice(1).join('=')) : null;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: clientEnv.apiRequestTimeoutMs,
  withCredentials: true,
});

const shouldSkipRefresh = (url = '') => {
  return [
    apiPaths.auth.login,
    apiPaths.auth.register,
    apiPaths.auth.refresh,
    apiPaths.auth.logout,
  ].some((path) => url.includes(path));
};

const dispatchAuthExpired = (reason) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('auth:expired', {
      detail: { reason },
    })
  );
};

let isRefreshing = false;
let waitingQueue = [];

const flushQueue = (error, accessToken) => {
  waitingQueue.forEach((entry) => {
    if (error) {
      entry.reject(error);
      return;
    }

    entry.resolve(accessToken);
  });

  waitingQueue = [];
};

api.interceptors.request.use(
  (config) => {
    useLoadingStore.getState().begin();

    const tokens = readAuthTokens();
    if (tokens.accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    if (config.method && !['get', 'head', 'options'].includes(config.method)) {
      const csrfToken = readCookie(CSRF_COOKIE_NAME);
      if (csrfToken) {
        config.headers = config.headers || {};
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    useLoadingStore.getState().end();
    return Promise.reject(normalizeApiError(error));
  }
);

api.interceptors.response.use(
  (response) => {
    useLoadingStore.getState().end();
    return response;
  },
  async (error) => {
    useLoadingStore.getState().end();

    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (
      status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waitingQueue.push({ resolve, reject });
        })
          .then((accessToken) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          })
          .catch((queueError) => Promise.reject(normalizeApiError(queueError)));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}${apiPaths.auth.refresh}`,
          {},
          {
            withCredentials: true,
            headers: {
              'X-CSRF-Token': readCookie(CSRF_COOKIE_NAME) || '',
            },
          }
        );

        const refreshed = refreshResponse?.data?.data;
        if (!refreshed?.access_token) {
          throw new Error('Invalid refresh token response.');
        }

        writeAuthTokens({
          accessToken: refreshed.access_token,
        });

        flushQueue(null, refreshed.access_token);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${refreshed.access_token}`;

        return api(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError);
        clearAuthTokens();
        dispatchAuthExpired('Session expired. Please login again.');
        return Promise.reject(normalizeApiError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export { api, API_BASE_URL };
