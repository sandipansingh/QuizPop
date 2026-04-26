import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../app/store/auth.store';
import { AppShellHeader } from './AppShellHeader';
import { AppShellFooter } from './AppShellFooter';

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const year = new Date().getFullYear();
  const isLandingPage = location.pathname === '/';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div
        aria-hidden="true"
        className="fixed z-0 w-64 h-64 border-2 border-foreground opacity-40 pointer-events-none top-[-100px] right-[-70px] rounded-[45%_55%_63%_37%] bg-tertiary"
      />
      <div
        aria-hidden="true"
        className="fixed z-0 w-64 h-64 border-2 border-foreground opacity-40 pointer-events-none bottom-[6%] left-[-120px] rounded-[45%_55%_44%_56%] bg-quaternary"
      />

      <AppShellHeader
        isAuthenticated={isAuthenticated}
        username={user?.username}
        onLogout={handleLogout}
      />

      <main className="relative z-1 w-[min(1120px,calc(100%-32px))] mx-auto my-6 mb-20">
        <Outlet />
      </main>

      <AppShellFooter
        isAuthenticated={isAuthenticated}
        isLandingPage={isLandingPage}
        year={year}
      />
    </div>
  );
}
