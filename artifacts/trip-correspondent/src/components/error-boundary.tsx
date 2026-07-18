import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Top-level error boundary — catches unhandled runtime errors anywhere in
 * the React tree and shows a plain recovery screen instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-8 gap-6">
          <h1 className="font-serif text-3xl text-foreground">Something went wrong</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground max-w-sm">
            {this.state.message}
          </p>
          <button
            onClick={this.handleReload}
            className="font-mono text-[10px] uppercase tracking-[0.25em] bg-primary text-primary-foreground px-6 py-3 hover:bg-primary/90 transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
