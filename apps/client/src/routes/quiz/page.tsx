import { CircleCheckBig, Timer } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../../app/store/quiz.store';
import { clientEnv } from '../../shared/config/env';
import { useCountdown } from '../../shared/hooks/useCountdown';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { formatSeconds } from '../../shared/utils/formatters';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { RouteSpinner } from '../_shared/components/RouteSpinner';
import { quizPageService } from './service';
import { useQuizPageStore } from './store';

const QUESTION_TIME_LIMIT_MS = clientEnv.quizQuestionTimeLimitMs;
const DEFAULT_QUESTION_LIMIT = clientEnv.defaultQuestionLimit;

export default function QuizPage() {
  const navigate = useNavigate();
  const hasInitializedRef = useRef(false);

  usePageMeta({
    title: 'Solo Quiz',
    description:
      'Play QuizPop solo mode with timed questions, instant feedback, and score-based progression.',
  });

  const questions = useQuizStore((state) => state.questions);
  const currentQuestionIndex = useQuizStore(
    (state) => state.currentQuestionIndex
  );
  const isLoadingQuestions = useQuizStore((state) => state.isLoadingQuestions);
  const isSubmittingQuiz = useQuizStore((state) => state.isSubmittingQuiz);
  const errorMessage = useQuizStore((state) => state.errorMessage);
  const selectedAnswer = useQuizPageStore((state) => state.selectedAnswer);
  const isLocked = useQuizPageStore((state) => state.isLocked);
  const notice = useQuizPageStore((state) => state.notice);
  const chooseAnswer = useQuizPageStore((state) => state.chooseAnswer);
  const lockAnswer = useQuizPageStore((state) => state.lockAnswer);
  const resetForNextQuestion = useQuizPageStore(
    (state) => state.resetForNextQuestion
  );

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    quizPageService.resetQuiz();
    resetForNextQuestion();
    void quizPageService.loadQuestions({
      limit: DEFAULT_QUESTION_LIMIT,
      difficulty: undefined,
    });
  }, [resetForNextQuestion]);

  const handleAutoExpire = useCallback(() => {
    if (!currentQuestion || isLocked) return;
    lockAnswer({ timeTakenMs: QUESTION_TIME_LIMIT_MS });
    toast.error('Time is up for this question.');
  }, [currentQuestion, isLocked, lockAnswer]);

  const { timeLeftMs } = useCountdown({
    durationMs: QUESTION_TIME_LIMIT_MS,
    isActive: Boolean(currentQuestion) && !isLocked,
    resetKey: currentQuestion?.id ?? 'quiz-empty',
    onExpire: handleAutoExpire,
  });

  const lockCurrentAnswer = () => {
    if (isLocked) return;
    lockAnswer({ timeTakenMs: QUESTION_TIME_LIMIT_MS - timeLeftMs });
  };

  const goToNext = () => {
    quizPageService.nextQuestion();
    resetForNextQuestion();
  };

  const submitQuiz = async () => {
    if (!isLocked) lockCurrentAnswer();
    try {
      const result = await quizPageService.submitQuiz();
      toast.success('Quiz submitted successfully.');
      navigate('/result', { state: { mode: 'solo', soloResult: result } });
    } catch {
      toast.error('Quiz submission failed.');
    }
  };

  if (isLoadingQuestions && !questions.length)
    return <RouteSpinner label="Preparing your quiz deck..." />;

  if (!isLoadingQuestions && !questions.length) {
    return (
      <section className="grid place-items-center">
        <Card>
          <h1>No Questions Available</h1>
          <p className="text-muted-fg mt-3">
            Try again in a moment or change your filters.
          </p>
          <div className="mt-5">
            <Button
              onClick={() =>
                quizPageService.loadQuestions({ limit: DEFAULT_QUESTION_LIMIT })
              }
            >
              Retry
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  const progressPct =
    ((currentQuestionIndex + 1) / Math.max(1, questions.length)) * 100;

  return (
    <section className="grid place-items-center">
      <Card className="w-[min(980px,100%)]" accent="violet">
        <div className="flex justify-between items-center gap-2.5">
          <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
            Solo Quiz Mode
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground px-3 py-1.5 font-bold bg-tertiary">
            <Timer size={16} /> {formatSeconds(timeLeftMs)}s
          </p>
        </div>

        <div className="mt-4 h-3 rounded-full border-2 border-foreground bg-muted overflow-hidden">
          <div
            className="h-full rounded-[inherit] quiz-progress-bar transition-[width] duration-300 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="text-muted-fg mt-2">
          Question {currentQuestionIndex + 1} / {questions.length}
        </p>
        <h1 className="mt-2 text-[clamp(1.4rem,2.8vw,2rem)]">
          {currentQuestion?.question_text}
        </h1>

        <div
          className="mt-4 grid gap-2.5"
          role="radiogroup"
          aria-label="Question options"
        >
          {currentQuestion?.options.map((option) => (
            <button
              key={option}
              type="button"
              className={[
                'border-2 border-foreground rounded-md bg-white text-foreground',
                'px-3.5 py-3.5 text-left font-semibold font-[inherit] flex items-center justify-between cursor-pointer',
                'transition-all duration-180 ease-linear',
                selectedAnswer === option
                  ? 'bg-[color-mix(in_srgb,var(--color-accent)_20%,white)] shadow-[4px_4px_0_0_color-mix(in_srgb,var(--color-accent)_75%,#0f172a)]'
                  : 'hover:not-disabled:bg-[color-mix(in_srgb,var(--color-secondary)_20%,white)]',
                isLocked ? 'opacity-85' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => chooseAnswer(option)}
              disabled={isLocked}
            >
              <span>{option}</span>
              {selectedAnswer === option ? <CircleCheckBig size={18} /> : null}
            </button>
          ))}
        </div>

        <FormMessage
          message={notice || errorMessage}
          tone={errorMessage ? 'error' : 'success'}
        />

        <div className="mt-5 flex gap-2.5 flex-wrap max-[960px]:flex-col">
          {!isLocked ? (
            <Button
              onClick={lockCurrentAnswer}
              disabled={!selectedAnswer && timeLeftMs > 0}
            >
              Lock Answer
            </Button>
          ) : null}
          {isLocked && !isLastQuestion ? (
            <Button variant="secondary" onClick={goToNext}>
              Next Question
            </Button>
          ) : null}
          {isLocked && isLastQuestion ? (
            <Button loading={isSubmittingQuiz} onClick={submitQuiz}>
              Submit Quiz
            </Button>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
