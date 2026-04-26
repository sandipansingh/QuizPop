import { create } from 'zustand';
import { authService } from '../../shared/services/auth.service';
import {
  clearAuthTokens,
  writeAuthTokens,
} from '../../shared/api/token-storage';
import { initializeAuthSession } from './auth.init';
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

  initializeAuthSession: () =>
    initializeAuthSession(
      set as (partial: Record<string, unknown>) => void,
      get as () => { isInitialized: boolean; isInitializing: boolean }
    ),

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
