interface FormMessageProps {
  message?: string | null;
  tone?: 'error' | 'success' | 'info';
}

const toneClasses: Record<string, string> = {
  error: 'bg-rose-100 text-rose-900',
  success: 'bg-green-100 text-green-900',
  info: 'bg-blue-100 text-blue-900',
};

export function FormMessage({ message, tone = 'error' }: FormMessageProps) {
  if (!message) return null;

  return (
    <p
      className={[
        'rounded-md px-3 py-2.5 border-2 border-foreground text-[0.9rem] mt-3',
        toneClasses[tone],
      ].join(' ')}
    >
      {message}
    </p>
  );
}
