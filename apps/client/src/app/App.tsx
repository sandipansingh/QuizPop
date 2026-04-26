import { ErrorBoundary } from './ErrorBoundary';
import { AppProviders } from './providers';
import { AppRouter } from './router';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
}
