import React from "react";

interface State { error: Error | null }

/** Catches render errors so a single broken page shows a message instead of a blank screen. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error("[ErrorBoundary]", error, info.componentStack); }
  componentDidUpdate(prev: { children: React.ReactNode }) {
    // reset when the route (children) changes so navigating away recovers
    if (this.state.error && prev.children !== this.props.children) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF8F3] px-4">
        <div className="yp-card max-w-md p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A]">Something went wrong on this page</h1>
          <p className="text-[#4B5565]">Please try again. If the problem continues, contact us and mention the page address.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="yp-btn yp-btn-primary">Reload page</button>
            <a href="/" className="yp-btn yp-btn-ghost">Go to homepage</a>
          </div>
        </div>
      </div>
    );
  }
}
