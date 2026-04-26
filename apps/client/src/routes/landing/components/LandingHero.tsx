import { ArrowRight, Sparkles, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../_shared/components/Button';
import { Card } from '../../_shared/components/Card';

export function LandingHero() {
  const navigate = useNavigate();

  return (
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
  );
}
