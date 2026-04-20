import { api } from '../api/api.js';
import { apiPaths } from '../api/endpoints.js';
import { parseApiResponse } from '../api/response.js';

export const roomService = {
  createRoom: async () => {
    const response = await api.post(apiPaths.room.create, {});
    return parseApiResponse(response).data;
  },
  joinRoom: async ({ room_id }) => {
    const response = await api.post(apiPaths.room.join, { room_id });
    return parseApiResponse(response).data;
  },
};
