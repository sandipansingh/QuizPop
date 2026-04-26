import { useEffect, useState } from 'react';
import { useAuthStore } from '../../app/store/auth.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { leaderboardService } from '../../shared/services/leaderboard.service';
import { createProfilePathBuilder } from '../../shared/utils/path.utils';
import type { LeaderboardRow } from '../../shared/types';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { RouteSpinner } from '../_shared/components/RouteSpinner';
import { LeaderboardTable } from './components/LeaderboardTable';

const PAGE_SIZE = 10;

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export default function LeaderboardPage() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentUsername = useAuthStore((state) => state.user?.username);

  usePageMeta({
    title: 'Leaderboard',
    description:
      'Browse QuizPop top players with pagination, compare score and accuracy, and check who leads the global ranking.',
  });

  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    total_pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPage = async (page: number) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const payload = await leaderboardService.getLeaderboard({
        page,
        limit: PAGE_SIZE,
      });
      setLeaderboardRows((payload.data ?? []) as LeaderboardRow[]);
      setPaginationMeta(
        (payload.meta as PaginationMeta | undefined) ?? {
          page,
          limit: PAGE_SIZE,
          total: payload.data?.length ?? 0,
          total_pages: 1,
        }
      );
    } catch (err) {
      setErrorMessage(
        (err as { message?: string }).message ?? 'Failed to load leaderboard.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPage(1);
  }, []);

  const currentPage = paginationMeta.page || 1;
  const totalPages = Math.max(1, paginationMeta.total_pages || 1);
  const getProfilePath = createProfilePathBuilder({
    currentUserId,
    currentUsername,
  });

  if (isLoading && !leaderboardRows.length)
    return <RouteSpinner label="Loading leaderboard..." />;

  return (
    <section className="grid">
      <Card accent="pink" className="w-[min(1024px,100%)]">
        <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
          Leaderboard
        </p>
        <h1 className="mt-2.5 text-[clamp(1.9rem,4.2vw,3rem)]">Top Players</h1>
        <p className="text-muted-fg mt-3">
          Compete for rank, improve your accuracy, and keep your streak alive.
        </p>

        <FormMessage message={errorMessage} tone="error" />

        {!leaderboardRows.length ? (
          <p className="text-muted-fg mt-4">No leaderboard entries yet.</p>
        ) : (
          <LeaderboardTable
            rows={leaderboardRows}
            getProfilePath={getProfilePath}
          />
        )}

        <div
          className="mt-3.5 flex items-center justify-between gap-2.5 max-[960px]:flex-col max-[960px]:items-stretch"
          aria-label="Leaderboard pagination"
        >
          <Button
            variant="secondary"
            onClick={() => loadPage(currentPage - 1)}
            disabled={isLoading || currentPage <= 1}
          >
            Previous
          </Button>
          <p className="text-muted-fg">
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
