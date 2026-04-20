import { create } from 'zustand';
import { registerPageService } from './service.js';
import { validateAuthForm } from '../../shared/utils/validators.js';
import { createAuthPageStore } from '../_shared/utils/createAuthPageStore.js';

const initialState = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  bio: '',
  errors: {},
  errorMessage: '',
  isSubmitting: false,
};

export const useRegisterPageStore = create(
  createAuthPageStore({
    initialState,
    buildValidationInput: (state) => ({
      username: state.username,
      email: state.email,
      password: state.password,
      confirmPassword: state.confirmPassword,
      mode: 'register',
    }),
    validate: validateAuthForm,
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
