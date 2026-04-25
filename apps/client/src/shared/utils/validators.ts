export const isEmail = (value: unknown): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());

export const isStrongPassword = (value: unknown): boolean =>
  String(value ?? '').trim().length >= 8;

export interface AuthFormInput {
  username?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  mode: 'login' | 'register';
}

export interface AuthFormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const validateAuthForm = ({
  username,
  email,
  password,
  confirmPassword,
  mode,
}: AuthFormInput): AuthFormErrors => {
  const errors: AuthFormErrors = {};

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
