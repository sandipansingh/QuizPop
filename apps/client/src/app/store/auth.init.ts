import { authService } from '../../shared/services/auth.service';
import {
  clearAuthTokens,
  readAuthTokens,
  writeAuthTokens,
} from '../../shared/api/token-storage';

type SetFn = (partial: Record<string, unknown>) => void;
type GetFn = () => { isInitialized: boolean; isInitializing: boolean };

const clearSession = (set: SetFn): void => {
  clearAuthTokens();
  set({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    errorMessage: null,
  });
};

export const initializeAuthSession = async (
  set: SetFn,
  get: GetFn
): Promise<void> => {
  if (get().isInitialized || get().isInitializing) return;

  set({ isInitializing: true, errorMessage: null });
  const storedTokens = readAuthTokens();

  if (storedTokens.accessToken) {
    set({ accessToken: storedTokens.accessToken, isAuthenticated: true });
  }

  let attemptedRefresh = false;

  try {
    if (!storedTokens.accessToken) {
      attemptedRefresh = true;
      const refreshed = await authService.refresh();
      writeAuthTokens({ accessToken: refreshed.access_token });
      set({ accessToken: refreshed.access_token, isAuthenticated: true });
    }
    const profile = await authService.getProfile();
    set({ user: profile, isInitialized: true, isInitializing: false });
    return;
  } catch {
    if (!attemptedRefresh) {
      try {
        const refreshed = await authService.refresh();
        writeAuthTokens({ accessToken: refreshed.access_token });
        const profile = await authService.getProfile();
        set({
          user: profile,
          accessToken: refreshed.access_token,
          isAuthenticated: true,
          isInitialized: true,
          isInitializing: false,
        });
        return;
      } catch {
        clearSession(set);
      }
    } else {
      clearSession(set);
    }
  }

  set({ isInitialized: true, isInitializing: false });
};
