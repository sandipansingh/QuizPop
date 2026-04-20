import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store.js';
import { usePageMeta } from '../../shared/hooks/usePageMeta.js';
import { Button } from '../_shared/components/Button.jsx';
import { Card } from '../_shared/components/Card.jsx';
import { FormMessage } from '../_shared/components/FormMessage.jsx';
import { InputField } from '../_shared/components/InputField.jsx';
import { submitAuthForm } from '../_shared/utils/submitAuthForm.js';
import { useRegisterPageStore } from './store.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  usePageMeta({
    title: 'Create Account',
    description:
      'Create your QuizPop account to start playing timed quizzes, build your profile, and climb the rankings.',
  });

  const username = useRegisterPageStore((state) => state.username);
  const email = useRegisterPageStore((state) => state.email);
  const password = useRegisterPageStore((state) => state.password);
  const confirmPassword = useRegisterPageStore(
    (state) => state.confirmPassword
  );
  const bio = useRegisterPageStore((state) => state.bio);
  const errors = useRegisterPageStore((state) => state.errors);
  const errorMessage = useRegisterPageStore((state) => state.errorMessage);
  const isSubmitting = useRegisterPageStore((state) => state.isSubmitting);
  const setField = useRegisterPageStore((state) => state.setField);
  const submit = useRegisterPageStore((state) => state.submit);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (event) => {
    await submitAuthForm({
      event,
      submit,
      onSuccess: () => {
        toast.success('Account created. You are now signed in.');
        navigate('/home', { replace: true });
      },
      onFailure: () => {
        toast.error('Could not create account.');
      },
    });
  };

  return (
    <section className="auth-page auth-page--register">
      <div
        className="auth-page__decor auth-page__decor--right"
        aria-hidden="true"
      />
      <Card className="auth-card" accent="yellow">
        <p className="eyebrow">Create Account</p>
        <h1>Build Your Quiz Identity</h1>
        <p className="lede">
          Start climbing live leaderboards with your own profile and streak
          stats.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <InputField
            id="register-username"
            label="Username"
            autoComplete="username"
            value={username}
            error={errors.username}
            placeholder="quiz_hero"
            onChange={(event) => setField('username', event.target.value)}
          />
          <InputField
            id="register-email"
            type="email"
            label="Email"
            autoComplete="email"
            value={email}
            error={errors.email}
            placeholder="you@example.com"
            onChange={(event) => setField('email', event.target.value)}
          />
          <InputField
            id="register-password"
            type="password"
            label="Password"
            autoComplete="new-password"
            value={password}
            error={errors.password}
            placeholder="At least 8 characters"
            onChange={(event) => setField('password', event.target.value)}
          />
          <InputField
            id="register-confirm-password"
            type="password"
            label="Confirm Password"
            autoComplete="new-password"
            value={confirmPassword}
            error={errors.confirmPassword}
            placeholder="Repeat your password"
            onChange={(event) =>
              setField('confirmPassword', event.target.value)
            }
          />
          <InputField
            id="register-bio"
            label="Bio (Optional)"
            maxLength={280}
            value={bio}
            hint="Share your trivia superpower in one line."
            placeholder="Pop culture speedrunner"
            onChange={(event) => setField('bio', event.target.value)}
          />
          <FormMessage message={errorMessage} tone="error" />
          <Button type="submit" loading={isSubmitting}>
            Create Account
          </Button>
        </form>
        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </Card>
    </section>
  );
}
