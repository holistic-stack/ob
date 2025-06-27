/**
 * Matrix Operations Exports
 * 
 * Public exports for matrix operations with React integration,
 * API abstraction, and development tools for external consumption.
 */

// React Integration Layer
export { useMatrixOperations } from '../hooks/useMatrixOperations';
export type { UseMatrixOperationsReturn, MatrixOperationState, MatrixOperationStatus } from '../hooks/useMatrixOperations';

export { 
  MatrixOperationProvider, 
  useMatrixOperationContext, 
  withMatrixOperations,
  MatrixOperationStatus as MatrixOperationStatusComponent
} from '../providers/MatrixOperationProvider';
export type { 
  MatrixOperationConfig, 
  MatrixOperationContextValue, 
  MatrixOperationProviderProps 
} from '../providers/MatrixOperationProvider';

export { MatrixOperationErrorBoundary } from '../components/MatrixOperationErrorBoundary';
export type { MatrixOperationErrorBoundaryProps } from '../components/MatrixOperationErrorBoundary';

// API Layer
export { 
  createMatrixOperationsAPI, 
  matrixOperationsAPI,
  MatrixOperationsAPIImpl
} from '../api/matrix-operations.api';
export type { 
  MatrixOperationsAPI, 
  MatrixOperationConfig as APIMatrixOperationConfig,
  BatchOperationConfig,
  APIPerformanceMetrics,
  APIHealthStatus
} from '../api/matrix-operations.api';

// Development Tools
export { 
  MatrixPerformanceProfiler,
  MatrixOperationDebugger
} from '../dev-tools/MatrixPerformanceProfiler';
export type { 
  MatrixPerformanceProfilerProps,
  MatrixOperationDebuggerProps
} from '../dev-tools/MatrixPerformanceProfiler';

// Service Layer (for advanced usage)
export { MatrixIntegrationService } from '../services/matrix-integration.service';
export type { 
  EnhancedMatrixOptions, 
  EnhancedMatrixResult,
  MatrixValidationResult,
  MatrixPerformanceMetrics
} from '../services/matrix-integration.service';

export { matrixServiceContainer } from '../services/matrix-service-container';

// Configuration and Types
export { MATRIX_CONFIG } from '../config/matrix-config';
export type { MatrixConfig } from '../config/matrix-config';

export type {
  MatrixOperationResult,
  MatrixConversionOptions,
  MatrixValidationResult as ValidationResult,
  PerformanceMetrics,
  MatrixOperationError,
  MatrixOperationDependencies,
  IMatrixValidator,
  IMatrixCache,
  IMatrixTelemetry,
  PerformanceReport
} from '../types/matrix.types';

// Utility Functions
export { 
  matrix4ToMLMatrix,
  mlMatrixToMatrix4,
  matrix3ToMLMatrix,
  mlMatrixToMatrix3,
  createIdentityMatrix,
  createZeroMatrix,
  createRandomMatrix,
  validateMatrixDimensions,
  isValidMatrix4,
  isValidMatrix3
} from '../utils/matrix-adapters';

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
export const createMatrixOperationsBundle = (config?: Partial<MatrixOperationConfig>): MatrixOperationsBundle => {
  const api = createMatrixOperationsAPI(config);

  return {
    api,
    hooks: {
      useMatrixOperations,
      useMatrixOperationContext
    },
    components: {
      Provider: MatrixOperationProvider,
      ErrorBoundary: MatrixOperationErrorBoundary,
      PerformanceProfiler: MatrixPerformanceProfiler,
      Debugger: MatrixOperationDebugger,
      StatusComponent: MatrixOperationStatusComponent
    },
    utils: {
      withMatrixOperations,
      createAPI: createMatrixOperationsAPI
    }
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
  readonly config?: Partial<MatrixOperationConfig>;
  readonly enableProfiler?: boolean;
  readonly enableDebugger?: boolean;
  readonly onError?: (error: Error) => void;
}

export const createMatrixOperationsDevProvider = (props: MatrixOperationsDevProviderProps) => {
  const {
    children,
    config,
    enableProfiler = process.env.NODE_ENV === 'development',
    enableDebugger = process.env.NODE_ENV === 'development',
    onError
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
        onError
      },
      errorBoundary: {
        enableAutoRecovery: true,
        showErrorDetails: process.env.NODE_ENV === 'development',
        onError: (error: Error, errorInfo: any, errorId: string) => {
          console.error('[MatrixOperationsDevProvider] Error caught:', { error, errorInfo, errorId });
          onError?.(error);
        }
      },
      profiler: enableProfiler ? {
        enabled: enableProfiler,
        showDetails: true,
        position: 'top-right' as const,
        onPerformanceAlert: (metric: string, value: number, threshold: number) => {
          console.warn(`[MatrixOperationsDevProvider] Performance alert: ${metric} = ${value} (threshold: ${threshold})`);
        }
      } : null,
      debugger: enableDebugger ? {
        enabled: enableDebugger,
        showStackTraces: true,
        autoScroll: true
      } : null
    }
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
  readonly config?: Partial<MatrixOperationConfig>;
  readonly onError?: (error: Error) => void;
  readonly onHealthStatusChange?: (isHealthy: boolean, status: any) => void;
}

export const createMatrixOperationsProdProvider = (props: MatrixOperationsProdProviderProps) => {
  const { children, config, onError, onHealthStatusChange } = props;

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
          ...config
        },
        onError,
        onHealthStatusChange
      },
      errorBoundary: {
        enableAutoRecovery: true,
        maxRetries: 3,
        retryDelay: 1000,
        showErrorDetails: false,
        onError: (error: Error, errorInfo: any, errorId: string) => {
          // Log to external monitoring service in production
          console.error('[MatrixOperationsProdProvider] Production error:', {
            errorId,
            message: error.message,
            timestamp: Date.now()
          });
          onError?.(error);
        }
      }
    }
  };
};

/**
 * Quick setup function for matrix operations
 *
 * Provides a simple way to set up matrix operations in any React application
 * with sensible defaults for development and production environments.
 */
export const setupMatrixOperations = (options: {
  readonly environment?: 'development' | 'production';
  readonly config?: Partial<MatrixOperationConfig>;
  readonly enableDevTools?: boolean;
  readonly onError?: (error: Error) => void;
  readonly onHealthStatusChange?: (isHealthy: boolean, status: any) => void;
} = {}) => {
  const {
    environment = process.env.NODE_ENV === 'development' ? 'development' : 'production',
    config,
    enableDevTools = environment === 'development',
    onError,
    onHealthStatusChange
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
        Debugger: MatrixOperationDebugger
      }
    };
  } else {
    return {
      createProvider: createMatrixOperationsProdProvider,
      api: createMatrixOperationsAPI(config),
      bundle: createMatrixOperationsBundle(config),
      components: {
        Provider: MatrixOperationProvider,
        ErrorBoundary: MatrixOperationErrorBoundary
      }
    };
  }
};
