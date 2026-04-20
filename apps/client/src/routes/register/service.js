import { useAuthStore } from '../../app/store/auth.store.js';

export const registerPageService = {
  signUp: async (payload) => {
    return useAuthStore.getState().register(payload);
  },
};
