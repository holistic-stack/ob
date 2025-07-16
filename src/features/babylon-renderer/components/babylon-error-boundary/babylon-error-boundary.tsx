/**
 * @file Babylon Error Boundary Component
 *
 * React Error Boundary specifically designed for BabylonJS rendering failures.
 * Provides graceful error handling, recovery mechanisms, and user-friendly feedback.
 *
 * @example
 * ```tsx
 * <BabylonErrorBoundary
 *   fallback={<div>3D rendering failed. Please try again.</div>}
 *   onError={(error, errorInfo) => console.error('Babylon error:', error)}
 *   enableRecovery={true}
 * >
 *   <BabylonCanvas onSceneReady={handleSceneReady} />
 * </BabylonErrorBoundary>
 * ```
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';

const logger = createLogger('BabylonErrorBoundary');

/**
 * Babylon-specific error types
 */
export type BabylonErrorType =
  | 'WEBGL_CONTEXT_LOST'
  | 'WEBGL_NOT_SUPPORTED'
  | 'SHADER_COMPILATION_ERROR'
  | 'MEMORY_ERROR'
  | 'SCENE_INITIALIZATION_ERROR'
  | 'ENGINE_INITIALIZATION_ERROR'
  | 'RENDERING_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Babylon error details
 */
export interface BabylonErrorDetails {
  readonly type: BabylonErrorType;
  readonly message: string;
  readonly originalError: Error;
  readonly timestamp: Date;
  readonly userAgent: string;
  readonly webglSupported: boolean;
  readonly webglVersion: string | undefined;
  readonly canvasSize?: { width: number; height: number };
}

/**
 * Error boundary state
 */
export interface BabylonErrorBoundaryState {
  readonly hasError: boolean;
  readonly errorDetails: BabylonErrorDetails | null;
  readonly retryCount: number;
  readonly isRecovering: boolean;
}

/**
 * Error boundary props
 */
