import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient, isRedisReady } from '../cache/redis.client.js';
import { env } from '../config/env.js';
import { ErrorCodes } from '../utils/error-codes.js';

const buildRateLimitMessage = (message) => ({
  success: false,
  message,
  data: null,
  meta: {
    code: ErrorCodes.RATE_LIMIT_EXCEEDED,
    timestamp: new Date().toISOString(),
  },
});

const buildLimiter = ({ redisPrefix, message: rawMessage, ...baseOptions }) => {
  const message = buildRateLimitMessage(
    rawMessage ?? 'Too many requests. Please retry later.'
  );

  const memoryLimiter = rateLimit({
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message,
    ...baseOptions,
  });

  let redisLimiter = null;

  return (req, res, next) => {
    if (!isRedisReady()) {
      return memoryLimiter(req, res, next);
    }

    if (!redisLimiter) {
      const client = getRedisClient();
      redisLimiter = rateLimit({
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message,
        passOnStoreError: true,
        validate: {
          creationStack: false,
        },
        ...baseOptions,
        store: new RedisStore({
          sendCommand: (...args) => client.sendCommand(args),
          prefix: `${env.REDIS_KEY_PREFIX}${redisPrefix}`,
        }),
      });
    }

    return redisLimiter(req, res, next);
  };
};

export const apiLimiter = buildLimiter({
  redisPrefix: 'rl:api:',
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  limit: env.API_RATE_LIMIT_MAX,
});

export const authRegisterLimiter = buildLimiter({
  redisPrefix: 'rl:auth:register:',
  windowMs: env.AUTH_REGISTER_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_REGISTER_RATE_LIMIT_MAX,
  message: 'Too many register attempts. Please retry later.',
});

export const authLoginLimiter = buildLimiter({
  redisPrefix: 'rl:auth:login:',
  windowMs: env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_LOGIN_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => ipKeyGenerator(req.ip, 56),
  message: 'Too many failed login attempts. Please retry later.',
});

export const authTokenLimiter = buildLimiter({
  redisPrefix: 'rl:auth:token:',
  windowMs: env.AUTH_TOKEN_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_TOKEN_RATE_LIMIT_MAX,
  message: 'Too many token actions. Please retry later.',
});

export const sensitiveWriteLimiter = buildLimiter({
  redisPrefix: 'rl:sensitive:',
  windowMs: env.SENSITIVE_WRITE_RATE_LIMIT_WINDOW_MS,
  limit: env.SENSITIVE_WRITE_RATE_LIMIT_MAX,
  message: 'Too many write operations. Please retry later.',
});
