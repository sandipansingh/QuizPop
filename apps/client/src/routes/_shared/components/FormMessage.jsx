export function FormMessage({ message, tone = 'error' }) {
  if (!message) {
    return null;
  }

  return <p className={`form-message form-message--${tone}`}>{message}</p>;
}
