import { AlertTriangle, Copy, Crown, Signal, Users } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store.js';
import { useRoomStore } from '../../app/store/room.store.js';
import { useCountdown } from '../../shared/hooks/useCountdown.js';
import { usePageMeta } from '../../shared/hooks/usePageMeta.js';
import { formatSeconds } from '../../shared/utils/formatters.js';
import { createProfilePathBuilder } from '../../shared/utils/path.utils.js';
import { Button } from '../_shared/components/Button.jsx';
import { Card } from '../_shared/components/Card.jsx';
import { FormMessage } from '../_shared/components/FormMessage.jsx';
import { RouteSpinner } from '../_shared/components/RouteSpinner.jsx';
import { roomPageService } from './service.js';
import { useRoomPageStore } from './store.js';

export default function RoomPage() {
  const navigate = useNavigate();
  const { id: roomIdFromRoute } = useParams();
  const currentUser = useAuthStore((state) => state.user);

  usePageMeta({
    title: `Room ${roomIdFromRoute || ''}`.trim(),
    description:
      'Join a live QuizPop room to play real-time quiz rounds with friends and watch the leaderboard update instantly.',
  });

  const room = useRoomStore((state) => state.room);
  const roomId = useRoomStore((state) => state.roomId) || roomIdFromRoute;
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
        await roomPageService.connectAndJoin(roomIdFromRoute);
      } catch (joinError) {
        if (cancelled) {
          return;
        }

        toast.error(joinError.message || 'Unable to join room.');
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
    if (gameStatus !== 'ended' || !finalLeaderboard) {
      return;
    }

    navigate('/result', {
      replace: true,
      state: {
        mode: 'room',
        roomId,
        leaderboard: finalLeaderboard,
      },
    });
  }, [finalLeaderboard, gameStatus, navigate, roomId]);

  const handleExpire = async () => {
    if (!currentQuestion || isAnswerLocked || isSubmitting) {
      return;
    }

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
    resetKey: `${currentQuestion?.id || 'room-idle'}-${currentQuestionIndex}`,
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
    if (!roomId) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomId);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = roomId;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      toast.success('Room ID copied.');
    } catch {
      toast.error('Could not copy room ID.');
    }
  };

  if (isJoining && !players.length) {
    return <RouteSpinner label="Joining room..." />;
  }

  return (
    <section className="room-page">
      <Card className="room-page__panel" accent="mint">
        <div className="room-page__header">
          <div>
            <button
              type="button"
              className="room-id-copy"
              onClick={handleCopyRoomId}
              disabled={!roomId}
              title="Click to copy room ID"
              aria-label={
                roomId ? `Copy room ID ${roomId}` : 'No room ID to copy'
              }
            >
              <span>{roomId || 'Unavailable'}</span>
              <Copy size={16} />
            </button>
          </div>
          <div className="room-status">
            <span
              className={`status-dot ${isSocketConnected ? 'status-dot--on' : 'status-dot--off'}`}
            />
            <Signal size={16} />
            {isSocketConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {!isSocketConnected ? (
          <div className="offline-banner">
            <AlertTriangle size={18} />
            Reconnecting to room socket...
          </div>
        ) : null}

        <div className="room-grid">
          <Card accent="yellow" className="room-grid__left">
            {gameStatus === 'waiting' ? (
              <>
                <h2>Waiting Room</h2>
                <p className="lede">
                  Invite players and start when everyone is ready.
                </p>
                <p className="muted">
                  {hasEnoughPlayers
                    ? 'Ready for the host to start the game.'
                    : 'Waiting for at least 1 more player.'}
                </p>
                <div className="room-actions">
                  {isHost ? (
                    <Button
                      loading={isStarting}
                      disabled={!canStartGame}
                      onClick={() => roomPageService.startGame()}
                    >
                      Start Game
                    </Button>
                  ) : (
                    <p className="muted">Host will start the game soon.</p>
                  )}
                  <Button variant="ghost" onClick={() => navigate('/home')}>
                    Leave
                  </Button>
                </div>
              </>
            ) : null}

            {gameStatus === 'active' && currentQuestion ? (
              <>
                <div className="quiz-card__header">
                  <p className="eyebrow">Question {currentQuestionIndex + 1}</p>
                  <p className="timer-pill">{formatSeconds(timeLeftMs)}s</p>
                </div>
                <p className="muted">
                  {Math.min(currentQuestionIndex + 1, totalQuestions)} /{' '}
                  {Math.max(1, totalQuestions)}
                </p>
                <h2>{currentQuestion.question_text}</h2>
                <div
                  className="option-grid"
                  role="radiogroup"
                  aria-label="Room question options"
                >
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`option-tile ${
                        selectedAnswer === option ? 'option-tile--selected' : ''
                      } ${isAnswerLocked ? 'option-tile--locked' : ''}`}
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

                <div className="room-actions">
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
                <h2>Race in progress</h2>
                {playerState?.finished ? (
                  <p className="muted">
                    You completed all questions. Waiting for final results...
                  </p>
                ) : (
                  <p className="muted">
                    Waiting for your next question state to sync...
                  </p>
                )}
              </>
            ) : null}
          </Card>

          <div className="room-grid__right">
            <Card accent="pink">
              <h2>
                <Users size={18} /> Players
              </h2>
              <ul className="player-list">
                {players.map((player) => (
                  <li key={player.user_id}>
                    <Link to={getProfilePath(player.user_id, player.username)}>
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
              <h2>Live Leaderboard</h2>
              <ol className="leaderboard-mini leaderboard-mini--room">
                {leaderboard.map((item) => (
                  <li key={item.user_id}>
                    <span>
                      #{item.rank}{' '}
                      <Link to={getProfilePath(item.user_id, item.username)}>
                        {item.username}
                      </Link>
                    </span>
                    <strong>{item.score}</strong>
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
