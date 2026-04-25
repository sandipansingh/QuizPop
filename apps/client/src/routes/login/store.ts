import { create } from 'zustand';
import { loginPageService } from './service';
import { validateAuthForm } from '../../shared/utils/validators';
import { createAuthPageStore } from '../_shared/utils/createAuthPageStore';
import type {
  AuthPageActions,
  AuthPageBaseState,
} from '../_shared/utils/createAuthPageStore';

interface LoginPageState extends AuthPageBaseState {
  email: string;
  password: string;
}

const initialState: LoginPageState = {
  email: '',
  password: '',
  errors: {},
  errorMessage: '',
  isSubmitting: false,
};

export const useLoginPageStore = create<LoginPageState & AuthPageActions>(
  createAuthPageStore({
    initialState,
    buildValidationInput: (state) => ({
      email: state.email,
      password: state.password,
      mode: 'login',
    }),
    validate: validateAuthForm as unknown as (
      input: Record<string, unknown>
    ) => Record<string, string>,
    buildSubmitPayload: (state) => ({
      email: state.email.trim(),
      password: state.password,
    }),
    submitAction: loginPageService.signIn,
    fallbackErrorMessage: 'Login failed. Please try again.',
  })
);
