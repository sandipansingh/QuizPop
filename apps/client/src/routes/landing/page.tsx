import {
  ArrowRight,
  ChartNoAxesColumn,
  Sparkles,
  Timer,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';

interface FeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'violet' | 'pink' | 'yellow' | 'mint';
}

const featureItems: FeatureItem[] = [
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

const cornerColors: Record<string, string> = {
  violet: 'bg-accent',
  pink: 'bg-[#ec4899]',
  yellow: 'bg-[#fbbf24]',
  mint: 'bg-[#34d399]',
};

export default function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  usePageMeta({
    title: 'Home',
    description:
      'Join QuizPop to play fast-paced solo quizzes, challenge friends in real-time rooms, and climb the global leaderboard.',
  });

  if (isAuthenticated) return <Navigate to="/home" replace />;

  return (
    <section className="grid gap-7">
      {/* Hero */}
      <Card
        className="relative overflow-hidden grid grid-cols-[1.25fr_1fr] gap-5 items-stretch pt-[30px] max-[960px]:grid-cols-1"
        accent="yellow"
        style={
          {
            background:
              'radial-gradient(circle at 22% 16%, #fff5a7 0, transparent 35%), radial-gradient(circle at 82% 80%, #d6ecff 0, transparent 40%), #ffffff',
          } as React.CSSProperties
        }
      >
        {/* Decorative shapes */}
        <div
          aria-hidden="true"
          className="absolute z-1 w-[130px] h-[130px] border-2 border-foreground pointer-events-none rounded-[40%_60%_56%_44%] bg-[color-mix(in_srgb,var(--color-secondary)_70%,#fff)]"
          style={{ right: '44%', top: '-56px' }}
        />
        <div
          aria-hidden="true"
          className="absolute z-1 w-[104px] h-[104px] border-2 border-foreground pointer-events-none rounded-[50%_50%_20%_80%] bg-[color-mix(in_srgb,var(--color-accent)_42%,#fff)]"
          style={{ right: '-38px', bottom: '-34px' }}
        />
        <div
          aria-hidden="true"
          className="absolute w-[112px] h-[112px] left-[-24px] top-[72px] rounded-full border-4 border-[color-mix(in_srgb,var(--color-secondary)_44%,#fff)] pointer-events-none max-[960px]:hidden"
        />

        {/* Copy */}
        <div className="relative z-2">
          <p className="inline-block mb-3.5 px-3.5 py-[9px] border-2 border-foreground rounded-sm font-heading text-[0.86rem] tracking-wider uppercase bg-tertiary shadow-[4px_4px_0_0_var(--color-foreground)] rotate-[-2.3deg]">
            QuizPop brings your squad together for fast rooms, solo drills, and
            ranking pushes.
          </p>
          <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
            <Sparkles size={16} /> Playful Geometric Quiz Arena
          </p>
          <h1 className="mt-2 text-[clamp(2.4rem,4.7vw,4rem)] leading-[1.1]">
            Transform The Way Your Crew Plays Quiz Battles
          </h1>
          <p className="text-muted-fg mt-3">
            Jump into real-time quiz rooms, stack streaks with timed solo
            challenges, and compete for leaderboard dominance.
          </p>
          <div className="mt-[18px] flex gap-2.5 flex-wrap max-[960px]:flex-col">
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
          <ul
            className="mt-[18px] p-0 list-none flex flex-wrap gap-2 max-[960px]:flex-col"
            aria-label="Core highlights"
          >
            {[
              'Instant score feedback',
              'Private multiplayer rooms',
              'XP, levels, and streak tracking',
            ].map((chip) => (
              <li
                key={chip}
                className="border-2 border-foreground rounded-full px-3 py-1.5 text-[0.82rem] font-semibold bg-white max-[960px]:w-full"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>

        {/* Media */}
        <div
          className="relative z-2 grid grid-rows-[1fr_auto_auto_auto] gap-2.5"
          aria-label="QuizPop highlights"
        >
          <div className="relative min-h-[290px] border-2 border-foreground rounded-[36px_36px_30px_30px] bg-linear-to-br from-[#ebedf4] to-[#d7dbe8] overflow-hidden landing-hero-frame">
            <div className="absolute inset-5 border-2 border-foreground rounded-[28px] bg-[#fde047] flex items-center justify-center shadow-[inset_0_-6px_0_rgba(0,0,0,0.1)]">
              <Trophy
                size={56}
                strokeWidth={1.5}
                color="var(--color-foreground)"
              />
            </div>
            <div className="absolute left-[18px] right-[18px] bottom-4 border-2 border-foreground rounded-md px-2.5 py-2 bg-[color-mix(in_srgb,#0f172a_90%,transparent)] text-[#f8fafc]">
              <span className="block text-[0.72rem] uppercase tracking-widest text-[#cbd5e1]">
                QuizPop Arena
              </span>
              <strong className="font-heading text-[1rem]">
                Live Match Ready
              </strong>
            </div>
          </div>
          {[
            { label: 'Real-Time Rooms', value: 'Live Sync' },
            { label: 'Solo Practice', value: 'Instant Feedback' },
            { label: 'Leaderboard', value: 'Global Rank Push' },
          ].map((card) => (
            <div
              key={card.label}
              className="border-2 border-foreground rounded-md bg-white px-3 py-2.5 transition-transform duration-180 ease-bounce hover:translate-[-2px_-2px]"
            >
              <span className="block text-[0.76rem] text-muted-fg uppercase tracking-[0.08em]">
                {card.label}
              </span>
              <strong className="font-heading">{card.value}</strong>
            </div>
          ))}
          <div
            aria-hidden="true"
            className="justify-self-end border-2 border-foreground rounded-[100px_100px_100px_16px] px-3.5 py-1.5 text-[0.76rem] font-extrabold tracking-[0.08em] bg-tertiary shadow-[3px_3px_0_0_var(--color-foreground)]"
          >
            POP QUIZ
          </div>
        </div>
      </Card>

      {/* Marquee */}
      <div
        aria-hidden="true"
        className="relative overflow-hidden border-2 border-foreground rounded-full bg-linear-to-r from-white to-[#eaf3ff] h-[46px] flex items-center max-[960px]:hidden"
      >
        <span className="whitespace-nowrap text-[0.83rem] tracking-[0.18em] font-extrabold text-[color-mix(in_srgb,var(--color-foreground)_88%,#334155)] pl-full animate-marquee">
          SOLO SPRINTS • ROOM BATTLES • STREAK CHALLENGES • XP PROGRESSION •
          SOLO SPRINTS • ROOM BATTLES • STREAK CHALLENGES • XP PROGRESSION •
        </span>
      </div>

      {/* Features */}
      <section
        id="landing-features"
        className="border-2 border-foreground rounded-lg p-6"
        style={{
          background:
            'radial-gradient(circle at 1px 1px, rgba(30,41,59,0.09) 1px, transparent 0) 0 0 / 18px 18px, #fffef8',
        }}
      >
        <p className="w-fit mx-auto mb-2.5 border-2 border-foreground rounded-sm px-3.5 py-2 font-heading text-[0.84rem] uppercase tracking-[0.08em] text-[#f8fafc] bg-secondary shadow-[4px_4px_0_0_var(--color-foreground)] rotate-[1.4deg]">
          Powerful Features
        </p>
        <h2 className="text-center text-[clamp(1.9rem,3.7vw,3rem)] font-heading">
          Everything You Need To Improve Every Round
        </h2>
        <p className="mt-2.5 mx-auto max-w-[720px] text-center text-muted-fg text-[1.05rem]">
          Designed for playful competition with serious performance tracking.
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3.5 max-[960px]:grid-cols-1">
          {featureItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                accent={item.tone}
                className="relative pt-14 overflow-hidden"
              >
                <span
                  className={`absolute w-6 h-6 border-2 border-foreground rounded-[8px_8px_8px_0] right-2.5 top-2.5 ${cornerColors[item.tone]}`}
                />
                <div className="absolute left-[18px] top-4 w-11 h-11 rounded-full border-2 border-foreground bg-[color-mix(in_srgb,var(--color-secondary)_80%,#fff)] grid place-items-center">
                  <Icon size={18} strokeWidth={2.5} />
                </div>
                <h3 className="text-[1.45rem] font-heading">{item.title}</h3>
                <p className="text-muted-fg mt-1">{item.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section
        id="landing-how"
        className="border-2 border-foreground rounded-lg p-6 bg-[#fffef8]"
      >
        <h2 className="text-center text-[clamp(1.9rem,3.7vw,3rem)] font-heading">
          How QuizPop Works
        </h2>
        <p className="mt-2.5 mx-auto max-w-[720px] text-center text-muted-fg text-[1.05rem]">
          Get up and competing in minutes, not days.
        </p>
        <ol className="relative mt-7 p-0 list-none grid grid-cols-3 gap-[18px] landing-steps-list max-[960px]:grid-cols-1">
          {steps.map((step, index) => (
            <li key={step.title} className="text-center relative z-2">
              <div className="mx-auto mb-3 w-[76px] h-[76px] rounded-full border-2 border-foreground bg-white grid place-items-center font-heading text-[2rem] text-accent">
                {index + 1}
              </div>
              <h3 className="text-[1.6rem] font-heading">{step.title}</h3>
              <p className="mt-2 text-muted-fg">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Value */}
      <section
        id="landing-value"
        className="grid grid-cols-[1.1fr_0.9fr] gap-5 border-2 border-foreground rounded-lg bg-[#f5f9ff] p-6 max-[960px]:grid-cols-1"
      >
        <div>
          <p className="w-fit border-2 border-[color-mix(in_srgb,var(--color-accent)_45%,#1e293b)] rounded-sm px-3.5 py-2 font-heading text-[0.84rem] uppercase tracking-[0.08em] text-accent bg-[color-mix(in_srgb,var(--color-accent)_12%,#ffffff)] shadow-[4px_4px_0_0_color-mix(in_srgb,var(--color-accent)_22%,#94a3b8)] rotate-[1.4deg]">
            Why Players Stay
          </p>
          <h2 className="mt-2 text-[clamp(1.8rem,3.4vw,2.7rem)] font-heading">
            Stay Organized, Competitive, And Always Improving
          </h2>
          <p className="mt-3 text-[1.03rem] text-[#475569]">
            QuizPop centralizes your full quiz journey into one visual,
            high-energy experience that feels rewarding every session.
          </p>
          <blockquote className="mt-[18px] border-2 border-foreground rounded-md bg-white p-3.5 italic text-[#334155]">
            "Designed for speed and clarity, so every round feels fun while your
            progress keeps compounding."
          </blockquote>
        </div>
        <div className="relative min-h-[290px] max-[960px]:min-h-[220px]">
          <div className="absolute right-2.5 top-1 w-[210px] h-[210px] rounded-full border-2 border-foreground bg-[#f8fafc] landing-value-circle" />
          <div className="absolute right-[170px] top-[158px] w-[78px] h-[78px] border-2 border-foreground bg-tertiary rotate-12" />
          <div className="absolute left-6 bottom-3.5 w-[230px] h-[170px] border-2 border-foreground rounded-lg bg-[#f8fafc] flex items-center justify-center">
            <span className="w-[54px] h-[54px] bg-foreground rotate-45" />
          </div>
          <div className="absolute left-[200px] bottom-[118px] w-[114px] h-[114px] border-2 border-foreground rounded-full bg-accent" />
        </div>
      </section>
    </section>
  );
}
