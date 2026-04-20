import { Medal, Play, Trophy } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store.js';
import { usePageMeta } from '../../shared/hooks/usePageMeta.js';
import {
  formatDuration,
  formatPercentage,
} from '../../shared/utils/formatters.js';
import { createProfilePathBuilder } from '../../shared/utils/path.utils.js';
import { Button } from '../_shared/components/Button.jsx';
import { Card } from '../_shared/components/Card.jsx';
import { FormMessage } from '../_shared/components/FormMessage.jsx';
import { quizPageService } from '../quiz/service.js';
import { useResultPageStore } from './store.js';

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
    hydrate(location.state);
  }, [hydrate, location.state]);
  const getProfilePath = createProfilePathBuilder({
    currentUserId,
    currentUsername,
  });

  const handlePlayAgainSoloMode = () => {
    quizPageService.resetQuiz();
    navigate('/quiz');
  };

  return (
    <section className="result-page">
      <Card className="result-card" accent="pink">
        <p className="eyebrow">Performance Summary</p>
        <h1>
          {mode === 'room' ? 'Room Match Complete' : 'Solo Quiz Complete'}
        </h1>
        <FormMessage message={errorMessage} tone="error" />

        {mode === 'solo' && solo ? (
          <div className="result-grid">
            <div>
              <span>Final Score</span>
              <strong>{solo.score}</strong>
            </div>
            <div>
              <span>Accuracy</span>
              <strong>
                {formatPercentage(
                  (solo.correct_answers / Math.max(1, solo.total_questions)) *
                    100
                )}
              </strong>
            </div>
            <div>
              <span>Correct Answers</span>
              <strong>
                {solo.correct_answers} / {solo.total_questions}
              </strong>
            </div>
            <div>
              <span>Total Time</span>
              <strong>
                {formatDuration(solo.average_response * solo.total_questions)}
              </strong>
            </div>
          </div>
        ) : null}

        {mode === 'room' && multiplayer ? (
          <>
            <div className="result-grid">
              <div>
                <span>My Rank</span>
                <strong>{multiplayer.myEntry?.rank || 'NA'}</strong>
              </div>
              <div>
                <span>My Score</span>
                <strong>{multiplayer.myEntry?.score || 0}</strong>
              </div>
              <div>
                <span>Room</span>
                <strong>{multiplayer.roomId || 'Unknown'}</strong>
              </div>
              <div>
                <span>Players</span>
                <strong>{multiplayer.leaderboard.length}</strong>
              </div>
            </div>
            <ol className="leaderboard-mini leaderboard-mini--room result-board">
              {multiplayer.leaderboard.map((entry) => (
                <li key={entry.user_id}>
                  <span>
                    #{entry.rank}{' '}
                    <Link to={getProfilePath(entry.user_id, entry.username)}>
                      {entry.username}
                    </Link>
                  </span>
                  <strong>{entry.score}</strong>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        <div className="result-actions">
          <Button onClick={handlePlayAgainSoloMode} icon={<Play size={18} />}>
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
