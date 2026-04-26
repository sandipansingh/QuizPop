import { env } from '../config/env.js';
import { getRedisClient, isRedisReady } from './redis.client.js';
import { logger } from '../utils/logger.js';
import { getWithStaleWhileRevalidate } from './cache.swr.js';

export { cacheKeys, cacheTtls } from './cache.keys.js';

const withPrefix = (key) => `${env.REDIS_KEY_PREFIX}${key}`;
const stripPrefix = (key) => key.replace(`${env.REDIS_KEY_PREFIX}`, '');

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
  if (!client) return 0;
  const prefixedPattern = withPrefix(pattern);
  let removedCount = 0;
  for await (const keyOrKeys of client.scanIterator({
    MATCH: prefixedPattern,
    COUNT: 100,
  })) {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    if (!keys.length) continue;
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
      logger.warn('cache get failed', { key, error: error.message });
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
      logger.info('cache delete', { keys: keys.map(stripPrefix), removed });
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

  getWithStaleWhileRevalidate: (options) =>
    getWithStaleWhileRevalidate({ ...options, cacheService }),

  getOrLoad: async ({ key, ttlSeconds, loader }) => {
    const cached = await cacheService.get(key);
    if (cached !== null) return cached;
    const value = await loader();
    await cacheService.set(key, value, ttlSeconds);
    return value;
  },
};
