import bcrypt from 'bcryptjs';
import { ApiError } from '../../shared/utils/api-error.js';
import {
  cacheKeys,
  cacheService,
  cacheTtls,
} from '../../shared/cache/cache.service.js';
import {
  buildAvatarObjectKey,
  getAvatarObjectStream,
  extractAvatarObjectKeyFromUrl,
  getAvatarPublicUrl,
  putAvatarObject,
  removeAvatarObject,
  statAvatarObject,
} from '../../shared/storage/minio.js';
import { env } from '../../shared/config/env.js';
import { userModel } from './user.model.js';

const buildOverview = ({ user, averageResponseTime }) => ({
  total_score: user.total_score,
  total_quizzes_played: user.total_quizzes_played,
  total_correct_answers: user.total_correct_answers,
  total_wrong_answers: user.total_wrong_answers,
  accuracy_percentage: Number(user.accuracy_percentage),
  average_time_per_question: Number(user.average_time_per_question || 0),
  average_response_time: averageResponseTime,
  rank: user.rank,
  rating_points: user.rating_points,
  xp_points: user.xp_points,
  level: user.level,
  current_streak: user.current_streak,
  longest_streak: user.longest_streak,
});

const calculateAverageResponseTime = (attempts = []) =>
  attempts.length
    ? Math.round(
        attempts.reduce((sum, attempt) => sum + attempt.average_response, 0) /
          attempts.length
      )
    : 0;

const mapCategoryAccuracy = (categoryPerformance = []) =>
  categoryPerformance.map((entry) => ({
    category: entry.category,
    total_attempts: entry.total_attempts,
    correct_answers: entry.correct_answers,
    wrong_answers: entry.wrong_answers,
    accuracy: Number(entry.accuracy),
  }));

const mapAchievements = (achievements = []) =>
  achievements.map((item) => ({
    unlocked_at: item.unlocked_at,
    ...item.achievement,
  }));

const resolveAvatarObjectKey = (avatarUrl) => {
  if (!avatarUrl) {
    return null;
  }

  const rawUrl = String(avatarUrl).trim();
  if (!rawUrl) {
    return null;
  }

  if (rawUrl.startsWith('users/')) {
    return rawUrl;
  }

  const proxyQueryPrefix = `${env.SERVER_PUBLIC_BASE_URL}/api/user/avatar/object?key=`;
  if (rawUrl.startsWith(proxyQueryPrefix)) {
    return decodeURIComponent(rawUrl.slice(proxyQueryPrefix.length));
  }

  return extractAvatarObjectKeyFromUrl(rawUrl);
};

const loadAvatarFileByObjectKey = async (objectKey) => {
  let objectStat;
  try {
    objectStat = await statAvatarObject(objectKey);
  } catch {
    throw new ApiError(404, 'Avatar not found');
  }

  const stream = await getAvatarObjectStream(objectKey);

  return {
    stream,
    size: objectStat.size,
    etag: objectStat.etag,
    lastModified: objectStat.lastModified,
    contentType:
      objectStat.metaData?.['content-type'] || 'application/octet-stream',
  };
};

const invalidateUserCaches = async (userId) => {
  await Promise.all([
    cacheService.del(cacheKeys.user(userId)),
    cacheService.del(cacheKeys.userStats(userId)),
    cacheService.invalidatePattern(`${cacheKeys.user(userId)}:*`),
  ]);
};

