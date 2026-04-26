import { cacheKeys, cacheService } from '../../shared/cache/cache.service.js';

export const invalidateUserCaches = async (userId) => {
  await Promise.all([
    cacheService.del(cacheKeys.user(userId)),
    cacheService.del(cacheKeys.userStats(userId)),
    cacheService.invalidatePattern(`${cacheKeys.user(userId)}:*`),
  ]);
};
