import { useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from './Button';

interface Props {
  isAuthenticated: boolean;
  username?: string;
  onLogout: () => void;
}

export function AppShellHeader({ isAuthenticated, username, onLogout }: Props) {
  const navigate = useNavigate();

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

  return (
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
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Logout {username ? `@${username}` : ''}
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
  );
}
