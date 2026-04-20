import { prisma } from '../../shared/db/connection.js';

const USER_PROFILE_SELECT = {
  id: true,
  username: true,
  email: true,
  avatar_url: true,
  bio: true,
  rank: true,
  rating_points: true,
  xp_points: true,
  level: true,
  total_score: true,
  accuracy_percentage: true,
  average_time_per_question: true,
  total_quizzes_played: true,
  total_correct_answers: true,
  total_wrong_answers: true,
  current_streak: true,
  longest_streak: true,
  last_active_at: true,
  created_at: true,
};

export const userModel = {
  getUserAuthById: (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    }),

  updateUserPasswordById: ({ userId, password }) =>
    prisma.user.update({
      where: { id: userId },
      data: { password },
      select: { id: true },
    }),

  revokeAllRefreshSessionsForUser: (userId) =>
    prisma.refreshTokenSession.updateMany({
      where: {
        user_id: userId,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    }),

  findUserByEmail: (email) =>
    prisma.user.findUnique({
      where: { email },
      select: { id: true },
    }),

  findUserByUsername: (username) =>
    prisma.user.findUnique({
      where: { username },
      select: { id: true },
    }),

  clearUserAvatarUrl: (userId) =>
    prisma.user.update({
      where: { id: userId },
      data: { avatar_url: null },
      select: {
        id: true,
        avatar_url: true,
      },
    }),

  updateUserAvatarUrl: ({ userId, avatarUrl }) =>
    prisma.user.update({
      where: { id: userId },
      data: { avatar_url: avatarUrl },
      select: {
        id: true,
        avatar_url: true,
      },
    }),

  getUserProfileById: (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: USER_PROFILE_SELECT,
    }),

  getUserAvatarById: (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatar_url: true,
      },
    }),

  updateUserProfileById: ({ userId, username, email, bio }) =>
    prisma.user.update({
      where: { id: userId },
      data: {
        username,
        email,
        bio,
      },
      select: USER_PROFILE_SELECT,
    }),

  getUserStatsById: async (userId) => {
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
  },
};
