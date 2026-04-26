import { env } from '../config/env.js';

export const cacheTtls = {
  questionPoolSeconds: env.CACHE_TTL_QUESTION_POOL_SECONDS,
  questionPoolStaleSeconds: env.CACHE_TTL_QUESTION_POOL_STALE_SECONDS,
  leaderboardSeconds: env.CACHE_TTL_LEADERBOARD_SECONDS,
  leaderboardStaleSeconds: env.CACHE_TTL_LEADERBOARD_STALE_SECONDS,
  userProfileSeconds: env.CACHE_TTL_USER_PROFILE_SECONDS,
  userProfileStaleSeconds: env.CACHE_TTL_USER_PROFILE_STALE_SECONDS,
};

export const cacheKeys = {
  user: (userId) => `user:${userId}`,
  userStats: (userId) => `user:${userId}:stats`,
  leaderboard: ({ scope = 'global', page = 1, limit = 20 } = {}) =>
    `leaderboard:${scope}:page:${page}:limit:${limit}`,
  questionsDifficulty: ({ level = 'all', category = 'all', limit = 0 } = {}) =>
    `questions:difficulty:${level}:category:${category}:limit:${limit}`,
  questionsUser: (userId) => `questions:user:${userId}`,
  roomMeta: (roomId) => `room:${roomId}:meta`,
};
