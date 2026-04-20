import { api } from '../api/api.js';
import { apiPaths } from '../api/endpoints.js';
import { parseApiResponse } from '../api/response.js';

export const authService = {
  register: async (payload) => {
    const response = await api.post(apiPaths.auth.register, payload);
    return parseApiResponse(response).data;
  },
  login: async (payload) => {
    const response = await api.post(apiPaths.auth.login, payload);
    return parseApiResponse(response).data;
  },
  refresh: async (payload = {}) => {
    const response = await api.post(apiPaths.auth.refresh, payload);
    return parseApiResponse(response).data;
  },
  logout: async (payload = {}) => {
    const response = await api.post(apiPaths.auth.logout, payload);
    return parseApiResponse(response).data;
  },
  getProfile: async () => {
    const response = await api.get(apiPaths.user.profile);
    return parseApiResponse(response).data;
  },
};
