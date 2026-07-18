'use client';

import React from 'react';

type BoundaryState = { error: Error | null };

/**
 * Keeps last successfully rendered children on error/suspend recovery paths
 * so routine failures never white-flash the shell.
 */
export class RenderBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error) => void;
  },
  BoundaryState & { lastGood: React.ReactNode }
> {
  state: BoundaryState & { lastGood: React.ReactNode } = {
    error: null,
    lastGood: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  componentDidUpdate(prevProps: { children: React.ReactNode }) {
    if (!this.state.error && prevProps.children !== this.props.children) {
      this.setState({ lastGood: this.props.children });
    }
  }

  componentDidMount() {
    this.setState({ lastGood: this.props.children });
  }

  render() {
    if (this.state.error) {
      return (
        this.state.lastGood ??
        this.props.fallback ?? (
          <div className="p-4 text-sm text-muted-foreground">
            Something went wrong. Your last view is preserved — try refreshing.
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export function AppRenderingShell({
  chrome,
  children,
}: {
  chrome: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      {chrome}
      <RenderBoundary>{children}</RenderBoundary>
    </>
  );
}
