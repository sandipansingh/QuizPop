import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary:
    'bg-accent text-white shadow-pop hover:not-disabled:translate-[-2px_-2px] hover:not-disabled:shadow-pop-hover active:not-disabled:translate-[2px_2px] active:not-disabled:shadow-pop-active',
  secondary: 'bg-transparent text-foreground hover:bg-tertiary',
  ghost: 'bg-muted text-foreground shadow-none hover:bg-quaternary',
};

const sizeClasses: Record<string, string> = {
  sm: 'min-h-10 px-3.5 py-2 text-sm',
  md: 'min-h-12 px-[18px] py-2.5',
  lg: 'min-h-14 px-6 py-3 text-lg',
};

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'border-2 border-foreground rounded-full font-bold font-body text-[0.95rem]',
        'cursor-pointer inline-flex items-center justify-center gap-2',
        'transition-[transform,box-shadow,background] duration-180 ease-bounce',
        'disabled:opacity-70 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <span
          className="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin-slow"
          aria-hidden="true"
        />
      ) : null}
      {!loading && icon ? (
        <span className="flex items-center">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
