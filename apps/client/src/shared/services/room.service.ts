import { api } from '../api/api';
import { apiPaths } from '../api/endpoints';
import { parseApiResponse } from '../api/response';
import type { Room } from '../types';

export const roomService = {
  createRoom: async (): Promise<Room> => {
    const response = await api.post(apiPaths.room.create, {});
    return parseApiResponse<Room>(response).data;
  },

  joinRoom: async ({ room_id }: { room_id: string }): Promise<Room> => {
    const response = await api.post(apiPaths.room.join, { room_id });
    return parseApiResponse<Room>(response).data;
  },
};
