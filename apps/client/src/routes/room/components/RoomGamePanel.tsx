import { useRoomStore } from '../../../app/store/room.store';
import { useCountdown } from '../../../shared/hooks/useCountdown';
import { Button } from '../../_shared/components/Button';
import { Card } from '../../_shared/components/Card';
import { roomPageService } from '../service';
import { useRoomPageStore } from '../store';
import { RoomActiveQuestion } from './RoomActiveQuestion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Props {
  isHost: boolean;
  hasEnoughPlayers: boolean;
  canStartGame: boolean;
}

export function RoomGamePanel({
  isHost,
  hasEnoughPlayers,
  canStartGame,
}: Props) {
  const navigate = useNavigate();
  const gameStatus = useRoomStore((state) => state.gameStatus);
  const currentQuestion = useRoomStore((state) => state.currentQuestion);
  const currentQuestionIndex = useRoomStore(
    (state) => state.currentQuestionIndex
  );
  const playerState = useRoomStore((state) => state.playerState);
  const questionTimeLimitMs = useRoomStore(
    (state) => state.questionTimeLimitMs
  );
  const isStarting = useRoomStore((state) => state.isStarting);
  const isSubmitting = useRoomStore((state) => state.isSubmitting);
  const isEnding = useRoomStore((state) => state.isEnding);
  const errorMessage = useRoomStore((state) => state.errorMessage);
  const isAnswerLocked = useRoomPageStore((state) => state.isAnswerLocked);
  const submitCurrentAnswer = useRoomPageStore(
    (state) => state.submitCurrentAnswer
  );

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

  return (
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
              <p className="text-muted-fg">Host will start the game soon.</p>
            )}
            <Button variant="ghost" onClick={() => navigate('/home')}>
              Leave
            </Button>
          </div>
        </>
      ) : null}

      {gameStatus === 'active' && currentQuestion ? (
        <RoomActiveQuestion
          isHost={isHost}
          timeLeftMs={timeLeftMs}
          isSubmitting={isSubmitting}
          isEnding={isEnding}
          errorMessage={errorMessage}
          onSubmit={handleSubmitAnswer}
        />
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
  );
}
