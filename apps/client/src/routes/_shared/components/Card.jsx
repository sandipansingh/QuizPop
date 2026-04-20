export function Card({ children, className = '', accent = 'violet' }) {
  const classes = ['sticker-card', `sticker-card--${accent}`, className]
    .filter(Boolean)
    .join(' ');

  return <article className={classes}>{children}</article>;
}
