export const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

export const isStrongPassword = (value) =>
  String(value || '').trim().length >= 8;

export const validateAuthForm = ({
  username,
  email,
  password,
  confirmPassword,
  mode,
}) => {
  const errors = {};

  if (mode === 'register' && (!username || username.trim().length < 3)) {
    errors.username = 'Username must be at least 3 characters.';
  }

  if (!isEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!isStrongPassword(password)) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (mode === 'register' && password !== confirmPassword) {
    errors.confirmPassword = 'Password confirmation does not match.';
  }

  return errors;
};
