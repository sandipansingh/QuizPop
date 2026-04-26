import { useRoomStore } from '../../../app/store/room.store';
import { formatSeconds } from '../../../shared/utils/formatters';
import { Button } from '../../_shared/components/Button';
import { FormMessage } from '../../_shared/components/FormMessage';
import { roomPageService } from '../service';
import { useRoomPageStore } from '../store';

interface Props {
  isHost: boolean;
  timeLeftMs: number;
  isSubmitting: boolean;
  isEnding: boolean;
  errorMessage: string | null;
  onSubmit: () => void;
}

export function RoomActiveQuestion({
  isHost,
  timeLeftMs,
  isSubmitting,
  isEnding,
  errorMessage,
  onSubmit,
}: Props) {
  const currentQuestion = useRoomStore((state) => state.currentQuestion);
  const currentQuestionIndex = useRoomStore(
    (state) => state.currentQuestionIndex
  );
  const totalQuestions = useRoomStore((state) => state.totalQuestions);
  const selectedAnswer = useRoomPageStore((state) => state.selectedAnswer);
  const isAnswerLocked = useRoomPageStore((state) => state.isAnswerLocked);
  const notice = useRoomPageStore((state) => state.notice);
  const chooseAnswer = useRoomPageStore((state) => state.chooseAnswer);

  if (!currentQuestion) return null;

  return (
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
              'border-2 border-foreground rounded-md bg-white text-foreground px-3.5 py-3.5 text-left font-semibold font-[inherit] cursor-pointer transition-all duration-180 ease-linear',
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
          onClick={onSubmit}
          disabled={isAnswerLocked || (!selectedAnswer && timeLeftMs > 0)}
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
  );
}
