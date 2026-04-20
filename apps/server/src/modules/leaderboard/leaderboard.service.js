import {
  leaderboardModel,
  MIN_GAMES_FOR_RANKING,
} from './leaderboard.model.js';
import {
  cacheKeys,
  cacheService,
  cacheTtls,
} from '../../shared/cache/cache.service.js';
import { env } from '../../shared/config/env.js';
import { baseService } from '../../shared/services/base.service.js';

const LEADERBOARD_CACHE_PREFIX = 'leaderboard:';

const clearLeaderboardCache = async () =>
  cacheService.invalidatePattern(`${LEADERBOARD_CACHE_PREFIX}*`);

const toRankMap = (rows) => {
  const map = new Map();
  rows.forEach((row, index) => {
    map.set(row.user_id, index + 1);
  });
  return map;
};

export const refreshLeaderboard = async () => {
  const [rankEligibleUsers, weeklyRows, monthlyRows] = await Promise.all([
    leaderboardModel.findAllUserRatings({
      minimumGames: MIN_GAMES_FOR_RANKING,
    }),
    leaderboardModel.aggregateScoresSince(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ),
    leaderboardModel.aggregateScoresSince(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ),
  ]);

  const weeklyRankMap = toRankMap(weeklyRows);
  const monthlyRankMap = toRankMap(monthlyRows);
  const globalUsers = rankEligibleUsers.length
    ? rankEligibleUsers
    : await leaderboardModel.findAllUserRatings({ minimumGames: 0 });

  await Promise.all(
    globalUsers.map((user, index) =>
      leaderboardModel.upsertEntry({
        userId: user.id,
        globalRank: index + 1,
        weeklyRank: weeklyRankMap.get(user.id) || null,
        monthlyRank: monthlyRankMap.get(user.id) || null,
      })
    )
  );

  await clearLeaderboardCache();
};

export const leaderboardService = {
  clearLeaderboardCache,

  getLeaderboard: async ({ page = 1, limit = 20 }) => {
    const {
      page: safePage,
      limit: safeLimit,
      skip,
    } = baseService.parsePagination({
      page,
      limit,
      maxLimit: env.LEADERBOARD_MAX_PAGE_LIMIT,
    });
    const cacheKey = cacheKeys.leaderboard({
      scope: 'global',
      page: safePage,
      limit: safeLimit,
    });

    return cacheService.getWithStaleWhileRevalidate({
      key: cacheKey,
      ttlSeconds: cacheTtls.leaderboardSeconds,
      staleTtlSeconds: cacheTtls.leaderboardStaleSeconds,
      loader: async () => {
        const [eligibleRows, eligibleTotal] = await Promise.all([
          leaderboardModel.findTopUsers({
            limit: safeLimit,
            skip,
            minimumGames: MIN_GAMES_FOR_RANKING,
          }),
          leaderboardModel.countUsers({ minimumGames: MIN_GAMES_FOR_RANKING }),
        ]);

        const usingProvisionalRanking = eligibleTotal === 0;

        const [rows, total] = usingProvisionalRanking
          ? await Promise.all([
              leaderboardModel.findTopUsers({
                limit: safeLimit,
                skip,
                minimumGames: 0,
              }),
              leaderboardModel.countUsers({ minimumGames: 0 }),
            ])
          : [eligibleRows, eligibleTotal];

        const data = rows.map((item, index) => ({
          global_rank: skip + index + 1,
          user_id: item.id,
          username: item.username,
          avatar_url: item.avatar_url,
          rank: item.rank,
          rating_points: item.rating_points,
          total_score: item.total_score,
          total_quizzes_played: item.total_quizzes_played,
          accuracy_percentage: Number(item.accuracy_percentage),
          accuracy: Number(item.accuracy_percentage),
          average_time_per_question: Number(item.average_time_per_question),
          avg_time: Number(item.average_time_per_question),
          is_rank_eligible: item.total_quizzes_played >= MIN_GAMES_FOR_RANKING,
          weekly_rank: item.leaderboard?.weekly_rank ?? null,
          monthly_rank: item.leaderboard?.monthly_rank ?? null,
          last_updated: item.leaderboard?.last_updated ?? null,
        }));

        return {
          data,
          meta: {
            page: safePage,
            limit: safeLimit,
            total,
            minimum_games_required: MIN_GAMES_FOR_RANKING,
            using_provisional_ranking: usingProvisionalRanking,
            total_pages: Math.ceil(total / safeLimit),
          },
        };
      },
    });
  },
};
