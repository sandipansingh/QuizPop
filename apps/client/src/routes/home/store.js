import { create } from 'zustand';
import { homePageService } from './service.js';

const initialState = {
  stats: null,
  leaderboard: [],
  joinRoomId: '',
  isLoadingSnapshot: false,
  isCreatingRoom: false,
  isJoiningRoom: false,
  errorMessage: null,
};

export const useHomePageStore = create((set) => ({
  ...initialState,
  setJoinRoomId: (joinRoomId) => {
    set({ joinRoomId, errorMessage: null });
  },
  fetchDashboardSnapshot: async () => {
    set({ isLoadingSnapshot: true, errorMessage: null });

    try {
      const snapshot = await homePageService.getDashboardSnapshot();
      set({
        stats: snapshot.stats,
        leaderboard: snapshot.leaderboard,
        isLoadingSnapshot: false,
      });
      return snapshot;
    } catch (error) {
      set({
        isLoadingSnapshot: false,
        errorMessage: error.message || 'Failed to load dashboard snapshot.',
      });
      throw error;
    }
  },
  createRoom: async () => {
    set({ isCreatingRoom: true, errorMessage: null });

    try {
      const room = await homePageService.createRoom();
      set({ isCreatingRoom: false });
      return room;
    } catch (error) {
      set({
        isCreatingRoom: false,
        errorMessage: error.message || 'Could not create room.',
      });
      throw error;
    }
  },
  joinRoom: async (roomId) => {
    set({ isJoiningRoom: true, errorMessage: null });

    try {
      const room = await homePageService.joinRoom(roomId);
      set({ isJoiningRoom: false });
      return room;
    } catch (error) {
      set({
        isJoiningRoom: false,
        errorMessage: error.message || 'Could not join room.',
      });
      throw error;
    }
  },
  clearError: () => {
    set({ errorMessage: null });
  },
}));
