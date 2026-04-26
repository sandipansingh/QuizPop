import { logger } from '../utils/logger.js';

const swrRefreshLocks = new Set();

export const getWithStaleWhileRevalidate = async ({
  key,
  ttlSeconds,
  staleTtlSeconds,
  loader,
  cacheService,
}) => {
  const now = Date.now();
  const cachedEnvelope = await cacheService.get(key);

  if (cachedEnvelope && typeof cachedEnvelope === 'object') {
    const isFresh = Number(cachedEnvelope.expires_at || 0) > now;
    const isStaleButServeable = Number(cachedEnvelope.stale_until || 0) > now;

    if (isFresh) return cachedEnvelope.data;

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
                stale_until: Date.now() + (ttlSeconds + staleTtlSeconds) * 1000,
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
};
