import React from "react";
import { Alert, AlertDescription } from "../../components/ui/feedback/alert";
import { Button } from "../../components/ui/base/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Something went wrong. Please try refreshing the page.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>

            <Button onClick={() => this.setState({ hasError: false })} variant="ghost">
              Try Again
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <summary className="font-bold cursor-pointer">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
