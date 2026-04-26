import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen grid place-items-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-heading mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-fg mb-6">
              We encountered an unexpected error. Please refresh the page to
              continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-accent text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
