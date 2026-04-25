import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { GlobalLoadingBar } from '../routes/_shared/components/GlobalLoadingBar';
import { clientEnv } from '../shared/config/env';
import { useAuthInit } from '../shared/hooks/useAuthInit';

function AuthProvider({ children }: { children: ReactNode }) {
  useAuthInit();
  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GlobalLoadingBar />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: clientEnv.toastDurationMs,
          style: {
            border: '2px solid var(--color-foreground)',
            borderRadius: '16px',
            boxShadow: '4px 4px 0 0 var(--color-foreground)',
            fontFamily: 'var(--font-body)',
            color: 'var(--color-foreground)',
            background: 'var(--color-card)',
          },
        }}
      />
    </AuthProvider>
  );
}
