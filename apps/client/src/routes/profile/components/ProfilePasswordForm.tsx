import { Button } from '../../_shared/components/Button';
import { FormMessage } from '../../_shared/components/FormMessage';
import { InputField } from '../../_shared/components/InputField';
import { userService } from '../../../shared/services/user.service';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Props {
  onBack: () => void;
}

const DEFAULT_FORM: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function ProfilePasswordForm({ onBack }: Props) {
  const [form, setForm] = useState<PasswordForm>(DEFAULT_FORM);
  const [errorMessage, setErrorMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const onFieldChange =
    (field: keyof PasswordForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((c) => ({ ...c, [field]: e.target.value }));
      setErrorMessage('');
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setErrorMessage('New password and confirmation must match.');
      return;
    }
    setIsChangingPassword(true);
    setErrorMessage('');
    try {
      await userService.changePassword({
        current_password: form.currentPassword,
        new_password: form.newPassword,
      });
      setForm(DEFAULT_FORM);
      toast.success('Password changed successfully.');
    } catch (err) {
      setErrorMessage(
        (err as { message?: string }).message ?? 'Could not change password.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-heading">Change Password</h2>
      <form className="mt-2.5 grid gap-3" onSubmit={handleSubmit}>
        <InputField
          id="current-password"
          type="password"
          label="Current Password"
          value={form.currentPassword}
          onChange={onFieldChange('currentPassword')}
          autoComplete="current-password"
        />
        <InputField
          id="new-password"
          type="password"
          label="New Password"
          value={form.newPassword}
          onChange={onFieldChange('newPassword')}
          autoComplete="new-password"
        />
        <InputField
          id="confirm-password"
          type="password"
          label="Confirm New Password"
          value={form.confirmPassword}
          onChange={onFieldChange('confirmPassword')}
          autoComplete="new-password"
        />
        <FormMessage message={errorMessage} tone="error" />
        <Button type="submit" loading={isChangingPassword}>
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
