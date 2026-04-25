import { useMemo } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuthStore } from '../../../app/store/auth.store';
import { Button } from './Button';

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const year = new Date().getFullYear();
  const isLandingPage = location.pathname === '/';

  const authNavItems = useMemo(
    () => [
      { label: 'Home', to: '/home' },
      { label: 'Solo Quiz', to: '/quiz' },
      { label: 'Leaderboard', to: '/leaderboard' },
      { label: 'My Profile', to: '/profile' },
    ],
    []
  );

  const publicNavItems = useMemo(
    () => [
      { label: 'Features', href: '/#landing-features' },
      { label: 'How It Works', href: '/#landing-how' },
      { label: 'Why QuizPop', href: '/#landing-value' },
    ],
    []
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="fixed z-0 w-64 h-64 border-2 border-foreground opacity-40 pointer-events-none top-[-100px] right-[-70px] rounded-[45%_55%_63%_37%] bg-tertiary"
      />
      <div
        aria-hidden="true"
        className="fixed z-0 w-64 h-64 border-2 border-foreground opacity-40 pointer-events-none bottom-[6%] left-[-120px] rounded-[45%_55%_44%_56%] bg-quaternary"
      />

      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b-2 border-foreground bg-[color-mix(in_srgb,var(--color-background)_92%,#ffffff)] backdrop-blur-sm">
        <div className="mx-auto max-w-[1120px] px-[18px] py-[14px] flex items-center justify-between gap-3">
          <Link
            className="inline-flex gap-[9px] items-center no-underline font-heading font-extrabold text-[1.2rem]"
            to={isAuthenticated ? '/home' : '/'}
          >
            <span
              aria-hidden="true"
              className="w-[22px] h-[22px] rounded-sm border-2 border-foreground bg-tertiary shadow-[2px_2px_0_0_var(--color-foreground)] rotate-10"
            />
            QuizPop
            <span className="ml-1.5 border-2 border-[color-mix(in_srgb,var(--color-border)_85%,#94a3b8)] rounded-full px-2.5 py-[5px] text-[0.66rem] tracking-[0.08em] uppercase font-bold text-muted-fg bg-white">
              Playful Quiz Arena
            </span>
          </Link>

          <nav
            className="flex items-center gap-2"
            aria-label="Primary navigation"
          >
            {isAuthenticated
              ? authNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'no-underline border-2 rounded-full px-3.5 py-[7px] font-semibold transition-all duration-180 ease-linear',
                        isActive
                          ? 'border-foreground bg-[color-mix(in_srgb,var(--color-tertiary)_80%,#fff)] shadow-[3px_3px_0_0_color-mix(in_srgb,var(--color-foreground)_28%,transparent)]'
                          : 'border-transparent hover:border-foreground hover:bg-[color-mix(in_srgb,var(--color-tertiary)_80%,#fff)] hover:shadow-[3px_3px_0_0_color-mix(in_srgb,var(--color-foreground)_28%,transparent)]',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))
              : publicNavItems.map((item) => (
                  <a
                    key={item.href}
                    className="no-underline border-2 border-transparent rounded-full px-3.5 py-[7px] font-semibold transition-all duration-180 ease-linear hover:border-foreground hover:bg-[color-mix(in_srgb,var(--color-tertiary)_80%,#fff)]"
                    href={item.href}
                  >
                    {item.label}
                  </a>
                ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout {user?.username ? `@${user.username}` : ''}
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Create Account
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="relative z-1 w-[min(1120px,calc(100%-32px))] mx-auto my-6 mb-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative mt-10 pt-[58px] pb-[22px] bg-[#1e2b45] text-[#f8fafc]">
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-[-59px] h-[60px] overflow-hidden pointer-events-none"
        >
          <svg
            viewBox="0 0 1440 60"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: '100%' }}
          >
            <path
              fill="#1e2b45"
              d="M0,30 C320,90 420,-30 740,30 C1060,90 1120,-30 1440,30 L1440,61 L0,61 Z"
            />
          </svg>
        </div>

        <div className="w-[min(1120px,calc(100%-32px))] mx-auto grid grid-cols-[1.2fr_repeat(3,minmax(0,1fr))] gap-6 max-[960px]:grid-cols-1 max-[960px]:gap-3.5">
          <div className="max-w-[260px]">
            <p className="font-heading text-[2rem] font-extrabold text-white">
              QuizPop
            </p>
            <p className="mt-2.5 text-[#94a3b8] text-[1.05rem]">
              Real-time quiz battles for curious minds and competitive friends.
            </p>
          </div>

          {isAuthenticated ? (
            <div className="grid gap-2 content-start">
              <h3 className="mb-1 text-[1.1rem] text-accent">Explore</h3>
              {[
                { to: '/home', label: 'Dashboard' },
                { to: '/quiz', label: 'Solo Quiz' },
                { to: '/leaderboard', label: 'Leaderboard' },
                { to: '/profile', label: 'Profile' },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="no-underline text-border w-fit border-b border-transparent hover:border-tertiary transition-[border-color] duration-180"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ) : isLandingPage ? (
            <div className="grid gap-2 content-start">
              <h3 className="mb-1 text-[1.1rem] text-accent">Overview</h3>
              <a
                href="#landing-features"
                className="no-underline text-border w-fit border-b border-transparent hover:border-tertiary transition-[border-color] duration-180"
              >
                Features
              </a>
              <a
                href="#landing-how"
                className="no-underline text-border w-fit border-b border-transparent hover:border-tertiary transition-[border-color] duration-180"
              >
                How it works
              </a>
              <a
                href="#landing-value"
                className="no-underline text-border w-fit border-b border-transparent hover:border-tertiary transition-[border-color] duration-180"
              >
                Why QuizPop
              </a>
              <Link
                to="/register"
                className="no-underline text-border w-fit border-b border-transparent hover:border-tertiary transition-[border-color] duration-180"
              >
                Create Account
              </Link>
            </div>
          ) : null}

          <div className="grid gap-2 content-start">
            <h3 className="mb-1 text-[1.1rem] text-accent">Legal</h3>
            {[
              { to: '/legal/privacy', label: 'Privacy Policy' },
              { to: '/legal/terms', label: 'Terms of Service' },
              { to: '/legal/cookies', label: 'Cookie Policy' },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="no-underline text-border w-fit border-b border-transparent hover:border-tertiary transition-[border-color] duration-180"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <p className="mt-2.5 pt-4 col-span-full border-t border-[rgba(148,163,184,0.3)] font-bold text-[0.82rem] text-[#94a3b8]">
            © {year} QuizPop. Built for curious minds.
          </p>
        </div>
      </footer>
    </div>
  );
}
