import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField(
    { id, label, error, hint, className = '', ...rest },
    ref
  ) {
    return (
      <div
        className={['flex flex-col gap-1.5', className]
          .filter(Boolean)
          .join(' ')}
      >
        <label
          htmlFor={id}
          className="text-[0.72rem] uppercase tracking-[0.14em] font-bold text-muted-fg"
        >
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          className={[
            'w-full rounded-md border-2 px-3.5 py-3 min-h-12',
            'font-[inherit] text-[0.95rem] text-foreground bg-white',
            'transition-[border-color,box-shadow] duration-180 ease-linear',
            'focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-[4px_4px_0_0_var(--color-ring)]',
            error
              ? 'border-rose-500'
              : 'border-[color-mix(in_srgb,var(--color-border)_88%,#94a3b8)]',
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
        {error ? (
          <p className="text-[0.82rem] text-rose-700">{error}</p>
        ) : hint ? (
          <p className="text-[0.82rem] text-muted-fg">{hint}</p>
        ) : null}
      </div>
    );
  }
);
