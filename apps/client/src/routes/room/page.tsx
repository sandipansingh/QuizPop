import { AlertTriangle, Copy, Crown, Signal, Users } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { useRoomStore } from '../../app/store/room.store';
import { useCountdown } from '../../shared/hooks/useCountdown';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { formatSeconds } from '../../shared/utils/formatters';
import { createProfilePathBuilder } from '../../shared/utils/path.utils';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { RouteSpinner } from '../_shared/components/RouteSpinner';
import { roomPageService } from './service';
import { useRoomPageStore } from './store';

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
  const leaderboard = useRoomStore((state) => state.leaderboard);
  const gameStatus = useRoomStore((state) => state.gameStatus);
  const currentQuestion = useRoomStore((state) => state.currentQuestion);
  const currentQuestionIndex = useRoomStore(
    (state) => state.currentQuestionIndex
  );
  const totalQuestions = useRoomStore((state) => state.totalQuestions);
  const playerState = useRoomStore((state) => state.playerState);
  const questionTimeLimitMs = useRoomStore(
    (state) => state.questionTimeLimitMs
  );
  const finalLeaderboard = useRoomStore((state) => state.finalLeaderboard);
  const isSocketConnected = useRoomStore((state) => state.isSocketConnected);
  const isJoining = useRoomStore((state) => state.isJoining);
  const isStarting = useRoomStore((state) => state.isStarting);
  const isSubmitting = useRoomStore((state) => state.isSubmitting);
  const isEnding = useRoomStore((state) => state.isEnding);
  const errorMessage = useRoomStore((state) => state.errorMessage);
  const selectedAnswer = useRoomPageStore((state) => state.selectedAnswer);
  const isAnswerLocked = useRoomPageStore((state) => state.isAnswerLocked);
  const notice = useRoomPageStore((state) => state.notice);
  const chooseAnswer = useRoomPageStore((state) => state.chooseAnswer);
  const submitCurrentAnswer = useRoomPageStore(
    (state) => state.submitCurrentAnswer
  );
  const resetForNextQuestion = useRoomPageStore(
    (state) => state.resetForNextQuestion
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

  const handleExpire = async () => {
    if (!currentQuestion || isAnswerLocked || isSubmitting) return;
    try {
      await submitCurrentAnswer(questionTimeLimitMs);
      toast.error('Time up. Unanswered submission sent.');
    } catch {
      toast.error('Could not auto-submit your answer.');
    }
  };

  const { timeLeftMs } = useCountdown({
    durationMs: questionTimeLimitMs,
    isActive:
      gameStatus === 'active' && Boolean(currentQuestion) && !isAnswerLocked,
    resetKey: `${currentQuestion?.id ?? 'room-idle'}-${currentQuestionIndex}`,
    onExpire: handleExpire,
  });

  const handleSubmitAnswer = async () => {
    try {
      await submitCurrentAnswer(questionTimeLimitMs - timeLeftMs);
    } catch {
      toast.error('Failed to submit answer.');
    }
  };

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
        {/* Header */}
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
            <AlertTriangle size={18} />
            Reconnecting to room socket...
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-[1.3fr_1fr] gap-4 max-[960px]:grid-cols-1">
          {/* Left panel */}
          <Card accent="yellow">
            {gameStatus === 'waiting' ? (
              <>
                <h2 className="text-xl font-heading">Waiting Room</h2>
                <p className="text-muted-fg mt-3">
                  Invite players and start when everyone is ready.
                </p>
                <p className="text-muted-fg mt-1">
                  {hasEnoughPlayers
                    ? 'Ready for the host to start the game.'
                    : 'Waiting for at least 1 more player.'}
                </p>
                <div className="mt-5 flex gap-2.5 flex-wrap max-[960px]:flex-col">
                  {isHost ? (
                    <Button
                      loading={isStarting}
                      disabled={!canStartGame}
                      onClick={() => roomPageService.startGame()}
                    >
                      Start Game
                    </Button>
                  ) : (
                    <p className="text-muted-fg">
                      Host will start the game soon.
                    </p>
                  )}
                  <Button variant="ghost" onClick={() => navigate('/home')}>
                    Leave
                  </Button>
                </div>
              </>
            ) : null}

            {gameStatus === 'active' && currentQuestion ? (
              <>
                <div className="flex justify-between items-center gap-2.5">
                  <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
                    Question {currentQuestionIndex + 1}
                  </p>
                  <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground px-3 py-1.5 font-bold bg-tertiary">
                    {formatSeconds(timeLeftMs)}s
                  </p>
                </div>
                <p className="text-muted-fg mt-1">
                  {Math.min(currentQuestionIndex + 1, totalQuestions)} /{' '}
                  {Math.max(1, totalQuestions)}
                </p>
                <h2 className="mt-2 text-[clamp(1.2rem,2.4vw,1.7rem)] font-heading">
                  {currentQuestion.question_text}
                </h2>
                <div
                  className="mt-4 grid gap-2.5"
                  role="radiogroup"
                  aria-label="Room question options"
                >
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={[
                        'border-2 border-foreground rounded-md bg-white text-foreground',
                        'px-3.5 py-3.5 text-left font-semibold font-[inherit] cursor-pointer',
                        'transition-all duration-180 ease-linear',
                        selectedAnswer === option
                          ? 'bg-[color-mix(in_srgb,var(--color-accent)_20%,white)] shadow-[4px_4px_0_0_color-mix(in_srgb,var(--color-accent)_75%,#0f172a)]'
                          : 'hover:not-disabled:bg-[color-mix(in_srgb,var(--color-secondary)_20%,white)]',
                        isAnswerLocked ? 'opacity-85' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => chooseAnswer(option)}
                      disabled={isAnswerLocked}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <FormMessage
                  message={notice || errorMessage}
                  tone={errorMessage ? 'error' : 'success'}
                />
                <div className="mt-5 flex gap-2.5 flex-wrap max-[960px]:flex-col">
                  <Button
                    loading={isSubmitting}
                    onClick={handleSubmitAnswer}
                    disabled={
                      isAnswerLocked || (!selectedAnswer && timeLeftMs > 0)
                    }
                  >
                    Submit Answer
                  </Button>
                  {isHost ? (
                    <Button
                      variant="ghost"
                      loading={isEnding}
                      onClick={() => roomPageService.endGame()}
                    >
                      End Game
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}

            {gameStatus === 'active' && !currentQuestion ? (
              <>
                <h2 className="text-xl font-heading">Race in progress</h2>
                <p className="text-muted-fg mt-2">
                  {playerState?.finished
                    ? 'You completed all questions. Waiting for final results...'
                    : 'Waiting for your next question state to sync...'}
                </p>
              </>
            ) : null}
          </Card>

          {/* Right panel */}
          <div className="grid gap-3.5">
            <Card accent="pink">
              <h2 className="flex items-center gap-2 text-xl font-heading">
                <Users size={18} /> Players
              </h2>
              <ul className="mt-3 p-0 list-none grid gap-2">
                {players.map((player) => (
                  <li
                    key={player.user_id}
                    className="border-2 border-border rounded-md p-2.5 bg-muted flex justify-between items-center"
                  >
                    <Link
                      to={getProfilePath(player.user_id, player.username)}
                      className="no-underline font-semibold hover:underline"
                    >
                      {player.username}
                    </Link>
                    {player.user_id === room?.host_id ? (
                      <Crown size={14} />
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
            <Card accent="violet">
              <h2 className="text-xl font-heading">Live Leaderboard</h2>
              <ol className="mt-3.5 p-0 list-none grid gap-2">
                {leaderboard.map((item) => (
                  <li
                    key={item.user_id}
                    className="flex justify-between items-center border-2 border-border rounded-md px-3 py-2.5 bg-[color-mix(in_srgb,var(--color-muted)_80%,transparent)]"
                  >
                    <span>
                      #{item.rank}{' '}
                      <Link
                        to={getProfilePath(item.user_id, item.username)}
                        className="font-bold no-underline hover:underline"
                      >
                        {item.username}
                      </Link>
                    </span>
                    <strong className="text-accent">
                      {item.score}
                    </strong>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </Card>
    </section>
  );
}
