import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-svh flex flex-col items-center justify-center bg-bg text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2 text-slate-100">Something went wrong</h1>
          <p className="text-slate-400 mb-8 max-w-sm">
            An unexpected error occurred. Reloading usually fixes it.
          </p>
          <button onClick={this.handleReload} className="btn-primary">
            Reload FiwFan
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
