interface SubmitAuthFormOptions {
  event: React.FormEvent;
  submit: () => Promise<boolean>;
  onSuccess: () => void;
  onFailure: () => void;
}

export const submitAuthForm = async ({
  event,
  submit,
  onSuccess,
  onFailure,
}: SubmitAuthFormOptions): Promise<void> => {
  event.preventDefault();

  try {
    await submit();
    onSuccess();
  } catch {
    onFailure();
  }
};
