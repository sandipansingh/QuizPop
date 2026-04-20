import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../app/store/auth.store.js';
import { useLoadingStore } from '../../app/store/loading.store.js';

export function useAuthInit() {
  const initializeAuthSession = useAuthStore(
    (state) => state.initializeAuthSession
  );
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    void initializeAuthSession();
  }, [initializeAuthSession]);

  useEffect(() => {
    const onExpired = (event) => {
      clearSession();
      useLoadingStore.getState().reset();
      toast.error(
        event?.detail?.reason || 'Session expired. Please login again.'
      );
    };

    window.addEventListener('auth:expired', onExpired);
    return () => {
      window.removeEventListener('auth:expired', onExpired);
    };
  }, [clearSession]);
}
