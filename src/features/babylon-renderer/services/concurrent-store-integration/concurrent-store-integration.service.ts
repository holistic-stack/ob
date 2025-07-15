/**
 * @file Concurrent Store Integration Service
 *
 * Service for integrating BabylonJS operations with React 19 concurrent features.
 * Provides concurrent-safe store actions with performance monitoring.
 */

import type { Scene } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';
import type { AppStore } from '../../../store/types/store.types';
import type { InspectorOptions } from '../../hooks/use-babylon-inspector';

const logger = createLogger('ConcurrentStoreIntegration');

/**
 * Performance metrics for concurrent operations
 */
export interface ConcurrentOperationMetrics {
  readonly operationType: 'inspector-show' | 'inspector-hide' | 'inspector-tab-switch';
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly success: boolean;
  readonly error?: string | undefined;
  readonly isPending: boolean;
  readonly isDeferred: boolean;
}

/**
 * Concurrent operation result
 */
export interface ConcurrentOperationResult<T = void> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly timestamp: Date;
  };
  readonly metrics: ConcurrentOperationMetrics;
}

/**
 * Concurrent store integration error codes
 */
export enum ConcurrentStoreErrorCode {
  STORE_NOT_AVAILABLE = 'STORE_NOT_AVAILABLE',
  OPERATION_FAILED = 'OPERATION_FAILED',
  TRANSITION_TIMEOUT = 'TRANSITION_TIMEOUT',
  PERFORMANCE_THRESHOLD_EXCEEDED = 'PERFORMANCE_THRESHOLD_EXCEEDED',
}

/**
 * Concurrent Store Integration Service
 *
 * Provides React 19 concurrent-safe operations for BabylonJS store integration.
 * Includes performance monitoring and optimization for <16ms targets.
 */
export class ConcurrentStoreIntegrationService {
  private store: AppStore | null = null;
  private performanceThreshold = 16; // 16ms target for 60fps
  private operationMetrics: ConcurrentOperationMetrics[] = [];

  constructor(store?: AppStore) {
    this.store = store || null;
    logger.init('[INIT][ConcurrentStoreIntegration] Service initialized');
  }

  /**
   * Set the store instance
   */
  setStore(store: AppStore): void {
    this.store = store;
    logger.debug('[DEBUG][ConcurrentStoreIntegration] Store instance set');
  }

  /**
   * Show inspector with concurrent features
   */
  async showInspectorConcurrent(
    _scene?: Scene,
    _options?: InspectorOptions
  ): Promise<ConcurrentOperationResult> {
    const startTime = performance.now();
    logger.debug('[DEBUG][ConcurrentStoreIntegration] Showing inspector concurrently...');

    const result = await tryCatchAsync(
      async () => {
        if (!this.store) {
          throw new Error('Store not available');
        }

        // Use store's showInspector action
        const storeResult = await this.store.showInspector();

        if (!storeResult.success) {
          throw new Error(storeResult.error.message);
        }

        return storeResult;
      },
      (error) => error as Error
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metrics: ConcurrentOperationMetrics = {
      operationType: 'inspector-show',
      startTime,
      endTime,
      duration,
      success: result.success,
      error: result.success ? undefined : result.error.message,
      isPending: false,
      isDeferred: duration > this.performanceThreshold,
    };

    this.recordMetrics(metrics);

    if (result.success) {
      logger.debug(
        `[DEBUG][ConcurrentStoreIntegration] Inspector shown in ${duration.toFixed(2)}ms`
      );

      return {
        success: true,
        data: undefined,
        metrics,
      };
    } else {
      return {
        success: false,
        error: {
          code: ConcurrentStoreErrorCode.OPERATION_FAILED,
          message: `Failed to show inspector: ${result.error.message}`,
          timestamp: new Date(),
        },
        metrics,
      };
    }
  }

  /**
   * Hide inspector with concurrent features
   */
  hideInspectorConcurrent(): ConcurrentOperationResult {
    const startTime = performance.now();
    logger.debug('[DEBUG][ConcurrentStoreIntegration] Hiding inspector concurrently...');

    const result = tryCatch(
      () => {
        if (!this.store) {
          throw new Error('Store not available');
        }

        // Use store's hideInspector action
        const storeResult = this.store.hideInspector();

        if (!storeResult.success) {
          throw new Error(storeResult.error?.message || 'Unknown error');
        }

        return storeResult;
      },
      (error) => error as Error
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metrics: ConcurrentOperationMetrics = {
      operationType: 'inspector-hide',
      startTime,
      endTime,
      duration,
      success: result.success,
      error: result.success ? undefined : result.error.message,
      isPending: false,
      isDeferred: duration > this.performanceThreshold,
    };

    this.recordMetrics(metrics);

    if (result.success) {
      logger.debug(
        `[DEBUG][ConcurrentStoreIntegration] Inspector hidden in ${duration.toFixed(2)}ms`
      );

      return {
        success: true,
        data: undefined,
        metrics,
      };
    } else {
      return {
        success: false,
        error: {
          code: ConcurrentStoreErrorCode.OPERATION_FAILED,
          message: `Failed to hide inspector: ${result.error.message}`,
          timestamp: new Date(),
        },
        metrics,
      };
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): readonly ConcurrentOperationMetrics[] {
    return Object.freeze([...this.operationMetrics]);
  }

  /**
   * Get average operation duration
   */
  getAverageOperationDuration(operationType?: ConcurrentOperationMetrics['operationType']): number {
    const filteredMetrics = operationType
      ? this.operationMetrics.filter((m) => m.operationType === operationType)
      : this.operationMetrics;

    if (filteredMetrics.length === 0) return 0;

    const totalDuration = filteredMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalDuration / filteredMetrics.length;
  }

  /**
   * Check if performance targets are being met
   */
  isPerformanceTargetMet(): boolean {
    const averageDuration = this.getAverageOperationDuration();
    return averageDuration <= this.performanceThreshold;
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.operationMetrics = [];
    logger.debug('[DEBUG][ConcurrentStoreIntegration] Performance metrics cleared');
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(metrics: ConcurrentOperationMetrics): void {
    this.operationMetrics.push(metrics);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.operationMetrics.length > 100) {
      this.operationMetrics = this.operationMetrics.slice(-100);
    }

    // Log performance warnings
    if (metrics.duration > this.performanceThreshold) {
      logger.warn(
        `[WARN][ConcurrentStoreIntegration] Operation ${metrics.operationType} exceeded performance threshold: ${metrics.duration.toFixed(2)}ms > ${this.performanceThreshold}ms`
      );
    }
  }

  /**
   * Get performance threshold for testing
   */
  getPerformanceThreshold(): number {
    return this.performanceThreshold;
  }

  /**
   * Set performance threshold for testing
   */
  setPerformanceThreshold(threshold: number): void {
    this.performanceThreshold = threshold;
  }

  /**
   * Dispose service and cleanup
   */
  dispose(): void {
    this.store = null;
    this.operationMetrics = [];
    logger.debug('[DEBUG][ConcurrentStoreIntegration] Service disposed');
  }
}
