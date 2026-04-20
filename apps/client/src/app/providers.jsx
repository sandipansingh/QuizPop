import { Toaster } from 'react-hot-toast';
import { GlobalLoadingBar } from '../routes/_shared/components/GlobalLoadingBar.jsx';
import { clientEnv } from '../shared/config/env.js';
import { useAuthInit } from '../shared/hooks/useAuthInit.js';

function AuthProvider({ children }) {
  useAuthInit();
  return <>{children}</>;
}

export function AppProviders({ children }) {
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
