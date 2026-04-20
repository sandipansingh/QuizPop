import { create } from 'zustand';
import { resultPageService } from './service.js';

const initialState = {
  mode: 'solo',
  solo: null,
  multiplayer: null,
  errorMessage: null,
};

export const useResultPageStore = create((set) => ({
  ...initialState,
  hydrate: (locationState = {}) => {
    const mode = locationState.mode === 'room' ? 'room' : 'solo';

    if (mode === 'room') {
      const leaderboard = resultPageService.getMultiplayerResult(locationState);
      const currentUserId = resultPageService.getCurrentUserId();
      const myEntry =
        leaderboard.find((item) => item.user_id === currentUserId) || null;

      set({
        mode,
        multiplayer: {
          leaderboard,
          myEntry,
          roomId: locationState.roomId || null,
        },
        solo: null,
        errorMessage: leaderboard.length
          ? null
          : 'No multiplayer result found.',
      });

      return;
    }

    const soloResult =
      locationState.soloResult || resultPageService.getSoloResult();
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
