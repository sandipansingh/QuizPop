import { prisma } from '../../db/connection.js';
import { ApiError } from '../../utils/api-error.js';
import { refreshLeaderboard } from '../../../modules/leaderboard/leaderboard.service.js';
import { cacheKeys, cacheService } from '../../cache/cache.service.js';
import { calculateScore, calculateXpEarned } from './scoring.score.js';
import { calculateMultiplayerRating } from './scoring.rating.js';
import { computePerformanceContext } from './scoring.difficulty.js';
import {
  persistAttemptForUser,
  syncMultipleUsersRank,
} from './scoring.persist.js';
import {
  buildRoomAnswers,
  sortRankedPlayers,
  calculatePlacementScores,
  toResultTag,
} from './scoring.answers.js';
import { ROOM_QUESTION_TIME_LIMIT_MS } from './scoring.constants.js';

const USER_SELECT = {
  id: true,
  total_correct_answers: true,
  total_wrong_answers: true,
  total_quizzes_played: true,
  rating_points: true,
  xp_points: true,
  average_time_per_question: true,
  current_streak: true,
  longest_streak: true,
  last_streak_date: true,
};

const invalidateScoreRelatedCaches = async (userIds = []) => {
  const normalizedUserIds = [...new Set(userIds.filter(Boolean))];
  await Promise.all([
    cacheService.invalidatePattern('leaderboard:*'),
    ...normalizedUserIds.map((userId) =>
      cacheService.invalidatePattern(`${cacheKeys.user(userId)}*`)
    ),
  ]);
};

const buildPlayerRatingDelta = ({
  player,
  user,
  placement,
  placementScore,
  preparedPlayers,
  userById,
  performance,
  questionTimeLimitMs,
}) => {
  const opponentRatings = preparedPlayers
    .filter((item) => item.user_id !== player.user_id)
    .map((item) => userById.get(item.user_id).rating_points);
  return calculateMultiplayerRating({
    placement,
    placementScore,
    totalPlayers: preparedPlayers.length,
    score: player.metrics.score,
    maxPossibleScore: performance.maxPossibleScore,
    accuracyPercentage: player.metrics.accuracy_percentage,
    completionRatio: player.metrics.completion_ratio,
    averageResponseMs: player.metrics.average_response,
    questionTimeLimitMs,
    playerRating: user.rating_points,
    opponentRatings,
    difficultyMultiplier: performance.difficultyMultiplier,
    easyRepeatMultiplier: performance.easyRepeatMultiplier,
    connected: player.connected,
  });
};

export const updateMultipleUsersRanking = async ({
  roomId,
  players,
  questions,
  questionTimeLimitMs = ROOM_QUESTION_TIME_LIMIT_MS,
}) => {
  if (!players.length) return { leaderboard: [], updates: [] };

  const totalQuestions = questions.length;
  const preparedPlayers = players.map((player) => {
    const normalizedAnswers = buildRoomAnswers({
      questions,
      answers: player.answers || [],
      questionTimeLimitMs,
    });
    const metrics = calculateScore({
      answers: normalizedAnswers,
      totalQuestions,
      questionTimeLimitMs,
      applyStreakBonus: true,
    });
    return {
      user_id: player.user_id,
      finish_time: player.finish_time || null,
      connected: player.connected !== false,
      metrics,
    };
  });

  const rankedPlayers = sortRankedPlayers(
    preparedPlayers.map((p) => ({
      user_id: p.user_id,
      score: p.metrics.score,
      finish_time: p.finish_time,
    }))
  );
  const placementByUserId = new Map(
    rankedPlayers.map((p, i) => [p.user_id, i + 1])
  );
  const placementScoreByUserId = calculatePlacementScores(rankedPlayers);
  const userIds = preparedPlayers.map((p) => p.user_id);

  const [users, performanceContexts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: USER_SELECT,
    }),
    Promise.all(
      userIds.map((userId) =>
        computePerformanceContext({
          questions,
          userId,
          totalQuestions,
          questionTimeLimitMs,
        })
      )
    ),
  ]);

  const performanceByUserId = new Map(
    userIds.map((userId, i) => [userId, performanceContexts[i]])
  );
  const userById = new Map(users.map((u) => [u.id, u]));
  if (userById.size !== userIds.length)
    throw new ApiError(404, 'One or more room players do not exist');

  const updates = await prisma.$transaction(
    async (tx) => {
      const persisted = await Promise.all(
        preparedPlayers.map((player) => {
          const user = userById.get(player.user_id);
          const placement = placementByUserId.get(player.user_id) || 1;
          const placementScore =
            placementScoreByUserId.get(player.user_id) || 0;
          const performance = performanceByUserId.get(player.user_id);
          const ratingDelta = buildPlayerRatingDelta({
            player,
            user,
            placement,
            placementScore,
            preparedPlayers,
            userById,
            performance,
            questionTimeLimitMs,
          });
          const xpEarned = calculateXpEarned({
            correctAnswers: player.metrics.correct_answers,
            totalQuestions: player.metrics.total_questions,
            avgResponseMs: player.metrics.average_response,
            questionTimeLimitMs,
            accuracyPercentage: player.metrics.accuracy_percentage,
          });
          return persistAttemptForUser({
            tx,
            user,
            userId: player.user_id,
            roomId,
            mode: 'multiplayer',
            resultTag: toResultTag({
              placement,
              totalPlayers: preparedPlayers.length,
              completionRatio: player.metrics.completion_ratio,
              connected: player.connected,
            }),
            attemptMetrics: player.metrics,
            ratingDelta,
            xpEarned,
            placementScore,
          });
        })
      );
      await syncMultipleUsersRank({ userIds, tx });
      return persisted;
    },
    { isolationLevel: 'Serializable' }
  );

  await refreshLeaderboard();
  await invalidateScoreRelatedCaches(userIds);

  const updateByUserId = new Map(updates.map((u) => [u.user_id, u]));
  const leaderboard = rankedPlayers.map((player, index) => {
    const update = updateByUserId.get(player.user_id);
    return {
      rank: index + 1,
      user_id: player.user_id,
      score: player.score,
      finish_time: player.finish_time,
      rating_change: update?.rating_change || 0,
    };
  });

  return { leaderboard, updates };
};
