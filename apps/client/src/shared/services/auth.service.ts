import { api } from '../api/api';
import { apiPaths } from '../api/endpoints';
import { parseApiResponse } from '../api/response';
import type { AuthPayload, User } from '../types';

export const authService = {
  register: async (payload: {
    username: string;
    email: string;
    password: string;
    bio?: string;
  }): Promise<AuthPayload> => {
    const response = await api.post(apiPaths.auth.register, payload);
    return parseApiResponse<AuthPayload>(response).data;
  },

  login: async (payload: {
    email: string;
    password: string;
  }): Promise<AuthPayload> => {
    const response = await api.post(apiPaths.auth.login, payload);
    return parseApiResponse<AuthPayload>(response).data;
  },

  refresh: async (
    payload: Record<string, unknown> = {}
  ): Promise<{ access_token: string }> => {
    const response = await api.post(apiPaths.auth.refresh, payload);
    return parseApiResponse<{ access_token: string }>(response).data;
  },

  logout: async (payload: Record<string, unknown> = {}): Promise<unknown> => {
    const response = await api.post(apiPaths.auth.logout, payload);
    return parseApiResponse(response).data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get(apiPaths.user.profile);
    return parseApiResponse<User>(response).data;
  },
};
