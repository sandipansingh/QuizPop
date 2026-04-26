import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { LandingHero } from './components/LandingHero';
import {
  LandingFeatures,
  LandingHowItWorks,
  LandingValue,
} from './components/LandingSections';

export default function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  usePageMeta({
    title: 'Home',
    description:
      'Join QuizPop to play fast-paced solo quizzes, challenge friends in real-time rooms, and climb the global leaderboard.',
  });

  if (isAuthenticated) return <Navigate to="/home" replace />;

  return (
    <section className="grid gap-7">
      <LandingHero />

      <div
        aria-hidden="true"
        className="relative overflow-hidden border-2 border-foreground rounded-full bg-linear-to-r from-white to-[#eaf3ff] h-[46px] flex items-center max-[960px]:hidden"
      >
        <span className="whitespace-nowrap text-[0.83rem] tracking-[0.18em] font-extrabold text-[color-mix(in_srgb,var(--color-foreground)_88%,#334155)] pl-full animate-marquee">
          SOLO SPRINTS • ROOM BATTLES • STREAK CHALLENGES • XP PROGRESSION •
          SOLO SPRINTS • ROOM BATTLES • STREAK CHALLENGES • XP PROGRESSION •
        </span>
      </div>

      <LandingFeatures />
      <LandingHowItWorks />
      <LandingValue />
    </section>
  );
}
