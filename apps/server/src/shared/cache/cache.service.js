import { env } from '../config/env.js';
import { getRedisClient, isRedisReady } from './redis.client.js';
import { logger } from '../utils/logger.js';

const withPrefix = (key) => `${env.REDIS_KEY_PREFIX}${key}`;
const stripPrefix = (key) => key.replace(`${env.REDIS_KEY_PREFIX}`, '');
const swrRefreshLocks = new Set();

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

const safeParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const toArray = (value) => (Array.isArray(value) ? value : [value]);

const scanAndDeleteByPattern = async (pattern) => {
  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  const prefixedPattern = withPrefix(pattern);
  let removedCount = 0;

  for await (const keyOrKeys of client.scanIterator({
    MATCH: prefixedPattern,
    COUNT: 100,
  })) {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    if (!keys.length) {
      continue;
    }

    removedCount += await client.del(keys);
  }

  return removedCount;
};

export const cacheService = {
  get: async (key) => {
    if (!isRedisReady()) {
      logger.debug('cache skipped (redis unavailable)', { key });
      return null;
    }

    try {
      const client = getRedisClient();
      const raw = await client.get(withPrefix(key));
      if (!raw) {
        logger.debug('cache miss', { key });
        return null;
      }

      const parsed = safeParseJson(raw);
      if (parsed === null && raw !== 'null') {
        logger.warn('cache parse failure', { key });
        return null;
      }

      logger.debug('cache hit', { key });
      return parsed;
    } catch (error) {
      logger.warn('cache get failed', {
        key,
        error: error.message,
      });
      return null;
    }
  },

  set: async (key, value, ttlSeconds = env.REDIS_CACHE_TTL_SECONDS) => {
    if (!isRedisReady()) {
      logger.debug('cache set skipped (redis unavailable)', { key });
      return false;
    }

    try {
      const client = getRedisClient();
      await client.set(withPrefix(key), JSON.stringify(value), {
        EX: ttlSeconds,
      });

      logger.debug('cache set', { key, ttl_seconds: ttlSeconds });
      return true;
    } catch (error) {
      logger.warn('cache set failed', {
        key,
        ttl_seconds: ttlSeconds,
        error: error.message,
      });
      return false;
    }
  },

  del: async (keyOrKeys) => {
    if (!isRedisReady()) {
      logger.debug('cache delete skipped (redis unavailable)', {
        keys: toArray(keyOrKeys),
      });
      return 0;
    }

    try {
      const client = getRedisClient();
      const keys = toArray(keyOrKeys).map(withPrefix);
      const removed = await client.del(keys);
      logger.info('cache delete', {
        keys: keys.map(stripPrefix),
        removed,
      });
      return removed;
    } catch (error) {
      logger.warn('cache delete failed', {
        keys: toArray(keyOrKeys),
        error: error.message,
      });
      return 0;
    }
  },

  invalidatePattern: async (pattern) => {
    if (!isRedisReady()) {
      logger.debug('cache invalidation skipped (redis unavailable)', {
        pattern,
      });
      return 0;
    }

    try {
      const removedCount = await scanAndDeleteByPattern(pattern);
      logger.info('cache pattern invalidation', {
        pattern,
        removed: removedCount,
      });
      return removedCount;
    } catch (error) {
      logger.warn('cache pattern invalidation failed', {
        pattern,
        error: error.message,
      });
      return 0;
    }
  },

  getWithStaleWhileRevalidate: async ({
    key,
    ttlSeconds,
    staleTtlSeconds,
    loader,
  }) => {
    const now = Date.now();
    const cachedEnvelope = await cacheService.get(key);

    if (cachedEnvelope && typeof cachedEnvelope === 'object') {
      const isFresh = Number(cachedEnvelope.expires_at || 0) > now;
      const isStaleButServeable = Number(cachedEnvelope.stale_until || 0) > now;

      if (isFresh) {
        return cachedEnvelope.data;
      }

      if (isStaleButServeable) {
        const lockKey = `refresh:${key}`;
        if (!swrRefreshLocks.has(lockKey)) {
          swrRefreshLocks.add(lockKey);
          void (async () => {
            try {
              const refreshed = await loader();
              await cacheService.set(
                key,
                {
                  data: refreshed,
                  expires_at: Date.now() + ttlSeconds * 1000,
                  stale_until:
                    Date.now() + (ttlSeconds + staleTtlSeconds) * 1000,
                },
                ttlSeconds + staleTtlSeconds
              );
              logger.debug('cache swr revalidated', { key });
            } catch (error) {
              logger.warn('cache swr revalidation failed', {
                key,
                error: error.message,
              });
            } finally {
              swrRefreshLocks.delete(lockKey);
            }
          })();
        }

        logger.debug('cache stale hit', { key });
        return cachedEnvelope.data;
      }
    }

    const freshValue = await loader();

    await cacheService.set(
      key,
      {
        data: freshValue,
        expires_at: Date.now() + ttlSeconds * 1000,
        stale_until: Date.now() + (ttlSeconds + staleTtlSeconds) * 1000,
      },
      ttlSeconds + staleTtlSeconds
    );

    return freshValue;
  },

  getOrLoad: async ({ key, ttlSeconds, loader }) => {
    const cached = await cacheService.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await loader();
    await cacheService.set(key, value, ttlSeconds);
    return value;
  },
};
