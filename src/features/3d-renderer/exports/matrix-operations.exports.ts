import type * as React from 'react';
import {
  type MatrixOperationConfig as APIMatrixOperationConfig,
  createMatrixOperationsAPI,
  type MatrixOperationsAPI,
} from '../api/matrix-operations.api.js';
import { MatrixOperationErrorBoundary } from '../components/MatrixOperationErrorBoundary.js';
import {
  MatrixOperationDebugger,
  MatrixPerformanceProfiler,
} from '../dev-tools/MatrixPerformanceProfiler.js';
import { useMatrixOperations } from '../hooks/useMatrixOperations.js';
import {
  MatrixOperationProvider,
  MatrixOperationStatus as MatrixOperationStatusComponent,
  useMatrixOperationContext,
  withMatrixOperations,
} from '../providers/MatrixOperationProvider.js';

/**
 * Matrix Operations Exports
 *
 * Public exports for matrix operations with React integration,
 * API abstraction, and development tools for external consumption.
 */

export type {
  APIHealthStatus,
  APIPerformanceMetrics,
  BatchOperationConfig,
  MatrixOperationConfig as APIMatrixOperationConfig,
  MatrixOperationsAPI,
} from '../api/matrix-operations.api.js';
// API Layer
export {
  createMatrixOperationsAPI,
  MatrixOperationsAPIImpl,
  matrixOperationsAPI,
} from '../api/matrix-operations.api.js';
export type { MatrixOperationErrorBoundaryProps } from '../components/MatrixOperationErrorBoundary.js';
export { MatrixOperationErrorBoundary } from '../components/MatrixOperationErrorBoundary.js';
export type { MatrixConfig } from '../config/matrix-config.js';
// Configuration and Types
export { MATRIX_CONFIG } from '../config/matrix-config.js';
export type {
  MatrixOperationDebuggerProps,
  MatrixPerformanceProfilerProps,
} from '../dev-tools/MatrixPerformanceProfiler.js';
// Development Tools
export {
  MatrixOperationDebugger,
  MatrixPerformanceProfiler,
} from '../dev-tools/MatrixPerformanceProfiler.js';
export type {
  MatrixOperationState,
  MatrixOperationStatus,
  UseMatrixOperationsReturn,
} from '../hooks/useMatrixOperations.js';
// React Integration Layer
export { useMatrixOperations } from '../hooks/useMatrixOperations.js';
export type {
  MatrixOperationContextValue,
  MatrixOperationProviderConfig,
  MatrixOperationProviderProps,
} from '../providers/MatrixOperationProvider.js';
export {
  MatrixOperationProvider,
  MatrixOperationStatus as MatrixOperationStatusComponent,
  useMatrixOperationContext,
  withMatrixOperations,
} from '../providers/MatrixOperationProvider.js';
export type {
  EnhancedMatrixOptions,
  EnhancedMatrixResult,
} from '../services/matrix-integration.service.js';
// Service Layer (for advanced usage)
export { MatrixIntegrationService } from '../services/matrix-integration.service.js';
export { matrixServiceContainer } from '../services/matrix-service-container.js';

export type {
  IMatrixCache,
  IMatrixTelemetry,
  IMatrixValidator,
  MatrixConversionOptions,
  MatrixError as MatrixOperationError,
  MatrixOperationDependencies,
  MatrixOperationResult,
  MatrixPerformanceMetrics as PerformanceMetrics,
  MatrixValidationResult as ValidationResult,
  PerformanceReport,
} from '../types/matrix.types.js';

// Utility Functions
export {
  createIdentityMatrix,
  createRandomMatrix,
  createZeroMatrix,
  isValidMatrix3,
  isValidMatrix4,
  matrix3ToMLMatrix,
  matrix4ToMLMatrix,
  mlMatrixToMatrix3,
  mlMatrixToMatrix4,
  validateMatrixDimensions,
} from '../utils/matrix-adapters.js';

/**
 * Complete Matrix Operations Bundle
 *
 * Pre-configured bundle with all matrix operations functionality
 * for easy integration into applications.
 */
export interface MatrixOperationsBundle {
  readonly api: MatrixOperationsAPI;
  readonly hooks: {
    readonly useMatrixOperations: typeof useMatrixOperations;
    readonly useMatrixOperationContext: typeof useMatrixOperationContext;
  };
  readonly components: {
    readonly Provider: typeof MatrixOperationProvider;
    readonly ErrorBoundary: typeof MatrixOperationErrorBoundary;
    readonly PerformanceProfiler: typeof MatrixPerformanceProfiler;
    readonly Debugger: typeof MatrixOperationDebugger;
    readonly StatusComponent: typeof MatrixOperationStatusComponent;
  };
  readonly utils: {
    readonly withMatrixOperations: typeof withMatrixOperations;
    readonly createAPI: typeof createMatrixOperationsAPI;
  };
}

/**
 * Create complete matrix operations bundle
 */
export const createMatrixOperationsBundle = (
  config?: Partial<APIMatrixOperationConfig>
): MatrixOperationsBundle => {
  const api = createMatrixOperationsAPI(config);

  return {
    api,
    hooks: {
      useMatrixOperations,
      useMatrixOperationContext,
    },
    components: {
      Provider: MatrixOperationProvider,
      ErrorBoundary: MatrixOperationErrorBoundary,
      PerformanceProfiler: MatrixPerformanceProfiler,
      Debugger: MatrixOperationDebugger,
      StatusComponent: MatrixOperationStatusComponent,
    },
    utils: {
      withMatrixOperations,
      createAPI: createMatrixOperationsAPI,
    },
  };
};

