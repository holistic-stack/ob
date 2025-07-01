/**
 * Matrix Service Container
 *
 * Dependency injection container for matrix services with lifecycle management,
 * service integration, and comprehensive error handling following bulletproof-react patterns.
 */

import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { error, success } from '../../../shared/utils/functional/result.js';
import { MATRIX_CONFIG } from '../config/matrix-config.js';
import { MatrixCacheService } from './matrix-cache.service.js';
import { MatrixConfigManagerService } from './matrix-config-manager.service.js';
import {
  type MatrixConversionDependencies,
  MatrixConversionService,
} from './matrix-conversion.service.js';
import { MatrixOperationsAPI } from './matrix-operations.api.js';
import {
  type MatrixTelemetryDependencies,
  MatrixTelemetryService,
} from './matrix-telemetry.service.js';
import {
  type MatrixValidationDependencies,
  MatrixValidationService,
} from './matrix-validation.service.js';

const logger = createLogger('MatrixServiceContainer');

/**
 * Service container configuration
 */
export interface ServiceContainerConfig {
  readonly enableTelemetry?: boolean;
  readonly enableValidation?: boolean;
  readonly enableConfigManager?: boolean;
  readonly autoStartServices?: boolean;
}

/**
 * Service lifecycle state
 */
export type ServiceLifecycleState =
  | 'uninitialized'
  | 'initializing'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'error';

/**
 * Service health status
 */
export interface ServiceHealthStatus {
  readonly service: string;
  readonly state: ServiceLifecycleState;
  readonly healthy: boolean;
  readonly lastCheck: number;
  readonly errorCount: number;
  readonly uptime: number;
}

/**
 * Container health report
 */
export interface ContainerHealthReport {
  readonly overall: 'healthy' | 'degraded' | 'unhealthy';
  readonly services: readonly ServiceHealthStatus[];
  readonly timestamp: number;
  readonly recommendations: readonly string[];
}

/**
 * Matrix Service Container with dependency injection and lifecycle management
 */
export class MatrixServiceContainer {
  private readonly services = new Map<string, unknown>();
  private readonly serviceStates = new Map<string, ServiceLifecycleState>();
  private readonly serviceStartTimes = new Map<string, number>();
  private readonly serviceErrorCounts = new Map<string, number>();
  private readonly config: ServiceContainerConfig;
  private isInitialized = false;

  constructor(config: ServiceContainerConfig = {}) {
    logger.init('Initializing service container');

    this.config = {
      enableTelemetry: true,
      enableValidation: true,
      enableConfigManager: true,
      autoStartServices: true,
      ...config,
    };

    if (this.config.autoStartServices) {
      this.initializeServices();
    }
  }

