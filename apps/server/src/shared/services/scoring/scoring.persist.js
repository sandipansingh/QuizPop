import { ActivityType } from '@prisma/client';
import { prisma } from '../../db/connection.js';
import { ApiError } from '../../utils/api-error.js';
import { getRankForRating } from './scoring.math.js';
import { buildUserUpdatePayload } from './scoring.user-update.js';
import { upsertCategoryStats } from './scoring.category.js';

export const persistAttemptForUser = async ({
  tx,
  user,
  userId,
  roomId,
  mode,
  resultTag,
  attemptMetrics,
  ratingDelta,
  xpEarned,
}) => {
  const { data: userUpdateData, summary } = buildUserUpdatePayload({
    user,
    attemptMetrics,
    ratingDelta,
    xpEarned,
  });

  const attempt = await tx.quizAttempt.create({
    data: {
      user_id: userId,
      room_id: roomId || null,
      score: attemptMetrics.score,
      total_questions: attemptMetrics.total_questions,
      correct_answers: attemptMetrics.correct_answers,
      wrong_answers: attemptMetrics.wrong_answers,
      time_taken: attemptMetrics.time_taken,
      rating_change: ratingDelta,
      xp_earned: xpEarned,
      average_response: attemptMetrics.average_response,
    },
  });

  if (attemptMetrics.answers.length) {
    await tx.answer.createMany({
      data: attemptMetrics.answers.map((answer) => ({
        attempt_id: attempt.id,
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        is_correct: answer.is_correct,
        time_taken: answer.time_taken,
      })),
    });
  }

  await tx.user.update({ where: { id: userId }, data: userUpdateData });

  if (attemptMetrics.category_stats.length) {
    await upsertCategoryStats({
      tx,
      userId,
      categoryStats: attemptMetrics.category_stats,
    });
  }

  await tx.activityLog.create({
    data: {
      user_id: userId,
      type: ActivityType.QUIZ_PLAYED,
      description: `Completed ${mode} quiz with score ${attemptMetrics.score}`,
      metadata: {
        attempt_id: attempt.id,
        mode,
        correct_answers: attemptMetrics.correct_answers,
        total_questions: attemptMetrics.total_questions,
        rating_change: ratingDelta,
        xp_earned: xpEarned,
      },
    },
  });

  await tx.matchHistory.create({
    data: {
      user_id: userId,
      room_id: roomId || null,
      score: attemptMetrics.score,
      result: resultTag,
    },
  });

  return {
    user_id: userId,
    attempt_id: attempt.id,
    score: attemptMetrics.score,
    total_questions: attemptMetrics.total_questions,
    correct_answers: attemptMetrics.correct_answers,
    wrong_answers: attemptMetrics.wrong_answers,
    average_response: attemptMetrics.average_response,
    rating_change: ratingDelta,
    xp_earned: xpEarned,
    updated_profile: summary,
  };
};

export const updateUserRanking = async ({ userId, tx = prisma }) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { rating_points: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  const rank = getRankForRating(user.rating_points);
  return tx.user.update({
    where: { id: userId },
    data: { rank },
    select: { id: true, rating_points: true, rank: true },
  });
};

export const syncMultipleUsersRank = async ({ userIds, tx = prisma }) => {
  const uniqueUserIds = [...new Set(userIds)];
  if (!uniqueUserIds.length) return [];
  const users = await tx.user.findMany({
    where: { id: { in: uniqueUserIds } },
    select: { id: true, rating_points: true },
  });
  await Promise.all(
    users.map((user) =>
      tx.user.update({
        where: { id: user.id },
        data: { rank: getRankForRating(user.rating_points) },
      })
    )
  );
  return users.map((user) => ({
    user_id: user.id,
    rating_points: user.rating_points,
    rank: getRankForRating(user.rating_points),
  }));
};
