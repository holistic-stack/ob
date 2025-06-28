/**
 * Matrix Operation Provider
 * 
 * React context provider for matrix operations with service management,
 * error boundaries, and performance monitoring following bulletproof-react patterns.
 */

import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { MatrixIntegrationService } from '../services/matrix-integration.service';
import { matrixServiceContainer } from '../services/matrix-service-container';
import { useMatrixOperations, type UseMatrixOperationsReturn } from '../hooks/useMatrixOperations';

/**
 * Matrix operation provider configuration
 */
export interface MatrixOperationProviderConfig {
  readonly enableTelemetry?: boolean;
  readonly enableValidation?: boolean;
  readonly enableConfigManager?: boolean;
  readonly autoOptimizeConfiguration?: boolean;
  readonly healthCheckInterval?: number;
  readonly performanceReportInterval?: number;
}

/**
 * Matrix operation context value
 */
export interface MatrixOperationContextValue extends UseMatrixOperationsReturn {
  readonly config: MatrixOperationProviderConfig;
  readonly updateConfig: (newConfig: Partial<MatrixOperationProviderConfig>) => void;
  readonly isInitialized: boolean;
  readonly lastHealthCheck: number | null;
  readonly lastPerformanceReport: any;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MatrixOperationProviderConfig = {
  enableTelemetry: true,
  enableValidation: true,
  enableConfigManager: true,
  autoOptimizeConfiguration: false,
  healthCheckInterval: 30000, // 30 seconds
  performanceReportInterval: 60000 // 1 minute
};

/**
 * Matrix operation context
 */
const MatrixOperationContext = createContext<MatrixOperationContextValue | null>(null);

/**
 * Matrix operation provider props
 */
export interface MatrixOperationProviderProps {
  readonly children: ReactNode;
  readonly config?: Partial<MatrixOperationProviderConfig>;
  readonly onHealthStatusChange?: (isHealthy: boolean, status: any) => void;
  readonly onPerformanceReport?: (report: any) => void;
  readonly onError?: (error: Error) => void;
}

/**
 * Matrix Operation Provider Component
 */
export const MatrixOperationProvider: React.FC<MatrixOperationProviderProps> = ({
  children,
  config: initialConfig = {},
  onHealthStatusChange,
  onPerformanceReport,
  onError
}) => {
  const [config, setConfig] = useState<MatrixOperationProviderConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<number | null>(null);
  const [lastPerformanceReport, setLastPerformanceReport] = useState<any>(null);

  // Use the matrix operations hook
  const matrixOperations = useMatrixOperations();

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<MatrixOperationProviderConfig>) => {
    console.log('[DEBUG][MatrixOperationProvider] Updating configuration:', newConfig);
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Perform health check
   */
  const performHealthCheck = useCallback(async () => {
    try {
      const status = await matrixOperations.getHealthStatus();
      const isHealthy = matrixOperations.isServiceHealthy;
      
      setLastHealthCheck(Date.now());
      onHealthStatusChange?.(isHealthy, status);
      
      if (!isHealthy) {
        console.warn('[WARN][MatrixOperationProvider] Matrix services are unhealthy:', status);
      }
    } catch (err) {
      console.error('[ERROR][MatrixOperationProvider] Health check failed:', err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [matrixOperations, onHealthStatusChange, onError]);

  /**
   * Generate performance report
   */
  const generatePerformanceReport = useCallback(() => {
    try {
      const report = matrixOperations.getPerformanceReport();
      setLastPerformanceReport(report);
      onPerformanceReport?.(report);
      
      console.log('[DEBUG][MatrixOperationProvider] Performance report generated:', {
        timestamp: Date.now(),
        reportSize: Object.keys(report || {}).length
      });
    } catch (err) {
      console.error('[ERROR][MatrixOperationProvider] Performance report generation failed:', err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [matrixOperations, onPerformanceReport, onError]);

  /**
   * Auto-optimize configuration if enabled
   */
  const autoOptimizeConfiguration = useCallback(async () => {
    if (!config.autoOptimizeConfiguration) return;

    try {
      console.log('[DEBUG][MatrixOperationProvider] Auto-optimizing configuration');
      const result = await matrixOperations.optimizeConfiguration();
      
      if (result.isError) {
        console.warn('[WARN][MatrixOperationProvider] Auto-optimization failed:', result.error);
      } else {
        console.log('[DEBUG][MatrixOperationProvider] Auto-optimization completed successfully');
      }
    } catch (err) {
      console.error('[ERROR][MatrixOperationProvider] Auto-optimization error:', err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [config.autoOptimizeConfiguration, matrixOperations, onError]);

  /**
   * Initialize provider
   */
  useEffect(() => {
    console.log('[INIT][MatrixOperationProvider] Initializing matrix operation provider');
    
    const initializeProvider = async () => {
      try {
        // Perform initial health check
        await performHealthCheck();
        
        // Generate initial performance report
        generatePerformanceReport();
        
        setIsInitialized(true);
        console.log('[DEBUG][MatrixOperationProvider] Provider initialized successfully');
      } catch (err) {
        console.error('[ERROR][MatrixOperationProvider] Provider initialization failed:', err);
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    };

    initializeProvider();
  }, [performHealthCheck, generatePerformanceReport, onError]);

  /**
   * Set up health check interval
   */
  useEffect(() => {
    if (!isInitialized || !config.healthCheckInterval) return;

    console.log(`[DEBUG][MatrixOperationProvider] Setting up health check interval: ${config.healthCheckInterval}ms`);
    
    const interval = setInterval(performHealthCheck, config.healthCheckInterval);
    
    return () => {
      console.log('[DEBUG][MatrixOperationProvider] Clearing health check interval');
      clearInterval(interval);
    };
  }, [isInitialized, config.healthCheckInterval, performHealthCheck]);

  /**
   * Set up performance report interval
   */
  useEffect(() => {
    if (!isInitialized || !config.performanceReportInterval) return;

    console.log(`[DEBUG][MatrixOperationProvider] Setting up performance report interval: ${config.performanceReportInterval}ms`);
    
    const interval = setInterval(generatePerformanceReport, config.performanceReportInterval);
    
    return () => {
      console.log('[DEBUG][MatrixOperationProvider] Clearing performance report interval');
      clearInterval(interval);
    };
  }, [isInitialized, config.performanceReportInterval, generatePerformanceReport]);

  /**
   * Set up auto-optimization interval
   */
  useEffect(() => {
    if (!isInitialized || !config.autoOptimizeConfiguration) return;

    console.log('[DEBUG][MatrixOperationProvider] Setting up auto-optimization interval');
    
    // Run auto-optimization every 5 minutes if enabled
    const interval = setInterval(autoOptimizeConfiguration, 5 * 60 * 1000);
    
    return () => {
      console.log('[DEBUG][MatrixOperationProvider] Clearing auto-optimization interval');
      clearInterval(interval);
    };
  }, [isInitialized, config.autoOptimizeConfiguration, autoOptimizeConfiguration]);

  /**
   * Context value
   */
  const contextValue: MatrixOperationContextValue = {
    ...matrixOperations,
    config,
    updateConfig,
    isInitialized,
    lastHealthCheck,
    lastPerformanceReport
  };

  return (
    <MatrixOperationContext.Provider value={contextValue}>
      {children}
    </MatrixOperationContext.Provider>
  );
};

/**
 * Hook to use matrix operation context
 */
export const useMatrixOperationContext = (): MatrixOperationContextValue => {
  const context = useContext(MatrixOperationContext);
  
  if (!context) {
    throw new Error('useMatrixOperationContext must be used within a MatrixOperationProvider');
  }
  
  return context;
};

/**
 * HOC to provide matrix operation context
 */
export const withMatrixOperations = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { matrixConfig?: Partial<MatrixOperationProviderConfig> }> => {
  const WrappedComponent: React.FC<P & { matrixConfig?: Partial<MatrixOperationProviderConfig> }> = ({ 
    matrixConfig, 
    ...props 
  }) => (
    <MatrixOperationProvider {...(matrixConfig ? { config: matrixConfig } : {})}>
      <Component {...(props as P)} />
    </MatrixOperationProvider>
  );

  WrappedComponent.displayName = `withMatrixOperations(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Matrix operation status component for debugging
 */
export const MatrixOperationStatus: React.FC<{
  readonly showDetails?: boolean;
  readonly className?: string;
}> = ({ showDetails = false, className = '' }) => {
  const { isServiceHealthy, serviceStatus, lastHealthCheck, lastPerformanceReport, isInitialized } = useMatrixOperationContext();

  if (!isInitialized) {
    return (
      <div className={`matrix-operation-status initializing ${className}`}>
        <span>🔄 Initializing matrix operations...</span>
      </div>
    );
  }

  return (
    <div className={`matrix-operation-status ${isServiceHealthy ? 'healthy' : 'unhealthy'} ${className}`}>
      <span>{isServiceHealthy ? '✅' : '❌'} Matrix Services: {isServiceHealthy ? 'Healthy' : 'Unhealthy'}</span>
      
      {showDetails && (
        <div className="matrix-operation-details">
          <div>Last Health Check: {lastHealthCheck ? new Date(lastHealthCheck).toLocaleTimeString() : 'Never'}</div>
          <div>Services: {serviceStatus?.services?.length || 0}</div>
          <div>Performance Report: {lastPerformanceReport ? 'Available' : 'Not available'}</div>
        </div>
      )}
    </div>
  );
};
