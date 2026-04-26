import { ArrowRight, PlusCircle, Users } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { useRoomStore } from '../../app/store/room.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { createProfilePathBuilder } from '../../shared/utils/path.utils';
import { normalizeOverviewStats } from '../../shared/utils/profile.utils';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { InputField } from '../_shared/components/InputField';
import { useHomePageStore } from './store';
import { HomeStatsCard } from './components/HomeStatsCard';
import { HomeTopPlayers } from './components/HomeTopPlayers';

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
          <HomeStatsCard stats={safeStats} />
          <HomeTopPlayers
            players={leaderboard}
            isLoading={isLoadingSnapshot}
            getProfilePath={getProfilePath}
          />
        </div>
      </div>
    </section>
  );
}
