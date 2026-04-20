export function RouteSpinner({ label = 'Loading route...' }) {
  return (
    <div className="route-spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
