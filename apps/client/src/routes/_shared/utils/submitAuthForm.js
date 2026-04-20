export const submitAuthForm = async ({
  event,
  submit,
  onSuccess,
  onFailure,
}) => {
  event.preventDefault();

  try {
    await submit();
    onSuccess();
  } catch {
    onFailure();
  }
};
