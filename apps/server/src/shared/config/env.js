import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars long'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 chars long'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SOCKET_CORS_ORIGIN: z.string().default('http://localhost:5173'),
  REFRESH_COOKIE_NAME: z.string().default('quizpop_refresh_token'),
  CSRF_COOKIE_NAME: z.string().default('quizpop_csrf_token'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
  COOKIE_DOMAIN: z.string().optional(),
  SERVER_PUBLIC_BASE_URL: z.string().url().default('http://localhost:4000'),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_REGION: z.string().default('local-1'),
  MINIO_USE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin123'),
  MINIO_BUCKET: z.string().optional(),
  MINIO_AVATARS_BUCKET: z.string().optional(),
  MINIO_PUBLIC_BASE_URL: z.string().url().default('http://localhost:9000'),
  REDIS_URL: z.string().default(''),
  REDIS_USER: z.string().default('default'),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_KEY_PREFIX: z.string().default('quizpop:'),
  REDIS_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  CACHE_TTL_QUESTION_POOL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 60),
  CACHE_TTL_QUESTION_POOL_STALE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 60),
  CACHE_TTL_LEADERBOARD_SECONDS: z.coerce.number().int().positive().default(45),
  CACHE_TTL_LEADERBOARD_STALE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(3 * 60),
  CACHE_TTL_USER_PROFILE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 60),
  CACHE_TTL_USER_PROFILE_STALE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(600),
  AUTH_REGISTER_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(900000),
  AUTH_REGISTER_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(900000),
  AUTH_LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(6),
  AUTH_TOKEN_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(900000),
  AUTH_TOKEN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(40),
  SENSITIVE_WRITE_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(600000),
  SENSITIVE_WRITE_RATE_LIMIT_MAX: z.coerce
    .number()
    .int()
    .positive()
    .default(120),
  ROOM_QUESTION_TIME_LIMIT_MS: z.coerce.number().int().min(1000).default(25000),
  ROOM_RACE_END_BUFFER_MS: z.coerce.number().int().min(0).default(15000),
  ROOM_QUESTION_COUNT: z.coerce.number().int().positive().default(10),
  ROOM_MAX_PLAYERS: z.coerce.number().int().positive().default(20),
  QUESTION_HISTORY_LOOKBACK_COUNT: z.coerce
    .number()
    .int()
    .positive()
    .default(20),
  QUIZ_DEFAULT_QUESTION_LIMIT: z.coerce.number().int().positive().default(10),
  QUIZ_MAX_QUESTION_LIMIT: z.coerce.number().int().positive().default(50),
  LEADERBOARD_MIN_GAMES_FOR_RANKING: z.coerce.number().int().min(0).default(5),
  LEADERBOARD_MAX_PAGE_LIMIT: z.coerce.number().int().positive().default(100),
  SOLO_QUESTION_TIME_LIMIT_MS: z.coerce.number().int().min(1000).default(15000),
});

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    'Invalid environment configuration',
    parsedEnv.error.flatten().fieldErrors
  );
  process.exit(1);
}

const resolvedMinioBucket =
  parsedEnv.data.MINIO_AVATARS_BUCKET ||
  parsedEnv.data.MINIO_BUCKET ||
  'avatars';

export const env = {
  ...parsedEnv.data,
  MINIO_AVATARS_BUCKET: resolvedMinioBucket,
};
