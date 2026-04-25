import { create } from 'zustand';
import { homePageService } from './service';
import type { LeaderboardRow, Room, UserStats } from '../../shared/types';

interface HomePageState {
  stats: UserStats | null;
  leaderboard: LeaderboardRow[];
  joinRoomId: string;
  isLoadingSnapshot: boolean;
  isCreatingRoom: boolean;
  isJoiningRoom: boolean;
  errorMessage: string | null;
  setJoinRoomId: (joinRoomId: string) => void;
  fetchDashboardSnapshot: () => Promise<void>;
  createRoom: () => Promise<Room>;
  joinRoom: (roomId: string) => Promise<Room>;
  clearError: () => void;
}

const initialState = {
  stats: null,
  leaderboard: [] as LeaderboardRow[],
  joinRoomId: '',
  isLoadingSnapshot: false,
  isCreatingRoom: false,
  isJoiningRoom: false,
  errorMessage: null,
};

export const useHomePageStore = create<HomePageState>((set) => ({
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
    } catch (error) {
      const err = error as { message?: string };
      set({
        isLoadingSnapshot: false,
        errorMessage: err.message ?? 'Failed to load dashboard snapshot.',
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
      const err = error as { message?: string };
      set({
        isCreatingRoom: false,
        errorMessage: err.message ?? 'Could not create room.',
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
      const err = error as { message?: string };
      set({
        isJoiningRoom: false,
        errorMessage: err.message ?? 'Could not join room.',
      });
      throw error;
    }
  },

  clearError: () => {
    set({ errorMessage: null });
  },
}));
