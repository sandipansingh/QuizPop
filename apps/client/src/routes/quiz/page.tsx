import { Timer } from 'lucide-react';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { formatSeconds } from '../../shared/utils/formatters';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { RouteSpinner } from '../_shared/components/RouteSpinner';
import { quizPageService } from './service';
import { QuizQuestion } from './components/QuizQuestion';
import { useQuizPage } from './hooks/useQuizPage';

export default function QuizPage() {
  usePageMeta({
    title: 'Solo Quiz',
    description:
      'Play QuizPop solo mode with timed questions, instant feedback, and score-based progression.',
  });

  const {
    questions,
    currentQuestion,
    currentQuestionIndex,
    isLastQuestion,
    isLoadingQuestions,
    isSubmittingQuiz,
    errorMessage,
    selectedAnswer,
    isLocked,
    notice,
    chooseAnswer,
    timeLeftMs,
    lockCurrentAnswer,
    submitQuiz,
    resetForNextQuestion,
    DEFAULT_QUESTION_LIMIT,
  } = useQuizPage();

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

        {currentQuestion ? (
          <QuizQuestion
            options={currentQuestion.options}
            selectedAnswer={selectedAnswer}
            isLocked={isLocked}
            onChoose={chooseAnswer}
          />
        ) : null}

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
            <Button
              variant="secondary"
              onClick={() => {
                quizPageService.nextQuestion();
                resetForNextQuestion();
              }}
            >
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
