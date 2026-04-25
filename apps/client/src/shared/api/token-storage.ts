const ACCESS_TOKEN_KEY = 'quizpop_access_token';
const REFRESH_TOKEN_KEY = 'quizpop_refresh_token';

const hasWindow = (): boolean => typeof window !== 'undefined';

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: null;
}

export const readAuthTokens = (): AuthTokens => {
  if (!hasWindow()) {
    return { accessToken: null, refreshToken: null };
  }

  return {
    accessToken: window.localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: null,
  };
};

export const writeAuthTokens = ({
  accessToken,
}: {
  accessToken: string;
}): void => {
  if (!hasWindow()) {
    return;
  }

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearAuthTokens = (): void => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};
