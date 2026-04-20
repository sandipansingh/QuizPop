import { prisma } from '../../shared/db/connection.js';
import { env } from '../../shared/config/env.js';

export const MIN_GAMES_FOR_RANKING = env.LEADERBOARD_MIN_GAMES_FOR_RANKING;

export const leaderboardModel = {
  findTopUsers: ({ limit, skip, minimumGames = MIN_GAMES_FOR_RANKING }) =>
    prisma.user.findMany({
      where:
        minimumGames > 0
          ? {
              total_quizzes_played: {
                gte: minimumGames,
              },
            }
          : undefined,
      take: limit,
      skip,
      orderBy: [
        { rating_points: 'desc' },
        { accuracy_percentage: 'desc' },
        { average_time_per_question: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        username: true,
        avatar_url: true,
        rank: true,
        rating_points: true,
        total_score: true,
        accuracy_percentage: true,
        average_time_per_question: true,
        total_quizzes_played: true,
        leaderboard: {
          select: {
            weekly_rank: true,
            monthly_rank: true,
            global_rank: true,
            last_updated: true,
          },
        },
      },
    }),

  countUsers: ({ minimumGames = MIN_GAMES_FOR_RANKING } = {}) =>
    prisma.user.count({
      where:
        minimumGames > 0
          ? {
              total_quizzes_played: {
                gte: minimumGames,
              },
            }
          : undefined,
    }),

  findAllUserRatings: ({ minimumGames = MIN_GAMES_FOR_RANKING } = {}) =>
    prisma.user.findMany({
      where:
        minimumGames > 0
          ? {
              total_quizzes_played: {
                gte: minimumGames,
              },
            }
          : undefined,
      orderBy: [
        { rating_points: 'desc' },
        { accuracy_percentage: 'desc' },
        { average_time_per_question: 'asc' },
        { id: 'asc' },
      ],
      select: { id: true },
    }),

  aggregateScoresSince: (startDate) =>
    prisma.quizAttempt.groupBy({
      by: ['user_id'],
      where: { created_at: { gte: startDate } },
      _sum: { score: true },
      orderBy: { _sum: { score: 'desc' } },
    }),

  upsertEntry: ({ userId, globalRank, weeklyRank, monthlyRank }) =>
    prisma.leaderboard.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        global_rank: globalRank,
        weekly_rank: weeklyRank,
        monthly_rank: monthlyRank,
        last_updated: new Date(),
      },
      update: {
        global_rank: globalRank,
        weekly_rank: weeklyRank,
        monthly_rank: monthlyRank,
        last_updated: new Date(),
      },
    }),
};
