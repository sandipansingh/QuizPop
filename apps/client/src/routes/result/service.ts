import { useAuthStore } from '../../app/store/auth.store';
import { useQuizStore } from '../../app/store/quiz.store';
import { useRoomStore } from '../../app/store/room.store';
import type { LeaderboardEntry, QuizSubmitResult } from '../../shared/types';

export const resultPageService = {
  getSoloResult: (): QuizSubmitResult | null => {
    return useQuizStore.getState().submitResult;
  },

  getMultiplayerResult: (locationState: {
    leaderboard?: LeaderboardEntry[];
  }): LeaderboardEntry[] => {
    if (locationState?.leaderboard?.length) {
      return locationState.leaderboard;
    }

    return useRoomStore.getState().finalLeaderboard ?? [];
  },

  getCurrentUserId: (): string | undefined => {
    return useAuthStore.getState().user?.id;
  },
};
