import { api } from '../api/api.js';
import { apiPaths } from '../api/endpoints.js';
import { parseApiResponse } from '../api/response.js';

export const leaderboardService = {
  getLeaderboard: async (params = { page: 1, limit: 5 }) => {
    const response = await api.get(apiPaths.leaderboard.list, { params });
    return parseApiResponse(response);
  },
};