export interface BabylonErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode | ((errorDetails: BabylonErrorDetails) => ReactNode);
  readonly onError?: (
    error: Error,
    errorInfo: ErrorInfo,
    errorDetails: BabylonErrorDetails
  ) => void;
  readonly enableRecovery?: boolean;
  readonly maxRetries?: number;
  readonly recoveryDelay?: number;
  readonly className?: string;
  readonly 'data-testid'?: string;
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{
  errorDetails: BabylonErrorDetails;
  onRetry?: () => void;
}> = ({ errorDetails, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
    <div className="text-center max-w-md">
      <div className="text-6xl mb-4">🔧</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">3D Rendering Error</h2>
      <p className="text-gray-600 mb-4">
        {errorDetails.type === 'WEBGL_NOT_SUPPORTED'
          ? 'Your browser does not support WebGL, which is required for 3D rendering.'
          : errorDetails.type === 'WEBGL_CONTEXT_LOST'
            ? 'The WebGL context was lost. This can happen due to GPU driver issues or memory constraints.'
            : 'An error occurred while initializing the 3D renderer.'}
      </p>
      <details className="text-left text-sm text-gray-500 mb-4">
        <summary className="cursor-pointer font-medium">Technical Details</summary>
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
          <div>Type: {errorDetails.type}</div>
          <div>Message: {errorDetails.message}</div>
          <div>Time: {errorDetails.timestamp.toISOString()}</div>
          <div>WebGL: {errorDetails.webglSupported ? 'Supported' : 'Not Supported'}</div>
          {errorDetails.webglVersion && <div>Version: {errorDetails.webglVersion}</div>}
        </div>
      </details>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

/**
 * Babylon Error Boundary Component
 *
 * Provides comprehensive error handling for BabylonJS rendering failures.
 * Includes WebGL context loss detection, recovery mechanisms, and detailed error reporting.
 */
export class BabylonErrorBoundary extends Component<
  BabylonErrorBoundaryProps,
  BabylonErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: BabylonErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorDetails: null,
      retryCount: 0,
      isRecovering: false,
    };
  }

  /**
   * Detect and categorize Babylon-specific errors
   */
  private categorizeBabylonError(error: Error): BabylonErrorType {
    return categorizeBabylonError(error);
  }

  /**
   * Check WebGL support and version
   */
  private getWebGLInfo(): { supported: boolean; version?: string } {
    return getWebGLInfo();
  }

  /**
   * Create detailed error information
   */
  private createErrorDetails(error: Error): BabylonErrorDetails {
    const webglInfo = this.getWebGLInfo();

    return {
      type: this.categorizeBabylonError(error),
      message: error.message,
      originalError: error,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      webglSupported: webglInfo.supported,
      webglVersion: webglInfo.version,
    };
  }

  /**
   * Handle retry mechanism
   */
  private handleRetry = (): void => {
    const { maxRetries = 3, recoveryDelay = 1000 } = this.props;

    if (this.state.retryCount >= maxRetries) {
      logger.warn('[RETRY] Maximum retry attempts reached');
      return;
    }

    logger.debug(`[RETRY] Attempting recovery (${this.state.retryCount + 1}/${maxRetries})`);

    this.setState({ isRecovering: true });

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        errorDetails: null,
        retryCount: this.state.retryCount + 1,
        isRecovering: false,
      });
    }, recoveryDelay);
  };

  /**
   * React Error Boundary lifecycle method
   */
  static getDerivedStateFromError(_error: Error): Partial<BabylonErrorBoundaryState> {
    return {
      hasError: true,
    };
  }

  /**
   * React Error Boundary lifecycle method
   */
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorDetails = this.createErrorDetails(error);

    logger.error('[ERROR] Babylon rendering error caught:', {
      error: errorDetails,
      errorInfo,
    });

    this.setState({ errorDetails });

    // Call user-provided error handler
    this.props.onError?.(error, errorInfo, errorDetails);
  }

  /**
   * Cleanup on unmount
   */
  override componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Render error boundary
   */
  override render(): ReactNode {
    const {
      children,
      fallback,
      enableRecovery = true,
      className,
      'data-testid': dataTestId,
    } = this.props;
    const { hasError, errorDetails, isRecovering } = this.state;

    if (hasError && errorDetails) {
      // Show recovery indicator
      if (isRecovering) {
        return (
          <div
            className={`flex items-center justify-center h-full ${className || ''}`}
            data-testid={dataTestId}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <div className="text-gray-600">Recovering...</div>
            </div>
          </div>
        );
      }

      // Show custom fallback or default error UI
      if (fallback) {
        return typeof fallback === 'function' ? fallback(errorDetails) : fallback;
      }

      return (
        <div className={className} data-testid={dataTestId}>
          <DefaultErrorFallback
            errorDetails={errorDetails}
            {...(enableRecovery && { onRetry: this.handleRetry })}
          />
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook for programmatic error boundary usage
 */
export const useBabylonErrorHandler = () => {
  const [error, setError] = React.useState<BabylonErrorDetails | null>(null);

  const handleError = React.useCallback((error: Error): BabylonErrorDetails => {
    // Create error details using the same logic as the boundary
    const webglInfo = getWebGLInfo();
    const errorDetails: BabylonErrorDetails = {
      type: categorizeBabylonError(error),
      message: error.message,
      originalError: error,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      webglSupported: webglInfo.supported,
      webglVersion: webglInfo.version,
    };
    setError(errorDetails);
    return errorDetails;
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: error !== null,
  };
};

/**
 * Helper function to categorize Babylon errors (extracted for reuse)
 */
function categorizeBabylonError(error: Error): BabylonErrorType {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  if (
    message.includes('webgl') &&
    (message.includes('context lost') || message.includes('context_lost'))
  ) {
    return 'WEBGL_CONTEXT_LOST';
  }

  if (
    message.includes('webgl') &&
    (message.includes('not supported') || message.includes('unavailable'))
  ) {
    return 'WEBGL_NOT_SUPPORTED';
  }

  if (message.includes('shader') || message.includes('glsl')) {
    return 'SHADER_COMPILATION_ERROR';
  }

  if (message.includes('memory') || message.includes('out of memory')) {
    return 'MEMORY_ERROR';
  }

  if (message.includes('scene') || stack.includes('scene')) {
    return 'SCENE_INITIALIZATION_ERROR';
  }

  if (message.includes('engine') || stack.includes('engine')) {
    return 'ENGINE_INITIALIZATION_ERROR';
  }

  if (message.includes('render') || stack.includes('render')) {
    return 'RENDERING_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Helper function to check WebGL support (extracted for reuse)
 */
function getWebGLInfo(): { supported: boolean; version?: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      return { supported: false };
    }

    const version = gl.getParameter(gl.VERSION);
    return { supported: true, version };
  } catch {
    return { supported: false };
  }
}
