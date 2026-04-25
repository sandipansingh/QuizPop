import { create } from 'zustand';
import { registerPageService } from './service';
import { validateAuthForm } from '../../shared/utils/validators';
import { createAuthPageStore } from '../_shared/utils/createAuthPageStore';
import type {
  AuthPageActions,
  AuthPageBaseState,
} from '../_shared/utils/createAuthPageStore';

interface RegisterPageState extends AuthPageBaseState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  bio: string;
}

const initialState: RegisterPageState = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  bio: '',
  errors: {},
  errorMessage: '',
  isSubmitting: false,
};

export const useRegisterPageStore = create<RegisterPageState & AuthPageActions>(
  createAuthPageStore({
    initialState,
    buildValidationInput: (state) => ({
      username: state.username,
      email: state.email,
      password: state.password,
      confirmPassword: state.confirmPassword,
      mode: 'register',
    }),
    validate: validateAuthForm as unknown as (
      input: Record<string, unknown>
    ) => Record<string, string>,
    buildSubmitPayload: (state) => ({
      username: state.username.trim(),
      email: state.email.trim(),
      password: state.password,
      bio: state.bio.trim() || undefined,
    }),
    submitAction: registerPageService.signUp,
    fallbackErrorMessage: 'Registration failed. Please try again.',
  })
);
