import { create } from 'zustand';

export const useLoadingStore = create((set, get) => ({
  pendingRequests: 0,
  isLoading: false,
  begin: () => {
    const next = get().pendingRequests + 1;
    set({ pendingRequests: next, isLoading: next > 0 });
  },
  end: () => {
    const next = Math.max(0, get().pendingRequests - 1);
    set({ pendingRequests: next, isLoading: next > 0 });
  },
  reset: () => {
    set({ pendingRequests: 0, isLoading: false });
  },
}));
