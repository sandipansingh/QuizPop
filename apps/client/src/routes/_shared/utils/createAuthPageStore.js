export const createAuthPageStore =
  ({
    initialState,
    buildValidationInput,
    validate,
    buildSubmitPayload,
    submitAction,
    fallbackErrorMessage,
  }) =>
  (set, get) => ({
    ...initialState,
    setField: (field, value) => {
      set((state) => ({
        [field]: value,
        errors: { ...state.errors, [field]: undefined },
        errorMessage: '',
      }));
    },
    reset: () => {
      set({ ...initialState });
    },
    submit: async () => {
      const state = get();
      const errors = validate(buildValidationInput(state));

      if (Object.keys(errors).length) {
        set({ errors });
        throw new Error('Please fix the highlighted fields.');
      }

      set({ isSubmitting: true, errorMessage: '', errors: {} });

      try {
        await submitAction(buildSubmitPayload(state));
        set({ isSubmitting: false });
        return true;
      } catch (error) {
        set({
          isSubmitting: false,
          errorMessage: error.message || fallbackErrorMessage,
        });
        throw error;
      }
    },
  });
