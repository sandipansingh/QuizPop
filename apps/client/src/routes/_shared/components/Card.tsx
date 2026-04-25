import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  accent?: 'violet' | 'mint' | 'pink' | 'yellow';
  style?: CSSProperties;
}

const accentShadow: Record<string, string> = {
  violet: 'shadow-sticker-violet',
  pink: 'shadow-sticker-pink',
  yellow: 'shadow-sticker-yellow',
  mint: 'shadow-sticker-mint',
};

export function Card({
  children,
  className = '',
  accent = 'violet',
  style,
}: CardProps) {
  return (
    <article
      style={style}
      className={[
        'relative bg-card border-2 border-foreground rounded-lg p-6',
        'transition-transform duration-300 ease-bounce hover:-rotate-1 hover:scale-101',
        accentShadow[accent],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </article>
  );
}