export const userService = {
  getAvatarObjectView: async (objectKey) => {
    const sanitizedKey = String(objectKey || '').trim();
    if (!sanitizedKey || !sanitizedKey.startsWith('users/')) {
      throw new ApiError(400, 'Invalid avatar object key');
    }

    return loadAvatarFileByObjectKey(sanitizedKey);
  },

  getUserAvatarView: async (targetUserId) => {
    const userAvatar = await userModel.getUserAvatarById(targetUserId);
    if (!userAvatar?.avatar_url) {
      throw new ApiError(404, 'Avatar not found');
    }

    const objectKey = resolveAvatarObjectKey(userAvatar.avatar_url);
    if (!objectKey) {
      throw new ApiError(404, 'Avatar not found');
    }

    return loadAvatarFileByObjectKey(objectKey);
  },

  changeMyPassword: async (userId, payload) => {
    const authUser = await userModel.getUserAuthById(userId);
    if (!authUser) {
      throw new ApiError(404, 'User profile not found');
    }

    const { current_password: currentPassword, new_password: newPassword } =
      payload;

    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      authUser.password
    );
    if (!isCurrentValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new ApiError(
        400,
        'New password must be different from current password'
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await userModel.updateUserPasswordById({
      userId,
      password: hashedPassword,
    });
    await userModel.revokeAllRefreshSessionsForUser(userId);
    await invalidateUserCaches(userId);

    return { password_updated: true };
  },

  updateMyProfile: async (userId, payload) => {
    const existing = await userModel.getUserProfileById(userId);
    if (!existing) {
      throw new ApiError(404, 'User profile not found');
    }

    const username = payload.username.trim();
    const email = payload.email.trim().toLowerCase();
    const bio = payload.bio ? payload.bio.trim() : null;

    if (username !== existing.username) {
      const usernameOwner = await userModel.findUserByUsername(username);
      if (usernameOwner && usernameOwner.id !== userId) {
        throw new ApiError(409, 'Username already in use');
      }
    }

    if (email !== existing.email) {
      const emailOwner = await userModel.findUserByEmail(email);
      if (emailOwner && emailOwner.id !== userId) {
        throw new ApiError(409, 'Email already in use');
      }
    }

    const updated = await userModel.updateUserProfileById({
      userId,
      username,
      email,
      bio,
    });

    await invalidateUserCaches(userId);

    return {
      ...updated,
      accuracy_percentage: Number(updated.accuracy_percentage),
      average_time_per_question: Number(updated.average_time_per_question || 0),
    };
  },

  getPublicProfileById: async (targetUserId) => {
    const cacheKey = cacheKeys.user(targetUserId);
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const [profile, statsPayload] = await Promise.all([
      userModel.getUserProfileById(targetUserId),
      userModel.getUserStatsById(targetUserId),
    ]);

    if (!profile || !statsPayload.user) {
      throw new ApiError(404, 'User profile not found');
    }

    const {
      attempts,
      categoryPerformance,
      recentActivity,
      achievements,
      user,
    } = statsPayload;

    const averageResponseTime = calculateAverageResponseTime(attempts);

    const publicProfile = { ...profile };
    delete publicProfile.email;

    const payload = {
      profile: {
        ...publicProfile,
        accuracy_percentage: Number(publicProfile.accuracy_percentage),
        average_time_per_question: Number(
          publicProfile.average_time_per_question || 0
        ),
      },
      overview: buildOverview({ user, averageResponseTime }),
      category_accuracy: mapCategoryAccuracy(categoryPerformance),
      recent_activity: recentActivity,
      achievements: mapAchievements(achievements),
    };

    await cacheService.set(cacheKey, payload, cacheTtls.userProfileSeconds);

    return payload;
  },

  getPublicProfileByUsername: async (targetUsername) => {
    const existing = await userModel.findUserByUsername(targetUsername.trim());

    if (!existing) {
      throw new ApiError(404, 'User profile not found');
    }

    return userService.getPublicProfileById(existing.id);
  },

  uploadMyAvatar: async (userId, file) => {
    const user = await userModel.getUserProfileById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }

    if (!file?.buffer?.length) {
      throw new ApiError(400, 'Avatar file is required');
    }

    const objectKey = buildAvatarObjectKey({
      userId,
      contentType: file.mimetype,
      fileName: file.originalname,
    });

    await putAvatarObject({
      objectKey,
      fileBuffer: file.buffer,
      contentType: file.mimetype,
    });

    const avatarUrl = getAvatarPublicUrl(objectKey);
    const updated = await userModel.updateUserAvatarUrl({
      userId,
      avatarUrl,
    });

    const previousObjectKey = resolveAvatarObjectKey(user.avatar_url);
    if (previousObjectKey && previousObjectKey !== objectKey) {
      try {
        await removeAvatarObject(previousObjectKey);
      } catch {
        // Ignore errors — profile update should still succeed.
      }
    }

    await invalidateUserCaches(userId);

    return {
      user_id: updated.id,
      avatar_url: updated.avatar_url,
      object_key: objectKey,
    };
  },

  deleteMyAvatar: async (userId) => {
    const user = await userModel.getUserProfileById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }

    const objectKey = resolveAvatarObjectKey(user.avatar_url);
    if (objectKey) {
      try {
        await removeAvatarObject(objectKey);
      } catch {
        // Ignore errors — DB cleanup still happens.
      }
    }

    const updated = await userModel.clearUserAvatarUrl(userId);
    await invalidateUserCaches(userId);
    return {
      user_id: updated.id,
      avatar_url: updated.avatar_url,
      removed_object_key: objectKey,
    };
  },

  getMyProfile: async (userId) => {
    const profile = await userModel.getUserProfileById(userId);
    if (!profile) {
      throw new ApiError(404, 'User profile not found');
    }

    return {
      ...profile,
      accuracy_percentage: Number(profile.accuracy_percentage),
      average_time_per_question: Number(profile.average_time_per_question || 0),
    };
  },

  getMyStats: async (userId) => {
    const cacheKey = cacheKeys.userStats(userId);
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const {
      user,
      attempts,
      categoryPerformance,
      recentActivity,
      matchHistory,
      achievements,
    } = await userModel.getUserStatsById(userId);

    if (!user) {
      throw new ApiError(404, 'User stats not found');
    }

    const averageResponseTime = calculateAverageResponseTime(attempts);

    const performanceOverTime = attempts.map((attempt) => ({
      attempt_id: attempt.id,
      score: attempt.score,
      accuracy: Number(
        (
          (attempt.correct_answers / Math.max(1, attempt.total_questions)) *
          100
        ).toFixed(2)
      ),
      time_taken: attempt.time_taken,
      average_response: attempt.average_response,
      created_at: attempt.created_at,
    }));

    const payload = {
      overview: buildOverview({ user, averageResponseTime }),
      category_accuracy: mapCategoryAccuracy(categoryPerformance),
      performance_over_time: performanceOverTime,
      recent_activity: recentActivity,
      match_history: matchHistory,
      achievements: mapAchievements(achievements),
    };

    await cacheService.set(cacheKey, payload, cacheTtls.userProfileSeconds);

    return payload;
  },
};
