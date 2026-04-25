import { useAuthStore } from '../../app/store/auth.store';
import type { User } from '../../shared/types';

export const registerPageService = {
  signUp: async (payload: Record<string, unknown>): Promise<User> => {
    return useAuthStore
      .getState()
      .register(
        payload as {
          username: string;
          email: string;
          password: string;
          bio?: string;
        }
      );
  },
};
