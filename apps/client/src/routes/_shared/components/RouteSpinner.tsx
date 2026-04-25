interface RouteSpinnerProps {
  label?: string;
}

export function RouteSpinner({
  label = 'Loading route...',
}: RouteSpinnerProps) {
  return (
    <div
      className="grid place-items-center min-h-[60vh] gap-3"
      role="status"
      aria-live="polite"
    >
      <span
        className="w-8 h-8 border-4 border-foreground border-r-transparent rounded-full animate-spin-fast"
        aria-hidden="true"
      />
      <p className="text-muted-fg">{label}</p>
    </div>
  );
}
