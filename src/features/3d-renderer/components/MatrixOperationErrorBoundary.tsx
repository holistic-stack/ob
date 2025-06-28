/**
 * Matrix Operation Error Boundary
 * 
 * React error boundary for matrix operations with graceful degradation,
 * error reporting, and recovery mechanisms following bulletproof-react patterns.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { MatrixIntegrationService } from '../services/matrix-integration.service.js';

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
 * Matrix Operation Error Boundary Component
 */
export class MatrixOperationErrorBoundary extends Component<
  MatrixOperationErrorBoundaryProps,
  MatrixOperationErrorBoundaryState
> {
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
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
    if (this.props.enableAutoRecovery && this.state.retryCount < (this.props.maxRetries ?? 3)) {
      this.scheduleAutoRecovery();
    }
  }

  /**
   * Schedule automatic recovery
   */
  private scheduleAutoRecovery = (): void => {
    const delay = this.props.retryDelay ?? 2000;
    
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
    const maxRetries = this.props.maxRetries ?? 3;

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
    const { hasError, error, errorInfo, isRecovering } = this.state;
    const { children, fallback, className = '' } = this.props;

    if (hasError && error && errorInfo) {
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
        <div className={`matrix-operation-error-boundary ${className}`}>
					<h3>⚠️ Matrix Operation Error</h3>
					<p>An error occurred during matrix operations. The application is still functional.</p>
				</div>
      );
    }

    return children;
  }
}
