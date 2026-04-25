import { ArrowRight, Flag, PlusCircle, Users } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { useRoomStore } from '../../app/store/room.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { formatPercentage } from '../../shared/utils/formatters';
import { createProfilePathBuilder } from '../../shared/utils/path.utils';
import { normalizeOverviewStats } from '../../shared/utils/profile.utils';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { InputField } from '../_shared/components/InputField';
import { useHomePageStore } from './store';

export default function HomePage() {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentUsername = useAuthStore((state) => state.user?.username);
  const hydrateRoom = useRoomStore((state) => state.hydrateRoom);

  usePageMeta({
    title: 'Dashboard',
    description:
      'View your QuizPop stats, create or join quiz rooms, and track top players from your personalized dashboard.',
  });

  const stats = useHomePageStore((state) => state.stats);
  const leaderboard = useHomePageStore((state) => state.leaderboard);
  const joinRoomId = useHomePageStore((state) => state.joinRoomId);
  const errorMessage = useHomePageStore((state) => state.errorMessage);
  const isLoadingSnapshot = useHomePageStore(
    (state) => state.isLoadingSnapshot
  );
  const isCreatingRoom = useHomePageStore((state) => state.isCreatingRoom);
  const isJoiningRoom = useHomePageStore((state) => state.isJoiningRoom);
  const fetchDashboardSnapshot = useHomePageStore(
    (state) => state.fetchDashboardSnapshot
  );
  const setJoinRoomId = useHomePageStore((state) => state.setJoinRoomId);
  const createRoom = useHomePageStore((state) => state.createRoom);
  const joinRoom = useHomePageStore((state) => state.joinRoom);

  useEffect(() => {
    void fetchDashboardSnapshot();
  }, [fetchDashboardSnapshot]);

  const safeStats = normalizeOverviewStats(
    (
      stats as {
        overview?: Parameters<typeof normalizeOverviewStats>[0];
      } | null
    )?.overview
  );

  const getProfilePath = createProfilePathBuilder({
    currentUserId,
    currentUsername,
  });

  const handleCreateRoom = async () => {
    try {
      const room = await createRoom();
      hydrateRoom(room);
      toast.success('Room created. Invite your squad.');
      navigate(`/room/${room.id}`);
    } catch {
      toast.error('Could not create room.');
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      toast.error('Enter a room id first.');
      return;
    }
    try {
      const room = await joinRoom(joinRoomId);
      hydrateRoom(room);
      toast.success('Joined room successfully.');
      navigate(`/room/${room.id}`);
    } catch {
      toast.error('Unable to join that room.');
    }
  };

  return (
    <section className="grid gap-5">
      <div className="grid grid-cols-[1.35fr_1fr] gap-5 max-[960px]:grid-cols-1">
        <Card className="hero-panel" accent="violet">
          <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
            Ready, Set, Quiz
          </p>
          <h1 className="mt-2.5 text-[clamp(1.9rem,4.2vw,3rem)]">
            Play Solo Or Go Head-To-Head In Live Rooms
          </h1>
          <p className="text-muted-fg mt-3">
            Practice with timed solo rounds, then switch to synchronized
            multiplayer battles.
          </p>
          <div className="mt-5 flex gap-2.5 flex-wrap max-[960px]:flex-col">
            <Button
              onClick={() => navigate('/quiz')}
              icon={<ArrowRight size={18} strokeWidth={2.5} />}
            >
              Start Solo Quiz
            </Button>
            <Button
              variant="secondary"
              loading={isCreatingRoom}
              onClick={handleCreateRoom}
              icon={<PlusCircle size={18} strokeWidth={2.5} />}
            >
              Create Room
            </Button>
          </div>
          <div className="mt-5 flex gap-2.5 flex-wrap items-end max-[960px]:flex-col">
            <InputField
              id="join-room-id"
              label="Join Existing Room"
              placeholder="Paste room id"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
            />
            <Button
              variant="ghost"
              loading={isJoiningRoom}
              icon={<Users size={18} strokeWidth={2.5} />}
              onClick={handleJoinRoom}
            >
              Join Room
            </Button>
          </div>
          <FormMessage message={errorMessage} tone="error" />
        </Card>

        <div className="grid gap-4">
          <Card accent="mint">
            <h2 className="text-xl font-heading">My Snapshot</h2>
            <div className="mt-3.5 grid grid-cols-2 gap-3">
              {[
                { label: 'Quizzes', value: safeStats.total_quizzes_played },
                { label: 'Total Score', value: safeStats.total_score },
                {
                  label: 'Accuracy',
                  value: formatPercentage(safeStats.accuracy_percentage),
                },
                {
                  label: 'Current Streak',
                  value: `${safeStats.current_streak} days`,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="border-2 border-border rounded-md p-2.5 bg-muted"
                >
                  <span className="block text-[0.75rem] uppercase tracking-[0.08em] text-muted-fg">
                    {label}
                  </span>
                  <strong className="text-[1.1rem] font-heading">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
            <p className="mt-3.5 inline-flex items-center gap-2">
              <Flag size={16} /> Rank: <strong>{safeStats.rank}</strong>
            </p>
          </Card>

          <Card accent="pink">
            <h2 className="text-xl font-heading">Top Players</h2>
            {isLoadingSnapshot ? (
              <p className="text-muted-fg">Loading leaderboard...</p>
            ) : !leaderboard.length ? (
              <p className="text-muted-fg">No leaderboard entries yet.</p>
            ) : (
              <ol className="mt-3.5 p-0 list-none grid gap-2">
                {leaderboard.map((player) => (
                  <li
                    key={player.user_id}
                    className="flex justify-between items-center border-2 border-border rounded-md px-3 py-2.5 bg-[color-mix(in_srgb,var(--color-muted)_80%,transparent)]"
                  >
                    <Link
                      to={getProfilePath(player.user_id, player.username)}
                      className="no-underline font-bold hover:underline"
                    >
                      {player.username}
                    </Link>
                    <strong>{player.total_score}</strong>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
