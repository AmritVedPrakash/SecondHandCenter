// ─────────────────────────────────────────────────────────────────────────────
//  ErrorBoundary  |  Catches render errors gracefully
// ─────────────────────────────────────────────────────────────────────────────

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-5xl animate-bounce-soft">😵</div>
            <h2 className="text-xl font-bold text-charcoal-800">Something went wrong</h2>
            <p className="text-sm text-cream-500 leading-relaxed">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary btn-md"
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
