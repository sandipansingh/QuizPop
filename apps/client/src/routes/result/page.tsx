import { Medal, Play, Trophy } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import {
  formatDuration,
  formatPercentage,
} from '../../shared/utils/formatters';
import { createProfilePathBuilder } from '../../shared/utils/path.utils';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { quizPageService } from '../quiz/service';
import { useResultPageStore } from './store';
import { ResultStatsGrid } from './components/ResultStatsGrid';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentUsername = useAuthStore((state) => state.user?.username);
  const mode = useResultPageStore((state) => state.mode);
  const solo = useResultPageStore((state) => state.solo);
  const multiplayer = useResultPageStore((state) => state.multiplayer);
  const errorMessage = useResultPageStore((state) => state.errorMessage);
  const hydrate = useResultPageStore((state) => state.hydrate);

  usePageMeta({
    title: 'Results',
    description:
      'Review your QuizPop quiz results, compare multiplayer standings, and jump into your next challenge.',
  });

  useEffect(() => {
    hydrate(location.state as Record<string, unknown> | null);
  }, [hydrate, location.state]);

  const getProfilePath = createProfilePathBuilder({
    currentUserId,
    currentUsername,
  });

  return (
    <section className="grid place-items-center">
      <Card className="w-[min(980px,100%)]" accent="pink">
        <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
          Performance Summary
        </p>
        <h1 className="mt-2.5 text-[clamp(1.9rem,4.2vw,3rem)]">
          {mode === 'room' ? 'Room Match Complete' : 'Solo Quiz Complete'}
        </h1>
        <FormMessage message={errorMessage} tone="error" />

        {mode === 'solo' && solo ? (
          <ResultStatsGrid
            items={[
              { label: 'Final Score', value: solo.score },
              {
                label: 'Accuracy',
                value: formatPercentage(
                  (solo.correct_answers / Math.max(1, solo.total_questions)) *
                    100
                ),
              },
              {
                label: 'Correct Answers',
                value: `${solo.correct_answers} / ${solo.total_questions}`,
              },
              {
                label: 'Total Time',
                value: formatDuration(
                  solo.average_response * solo.total_questions
                ),
              },
            ]}
          />
        ) : null}

        {mode === 'room' && multiplayer ? (
          <>
            <ResultStatsGrid
              items={[
                { label: 'My Rank', value: multiplayer.myEntry?.rank ?? 'NA' },
                { label: 'My Score', value: multiplayer.myEntry?.score ?? 0 },
                { label: 'Room', value: multiplayer.roomId ?? 'Unknown' },
                { label: 'Players', value: multiplayer.leaderboard.length },
              ]}
            />
            <ol className="mt-4 p-0 list-none grid gap-2">
              {multiplayer.leaderboard.map((entry) => (
                <li
                  key={entry.user_id}
                  className="flex justify-between items-center border-2 border-border rounded-md px-3 py-2.5 bg-[color-mix(in_srgb,var(--color-muted)_80%,transparent)]"
                >
                  <span>
                    #{entry.rank}{' '}
                    <Link
                      to={getProfilePath(entry.user_id, entry.username)}
                      className="font-bold no-underline hover:underline"
                    >
                      {entry.username}
                    </Link>
                  </span>
                  <strong className="text-accent">{entry.score}</strong>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        <div className="mt-5 flex gap-2.5 flex-wrap max-[960px]:flex-col">
          <Button
            onClick={() => {
              quizPageService.resetQuiz();
              navigate('/quiz');
            }}
            icon={<Play size={18} />}
          >
            Play Solo
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/home')}
            icon={<Trophy size={18} />}
          >
            Back Home
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            icon={<Medal size={18} />}
          >
            New Room Match
          </Button>
        </div>
      </Card>
    </section>
  );
}
