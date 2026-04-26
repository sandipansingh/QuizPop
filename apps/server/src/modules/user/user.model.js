import { prisma } from '../../shared/db/connection.js';
import { getUserStatsById } from './user.stats.model.js';

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
      select: { id: true, password: true },
    }),

  updateUserPasswordById: ({ userId, password }) =>
    prisma.user.update({
      where: { id: userId },
      data: { password },
      select: { id: true },
    }),

  revokeAllRefreshSessionsForUser: (userId) =>
    prisma.refreshTokenSession.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    }),

  findUserByEmail: (email) =>
    prisma.user.findUnique({ where: { email }, select: { id: true } }),

  findUserByUsername: (username) =>
    prisma.user.findUnique({ where: { username }, select: { id: true } }),

  clearUserAvatarUrl: (userId) =>
    prisma.user.update({
      where: { id: userId },
      data: { avatar_url: null },
      select: { id: true, avatar_url: true },
    }),

  updateUserAvatarUrl: ({ userId, avatarUrl }) =>
    prisma.user.update({
      where: { id: userId },
      data: { avatar_url: avatarUrl },
      select: { id: true, avatar_url: true },
    }),

  getUserProfileById: (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: USER_PROFILE_SELECT,
    }),

  getUserAvatarById: (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, avatar_url: true },
    }),

  updateUserProfileById: ({ userId, username, email, bio }) =>
    prisma.user.update({
      where: { id: userId },
      data: { username, email, bio },
      select: USER_PROFILE_SELECT,
    }),

  getUserStatsById,
};
