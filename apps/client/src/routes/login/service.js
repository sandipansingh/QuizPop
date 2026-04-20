import { useAuthStore } from '../../app/store/auth.store.js';

export const loginPageService = {
  signIn: async (payload) => {
    return useAuthStore.getState().login(payload);
  },
};
