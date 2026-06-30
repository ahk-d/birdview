import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui';

interface Props {
  children: ReactNode;
  /** Label of the section being guarded, for the fallback message. */
  label?: string;
}
interface State {
  error: Error | null;
}

/** Catches render errors in a module so one broken card never takes down the dashboard. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Birdview] module error', this.props.label, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm">
          <p className="font-medium text-danger">
            {this.props.label ? `${this.props.label} crashed` : 'Something went wrong'}
          </p>
          <p className="mt-1 text-muted">{this.state.error.message}</p>
          <Button size="sm" className="mt-3" onClick={() => this.setState({ error: null })}>
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
