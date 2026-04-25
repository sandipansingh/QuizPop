import type { StateCreator } from 'zustand';

export interface AuthPageBaseState {
  errors: Record<string, string | undefined>;
  errorMessage: string;
  isSubmitting: boolean;
}

export interface AuthPageActions {
  setField: (field: string, value: string) => void;
  reset: () => void;
  submit: () => Promise<boolean>;
}

export type AuthPageStore = AuthPageBaseState & AuthPageActions;

interface CreateAuthPageStoreOptions<TState extends AuthPageBaseState> {
  initialState: TState;
  buildValidationInput: (state: TState) => Record<string, unknown>;
  validate: (input: Record<string, unknown>) => Record<string, string>;
  buildSubmitPayload: (state: TState) => Record<string, unknown>;
  submitAction: (payload: Record<string, unknown>) => Promise<unknown>;
  fallbackErrorMessage: string;
}

export const createAuthPageStore =
  <TState extends AuthPageBaseState>({
    initialState,
    buildValidationInput,
    validate,
    buildSubmitPayload,
    submitAction,
    fallbackErrorMessage,
  }: CreateAuthPageStoreOptions<TState>): StateCreator<
    TState & AuthPageActions
  > =>
  (set, get) => ({
    ...initialState,
    setField: (field: string, value: string) => {
      set((state) => ({
        ...state,
        [field]: value,
        errors: { ...(state as AuthPageBaseState).errors, [field]: undefined },
        errorMessage: '',
      }));
    },
    reset: () => {
      set(
        (_s) =>
          ({ ...initialState }) as unknown as Partial<TState & AuthPageActions>
      );
    },
    submit: async () => {
      const state = get();
      const errors = validate(buildValidationInput(state as TState));

      if (Object.keys(errors).length) {
        set((s) => ({ ...s, errors }));
        throw new Error('Please fix the highlighted fields.');
      }

      set((s) => ({ ...s, isSubmitting: true, errorMessage: '', errors: {} }));

      try {
        await submitAction(buildSubmitPayload(state as TState));
        set((s) => ({ ...s, isSubmitting: false }));
        return true;
      } catch (error) {
        const err = error as { message?: string };
        set((s) => ({
          ...s,
          isSubmitting: false,
          errorMessage: err.message ?? fallbackErrorMessage,
        }));
        throw error;
      }
    },
  });
