import {
  ArrowRight,
  ChartNoAxesColumn,
  Sparkles,
  Timer,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store.js';
import { usePageMeta } from '../../shared/hooks/usePageMeta.js';
import { Button } from '../_shared/components/Button.jsx';
import { Card } from '../_shared/components/Card.jsx';

const featureItems = [
  {
    title: 'Real-time Collaboration',
    description:
      'Host quiz rooms, invite friends, and watch scoreboards update instantly.',
    icon: Users,
    tone: 'violet',
  },
  {
    title: 'Smart Progression',
    description:
      'Earn XP, maintain streaks, and unlock higher-level challenge sessions.',
    icon: Zap,
    tone: 'pink',
  },
  {
    title: 'Advanced Insights',
    description:
      'Track accuracy, average response speed, and long-term growth by category.',
    icon: ChartNoAxesColumn,
    tone: 'yellow',
  },
  {
    title: 'Timed Precision',
    description:
      'Every question is a sprint. Faster and correct answers bring better scores.',
    icon: Timer,
    tone: 'mint',
  },
  {
    title: 'Competitive Rankings',
    description:
      'Climb the global leaderboard with every completed solo or room challenge.',
    icon: Trophy,
    tone: 'violet',
  },
  {
    title: 'Smart Question System',
    description:
      'Difficulty adapts to your skill, repeated questions are filtered out, multiplayer stays fair, and progression feels dynamic.',
    icon: Sparkles,
    tone: 'mint',
  },
];

const steps = [
  {
    title: 'Create Your Profile',
    description:
      'Register in seconds and personalize your identity before your first battle.',
  },
  {
    title: 'Join A Quiz Mode',
    description:
      'Pick solo challenge mode or jump into a real-time room with friends.',
  },
  {
    title: 'Track And Improve',
    description:
      'Review stats, optimize speed, and return stronger in every new round.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  usePageMeta({
    title: 'Home',
    description:
      'Join QuizPop to play fast-paced solo quizzes, challenge friends in real-time rooms, and climb the global leaderboard.',
  });

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <section className="landing-page">
      <Card className="landing-hero" accent="yellow">
        <div className="landing-hero__shape landing-hero__shape--pink" />
        <div className="landing-hero__shape landing-hero__shape--blue" />
        <div className="landing-hero__ring" />

        <div className="landing-hero__copy">
          <p className="landing-kicker">
            QuizPop brings your squad together for fast rooms, solo drills, and
            ranking pushes.
          </p>
          <p className="eyebrow">
            <Sparkles size={16} /> Playful Geometric Quiz Arena
          </p>
          <h1>Transform The Way Your Crew Plays Quiz Battles</h1>
          <p className="lede">
            Jump into real-time quiz rooms, stack streaks with timed solo
            challenges, and compete for leaderboard dominance.
          </p>
          <div className="landing-hero__actions">
            <Button
              onClick={() => navigate('/register')}
              icon={<ArrowRight size={18} />}
            >
              Start Playing Free
            </Button>
            <Button variant="secondary" onClick={() => navigate('/login')}>
              I Already Have An Account
            </Button>
          </div>

          <ul className="landing-hero__chips" aria-label="Core highlights">
            <li>Instant score feedback</li>
            <li>Private multiplayer rooms</li>
            <li>XP, levels, and streak tracking</li>
          </ul>
        </div>

        <div className="landing-hero__media" aria-label="QuizPop highlights">
          <div className="landing-hero__media-frame">
            <div className="landing-hero__media-avatar">
              <Trophy
                size={56}
                strokeWidth={1.5}
                color="var(--color-foreground)"
              />
            </div>
            <div className="landing-hero__media-overlay">
              <span>QuizPop Arena</span>
              <strong>Live Match Ready</strong>
            </div>
          </div>

          <div className="landing-hero__stat-card">
            <span>Real-Time Rooms</span>
            <strong>Live Sync</strong>
          </div>
          <div className="landing-hero__stat-card">
            <span>Solo Practice</span>
            <strong>Instant Feedback</strong>
          </div>
          <div className="landing-hero__stat-card">
            <span>Leaderboard</span>
            <strong>Global Rank Push</strong>
          </div>

          <div className="landing-hero__burst" aria-hidden="true">
            POP QUIZ
          </div>
        </div>
      </Card>

      <div className="landing-marquee" aria-hidden="true">
        <span>
          SOLO SPRINTS • ROOM BATTLES • STREAK CHALLENGES • XP PROGRESSION •
          SOLO SPRINTS • ROOM BATTLES • STREAK CHALLENGES • XP PROGRESSION •
        </span>
      </div>

      <section id="landing-features" className="landing-section">
        <p className="landing-section__badge">Powerful Features</p>
        <h2>Everything You Need To Improve Every Round</h2>
        <p className="landing-section__sub">
          Designed for playful competition with serious performance tracking.
        </p>

        <div className="landing-feature-grid">
          {featureItems.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                accent={item.tone}
                className="landing-feature"
              >
                <span
                  className={`landing-feature__corner landing-feature__corner--${item.tone}`}
                />
                <div className="landing-feature__icon">
                  <Icon size={18} strokeWidth={2.5} />
                </div>
                <h3>{item.title}</h3>
                <p className="muted">{item.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section
        id="landing-how"
        className="landing-section landing-section--steps"
      >
        <h2>How QuizPop Works</h2>
        <p className="landing-section__sub">
          Get up and competing in minutes, not days.
        </p>

        <ol className="landing-steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <div className="landing-steps__index">{index + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="landing-value" className="landing-value">
        <div className="landing-value__copy">
          <p className="landing-section__badge landing-section__badge--light">
            Why Players Stay
          </p>
          <h2>Stay Organized, Competitive, And Always Improving</h2>
          <p>
            QuizPop centralizes your full quiz journey into one visual,
            high-energy experience that feels rewarding every session.
          </p>
          <blockquote>
            "Designed for speed and clarity, so every round feels fun while your
            progress keeps compounding."
          </blockquote>
        </div>

        <div className="landing-value__art" aria-hidden="true">
          <div className="landing-value__circle" />
          <div className="landing-value__square" />
          <div className="landing-value__card">
            <span />
          </div>
          <div className="landing-value__pill" />
        </div>
      </section>
    </section>
  );
}
