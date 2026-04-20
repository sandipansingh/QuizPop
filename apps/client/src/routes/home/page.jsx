import { ArrowRight, Flag, PlusCircle, Users } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store.js';
import { useRoomStore } from '../../app/store/room.store.js';
import { usePageMeta } from '../../shared/hooks/usePageMeta.js';
import { formatPercentage } from '../../shared/utils/formatters.js';
import { createProfilePathBuilder } from '../../shared/utils/path.utils.js';
import { normalizeOverviewStats } from '../../shared/utils/profile.utils.js';
import { Button } from '../_shared/components/Button.jsx';
import { Card } from '../_shared/components/Card.jsx';
import { FormMessage } from '../_shared/components/FormMessage.jsx';
import { InputField } from '../_shared/components/InputField.jsx';
import { useHomePageStore } from './store.js';

export default function HomePage() {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);
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

  const safeStats = normalizeOverviewStats(stats?.overview || stats);

  const currentUsername = useAuthStore((state) => state.user?.username);
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
    <section className="home-page">
      <div className="hero-grid">
        <Card className="hero-panel" accent="violet">
          <p className="eyebrow">Ready, Set, Quiz</p>
          <h1>Play Solo Or Go Head-To-Head In Live Rooms</h1>
          <p className="lede">
            Practice with timed solo rounds, then switch to synchronized
            multiplayer battles.
          </p>
          <div className="hero-panel__actions">
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
          <div className="join-room-box">
            <InputField
              id="join-room-id"
              label="Join Existing Room"
              placeholder="Paste room id"
              value={joinRoomId}
              onChange={(event) => setJoinRoomId(event.target.value)}
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

        <div className="home-side-column">
          <Card accent="mint">
            <h2>My Snapshot</h2>
            <div className="stats-grid">
              <div>
                <span>Quizzes</span>
                <strong>{safeStats.total_quizzes_played}</strong>
              </div>
              <div>
                <span>Total Score</span>
                <strong>{safeStats.total_score}</strong>
              </div>
              <div>
                <span>Accuracy</span>
                <strong>
                  {formatPercentage(safeStats.accuracy_percentage)}
                </strong>
              </div>
              <div>
                <span>Current Streak</span>
                <strong>{safeStats.current_streak} days</strong>
              </div>
            </div>
            <p className="stats-rank">
              <Flag size={16} /> Rank: <strong>{safeStats.rank}</strong>
            </p>
          </Card>

          <Card accent="pink">
            <h2>Top Players</h2>
            {isLoadingSnapshot ? (
              <p className="muted">Loading leaderboard...</p>
            ) : !leaderboard.length ? (
              <p className="muted">No leaderboard entries yet.</p>
            ) : (
              <ol className="leaderboard-mini">
                {leaderboard.map((player) => (
                  <li key={player.user_id}>
                    <Link to={getProfilePath(player.user_id, player.username)}>
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
