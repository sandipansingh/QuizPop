import { create } from 'zustand';
import { authService } from '../../shared/services/auth.service';
import {
  clearAuthTokens,
  readAuthTokens,
  writeAuthTokens,
} from '../../shared/api/token-storage';
import type { User, AuthPayload } from '../../shared/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isInitialized: boolean;
  errorMessage: string | null;
  initializeAuthSession: () => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<User>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    bio?: string;
  }) => Promise<User>;
  logout: (options?: { skipRequest?: boolean }) => Promise<void>;
  clearSession: () => void;
  setUser: (user: User) => void;
}

const baseState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: false,
  isInitialized: false,
  errorMessage: null,
};

const withSession = (
  set: (partial: Partial<AuthState>) => void,
  payload: AuthPayload
): void => {
  writeAuthTokens({ accessToken: payload.access_token });

  set({
    user: payload.user,
    accessToken: payload.access_token,
    isAuthenticated: true,
    errorMessage: null,
  });
};

const clearSessionState = (
  set: (partial: Partial<AuthState>) => void
): void => {
  clearAuthTokens();
  set({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    errorMessage: null,
  });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...baseState,

  initializeAuthSession: async () => {
    if (get().isInitialized || get().isInitializing) {
      return;
    }

    set({ isInitializing: true, errorMessage: null });
    const storedTokens = readAuthTokens();

    if (storedTokens.accessToken) {
      set({
        accessToken: storedTokens.accessToken,
        isAuthenticated: true,
      });
    }

    let attemptedRefresh = false;

    try {
      if (!storedTokens.accessToken) {
        attemptedRefresh = true;
        const refreshed = await authService.refresh();
        writeAuthTokens({ accessToken: refreshed.access_token });

        set({
          accessToken: refreshed.access_token,
          isAuthenticated: true,
        });
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
          clearSessionState(set);
        }
      } else {
        clearSessionState(set);
      }
    }

    set({ isInitialized: true, isInitializing: false });
  },

  login: async (payload) => {
    set({ errorMessage: null });
    const response = await authService.login(payload);
    withSession(set, response);
    return response.user;
  },

  register: async (payload) => {
    set({ errorMessage: null });
    const response = await authService.register(payload);
    withSession(set, response);
    return response.user;
  },

  logout: async (options = {}) => {
    if (!options.skipRequest) {
      try {
        await authService.logout();
      } catch {
        // Always clear local session, even if logout fails.
      }
    }

    clearSessionState(set);
  },

  clearSession: () => {
    clearSessionState(set);
  },

  setUser: (user) => {
    set({ user });
  },
}));
