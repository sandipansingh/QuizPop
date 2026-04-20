import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store.js';
import { usePageMeta } from '../../shared/hooks/usePageMeta.js';
import { leaderboardService } from '../../shared/services/leaderboard.service.js';
import { formatPercentage } from '../../shared/utils/formatters.js';
import { createProfilePathBuilder } from '../../shared/utils/path.utils.js';
import { Button } from '../_shared/components/Button.jsx';
import { Card } from '../_shared/components/Card.jsx';
import { FormMessage } from '../_shared/components/FormMessage.jsx';
import { RouteSpinner } from '../_shared/components/RouteSpinner.jsx';

const PAGE_SIZE = 10;

export default function LeaderboardPage() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentUsername = useAuthStore((state) => state.user?.username);

  usePageMeta({
    title: 'Leaderboard',
    description:
      'Browse QuizPop top players with pagination, compare score and accuracy, and check who leads the global ranking.',
  });

  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    total_pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPage = async (page) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload = await leaderboardService.getLeaderboard({
        page,
        limit: PAGE_SIZE,
      });
      setLeaderboardRows(payload.data || []);
      setPaginationMeta(
        payload.meta || {
          page,
          limit: PAGE_SIZE,
          total: payload.data?.length || 0,
          total_pages: 1,
        }
      );
    } catch (loadError) {
      setErrorMessage(loadError.message || 'Failed to load leaderboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPage(1);
  }, []);

  const currentPage = paginationMeta.page || 1;
  const totalPages = Math.max(1, paginationMeta.total_pages || 1);
  const getProfilePath = createProfilePathBuilder({
    currentUserId,
    currentUsername,
  });

  if (isLoading && !leaderboardRows.length) {
    return <RouteSpinner label="Loading leaderboard..." />;
  }

  return (
    <section className="leaderboard-page">
      <Card accent="pink" className="leaderboard-card">
        <p className="eyebrow">Leaderboard</p>
        <h1>Top Players</h1>
        <p className="lede">
          Compete for rank, improve your accuracy, and keep your streak alive.
        </p>

        <FormMessage message={errorMessage} tone="error" />

        {!leaderboardRows.length ? (
          <p className="muted">No leaderboard entries yet.</p>
        ) : (
          <div
            className="leaderboard-table-wrap"
            role="region"
            aria-label="Top players leaderboard"
          >
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Player</th>
                  <th scope="col">Score</th>
                  <th scope="col">Accuracy</th>
                  <th scope="col">Quizzes</th>
                  <th scope="col">Rank Tier</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardRows.map((player) => (
                  <tr key={player.user_id}>
                    <td>{player.global_rank}</td>
                    <td>
                      <Link
                        to={getProfilePath(player.user_id, player.username)}
                      >
                        {player.username}
                      </Link>
                    </td>
                    <td>{player.total_score}</td>
                    <td>{formatPercentage(player.accuracy_percentage)}</td>
                    <td>{player.total_quizzes_played}</td>
                    <td>{player.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div
          className="leaderboard-pagination"
          aria-label="Leaderboard pagination"
        >
          <Button
            variant="secondary"
            onClick={() => loadPage(currentPage - 1)}
            disabled={isLoading || currentPage <= 1}
          >
            Previous
          </Button>
          <p className="muted">
            Page {currentPage} of {totalPages}
          </p>
          <Button
            variant="secondary"
            onClick={() => loadPage(currentPage + 1)}
            disabled={isLoading || currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </Card>
    </section>
  );
}
