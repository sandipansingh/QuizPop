import { api } from '../api/api.js';
import { apiPaths } from '../api/endpoints.js';
import { parseApiResponse } from '../api/response.js';

const SUPPORTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const userService = {
  getMyProfile: async () => {
    const response = await api.get(apiPaths.user.profile);
    return parseApiResponse(response).data;
  },
  updateMyProfile: async (payload) => {
    const response = await api.patch(apiPaths.user.profile, payload);
    return parseApiResponse(response).data;
  },
  changePassword: async (payload) => {
    const response = await api.post('/user/change-password', payload);
    return parseApiResponse(response).data;
  },
  getPublicProfileByUsername: async (username) => {
    const response = await api.get(
      `${apiPaths.user.profileByUsernamePrefix}/${encodeURIComponent(username)}`
    );
    return parseApiResponse(response).data;
  },
  getStats: async () => {
    const response = await api.get(apiPaths.user.stats);
    return parseApiResponse(response).data;
  },
  deleteMyAvatar: async () => {
    const response = await api.delete(apiPaths.user.avatar);
    return parseApiResponse(response).data;
  },
  uploadMyAvatar: async (file) => {
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
