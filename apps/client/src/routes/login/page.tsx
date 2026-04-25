import toast from 'react-hot-toast';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { InputField } from '../_shared/components/InputField';
import { submitAuthForm } from '../_shared/utils/submitAuthForm';
import { useLoginPageStore } from './store';

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

  if (isAuthenticated) return <Navigate to="/home" replace />;

  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/home';

  const handleSubmit = async (event: React.FormEvent) => {
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
    <section className="grid place-items-center">
      <div
        aria-hidden="true"
        className="absolute w-[220px] h-[220px] rounded-full border-2 border-dashed border-foreground -z-10"
        style={{
          background:
            'repeating-linear-gradient(-45deg, color-mix(in srgb, var(--color-secondary) 45%, transparent) 0, color-mix(in srgb, var(--color-secondary) 45%, transparent) 8px, transparent 8px, transparent 16px)',
          left: 'max(0px, calc(50% - 450px))',
          top: '180px',
        }}
      />
      <Card className="w-[min(620px,100%)]" accent="pink">
        <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
          QuizPop
        </p>
        <h1 className="mt-2.5 text-[clamp(1.9rem,4.2vw,3rem)]">
          Sign In And Jump Into The Next Round
        </h1>
        <p className="text-muted-fg mt-3">
          Real-time rooms, live rankings, and smooth solo practice sessions.
        </p>
        <form className="mt-4 grid gap-3.5" onSubmit={handleSubmit} noValidate>
          <InputField
            id="login-email"
            type="email"
            autoComplete="email"
            label="Email"
            value={email}
            error={errors.email}
            placeholder="you@example.com"
            onChange={(e) => setField('email', e.target.value)}
          />
          <InputField
            id="login-password"
            type="password"
            autoComplete="current-password"
            label="Password"
            value={password}
            error={errors.password}
            placeholder="At least 8 characters"
            onChange={(e) => setField('password', e.target.value)}
          />
          <FormMessage message={errorMessage} tone="error" />
          <Button type="submit" loading={isSubmitting}>
            Sign In
          </Button>
        </form>
        <p className="mt-[18px] text-muted-fg">
          New to QuizPop?{' '}
          <Link to="/register" className="font-bold text-accent">
            Create your account
          </Link>
        </p>
      </Card>
    </section>
  );
}
