import { useAuthStore } from '../../app/store/auth.store';
import type { User } from '../../shared/types';

export const loginPageService = {
  signIn: async (payload: Record<string, unknown>): Promise<User> => {
    return useAuthStore
      .getState()
      .login(payload as { email: string; password: string });
  },
};
