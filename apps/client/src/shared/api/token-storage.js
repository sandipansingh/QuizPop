const ACCESS_TOKEN_KEY = 'quizpop_access_token';
const REFRESH_TOKEN_KEY = 'quizpop_refresh_token';

const hasWindow = () => typeof window !== 'undefined';

export const readAuthTokens = () => {
  if (!hasWindow()) {
    return { accessToken: null, refreshToken: null };
  }

  return {
    accessToken: window.localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: null,
  };
};

export const writeAuthTokens = ({ accessToken }) => {
  if (!hasWindow()) {
    return;
  }

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearAuthTokens = () => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};
