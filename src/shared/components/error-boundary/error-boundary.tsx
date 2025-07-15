/**
 * @file React Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */

import type React from 'react';
import { Component } from 'react';
import { createLogger } from '../../services/logger.service';

const logger = createLogger('ErrorBoundary');

interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
  readonly errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
  readonly fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo }>;
  readonly onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  readonly componentName?: string;
}

/**
 * Default fallback component for error display
 */
const DefaultErrorFallback: React.FC<{ error: Error; errorInfo: React.ErrorInfo }> = ({
  error,
  errorInfo,
}) => (
  <div
    style={{
      padding: '20px',
      margin: '20px',
      border: '2px solid #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#ffe0e0',
      color: '#d63031',
      fontFamily: 'monospace',
    }}
  >
    <h2 style={{ margin: '0 0 16px 0', color: '#d63031' }}>🚨 Component Error</h2>
    <details style={{ marginBottom: '16px' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
      <pre
        style={{
          marginTop: '8px',
          padding: '12px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px',
        }}
      >
        {error.message}
      </pre>
    </details>
    <details>
      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Component Stack</summary>
      <pre
        style={{
          marginTop: '8px',
          padding: '12px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px',
        }}
      >
        {errorInfo.componentStack}
      </pre>
    </details>
  </div>
);

/**
 * React Error Boundary Component
 *
 * Catches and handles errors in child components following React error boundary patterns.
 * Provides detailed error logging and customizable fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const componentName = this.props.componentName || 'Unknown';

    // Log the error with full details
    logger.error(`[ERROR][ErrorBoundary] Error caught in ${componentName}:`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  override render(): React.ReactNode {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return <FallbackComponent error={this.state.error} errorInfo={this.state.errorInfo} />;
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
