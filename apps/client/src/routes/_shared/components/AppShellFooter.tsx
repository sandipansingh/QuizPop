import { Link } from 'react-router-dom';

interface Props {
  isAuthenticated: boolean;
  isLandingPage: boolean;
  year: number;
}

export function AppShellFooter({
  isAuthenticated,
  isLandingPage,
  year,
}: Props) {
  return (
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
            {[
              { href: '#landing-features', label: 'Features' },
              { href: '#landing-how', label: 'How it works' },
              { href: '#landing-value', label: 'Why QuizPop' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="no-underline text-border w-fit border-b border-transparent hover:border-tertiary transition-[border-color] duration-180"
              >
                {l.label}
              </a>
            ))}
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
  );
}
