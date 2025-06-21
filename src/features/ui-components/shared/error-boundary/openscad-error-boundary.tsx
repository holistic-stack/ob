/**
 * OpenSCAD Error Boundary Component
 * 
 * Comprehensive error boundary for the OpenSCAD 3D visualization pipeline
 * with user-friendly error messages, recovery options, and detailed error reporting.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { clsx } from '../utils';

// Types for error handling
export interface ParseError {
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly severity: 'error' | 'warning';
}

export interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
  readonly errorInfo: ErrorInfo | null;
  readonly errorType: 'parse' | 'render' | 'csg2' | 'unknown';
  readonly userMessage: string;
  readonly technicalDetails: string;
  readonly canRecover: boolean;
}

export interface OpenSCADErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
  readonly onError?: (error: Error, errorInfo: ErrorInfo) => void;
  readonly enableRecovery?: boolean;
  readonly showTechnicalDetails?: boolean;
  readonly className?: string;
}

/**
 * Enhanced error boundary specifically designed for OpenSCAD 3D visualization pipeline
 */
export class OpenSCADErrorBoundary extends Component<OpenSCADErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: OpenSCADErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      userMessage: '',
      technicalDetails: '',
      canRecover: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Analyze error to provide better user experience
    const errorAnalysis = analyzeError(error);
    
    return {
      hasError: true,
      error,
      errorType: errorAnalysis.type,
      userMessage: errorAnalysis.userMessage,
      technicalDetails: errorAnalysis.technicalDetails,
      canRecover: errorAnalysis.canRecover
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging
    console.error('[OpenSCADErrorBoundary] Error caught:', error);
    console.error('[OpenSCADErrorBoundary] Error info:', errorInfo);
    
    this.setState({
      errorInfo
    });
    
    // Call parent error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      userMessage: '',
      technicalDetails: '',
      canRecover: false
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render error UI
      return (
        <div className={clsx(
          'min-h-[400px] flex items-center justify-center p-6',
          'bg-red-50 border border-red-200 rounded-lg',
          this.props.className
        )}>
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-red-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              {getErrorTitle(this.state.errorType)}
            </h2>

            {/* User-friendly message */}
            <p className="text-red-700 mb-4">
              {this.state.userMessage}
            </p>

            {/* Technical details (if enabled) */}
            {this.props.showTechnicalDetails && this.state.technicalDetails && (
              <details className="mb-4 text-left">
                <summary className="text-sm text-red-600 cursor-pointer hover:text-red-800">
                  Technical Details
                </summary>
                <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto">
                  {this.state.technicalDetails}
                </pre>
              </details>
            )}

            {/* Recovery actions */}
            <div className="flex gap-3 justify-center">
              {this.state.canRecover && this.props.enableRecovery && (
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              )}
              
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Help text */}
            <p className="mt-4 text-sm text-red-600">
              If this problem persists, try refreshing the page or checking your OpenSCAD code syntax.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Analyze error to provide better user experience
 */
function analyzeError(error: Error): {
  type: ErrorBoundaryState['errorType'];
  userMessage: string;
  technicalDetails: string;
  canRecover: boolean;
} {
  const message = error.message.toLowerCase();
  const stack = error.stack || '';

  // Parse errors
  if (message.includes('parse') || message.includes('syntax')) {
    return {
      type: 'parse',
      userMessage: 'There\'s a syntax error in your OpenSCAD code. Please check your code for missing semicolons, brackets, or invalid syntax.',
      technicalDetails: `Parse Error: ${error.message}\n\n${stack}`,
      canRecover: true
    };
  }

  // CSG2 errors
  if (message.includes('csg2') || message.includes('csg') || message.includes('boolean')) {
    return {
      type: 'csg2',
      userMessage: 'There was an error processing the 3D geometry. This might be due to complex boolean operations or invalid mesh data.',
      technicalDetails: `CSG2 Error: ${error.message}\n\n${stack}`,
      canRecover: true
    };
  }

  // Rendering errors
  if (message.includes('render') || message.includes('babylon') || message.includes('webgl')) {
    return {
      type: 'render',
      userMessage: 'There was an error rendering the 3D scene. This might be due to WebGL issues or graphics driver problems.',
      technicalDetails: `Render Error: ${error.message}\n\n${stack}`,
      canRecover: false
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    userMessage: 'An unexpected error occurred while processing your OpenSCAD code. Please try again.',
    technicalDetails: `Unknown Error: ${error.message}\n\n${stack}`,
    canRecover: true
  };
}

/**
 * Get user-friendly error title based on error type
 */
function getErrorTitle(errorType: ErrorBoundaryState['errorType']): string {
  switch (errorType) {
    case 'parse':
      return 'OpenSCAD Syntax Error';
    case 'csg2':
      return '3D Geometry Processing Error';
    case 'render':
      return '3D Rendering Error';
    default:
      return 'Unexpected Error';
  }
}

export default OpenSCADErrorBoundary;
