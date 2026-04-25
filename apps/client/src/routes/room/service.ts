import { useRoomStore } from '../../app/store/room.store';
import type { Room } from '../../shared/types';

export const roomPageService = {
  connectAndJoin: async (roomId: string): Promise<Room> => {
    return useRoomStore.getState().joinRoom(roomId);
  },

  startGame: async (): Promise<void> => {
    return useRoomStore.getState().startGame();
  },

  submitAnswer: async (payload: {
    questionIndex: number;
    selectedAnswer: string;
    timeTaken: number;
  }): Promise<{ success: boolean }> => {
    return useRoomStore.getState().submitAnswer(payload);
  },

  endGame: async (): Promise<void> => {
    return useRoomStore.getState().endGame();
  },

  leaveRoom: async (): Promise<void> => {
    return useRoomStore.getState().leaveRoom();
  },

  disconnect: (): void => {
    useRoomStore.getState().disconnect();
  },
};
