import { create } from 'zustand';
import { loginPageService } from './service.js';
import { validateAuthForm } from '../../shared/utils/validators.js';
import { createAuthPageStore } from '../_shared/utils/createAuthPageStore.js';

const initialState = {
  email: '',
  password: '',
  errors: {},
  errorMessage: '',
  isSubmitting: false,
};

export const useLoginPageStore = create(
  createAuthPageStore({
    initialState,
    buildValidationInput: (state) => ({
      email: state.email,
      password: state.password,
      mode: 'login',
    }),
    validate: validateAuthForm,
    buildSubmitPayload: (state) => ({
      email: state.email.trim(),
      password: state.password,
    }),
    submitAction: loginPageService.signIn,
    fallbackErrorMessage: 'Login failed. Please try again.',
  })
);
