import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { InputField } from '../_shared/components/InputField';
import { submitAuthForm } from '../_shared/utils/submitAuthForm';
import { useRegisterPageStore } from './store';

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

  if (isAuthenticated) return <Navigate to="/home" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
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
    <section className="grid place-items-center">
      <div
        aria-hidden="true"
        className="absolute w-[220px] h-[220px] rounded-full border-2 border-dashed border-foreground -z-10"
        style={{
          background:
            'repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-quaternary) 45%, transparent) 0, color-mix(in srgb, var(--color-quaternary) 45%, transparent) 8px, transparent 8px, transparent 16px)',
          right: 'max(0px, calc(50% - 450px))',
          top: '180px',
        }}
      />
      <Card className="w-[min(620px,100%)]" accent="yellow">
        <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
          Create Account
        </p>
        <h1 className="mt-2.5 text-[clamp(1.9rem,4.2vw,3rem)]">
          Build Your Quiz Identity
        </h1>
        <p className="text-muted-fg mt-3">
          Start climbing live leaderboards with your own profile and streak
          stats.
        </p>
        <form className="mt-4 grid gap-3.5" onSubmit={handleSubmit} noValidate>
          <InputField
            id="register-username"
            label="Username"
            autoComplete="username"
            value={username}
            error={errors.username}
            placeholder="quiz_hero"
            onChange={(e) => setField('username', e.target.value)}
          />
          <InputField
            id="register-email"
            type="email"
            label="Email"
            autoComplete="email"
            value={email}
            error={errors.email}
            placeholder="you@example.com"
            onChange={(e) => setField('email', e.target.value)}
          />
          <InputField
            id="register-password"
            type="password"
            label="Password"
            autoComplete="new-password"
            value={password}
            error={errors.password}
            placeholder="At least 8 characters"
            onChange={(e) => setField('password', e.target.value)}
          />
          <InputField
            id="register-confirm-password"
            type="password"
            label="Confirm Password"
            autoComplete="new-password"
            value={confirmPassword}
            error={errors.confirmPassword}
            placeholder="Repeat your password"
            onChange={(e) => setField('confirmPassword', e.target.value)}
          />
          <InputField
            id="register-bio"
            label="Bio (Optional)"
            maxLength={280}
            value={bio}
            hint="Share your trivia superpower in one line."
            placeholder="Pop culture speedrunner"
            onChange={(e) => setField('bio', e.target.value)}
          />
          <FormMessage message={errorMessage} tone="error" />
          <Button type="submit" loading={isSubmitting}>
            Create Account
          </Button>
        </form>
        <p className="mt-[18px] text-muted-fg">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-accent">
            Sign in here
          </Link>
        </p>
      </Card>
    </section>
  );
}
