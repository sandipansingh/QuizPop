import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button } from '../../_shared/components/Button';
import { FormMessage } from '../../_shared/components/FormMessage';
import { InputField } from '../../_shared/components/InputField';
import { userService } from '../../../shared/services/user.service';
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '../../../shared/validation/user.schemas';
import { getGeneralErrorMessage } from '../../../shared/utils/error-mapper';
import type { ApiError } from '../../../shared/api/response';

interface Props {
  onBack: () => void;
}

export function ProfilePasswordForm({ onBack }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await userService.changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      reset();
      toast.success('Password changed successfully.');
    } catch (err) {
      const apiError = err as ApiError;
      setError('root', {
        message: getGeneralErrorMessage(apiError),
      });
      toast.error('Could not change password.');
    }
  };

  return (
    <>
      <h2 className="text-2xl font-heading">Change Password</h2>
      <form className="mt-2.5 grid gap-3" onSubmit={handleSubmit(onSubmit)}>
        <InputField
          id="current-password"
          type="password"
          label="Current Password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <InputField
          id="new-password"
          type="password"
          label="New Password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <InputField
          id="confirm-password"
          type="password"
          label="Confirm New Password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <FormMessage message={errors.root?.message} tone="error" />
        <Button type="submit" loading={isSubmitting}>
          Update Password
        </Button>
        <button
          type="button"
          className="border-0 bg-transparent text-accent font-body font-bold text-[0.92rem] cursor-pointer p-0 w-fit underline underline-offset-[3px] hover:text-[color-mix(in_srgb,var(--color-accent)_80%,#0f172a)]"
          onClick={onBack}
        >
          Back to edit profile
        </button>
      </form>
    </>
  );
}
