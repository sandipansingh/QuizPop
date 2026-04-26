import { CircleCheckBig } from 'lucide-react';

interface Props {
  options: string[];
  selectedAnswer: string | null;
  isLocked: boolean;
  onChoose: (option: string) => void;
}

export function QuizQuestion({
  options,
  selectedAnswer,
  isLocked,
  onChoose,
}: Props) {
  return (
    <div
      className="mt-4 grid gap-2.5"
      role="radiogroup"
      aria-label="Question options"
    >
      {options.map((option) => (
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
          onClick={() => onChoose(option)}
          disabled={isLocked}
        >
          <span>{option}</span>
          {selectedAnswer === option ? <CircleCheckBig size={18} /> : null}
        </button>
      ))}
    </div>
  );
}
