import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { InputField } from '../_shared/components/InputField';
import {
  registerSchema,
  type RegisterFormData,
} from '../../shared/validation/auth.schemas';
import { authService } from '../../shared/services/auth.service';
import { getGeneralErrorMessage } from '../../shared/utils/error-mapper';
import type { ApiError } from '../../shared/api/response';

export default function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  usePageMeta({
    title: 'Create Account',
    description:
      'Create your QuizPop account to start playing timed quizzes, build your profile, and climb the rankings.',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      bio: '',
    },
  });

  if (isAuthenticated) return <Navigate to="/home" replace />;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...payload } = data;
      await authService.register({
        ...payload,
        bio: payload.bio || undefined,
      });
      toast.success('Account created. You are now signed in.');
      navigate('/home', { replace: true });
    } catch (err) {
      const apiError = err as ApiError;
      setError('root', {
        message: getGeneralErrorMessage(apiError),
      });
      toast.error('Could not create account.');
    }
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
        <form
          className="mt-4 grid gap-3.5"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <InputField
            id="register-username"
            label="Username"
            autoComplete="username"
            error={errors.username?.message}
            placeholder="quiz_hero"
            {...register('username')}
          />
          <InputField
            id="register-email"
            type="email"
            label="Email"
            autoComplete="email"
            error={errors.email?.message}
            placeholder="you@example.com"
            {...register('email')}
          />
          <InputField
            id="register-password"
            type="password"
            label="Password"
            autoComplete="new-password"
            error={errors.password?.message}
            placeholder="At least 8 characters"
            {...register('password')}
          />
          <InputField
            id="register-confirm-password"
            type="password"
            label="Confirm Password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            placeholder="Repeat your password"
            {...register('confirmPassword')}
          />
          <InputField
            id="register-bio"
            label="Bio (Optional)"
            maxLength={280}
            error={errors.bio?.message}
            hint="Share your trivia superpower in one line."
            placeholder="Pop culture speedrunner"
            {...register('bio')}
          />
          <FormMessage message={errors.root?.message} tone="error" />
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
