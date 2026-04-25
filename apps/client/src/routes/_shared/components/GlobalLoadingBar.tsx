import { useLoadingStore } from '../../../app/store/loading.store';

export function GlobalLoadingBar() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  return (
    <div
      aria-hidden="true"
      className={[
        'fixed top-0 left-0 z-999 h-1',
        'bg-gradient-to-r from-secondary via-accent to-tertiary',
        'transition-[width,opacity] duration-400 ease-linear',
        isLoading ? 'w-full opacity-100' : 'w-0 opacity-0',
      ].join(' ')}
    />
  );
}
