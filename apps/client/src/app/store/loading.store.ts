import { create } from 'zustand';

interface LoadingState {
  pendingRequests: number;
  isLoading: boolean;
  begin: () => void;
  end: () => void;
  reset: () => void;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
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
