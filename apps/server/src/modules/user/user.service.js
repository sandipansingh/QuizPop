import bcrypt from 'bcryptjs';
import { ApiError } from '../../shared/utils/api-error.js';
import { userModel } from './user.model.js';
import { avatarService } from './user.avatar.js';
import { invalidateUserCaches } from './user.cache.js';
import { getPublicProfileById, getMyStats } from './user.profile.js';

export const userService = {
  ...avatarService,

  changeMyPassword: async (userId, payload) => {
    const authUser = await userModel.getUserAuthById(userId);
    if (!authUser) throw new ApiError(404, 'User profile not found');

    const { current_password: currentPassword, new_password: newPassword } =
      payload;
    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      authUser.password
    );
    if (!isCurrentValid)
      throw new ApiError(400, 'Current password is incorrect');
    if (currentPassword === newPassword)
      throw new ApiError(
        400,
        'New password must be different from current password'
      );

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
    if (!existing) throw new ApiError(404, 'User profile not found');

    const username = payload.username.trim();
    const email = payload.email.trim().toLowerCase();
    const bio = payload.bio ? payload.bio.trim() : null;

    if (username !== existing.username) {
      const usernameOwner = await userModel.findUserByUsername(username);
      if (usernameOwner && usernameOwner.id !== userId)
        throw new ApiError(409, 'Username already in use');
    }

    if (email !== existing.email) {
      const emailOwner = await userModel.findUserByEmail(email);
      if (emailOwner && emailOwner.id !== userId)
        throw new ApiError(409, 'Email already in use');
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

  getPublicProfileById,

  getPublicProfileByUsername: async (targetUsername) => {
    const existing = await userModel.findUserByUsername(targetUsername.trim());
    if (!existing) throw new ApiError(404, 'User profile not found');
    return getPublicProfileById(existing.id);
  },

  getMyProfile: async (userId) => {
    const profile = await userModel.getUserProfileById(userId);
    if (!profile) throw new ApiError(404, 'User profile not found');
    return {
      ...profile,
      accuracy_percentage: Number(profile.accuracy_percentage),
      average_time_per_question: Number(profile.average_time_per_question || 0),
    };
  },

  getMyStats,
};
