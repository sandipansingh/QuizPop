import { AlertTriangle, Copy, Signal } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { useRoomStore } from '../../app/store/room.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { createProfilePathBuilder } from '../../shared/utils/path.utils';
import { Card } from '../_shared/components/Card';
import { RouteSpinner } from '../_shared/components/RouteSpinner';
import { roomPageService } from './service';
import { useRoomPageStore } from './store';
import { RoomGamePanel } from './components/RoomGamePanel';
import { RoomSidebar } from './components/RoomSidebar';

export default function RoomPage() {
  const navigate = useNavigate();
  const { id: roomIdFromRoute } = useParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.user);

  usePageMeta({
    title: `Room ${roomIdFromRoute ?? ''}`.trim(),
    description:
      'Join a live QuizPop room to play real-time quiz rounds with friends and watch the leaderboard update instantly.',
  });

  const room = useRoomStore((state) => state.room);
  const roomId = useRoomStore((state) => state.roomId) ?? roomIdFromRoute;
  const players = useRoomStore((state) => state.players);
  const gameStatus = useRoomStore((state) => state.gameStatus);
  const finalLeaderboard = useRoomStore((state) => state.finalLeaderboard);
  const isSocketConnected = useRoomStore((state) => state.isSocketConnected);
  const isJoining = useRoomStore((state) => state.isJoining);
  const resetForNextQuestion = useRoomPageStore(
    (state) => state.resetForNextQuestion
  );
  const currentQuestionIndex = useRoomStore(
    (state) => state.currentQuestionIndex
  );

  const isHost = room?.host_id === currentUser?.id;
  const hasEnoughPlayers = players.length >= 2;
  const canStartGame = isHost && gameStatus === 'waiting' && hasEnoughPlayers;
  const getProfilePath = createProfilePathBuilder({
    currentUserId: currentUser?.id,
    currentUsername: currentUser?.username,
  });

  useEffect(() => {
    let cancelled = false;
    const connectToRoom = async () => {
      try {
        await roomPageService.connectAndJoin(roomIdFromRoute ?? '');
      } catch (joinError) {
        if (cancelled) return;
        toast.error(
          (joinError as { message?: string }).message ?? 'Unable to join room.'
        );
        navigate('/', { replace: true });
      }
    };
    void connectToRoom();
    return () => {
      cancelled = true;
      void roomPageService.leaveRoom();
      roomPageService.disconnect();
      resetForNextQuestion();
    };
  }, [navigate, resetForNextQuestion, roomIdFromRoute]);

  useEffect(() => {
    resetForNextQuestion();
  }, [currentQuestionIndex, resetForNextQuestion]);

  useEffect(() => {
    if (gameStatus !== 'ended' || !finalLeaderboard) return;
    navigate('/result', {
      replace: true,
      state: { mode: 'room', roomId, leaderboard: finalLeaderboard },
    });
  }, [finalLeaderboard, gameStatus, navigate, roomId]);

  const handleCopyRoomId = async () => {
    if (!roomId) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomId);
      } else {
        const ta = document.createElement('textarea');
        ta.value = roomId;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:absolute;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast.success('Room ID copied.');
    } catch {
      toast.error('Could not copy room ID.');
    }
  };

  if (isJoining && !players.length)
    return <RouteSpinner label="Joining room..." />;

  return (
    <section className="grid place-items-center">
      <Card className="w-[min(980px,100%)]" accent="mint">
        <div className="flex justify-between items-center gap-2.5">
          <button
            type="button"
            className="border-0 p-0 bg-transparent text-foreground font-heading text-[clamp(1.5rem,3.4vw,2.2rem)] font-extrabold tracking-tight leading-[1.15] inline-flex items-center gap-2 cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-65 hover:not-disabled:underline hover:not-disabled:decoration-2 focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-[3px] focus-visible:rounded-sm"
            onClick={handleCopyRoomId}
            disabled={!roomId}
            title="Click to copy room ID"
            aria-label={
              roomId ? `Copy room ID ${roomId}` : 'No room ID to copy'
            }
          >
            <span className="break-all">{roomId ?? 'Unavailable'}</span>
            <Copy size={16} />
          </button>
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground px-3 py-1.5 font-bold bg-tertiary">
            <span
              className={`w-2.5 h-2.5 rounded-full border border-foreground ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <Signal size={16} />
            {isSocketConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {!isSocketConnected ? (
          <div className="mt-3 inline-flex items-center gap-2 border-2 border-orange-400 rounded-md px-2.5 py-2 bg-orange-50 text-orange-900">
            <AlertTriangle size={18} /> Reconnecting to room socket...
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-[1.3fr_1fr] gap-4 max-[960px]:grid-cols-1">
          <RoomGamePanel
            isHost={isHost}
            hasEnoughPlayers={hasEnoughPlayers}
            canStartGame={canStartGame}
          />
          <RoomSidebar
            roomHostId={room?.host_id}
            getProfilePath={getProfilePath}
          />
        </div>
      </Card>
    </section>
  );
}
