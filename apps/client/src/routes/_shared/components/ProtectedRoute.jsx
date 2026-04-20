import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../app/store/auth.store.js';
import { RouteSpinner } from './RouteSpinner.jsx';

export function ProtectedRoute() {
  const location = useLocation();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isInitialized || isInitializing) {
    return <RouteSpinner label="Restoring your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
