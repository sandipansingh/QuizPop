import toast from 'react-hot-toast';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store.js';
import { usePageMeta } from '../../shared/hooks/usePageMeta.js';
import { Button } from '../_shared/components/Button.jsx';
import { Card } from '../_shared/components/Card.jsx';
import { FormMessage } from '../_shared/components/FormMessage.jsx';
import { InputField } from '../_shared/components/InputField.jsx';
import { submitAuthForm } from '../_shared/utils/submitAuthForm.js';
import { useLoginPageStore } from './store.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  usePageMeta({
    title: 'Sign In',
    description:
      'Sign in to QuizPop to continue your streak, enter multiplayer quiz rooms, and track your leaderboard progress.',
  });

  const email = useLoginPageStore((state) => state.email);
  const password = useLoginPageStore((state) => state.password);
  const errors = useLoginPageStore((state) => state.errors);
  const errorMessage = useLoginPageStore((state) => state.errorMessage);
  const isSubmitting = useLoginPageStore((state) => state.isSubmitting);
  const setField = useLoginPageStore((state) => state.setField);
  const submit = useLoginPageStore((state) => state.submit);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const fromPath = location.state?.from?.pathname || '/home';

  const handleSubmit = async (event) => {
    await submitAuthForm({
      event,
      submit,
      onSuccess: () => {
        toast.success('Welcome back. Ready to play?');
        navigate(fromPath, { replace: true });
      },
      onFailure: () => {
        toast.error('Login failed. Check your credentials.');
      },
    });
  };

  return (
    <section className="auth-page">
      <div className="auth-page__decor" aria-hidden="true" />
      <Card className="auth-card" accent="pink">
        <p className="eyebrow">QuizPop</p>
        <h1>Sign In And Jump Into The Next Round</h1>
        <p className="lede">
          Real-time rooms, live rankings, and smooth solo practice sessions.
        </p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <InputField
            id="login-email"
            type="email"
            autoComplete="email"
            label="Email"
            value={email}
            error={errors.email}
            placeholder="you@example.com"
            onChange={(event) => setField('email', event.target.value)}
          />
          <InputField
            id="login-password"
            type="password"
            autoComplete="current-password"
            label="Password"
            value={password}
            error={errors.password}
            placeholder="At least 8 characters"
            onChange={(event) => setField('password', event.target.value)}
          />
          <FormMessage message={errorMessage} tone="error" />
          <Button type="submit" loading={isSubmitting}>
            Sign In
          </Button>
        </form>
        <p className="auth-card__footer">
          New to QuizPop? <Link to="/register">Create your account</Link>
        </p>
      </Card>
    </section>
  );
}