  /**
   * Initialize all services with proper dependency injection
   */
  private async initializeServices(): Promise<Result<void, string>> {
    if (this.isInitialized) {
      return success(undefined);
    }

    logger.debug('Starting service initialization');

    try {
      // Initialize core services first (no dependencies)
      await this.initializeCoreServices();

      // Initialize dependent services
      await this.initializeDependentServices();

      // Perform health checks
      const healthReport = await this.performHealthCheck();
      if (healthReport.overall === 'unhealthy') {
        return error(`Service container unhealthy: ${healthReport.recommendations.join(', ')}`);
      }

      this.isInitialized = true;
      logger.debug('Service initialization completed successfully');
      return success(undefined);
    } catch (err) {
      logger.error('Service initialization failed:', err);
      return error(
        `Service initialization failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Initialize core services (no dependencies)
   */
  private async initializeCoreServices(): Promise<void> {
    logger.debug('Initializing core services');

    // Initialize cache service
    this.setServiceState('cache', 'initializing');
    try {
      const cacheService = new MatrixCacheService();
      this.registerService('cache', cacheService);
      this.setServiceState('cache', 'running');
      logger.debug('Cache service initialized');
    } catch (err) {
      this.setServiceState('cache', 'error');
      this.incrementErrorCount('cache');
      throw new Error(`Failed to initialize cache service: ${err}`);
    }

    // Initialize configuration manager if enabled
    if (this.config.enableConfigManager) {
      this.setServiceState('configManager', 'initializing');
      try {
        const configManager = new MatrixConfigManagerService();
        this.registerService('configManager', configManager);
        this.setServiceState('configManager', 'running');
        logger.debug('Configuration manager initialized');
      } catch (err) {
        this.setServiceState('configManager', 'error');
        this.incrementErrorCount('configManager');
        throw new Error(`Failed to initialize configuration manager: ${err}`);
      }
    }

    // Initialize telemetry service if enabled
    if (this.config.enableTelemetry) {
      this.setServiceState('telemetry', 'initializing');
      try {
        const telemetryDeps: MatrixTelemetryDependencies = {
          config: this.getConfigManager()?.getCurrentConfig() ?? MATRIX_CONFIG,
        };
        const telemetryService = new MatrixTelemetryService(telemetryDeps);
        this.registerService('telemetry', telemetryService);
        this.setServiceState('telemetry', 'running');
        logger.debug('Telemetry service initialized');
      } catch (err) {
        this.setServiceState('telemetry', 'error');
        this.incrementErrorCount('telemetry');
        throw new Error(`Failed to initialize telemetry service: ${err}`);
      }
    }
  }

  /**
   * Initialize dependent services
   */
  private async initializeDependentServices(): Promise<void> {
    logger.debug('Initializing dependent services');

    const cacheService = this.getService<MatrixCacheService>('cache');
    const telemetryService = this.getService<MatrixTelemetryService>('telemetry');
    const configManager = this.getService<MatrixConfigManagerService>('configManager');
    const currentConfig = configManager?.getCurrentConfig() ?? MATRIX_CONFIG;

    // Initialize conversion service
    this.setServiceState('conversion', 'initializing');
    try {
      const conversionDeps: MatrixConversionDependencies = {
        cache: cacheService,
        config: currentConfig,
        telemetry: telemetryService,
      };
      const conversionService = new MatrixConversionService(conversionDeps);
      this.registerService('conversion', conversionService);
      this.setServiceState('conversion', 'running');
      logger.debug('Conversion service initialized');
    } catch (err) {
      this.setServiceState('conversion', 'error');
      this.incrementErrorCount('conversion');
      throw new Error(`Failed to initialize conversion service: ${err}`);
    }

    // Initialize validation service if enabled
    if (this.config.enableValidation) {
      this.setServiceState('validation', 'initializing');
      try {
        const validationDeps: MatrixValidationDependencies = {
          cache: cacheService,
          config: currentConfig,
          telemetry: telemetryService,
        };
        const validationService = new MatrixValidationService(validationDeps);
        this.registerService('validation', validationService);
        this.setServiceState('validation', 'running');
        logger.debug('Validation service initialized');
      } catch (err) {
        this.setServiceState('validation', 'error');
        this.incrementErrorCount('validation');
        throw new Error(`Failed to initialize validation service: ${err}`);
      }
    }

    // Initialize operations API (depends on all other services)
    this.setServiceState('operations', 'initializing');
    try {
      const operationsAPI = new MatrixOperationsAPI();
      this.registerService('operations', operationsAPI);
      this.setServiceState('operations', 'running');
      logger.debug('Operations API initialized');
    } catch (err) {
      this.setServiceState('operations', 'error');
      this.incrementErrorCount('operations');
      throw new Error(`Failed to initialize operations API: ${err}`);
    }
  }

  /**
   * Register a service in the container
   */
  private registerService(name: string, service: unknown): void {
    this.services.set(name, service);
    this.serviceStartTimes.set(name, Date.now());
    this.serviceErrorCounts.set(name, 0);
    logger.debug(`Service '${name}' registered`);
  }

  /**
   * Set service lifecycle state
   */
  private setServiceState(name: string, state: ServiceLifecycleState): void {
    this.serviceStates.set(name, state);
    logger.debug(`Service '${name}' state: ${state}`);
  }

  /**
   * Increment error count for a service
   */
  private incrementErrorCount(name: string): void {
    const current = this.serviceErrorCounts.get(name) ?? 0;
    this.serviceErrorCounts.set(name, current + 1);
  }

  /**
   * Get a service from the container
   */
  getService<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }
    return service as T;
  }

  /**
   * Check if a service exists in the container
   */
  hasService(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Get cache service
   */
  getCacheService(): MatrixCacheService {
    return this.getService<MatrixCacheService>('cache');
  }

  /**
   * Get conversion service
   */
  getConversionService(): MatrixConversionService {
    return this.getService<MatrixConversionService>('conversion');
  }

  /**
   * Get validation service
   */
  getValidationService(): MatrixValidationService | null {
    return this.hasService('validation')
      ? this.getService<MatrixValidationService>('validation')
      : null;
  }

  /**
   * Get telemetry service
   */
  getTelemetryService(): MatrixTelemetryService | null {
    return this.hasService('telemetry')
      ? this.getService<MatrixTelemetryService>('telemetry')
      : null;
  }

  /**
   * Get configuration manager
   */
  getConfigManager(): MatrixConfigManagerService | null {
    return this.hasService('configManager')
      ? this.getService<MatrixConfigManagerService>('configManager')
      : null;
  }

  /**
   * Get operations API
   */
  getOperationsAPI(): MatrixOperationsAPI {
    return this.getService<MatrixOperationsAPI>('operations');
  }

  /**
   * Perform health check on all services
   */
  async performHealthCheck(): Promise<ContainerHealthReport> {
    logger.debug('Performing health check');

    const serviceStatuses: ServiceHealthStatus[] = [];
    const recommendations: string[] = [];
    let healthyCount = 0;

    for (const [name, service] of this.services.entries()) {
      const state = this.serviceStates.get(name) ?? 'uninitialized';
      const startTime = this.serviceStartTimes.get(name) ?? Date.now();
      const errorCount = this.serviceErrorCounts.get(name) ?? 0;
      const uptime = Date.now() - startTime;

      let healthy = state === 'running' && errorCount < 5;

      // Perform service-specific health checks
      try {
        if (name === 'cache' && 'getStats' in (service as MatrixCacheService)) {
          const stats = (service as MatrixCacheService).getStats();
          if (stats.cacheHitRate < 0.1) {
            healthy = false;
            recommendations.push('Cache hit rate is very low - consider reviewing cache strategy');
          }
        }

        if (
          name === 'telemetry' &&
          'getPerformanceMetrics' in (service as MatrixTelemetryService)
        ) {
          const metrics = (service as MatrixTelemetryService).getPerformanceMetrics();
          if (metrics.failedOperations > metrics.operationCount * 0.1) {
            healthy = false;
            recommendations.push(
              'High failure rate detected in telemetry - investigate operation failures'
            );
          }
        }
      } catch (err) {
        healthy = false;
        recommendations.push(`Health check failed for ${name}: ${err}`);
      }

      if (healthy) {
        healthyCount++;
      }

      serviceStatuses.push({
        service: name,
        state,
        healthy,
        lastCheck: Date.now(),
        errorCount,
        uptime,
      });
    }

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    const totalServices = serviceStatuses.length;

    if (healthyCount === totalServices) {
      overall = 'healthy';
    } else if (healthyCount >= totalServices * 0.7) {
      overall = 'degraded';
      recommendations.push('Some services are unhealthy - monitor closely');
    } else {
      overall = 'unhealthy';
      recommendations.push(
        'Critical: Multiple services are unhealthy - immediate attention required'
      );
    }

    return {
      overall,
      services: serviceStatuses,
      timestamp: Date.now(),
      recommendations,
    };
  }

  /**
   * Restart a specific service
   */
  async restartService(serviceName: string): Promise<Result<void, string>> {
    logger.debug(`Restarting service: ${serviceName}`);

    try {
      this.setServiceState(serviceName, 'stopping');

      // Stop the service if it has a cleanup method
      const service = this.services.get(serviceName);
      if (
        typeof service === 'object' &&
        service !== null &&
        'dispose' in service &&
        typeof (service as { dispose: () => Promise<void> }).dispose === 'function'
      ) {
        await (service as { dispose: () => Promise<void> }).dispose();
      }

      this.setServiceState(serviceName, 'stopped');
      this.services.delete(serviceName);

      // Reinitialize the service
      await this.initializeServices();

      logger.debug(`Service '${serviceName}' restarted successfully`);
      return success(undefined);
    } catch (err) {
      this.setServiceState(serviceName, 'error');
      this.incrementErrorCount(serviceName);
      return error(
        `Failed to restart service '${serviceName}': ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Shutdown all services
   */
  async shutdown(): Promise<void> {
    logger.debug('Shutting down service container');

    for (const [name, service] of this.services.entries()) {
      try {
        this.setServiceState(name, 'stopping');

        if (
          typeof service === 'object' &&
          service !== null &&
          'dispose' in service &&
          typeof (service as { dispose: () => Promise<void> }).dispose === 'function'
        ) {
          await (service as { dispose: () => Promise<void> }).dispose();
        }

        this.setServiceState(name, 'stopped');
        logger.debug(`Service '${name}' stopped`);
      } catch (err) {
        logger.error(`Failed to stop service '${name}':`, err);
        this.setServiceState(name, 'error');
      }
    }

    this.services.clear();
    this.serviceStates.clear();
    this.serviceStartTimes.clear();
    this.serviceErrorCounts.clear();
    this.isInitialized = false;

    logger.debug('Service container shutdown completed');
  }

  /**
   * Get container status
   */
  getStatus(): {
    initialized: boolean;
    serviceCount: number;
    runningServices: string[];
    errorServices: string[];
  } {
    const runningServices: string[] = [];
    const errorServices: string[] = [];

    for (const [name, state] of this.serviceStates.entries()) {
      if (state === 'running') {
        runningServices.push(name);
      } else if (state === 'error') {
        errorServices.push(name);
      }
    }

    return {
      initialized: this.isInitialized,
      serviceCount: this.services.size,
      runningServices,
      errorServices,
    };
  }
}

// Export singleton instance
export const matrixServiceContainer = new MatrixServiceContainer();
