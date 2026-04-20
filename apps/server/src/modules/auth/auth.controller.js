import { authService } from './auth.service.js';
import { sendSuccess } from '../../shared/utils/http-response.js';
import { env } from '../../shared/config/env.js';

const cookieSecure = env.COOKIE_SECURE ?? env.NODE_ENV === 'production';

const parseExpiryToMs = (expiryValue) => {
  const value = String(expiryValue).trim();
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric * 1000;
  }

  const match = value.match(/^(\d+)\s*([smhd])$/i);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * unitMs[unit];
};

const refreshCookieBaseOptions = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/api/auth',
};

const refreshCookieOptions = {
  ...refreshCookieBaseOptions,
  maxAge: parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN),
};

if (env.COOKIE_DOMAIN) {
  refreshCookieBaseOptions.domain = env.COOKIE_DOMAIN;
  refreshCookieOptions.domain = env.COOKIE_DOMAIN;
}

const csrfCookieBaseOptions = {
  httpOnly: false,
  secure: cookieSecure,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/',
};

if (env.COOKIE_DOMAIN) {
  csrfCookieBaseOptions.domain = env.COOKIE_DOMAIN;
}

const resolveRefreshToken = (req) =>
  req.cookies?.[env.REFRESH_COOKIE_NAME] ||
  req.validated.body.refresh_token ||
  req.validated.body.refreshToken;

export const authController = {
  register: async (req, res) => {
    const result = await authService.register(req.validated.body);
    res.cookie(
      env.REFRESH_COOKIE_NAME,
      result.refresh_token,
      refreshCookieOptions
    );
    const publicResult = { ...result };
    delete publicResult.refresh_token;

    sendSuccess(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: publicResult,
    });
  },

  login: async (req, res) => {
    const result = await authService.login(req.validated.body);
    res.cookie(
      env.REFRESH_COOKIE_NAME,
      result.refresh_token,
      refreshCookieOptions
    );
    const publicResult = { ...result };
    delete publicResult.refresh_token;

    sendSuccess(res, { message: 'Login successful', data: publicResult });
  },

  refreshToken: async (req, res) => {
    const refreshToken = resolveRefreshToken(req);
    const result = await authService.refreshToken({
      refresh_token: refreshToken,
    });
    res.cookie(
      env.REFRESH_COOKIE_NAME,
      result.refresh_token,
      refreshCookieOptions
    );
    const publicResult = { ...result };
    delete publicResult.refresh_token;

    sendSuccess(res, {
      message: 'Token refreshed successfully',
      data: publicResult,
    });
  },

  logout: async (req, res) => {
    const refreshToken = resolveRefreshToken(req);
    const result = await authService.logout({ refresh_token: refreshToken });
    res.clearCookie(env.REFRESH_COOKIE_NAME, refreshCookieBaseOptions);
    res.clearCookie(env.CSRF_COOKIE_NAME, csrfCookieBaseOptions);

    sendSuccess(res, { message: 'Logout successful', data: result });
  },
};
