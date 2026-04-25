import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../app/store/auth.store';
import { useLoadingStore } from '../../app/store/loading.store';

export function useAuthInit(): void {
  const initializeAuthSession = useAuthStore(
    (state) => state.initializeAuthSession
  );
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    void initializeAuthSession();
  }, [initializeAuthSession]);

  useEffect(() => {
    const onExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ reason?: string }>;
      clearSession();
      useLoadingStore.getState().reset();
      toast.error(
        customEvent.detail?.reason ?? 'Session expired. Please login again.'
      );
    };

    window.addEventListener('auth:expired', onExpired);
    return () => {
      window.removeEventListener('auth:expired', onExpired);
    };
  }, [clearSession]);
}
