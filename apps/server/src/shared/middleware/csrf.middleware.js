import { randomBytes, timingSafeEqual } from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER = 'x-csrf-token';
const CSRF_EXCLUDED_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
];

const cookieSecure = env.COOKIE_SECURE ?? env.NODE_ENV === 'production';

const csrfCookieOptions = {
  httpOnly: false,
  secure: cookieSecure,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/',
};

if (env.COOKIE_DOMAIN) {
  csrfCookieOptions.domain = env.COOKIE_DOMAIN;
}

const shouldSkipCsrf = (req) => {
  if (SAFE_METHODS.has(req.method)) {
    return true;
  }

  return CSRF_EXCLUDED_PATHS.some((path) => req.path === path);
};

const safeCompare = (left, right) => {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const attachCsrfToken = (req, res, next) => {
  let csrfToken = req.cookies?.[env.CSRF_COOKIE_NAME];

  if (!csrfToken) {
    csrfToken = randomBytes(32).toString('hex');
    res.cookie(env.CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions);
  }

  req.csrfToken = csrfToken;
  next();
};

export const requireCsrfProtection = (req, _res, next) => {
  if (shouldSkipCsrf(req)) {
    return next();
  }

  const headerToken = req.get(CSRF_HEADER);
  const cookieToken = req.cookies?.[env.CSRF_COOKIE_NAME];

  if (!cookieToken || !headerToken || !safeCompare(cookieToken, headerToken)) {
    return next(new ApiError(403, 'Invalid CSRF token'));
  }

  return next();
};
