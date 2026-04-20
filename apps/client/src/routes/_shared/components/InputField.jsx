export function InputField({
  id,
  label,
  error,
  hint,
  className = '',
  ...rest
}) {
  const classes = ['input-field', error ? 'input-field--error' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <label htmlFor={id} className="input-field__label">
        {label}
      </label>
      <input id={id} className="input-field__control" {...rest} />
      {error ? <p className="input-field__error">{error}</p> : null}
      {!error && hint ? <p className="input-field__hint">{hint}</p> : null}
    </div>
  );
}
