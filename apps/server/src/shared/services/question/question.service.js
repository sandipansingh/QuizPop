import { cacheService } from '../../cache/cache.service.js';
import { env } from '../../config/env.js';
import { prisma } from '../../db/connection.js';
import { ApiError } from '../../utils/api-error.js';
import {
  getRecentQuestionIdsForUsers,
  recordQuestionHistory,
  calculateHistoryCoverageRatio,
} from './question.history.js';
import { selectAdaptiveQuestions } from './question.select.js';

const QUESTION_HISTORY_LOOKBACK_COUNT = env.QUESTION_HISTORY_LOOKBACK_COUNT;
const SOLO_HISTORY_RESET_THRESHOLD = 0.8;

const getUserRatingPoints = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, rating_points: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user.rating_points;
};

const getHighestRatingPoints = (players = []) => {
  const ratings = players
    .map((p) => Number(p?.user?.rating_points ?? p?.rating_points ?? 1000))
    .filter((r) => Number.isFinite(r));
  return ratings.length ? Math.max(...ratings) : 1000;
};

export const questionService = {
  invalidateQuestionCaches: async () => {
    await cacheService.invalidatePattern('questions:*');
  },

  getQuestionsForUser: async (
    userId,
    { limit = env.QUIZ_DEFAULT_QUESTION_LIMIT, category } = {}
  ) => {
    const ratingPoints = await getUserRatingPoints(userId);
    const [recentQuestionIds, historyCoverageRatio] = await Promise.all([
      getRecentQuestionIdsForUsers([userId], QUESTION_HISTORY_LOOKBACK_COUNT),
      calculateHistoryCoverageRatio(userId),
    ]);
    const shouldResetCycle =
      historyCoverageRatio >= SOLO_HISTORY_RESET_THRESHOLD;
    const questions = await selectAdaptiveQuestions({
      ratingPoints,
      limit,
      category,
      excludedQuestionIds: shouldResetCycle ? [] : recentQuestionIds,
      historyUserIds: [userId],
      includeCorrectAnswer: false,
    });
    if (!questions.length)
      throw new ApiError(
        404,
        'No questions available for the requested criteria'
      );
    await recordQuestionHistory({ userIds: [userId], questions, mode: 'solo' });
    return questions;
  },

  getQuestionsForRoom: async (
    players,
    { limit = env.ROOM_QUESTION_COUNT, category, roomId = null } = {}
  ) => {
    if (!Array.isArray(players) || !players.length) {
      throw new ApiError(
        400,
        'At least one player is required to build room questions'
      );
    }
    const userIds = players
      .map((p) => p?.user?.id || p?.user_id)
      .filter(Boolean);
    const [recentQuestionIds, ratingPoints] = await Promise.all([
      getRecentQuestionIdsForUsers(userIds, QUESTION_HISTORY_LOOKBACK_COUNT),
      Promise.resolve(getHighestRatingPoints(players)),
    ]);
    const questions = await selectAdaptiveQuestions({
      ratingPoints,
      limit,
      category,
      excludedQuestionIds: recentQuestionIds,
      historyUserIds: userIds,
      includeCorrectAnswer: true,
    });
    if (!questions.length)
      throw new ApiError(404, 'No questions available for this room');
    await recordQuestionHistory({ userIds, questions, roomId, mode: 'room' });
    return questions;
  },
};
