import { prisma } from '../../shared/db/connection.js';

export const getUserStatsById = async (userId) => {
  const [
    user,
    attempts,
    categoryPerformance,
    recentActivity,
    matchHistory,
    achievements,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        total_score: true,
        total_quizzes_played: true,
        total_correct_answers: true,
        total_wrong_answers: true,
        accuracy_percentage: true,
        average_time_per_question: true,
        current_streak: true,
        longest_streak: true,
        rating_points: true,
        rank: true,
        xp_points: true,
        level: true,
      },
    }),
    prisma.quizAttempt.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 30,
      select: {
        id: true,
        score: true,
        correct_answers: true,
        total_questions: true,
        time_taken: true,
        average_response: true,
        created_at: true,
      },
    }),
    prisma.userCategoryPerformance.findMany({
      where: { user_id: userId },
      orderBy: { accuracy: 'desc' },
      select: {
        category: true,
        total_attempts: true,
        correct_answers: true,
        wrong_answers: true,
        accuracy: true,
      },
    }),
    prisma.activityLog.findMany({
      where: { user_id: userId },
      orderBy: { occurred_at: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        description: true,
        metadata: true,
        occurred_at: true,
      },
    }),
    prisma.matchHistory.findMany({
      where: { user_id: userId },
      orderBy: { played_at: 'desc' },
      take: 20,
      select: {
        id: true,
        room_id: true,
        score: true,
        result: true,
        played_at: true,
      },
    }),
    prisma.userAchievement.findMany({
      where: { user_id: userId },
      orderBy: { unlocked_at: 'desc' },
      include: {
        achievement: {
          select: {
            code: true,
            title: true,
            description: true,
            xp_reward: true,
          },
        },
      },
    }),
  ]);
  return {
    user,
    attempts,
    categoryPerformance,
    recentActivity,
    matchHistory,
    achievements,
  };
};
