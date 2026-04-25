import { api } from '../api/api';
import { apiPaths } from '../api/endpoints';
import { parseApiResponse, type ApiResponse } from '../api/response';
import type { LeaderboardRow } from '../types';

export interface LeaderboardParams {
  page?: number;
  limit?: number;
}

export const leaderboardService = {
  getLeaderboard: async (
    params: LeaderboardParams = { page: 1, limit: 5 }
  ): Promise<ApiResponse<LeaderboardRow[]>> => {
    const response = await api.get(apiPaths.leaderboard.list, { params });
    return parseApiResponse<LeaderboardRow[]>(response);
  },
};
