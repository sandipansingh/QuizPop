import { create } from 'zustand';
import { resultPageService } from './service';
import type { LeaderboardEntry, QuizSubmitResult } from '../../shared/types';

interface MultiplayerResult {
  leaderboard: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
  roomId: string | null;
}

interface ResultPageState {
  mode: 'solo' | 'room';
  solo: QuizSubmitResult | null;
  multiplayer: MultiplayerResult | null;
  errorMessage: string | null;
  hydrate: (locationState: Record<string, unknown> | null) => void;
}

const initialState = {
  mode: 'solo' as const,
  solo: null,
  multiplayer: null,
  errorMessage: null,
};

export const useResultPageStore = create<ResultPageState>((set) => ({
  ...initialState,

  hydrate: (locationState = {}) => {
    const mode = locationState?.mode === 'room' ? 'room' : 'solo';

    if (mode === 'room') {
      const leaderboard = resultPageService.getMultiplayerResult(
        locationState as { leaderboard?: LeaderboardEntry[] }
      );
      const currentUserId = resultPageService.getCurrentUserId();
      const myEntry =
        leaderboard.find((item) => item.user_id === currentUserId) ?? null;

      set({
        mode,
        multiplayer: {
          leaderboard,
          myEntry,
          roomId: (locationState?.roomId as string) ?? null,
        },
        solo: null,
        errorMessage: leaderboard.length
          ? null
          : 'No multiplayer result found.',
      });

      return;
    }

    const soloResult =
      (locationState?.soloResult as QuizSubmitResult | undefined) ??
      resultPageService.getSoloResult();

    if (!soloResult) {
      set({
        mode,
        solo: null,
        multiplayer: null,
        errorMessage: 'No solo result found. Complete a quiz first.',
      });
      return;
    }

    set({
      mode,
      solo: soloResult,
      multiplayer: null,
      errorMessage: null,
    });
  },
}));
