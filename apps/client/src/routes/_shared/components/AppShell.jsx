import { useMemo } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuthStore } from '../../../app/store/auth.store.js';
import { Button } from './Button.jsx';

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
    <div className="app-shell">
      <div className="app-shell__bg app-shell__bg--yellow" aria-hidden="true" />
      <div className="app-shell__bg app-shell__bg--mint" aria-hidden="true" />
      <header className="top-nav">
        <div className="top-nav__inner">
          <Link className="brand" to={isAuthenticated ? '/home' : '/'}>
            <span className="brand__dot" aria-hidden="true" />
            QuizPop
            <span className="brand__tag">Playful Quiz Arena</span>
          </Link>

          <nav className="top-nav__links" aria-label="Primary navigation">
            {isAuthenticated
              ? authNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `top-nav__link ${isActive ? 'top-nav__link--active' : ''}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))
              : publicNavItems.map((item) => (
                  <a key={item.href} className="top-nav__link" href={item.href}>
                    {item.label}
                  </a>
                ))}
          </nav>

          <div className="top-nav__actions">
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

      <main className="page-wrap">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="app-footer__wave" aria-hidden="true">
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
        <div className="app-footer__inner">
          <div className="app-footer__brand-block">
            <p className="app-footer__brand">QuizPop</p>
            <p className="app-footer__tagline">
              Real-time quiz battles for curious minds and competitive friends.
            </p>
          </div>

          {isAuthenticated ? (
            <div className="app-footer__column">
              <h3>Explore</h3>
              <Link to="/home">Dashboard</Link>
              <Link to="/quiz">Solo Quiz</Link>
              <Link to="/leaderboard">Leaderboard</Link>
              <Link to="/profile">Profile</Link>
            </div>
          ) : isLandingPage ? (
            <div className="app-footer__column">
              <h3>Overview</h3>
              <a href="#landing-features">Features</a>
              <a href="#landing-how">How it works</a>
              <a href="#landing-value">Why QuizPop</a>
              <Link to="/register">Create Account</Link>
            </div>
          ) : null}

          <div className="app-footer__column">
            <h3>Legal</h3>
            <Link to="/legal/privacy">Privacy Policy</Link>
            <Link to="/legal/terms">Terms of Service</Link>
            <Link to="/legal/cookies">Cookie Policy</Link>
          </div>

          <p className="app-footer__meta">
            © {year} QuizPop. Built for curious minds.
          </p>
        </div>
      </footer>
    </div>
  );
}
