import { ActivityType } from '@prisma/client';
import { ApiError } from '../../shared/utils/api-error.js';
import { cacheKeys, cacheService } from '../../shared/cache/cache.service.js';
import { env } from '../../shared/config/env.js';
import { scoringService } from '../../shared/services/scoring.service.js';
import { questionService } from '../../shared/services/question.service.js';
import { quizModel } from './quiz.model.js';

const USER_QUESTION_SET_CACHE_SECONDS = 30;

const ACHIEVEMENT_CATALOG = [
  {
    code: 'FIRST_WIN',
    title: 'First Blood',
    description: 'Complete your first quiz.',
    xp_reward: 100,
    evaluate: ({ totalQuizzesPlayed }) => totalQuizzesPlayed >= 1,
  },
  {
    code: 'STREAK_7',
    title: '7-Day Streak',
    description: 'Play 7 days in a row.',
    xp_reward: 200,
    evaluate: ({ currentStreak }) => currentStreak >= 7,
  },
  {
    code: 'QUIZ_MASTER',
    title: 'Quiz Master',
    description: 'Reach 10,000 total score.',
    xp_reward: 500,
    evaluate: ({ totalScore }) => totalScore >= 10000,
  },
  {
    code: 'SHARPSHOOTER',
    title: 'Sharpshooter',
    description: 'Maintain 80% accuracy after 20 quizzes.',
    xp_reward: 400,
    evaluate: ({ accuracy, totalQuizzesPlayed }) =>
      accuracy >= 80 && totalQuizzesPlayed >= 20,
  },
];

const ensureAchievementCatalog = async (tx) => {
  await Promise.all(
    ACHIEVEMENT_CATALOG.map((achievement) =>
      tx.achievement.upsert({
        where: { code: achievement.code },
        create: {
          code: achievement.code,
          title: achievement.title,
          description: achievement.description,
          xp_reward: achievement.xp_reward,
        },
        update: {
          title: achievement.title,
          description: achievement.description,
          xp_reward: achievement.xp_reward,
        },
      })
    )
  );
};

const unlockAchievements = async ({ userId, profile }) => {
  await quizModel.executeTransaction(async (tx) => {
    await ensureAchievementCatalog(tx);

    const allAchievements = await tx.achievement.findMany();
    const existingAchievementRows = await tx.userAchievement.findMany({
      where: { user_id: userId },
      select: { achievement: { select: { code: true } } },
    });
    const existingCodes = new Set(
      existingAchievementRows.map((row) => row.achievement.code)
    );

    const toUnlock = ACHIEVEMENT_CATALOG.filter((achievement) =>
      achievement.evaluate({
        totalQuizzesPlayed: profile.total_quizzes_played,
        currentStreak: profile.current_streak,
        totalScore: profile.total_score,
        accuracy:
          (profile.total_correct_answers /
            Math.max(
              1,
              profile.total_correct_answers + profile.total_wrong_answers
            )) *
          100,
      })
    ).filter((achievement) => !existingCodes.has(achievement.code));

    if (!toUnlock.length) {
      return;
    }

    const idByCode = new Map(
      allAchievements.map((achievement) => [achievement.code, achievement.id])
    );

    await tx.userAchievement.createMany({
      data: toUnlock.map((achievement) => ({
        user_id: userId,
        achievement_id: idByCode.get(achievement.code),
      })),
    });

    await tx.activityLog.createMany({
      data: toUnlock.map((achievement) => ({
        user_id: userId,
        type: ActivityType.ACHIEVEMENT_UNLOCKED,
        description: `Unlocked achievement: ${achievement.title}`,
        metadata: { code: achievement.code },
      })),
    });
  });
};

export const quizService = {
  getQuestions: async ({
    limit = env.QUIZ_DEFAULT_QUESTION_LIMIT,
    category,
    userId,
  }) => {
    const cacheKey = cacheKeys.questionsUser(userId);
    const cachedQuestions = await cacheService.get(cacheKey);

    if (Array.isArray(cachedQuestions) && cachedQuestions.length > 0) {
      return cachedQuestions;
    }

    const questions = await questionService.getQuestionsForUser(userId, {
      limit: Number(limit),
      category,
    });

    await cacheService.set(
      cacheKey,
      questions,
      USER_QUESTION_SET_CACHE_SECONDS
    );

    return questions;
  },

  submitQuiz: async (userId, payload) => {
    const questionIds = payload.answers.map((answer) => answer.question_id);
    const uniqueQuestionIds = new Set(questionIds);
    if (uniqueQuestionIds.size !== questionIds.length) {
      throw new ApiError(409, 'Duplicate question submission detected');
    }

    const questions = await quizModel.findQuestionsByIds(questionIds);

    if (questions.length !== questionIds.length) {
      throw new ApiError(400, 'One or more questions are invalid');
    }

    const result = await scoringService.updateUserStats({
      userId,
      mode: 'solo',
      roomId: payload.room_id,
      submittedAnswers: payload.answers,
      questions,
      totalTimeTaken: payload.total_time_taken,
    });

    const updatedProfile = await quizModel.findUserById(userId);
    if (updatedProfile) {
      await unlockAchievements({
        userId,
        profile: updatedProfile,
      });
    }

    await cacheService.del(cacheKeys.questionsUser(userId));

    return result;
  },
};
