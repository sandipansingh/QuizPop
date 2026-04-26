import { prisma } from '../../db/connection.js';
import { ApiError } from '../../utils/api-error.js';
import { refreshLeaderboard } from '../../../modules/leaderboard/leaderboard.service.js';
import { cacheKeys, cacheService } from '../../cache/cache.service.js';
import { calculateScore, calculateXpEarned } from './scoring.score.js';
import { calculateSoloRating } from './scoring.rating.js';
import { computePerformanceContext } from './scoring.difficulty.js';
import { persistAttemptForUser, updateUserRanking } from './scoring.persist.js';
import { buildSoloAnswers } from './scoring.answers.js';
import { SOLO_QUESTION_TIME_LIMIT_MS } from './scoring.constants.js';

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

export const updateUserStats = async ({
  userId,
  mode,
  roomId,
  submittedAnswers,
  questions,
  totalTimeTaken,
  questionTimeLimitMs = SOLO_QUESTION_TIME_LIMIT_MS,
}) => {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const normalizedAnswers = buildSoloAnswers({ submittedAnswers, questionMap });
  const totalQuestions = questions.length;
  const metrics = calculateScore({
    answers: normalizedAnswers,
    totalQuestions,
    questionTimeLimitMs,
    applyStreakBonus: true,
  });

  if (Number.isFinite(Number(totalTimeTaken)) && Number(totalTimeTaken) > 0) {
    metrics.time_taken = Math.round(Number(totalTimeTaken));
    metrics.average_response = Math.round(
      metrics.time_taken / Math.max(1, metrics.total_questions)
    );
  }

  const [performanceContext, user] = await Promise.all([
    computePerformanceContext({
      questions,
      userId,
      totalQuestions,
      questionTimeLimitMs,
    }),
    prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT }),
  ]);

  if (!user) throw new ApiError(404, 'User not found');

  const ratingDelta = calculateSoloRating({
    score: metrics.score,
    maxPossibleScore: performanceContext.maxPossibleScore,
    accuracyPercentage: metrics.accuracy_percentage,
    averageResponseMs: metrics.average_response,
    questionTimeLimitMs,
    completionRatio: metrics.completion_ratio,
    difficultyMultiplier: performanceContext.difficultyMultiplier,
    easyRepeatMultiplier: performanceContext.easyRepeatMultiplier,
    partialCompletion: metrics.completion_ratio < 1,
  });

  const xpEarned = calculateXpEarned({
    correctAnswers: metrics.correct_answers,
    totalQuestions: metrics.total_questions,
    avgResponseMs: metrics.average_response,
    questionTimeLimitMs,
    accuracyPercentage: metrics.accuracy_percentage,
  });

  const result = await prisma.$transaction(async (tx) => {
    const persisted = await persistAttemptForUser({
      tx,
      user,
      userId,
      roomId,
      mode,
      resultTag:
        metrics.correct_answers >= metrics.wrong_answers ? 'win' : 'loss',
      attemptMetrics: metrics,
      ratingDelta,
      xpEarned,
    });
    await updateUserRanking({ userId, tx });
    return persisted;
  });

  await refreshLeaderboard();
  await invalidateScoreRelatedCaches([userId]);

  return {
    ...result,
    score_breakdown: {
      raw_score: metrics.raw_score,
      accuracy_bonus: metrics.accuracy_bonus,
      final_score: metrics.score,
      max_possible_score: performanceContext.maxPossibleScore,
    },
  };
};
