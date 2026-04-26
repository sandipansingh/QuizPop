import { ActivityType } from '@prisma/client';
import { quizModel } from './quiz.model.js';

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

export const unlockAchievements = async ({ userId, profile }) => {
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

    if (!toUnlock.length) return;

    const idByCode = new Map(allAchievements.map((a) => [a.code, a.id]));
    await tx.userAchievement.createMany({
      data: toUnlock.map((a) => ({
        user_id: userId,
        achievement_id: idByCode.get(a.code),
      })),
    });
    await tx.activityLog.createMany({
      data: toUnlock.map((a) => ({
        user_id: userId,
        type: ActivityType.ACHIEVEMENT_UNLOCKED,
        description: `Unlocked achievement: ${a.title}`,
        metadata: { code: a.code },
      })),
    });
  });
};