/**
 * Default matrix operations bundle
 */
export const matrixOperationsBundle = createMatrixOperationsBundle();

/**
 * Matrix Operations Provider with all development tools
 *
 * Complete provider setup with error boundary, performance profiler,
 * and debugger for development environments.
 */
export interface MatrixOperationsDevProviderProps {
  readonly children: React.ReactNode;
  readonly config?: Partial<APIMatrixOperationConfig>;
  readonly enableProfiler?: boolean;
  readonly enableDebugger?: boolean;
  readonly onError?: (error: Error) => void;
}

export const createMatrixOperationsDevProvider = (props: MatrixOperationsDevProviderProps) => {
  const {
    children: _children,
    config,
    enableProfiler = process.env.NODE_ENV === 'development',
    enableDebugger = process.env.NODE_ENV === 'development',
    onError,
  } = props;

  // Return configuration object for JSX usage
  return {
    Provider: MatrixOperationProvider,
    ErrorBoundary: MatrixOperationErrorBoundary,
    PerformanceProfiler: MatrixPerformanceProfiler,
    Debugger: MatrixOperationDebugger,
    config: {
      provider: {
        config,
        onError,
      },
      errorBoundary: {
        enableAutoRecovery: true,
        showErrorDetails: process.env.NODE_ENV === 'development',
        onError: (error: Error, errorInfo: unknown, errorId: string) => {
          console.error('[MatrixOperationsDevProvider] Error caught:', {
            error,
            errorInfo,
            errorId,
          });
          onError?.(error);
        },
      },
      profiler: enableProfiler
        ? {
            enabled: enableProfiler,
            showDetails: true,
            position: 'top-right' as const,
            onPerformanceAlert: (metric: string, value: number, threshold: number) => {
              console.warn(
                `[MatrixOperationsDevProvider] Performance alert: ${metric} = ${value} (threshold: ${threshold})`
              );
            },
          }
        : null,
      debugger: enableDebugger
        ? {
            enabled: enableDebugger,
            showStackTraces: true,
            autoScroll: true,
          }
        : null,
    },
  };
};

/**
 * Matrix Operations Provider for production
 *
 * Minimal provider setup optimized for production environments
 * with essential error handling and monitoring.
 */
export interface MatrixOperationsProdProviderProps {
  readonly children: React.ReactNode;
  readonly config?: Partial<APIMatrixOperationConfig>;
  readonly onError?: (error: Error) => void;
  readonly onHealthStatusChange?: (isHealthy: boolean, status: unknown) => void;
}

export const createMatrixOperationsProdProvider = (props: MatrixOperationsProdProviderProps) => {
  const { children: _children, config, onError, onHealthStatusChange } = props;

  // Return configuration object for JSX usage
  return {
    Provider: MatrixOperationProvider,
    ErrorBoundary: MatrixOperationErrorBoundary,
    config: {
      provider: {
        config: {
          enableTelemetry: true,
          enableValidation: true,
          enableConfigManager: true,
          autoOptimizeConfiguration: true,
          healthCheckInterval: 60000, // 1 minute
          performanceReportInterval: 300000, // 5 minutes
          ...config,
        },
        onError,
        onHealthStatusChange,
      },
      errorBoundary: {
        enableAutoRecovery: true,
        maxRetries: 3,
        retryDelay: 1000,
        showErrorDetails: false,
        onError: (error: Error, _errorInfo: unknown, errorId: string) => {
          // Log to external monitoring service in production
          console.error('[MatrixOperationsProdProvider] Production error:', {
            errorId,
            message: error.message,
            timestamp: Date.now(),
          });
          onError?.(error);
        },
      },
    },
  };
};

/**
 * Quick setup function for matrix operations
 *
 * Provides a simple way to set up matrix operations in any React application
 * with sensible defaults for development and production environments.
 */
export const setupMatrixOperations = (
  options: {
    readonly environment?: 'development' | 'production';
    readonly config?: Partial<APIMatrixOperationConfig>;
    readonly enableDevTools?: boolean;
    readonly onError?: (error: Error) => void;
    readonly onHealthStatusChange?: (isHealthy: boolean, status: unknown) => void;
  } = {}
) => {
  const {
    environment = process.env.NODE_ENV === 'development' ? 'development' : 'production',
    config,
    enableDevTools = environment === 'development',
    onError: _onError,
    onHealthStatusChange: _onHealthStatusChange,
  } = options;

  if (environment === 'development' && enableDevTools) {
    return {
      createProvider: createMatrixOperationsDevProvider,
      api: createMatrixOperationsAPI(config),
      bundle: createMatrixOperationsBundle(config),
      components: {
        Provider: MatrixOperationProvider,
        ErrorBoundary: MatrixOperationErrorBoundary,
        PerformanceProfiler: MatrixPerformanceProfiler,
        Debugger: MatrixOperationDebugger,
      },
    };
  } else {
    return {
      createProvider: createMatrixOperationsProdProvider,
      api: createMatrixOperationsAPI(config),
      bundle: createMatrixOperationsBundle(config),
      components: {
        Provider: MatrixOperationProvider,
        ErrorBoundary: MatrixOperationErrorBoundary,
      },
    };
  }
};
