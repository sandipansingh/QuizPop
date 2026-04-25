import { api } from '../api/api';
import { apiPaths } from '../api/endpoints';
import { parseApiResponse } from '../api/response';
import type { User, UserStats, PublicProfilePayload } from '../types';

const SUPPORTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const userService = {
  getMyProfile: async (): Promise<User> => {
    const response = await api.get(apiPaths.user.profile);
    return parseApiResponse<User>(response).data;
  },

  updateMyProfile: async (payload: {
    username?: string;
    email?: string;
    bio?: string | null;
  }): Promise<User> => {
    const response = await api.patch(apiPaths.user.profile, payload);
    return parseApiResponse<User>(response).data;
  },

  changePassword: async (payload: {
    current_password: string;
    new_password: string;
  }): Promise<unknown> => {
    const response = await api.post('/user/change-password', payload);
    return parseApiResponse(response).data;
  },

  getPublicProfileByUsername: async (
    username: string
  ): Promise<PublicProfilePayload> => {
    const response = await api.get(
      `${apiPaths.user.profileByUsernamePrefix}/${encodeURIComponent(username)}`
    );
    return parseApiResponse<PublicProfilePayload>(response).data;
  },

  getStats: async (): Promise<UserStats> => {
    const response = await api.get(apiPaths.user.stats);
    return parseApiResponse<UserStats>(response).data;
  },

  deleteMyAvatar: async (): Promise<unknown> => {
    const response = await api.delete(apiPaths.user.avatar);
    return parseApiResponse(response).data;
  },

  uploadMyAvatar: async (file: File): Promise<unknown> => {
    if (!file) {
      throw new Error('Please select an image file.');
    }

    const contentType = file.type;
    if (!SUPPORTED_AVATAR_TYPES.includes(contentType)) {
      throw new Error('Avatar must be PNG, JPEG, or WEBP.');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post(apiPaths.user.avatar, formData);
    return parseApiResponse(response).data;
  },
};
