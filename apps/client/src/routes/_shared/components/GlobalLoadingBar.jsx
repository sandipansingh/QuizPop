import { useLoadingStore } from '../../../app/store/loading.store.js';

export function GlobalLoadingBar() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  return (
    <div
      aria-hidden="true"
      className={`global-loading ${isLoading ? 'global-loading--visible' : ''}`}
    />
  );
}
