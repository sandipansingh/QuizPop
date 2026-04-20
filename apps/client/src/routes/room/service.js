import { useRoomStore } from '../../app/store/room.store.js';

export const roomPageService = {
  connectAndJoin: async (roomId) => {
    return useRoomStore.getState().joinRoom(roomId);
  },
  startGame: async () => {
    return useRoomStore.getState().startGame();
  },
  submitAnswer: async (payload) => {
    return useRoomStore.getState().submitAnswer(payload);
  },
  endGame: async () => {
    return useRoomStore.getState().endGame();
  },
  leaveRoom: async () => {
    return useRoomStore.getState().leaveRoom();
  },
  disconnect: () => {
    useRoomStore.getState().disconnect();
  },
};
