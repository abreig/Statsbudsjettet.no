"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  harFeil: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { harFeil: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { harFeil: true };
  }

  render() {
    if (this.state.harFeil) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            style={{
              padding: "var(--space-6)",
              textAlign: "center",
              color: "var(--farge-nedgang)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <p>Noe gikk galt. Prøv å laste siden på nytt.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
