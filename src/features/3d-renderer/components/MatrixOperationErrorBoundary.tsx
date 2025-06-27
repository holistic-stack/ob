/**
 * Matrix Operation Error Boundary
 * 
 * React error boundary for matrix operations with graceful degradation,
 * error reporting, and recovery mechanisms following bulletproof-react patterns.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { MatrixIntegrationService } from '../services/matrix-integration.service';

/**
 * Error boundary state
 */
interface MatrixOperationErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
  readonly errorInfo: ErrorInfo | null;
  readonly errorId: string | null;
  readonly retryCount: number;
  readonly isRecovering: boolean;
  readonly lastErrorTime: number | null;
}

/**
 * Error boundary props
 */
export interface MatrixOperationErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
  readonly onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  readonly onRecovery?: (errorId: string, retryCount: number) => void;
  readonly maxRetries?: number;
  readonly retryDelay?: number;
  readonly enableAutoRecovery?: boolean;
  readonly showErrorDetails?: boolean;
  readonly className?: string;
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  retryCount: number;
  onRetry: () => void;
  onReset: () => void;
  showDetails: boolean;
}> = ({ error, errorInfo, errorId, retryCount, onRetry, onReset, showDetails }) => (
  <div className="matrix-operation-error-boundary">
    <div className="error-header">
      <h3>⚠️ Matrix Operation Error</h3>
      <p>An error occurred during matrix operations. The application is still functional.</p>
    </div>
    
    <div className="error-actions">
      <button 
        onClick={onRetry}
        className="retry-button"
        disabled={retryCount >= 3}
      >
        🔄 Retry Operation {retryCount > 0 && `(${retryCount}/3)`}
      </button>
      
      <button 
        onClick={onReset}
        className="reset-button"
      >
        🔧 Reset Matrix Services
      </button>
    </div>

    {showDetails && (
      <details className="error-details">
        <summary>Error Details (ID: {errorId})</summary>
        <div className="error-content">
          <div className="error-message">
            <strong>Error:</strong> {error.message}
          </div>
          <div className="error-stack">
            <strong>Stack:</strong>
            <pre>{error.stack}</pre>
          </div>
          <div className="error-component-stack">
            <strong>Component Stack:</strong>
            <pre>{errorInfo.componentStack}</pre>
          </div>
        </div>
      </details>
    )}

    <div className="error-info">
      <p>
        <strong>What happened?</strong> A matrix operation failed unexpectedly. 
        This could be due to invalid input data, numerical instability, or service issues.
      </p>
      <p>
        <strong>What can you do?</strong> Try the retry button above, or reset the matrix services. 
        If the problem persists, check your input data or contact support.
      </p>
    </div>

    <style jsx>{`
      .matrix-operation-error-boundary {
        padding: 20px;
        margin: 10px;
        border: 2px solid #ff6b6b;
        border-radius: 8px;
        background-color: #fff5f5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .error-header h3 {
        margin: 0 0 10px 0;
        color: #d63031;
      }
      
      .error-header p {
        margin: 0 0 15px 0;
        color: #636e72;
      }
      
      .error-actions {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .retry-button, .reset-button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }
      
      .retry-button {
        background-color: #0984e3;
        color: white;
      }
      
      .retry-button:disabled {
        background-color: #b2bec3;
        cursor: not-allowed;
      }
      
      .reset-button {
        background-color: #e17055;
        color: white;
      }
      
      .error-details {
        margin: 15px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      
      .error-details summary {
        padding: 10px;
        background-color: #f8f9fa;
        cursor: pointer;
        font-weight: 500;
      }
      
      .error-content {
        padding: 15px;
      }
      
      .error-message, .error-stack, .error-component-stack {
        margin-bottom: 15px;
      }
      
      .error-content pre {
        background-color: #f1f3f4;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 12px;
        line-height: 1.4;
      }
      
      .error-info {
        background-color: #e3f2fd;
        padding: 15px;
        border-radius: 4px;
        border-left: 4px solid #2196f3;
      }
      
      .error-info p {
        margin: 0 0 10px 0;
      }
      
      .error-info p:last-child {
        margin-bottom: 0;
      }
    `}</style>
  </div>
);

/**
 * Matrix Operation Error Boundary Component
 */
export class MatrixOperationErrorBoundary extends Component<
  MatrixOperationErrorBoundaryProps,
  MatrixOperationErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private matrixIntegration: MatrixIntegrationService | null = null;

  constructor(props: MatrixOperationErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
      lastErrorTime: null
    };
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `matrix_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Catch errors in child components
   */
  static getDerivedStateFromError(error: Error): Partial<MatrixOperationErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now()
    };
  }

  /**
   * Handle component errors
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = this.generateErrorId();
    
    console.error('[ERROR][MatrixOperationErrorBoundary] Matrix operation error caught:', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.setState({
      errorInfo,
      errorId
    });

    // Report error to parent component
    this.props.onError?.(error, errorInfo, errorId);

    // Attempt auto-recovery if enabled
    if (this.props.enableAutoRecovery && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleAutoRecovery();
    }
  }

  /**
   * Schedule automatic recovery
   */
  private scheduleAutoRecovery = (): void => {
    const delay = this.props.retryDelay || 2000;
    
    console.log(`[DEBUG][MatrixOperationErrorBoundary] Scheduling auto-recovery in ${delay}ms`);
    
    this.setState({ isRecovering: true });
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  /**
   * Handle manual retry
   */
  private handleRetry = (): void => {
    const { retryCount, errorId } = this.state;
    const maxRetries = this.props.maxRetries || 3;

    if (retryCount >= maxRetries) {
      console.warn('[WARN][MatrixOperationErrorBoundary] Maximum retry attempts reached');
      return;
    }

    console.log(`[DEBUG][MatrixOperationErrorBoundary] Retrying operation (attempt ${retryCount + 1}/${maxRetries})`);

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRecovering: false
    }));

    // Notify parent of recovery attempt
    if (errorId) {
      this.props.onRecovery?.(errorId, retryCount + 1);
    }
  };

  /**
   * Handle service reset
   */
  private handleReset = async (): Promise<void> => {
    console.log('[DEBUG][MatrixOperationErrorBoundary] Resetting matrix services');

    try {
      // Reset matrix services if available
      if (this.matrixIntegration) {
        await this.matrixIntegration.shutdown();
      }

      // Reset error boundary state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: 0,
        isRecovering: false,
        lastErrorTime: null
      });

      console.log('[DEBUG][MatrixOperationErrorBoundary] Matrix services reset successfully');
    } catch (err) {
      console.error('[ERROR][MatrixOperationErrorBoundary] Failed to reset matrix services:', err);
    }
  };

  /**
   * Cleanup on unmount
   */
  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    
    if (this.matrixIntegration) {
      this.matrixIntegration.shutdown().catch(err => {
        console.error('[ERROR][MatrixOperationErrorBoundary] Failed to shutdown matrix integration:', err);
      });
    }
  }

  render(): ReactNode {
    const { hasError, error, errorInfo, errorId, retryCount, isRecovering } = this.state;
    const { children, fallback, showErrorDetails = false, className = '' } = this.props;

    if (hasError && error && errorInfo && errorId) {
      // Show recovery indicator
      if (isRecovering) {
        return (
          <div className={`matrix-operation-recovering ${className}`}>
            <div>🔄 Recovering from matrix operation error...</div>
          </div>
        );
      }

      // Show custom fallback or default error UI
      if (fallback) {
        return fallback;
      }

      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          retryCount={retryCount}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          showDetails={showErrorDetails}
        />
      );
    }

    return children;
  }
}
