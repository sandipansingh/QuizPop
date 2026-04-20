import { useAuthStore } from '../../app/store/auth.store.js';
import { useQuizStore } from '../../app/store/quiz.store.js';
import { useRoomStore } from '../../app/store/room.store.js';

export const resultPageService = {
  getSoloResult: () => {
    return useQuizStore.getState().submitResult;
  },
  getMultiplayerResult: (locationState) => {
    if (locationState?.leaderboard?.length) {
      return locationState.leaderboard;
    }

    return useRoomStore.getState().finalLeaderboard || [];
  },
  getCurrentUserId: () => {
    return useAuthStore.getState().user?.id;
  },
};
