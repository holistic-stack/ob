/**
 * Matrix Integration Service
 *
 * Integration layer that connects the new matrix services with existing CSG operations,
 * providing enhanced operations with validation, telemetry, and robust error handling.
 */

import type { Matrix } from 'ml-matrix';
import type { Matrix3, Matrix4 } from 'three';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { error, success } from '../../../shared/utils/functional/result.js';
import type { MatrixValidationResult } from '../types/matrix.types.js';
import type { MatrixConversionOptions } from './matrix-conversion.service.js';
import { MatrixServiceContainer } from './matrix-service-container.js';
import type { MatrixValidationOptions } from './matrix-validation.service.js';

const logger = createLogger('MatrixIntegrationService');

/**
 * Enhanced matrix operation options
 */
export interface EnhancedMatrixOptions {
  readonly useValidation?: boolean;
  readonly useTelemetry?: boolean;
  readonly useCache?: boolean;
  readonly enableSVDFallback?: boolean;
  readonly precision?: number;
  readonly timeout?: number;
}

/**
 * Matrix operation with validation and telemetry result
 */
export interface EnhancedMatrixResult<T> {
  readonly result: T;
  readonly validation?: MatrixValidationResult;
  readonly performance: {
    readonly executionTime: number;
    readonly memoryUsed: number;
    readonly cacheHit: boolean;
    readonly operationType: string;
  };
  readonly metadata: {
    readonly timestamp: number;
    readonly operationId: string;
    readonly warnings: readonly string[];
  };
}

/**
 * Matrix Integration Service for enhanced CSG operations
 */
export class MatrixIntegrationService {
  private readonly serviceContainer: MatrixServiceContainer;
  private readonly operationCounter = new Map<string, number>();

  constructor(serviceContainer?: MatrixServiceContainer) {
    logger.init('Initializing matrix integration service');

    this.serviceContainer = serviceContainer ?? new MatrixServiceContainer();
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(operation: string): string {
    const count = this.operationCounter.get(operation) ?? 0;
    this.operationCounter.set(operation, count + 1);
    return `${operation}_${Date.now()}_${count}`;
  }

  /**
   * Enhanced matrix conversion with validation and telemetry
   */
  async convertMatrix4ToMLMatrix(
    matrix4: Matrix4,
    options: EnhancedMatrixOptions = {}
  ): Promise<Result<EnhancedMatrixResult<Matrix>, string>> {
    const startTime = Date.now();
    const operation = 'convertMatrix4ToMLMatrix';

    logger.debug(`Enhanced Matrix4 to ml-matrix conversion`);

    try {
      const conversionService = this.serviceContainer.getConversionService();
      const validationService = this.serviceContainer.getValidationService();
      const telemetryService = this.serviceContainer.getTelemetryService();

      // Prepare conversion options with conditional assignment
      const conversionOptions: MatrixConversionOptions = {
        ...(options.useCache !== undefined && { useCache: options.useCache }),
        ...(options.useValidation !== undefined && { validateInput: options.useValidation }),
        ...(options.precision !== undefined && { precision: options.precision }),
        ...(options.timeout !== undefined && { timeout: options.timeout }),
      };

      // Perform conversion
      const conversionResult = await conversionService.convertMatrix4ToMLMatrix(
        matrix4,
        conversionOptions
      );

      if (!conversionResult.success) {
        // Track failure in telemetry
        if (telemetryService && options.useTelemetry !== false) {
          telemetryService.trackOperation(operation, Date.now() - startTime, false);
        }
        return error(conversionResult.error);
      }

      const matrix = conversionResult.data.result;
      const warnings: string[] = [];

      // Perform validation if requested
      let validation: MatrixValidationResult | undefined;
      if (validationService && options.useValidation) {
        const validationOptions: MatrixValidationOptions = {
          computeEigenvalues: false,
          computeSVD: false,
          enableDetailedAnalysis: true,
          ...(options.useCache !== undefined && { useCache: options.useCache }),
        };

        const validationResult = await validationService.validateMatrix(matrix, validationOptions);

        if (validationResult.success) {
          validation = validationResult.data.result;
          warnings.push(...validation.warnings);
        } else {
          warnings.push(`Validation failed: ${validationResult.error}`);
        }
      }

      const executionTime = Date.now() - startTime;

      // Track in telemetry
      if (telemetryService && options.useTelemetry !== false) {
        telemetryService.trackOperation(operation, executionTime, true, {
          memoryUsage: conversionResult.data.performance.memoryUsed,
          matrixSize: [4, 4],
        });
      }

      const enhancedResult: EnhancedMatrixResult<Matrix> = {
        result: matrix,
        ...(validation && { validation }),
        performance: {
          executionTime,
          memoryUsed: conversionResult.data.performance.memoryUsed,
          cacheHit: conversionResult.data.performance.cacheHit,
          operationType: operation,
        },
        metadata: {
          timestamp: Date.now(),
          operationId: this.generateOperationId(operation),
          warnings,
        },
      };

      logger.debug(
        `Enhanced conversion completed in ${executionTime}ms`
      );
      return success(enhancedResult);
    } catch (err) {
      const executionTime = Date.now() - startTime;
      const telemetryService = this.serviceContainer.getTelemetryService();

      if (telemetryService && options.useTelemetry !== false) {
        telemetryService.trackOperation(operation, executionTime, false);
      }

      return error(
        `Enhanced matrix conversion failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Enhanced matrix inversion with validation and SVD fallback
   */
  async performRobustInversion(
    matrix: Matrix,
    options: EnhancedMatrixOptions = {}
  ): Promise<Result<EnhancedMatrixResult<Matrix>, string>> {
    const startTime = Date.now();
    const operation = 'performRobustInversion';

    logger.debug(`Enhanced robust matrix inversion`);

    try {
      const conversionService = this.serviceContainer.getConversionService();
      const validationService = this.serviceContainer.getValidationService();
      const telemetryService = this.serviceContainer.getTelemetryService();

      const warnings: string[] = [];

      // Pre-validation if requested
      let validation: MatrixValidationResult | undefined;
      if (validationService && options.useValidation) {
        const validationResult = await validationService.validateMatrix(matrix, {
          ...(options.useCache !== undefined && { useCache: options.useCache }),
          computeEigenvalues: true,
          computeSVD: true,
          enableDetailedAnalysis: true,
        });

        if (validationResult.success) {
          validation = validationResult.data.result;
          warnings.push(...validation.warnings);

          // Check if matrix is suitable for inversion
          if (validation.numericalStability === 'unstable') {
            warnings.push('Matrix has unstable numerical properties - using SVD fallback');
          }
        }
      }

      // Perform robust inversion
      const inversionResult = await conversionService.performRobustInversion(matrix, {
        ...(options.useCache !== undefined && { useCache: options.useCache }),
        enableSVDFallback: options.enableSVDFallback !== false,
        ...(options.precision !== undefined && { precision: options.precision }),
        validateInput: false, // Already validated above
      });

      if (!inversionResult.success) {
        const executionTime = Date.now() - startTime;
        if (telemetryService && options.useTelemetry !== false) {
          telemetryService.trackOperation(operation, executionTime, false);
        }
        return error(inversionResult.error);
      }

      const executionTime = Date.now() - startTime;

      // Track in telemetry
      if (telemetryService && options.useTelemetry !== false) {
        telemetryService.trackOperation(operation, executionTime, true, {
          memoryUsage: inversionResult.data.performance.memoryUsed,
          matrixSize: [matrix.rows, matrix.columns],
        });
      }

      const enhancedResult: EnhancedMatrixResult<Matrix> = {
        result: inversionResult.data.result,
        ...(validation && { validation }),
        performance: {
          executionTime,
          memoryUsed: inversionResult.data.performance.memoryUsed,
          cacheHit: inversionResult.data.performance.cacheHit,
          operationType: operation,
        },
        metadata: {
          timestamp: Date.now(),
          operationId: this.generateOperationId(operation),
          warnings,
        },
      };

      logger.debug(
        `Enhanced inversion completed in ${executionTime}ms`
      );
      return success(enhancedResult);
    } catch (err) {
      const executionTime = Date.now() - startTime;
      const telemetryService = this.serviceContainer.getTelemetryService();

      if (telemetryService && options.useTelemetry !== false) {
        telemetryService.trackOperation(operation, executionTime, false);
      }

      return error(
        `Enhanced matrix inversion failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Enhanced normal matrix computation for CSG operations
   */
  async computeEnhancedNormalMatrix(
    modelMatrix: Matrix4,
    options: EnhancedMatrixOptions = {}
  ): Promise<Result<EnhancedMatrixResult<Matrix3>, string>> {
    const startTime = Date.now();
    const operation = 'computeEnhancedNormalMatrix';

    logger.debug(`Enhanced normal matrix computation`);

    try {
      const conversionService = this.serviceContainer.getConversionService();
      const telemetryService = this.serviceContainer.getTelemetryService();

      // Compute normal matrix using robust methods
      const conversionOptions: MatrixConversionOptions = {
        enableSVDFallback: options.enableSVDFallback !== false,
        ...(options.useCache !== undefined && { useCache: options.useCache }),
        ...(options.precision !== undefined && { precision: options.precision }),
        ...(options.useValidation !== undefined && { validateInput: options.useValidation }),
      };

      const normalResult = await conversionService.computeRobustNormalMatrix(
        modelMatrix,
        conversionOptions
      );

      if (!normalResult.success) {
        const executionTime = Date.now() - startTime;
        if (telemetryService && options.useTelemetry !== false) {
          telemetryService.trackOperation(operation, executionTime, false);
        }
        return error(normalResult.error);
      }

      const executionTime = Date.now() - startTime;

      // Track in telemetry
      if (telemetryService && options.useTelemetry !== false) {
        telemetryService.trackOperation(operation, executionTime, true, {
          memoryUsage: normalResult.data.performance.memoryUsed,
          matrixSize: [3, 3],
        });
      }

      const enhancedResult: EnhancedMatrixResult<Matrix3> = {
        result: normalResult.data.result,
        performance: {
          executionTime,
          memoryUsed: normalResult.data.performance.memoryUsed,
          cacheHit: normalResult.data.performance.cacheHit,
          operationType: operation,
        },
        metadata: {
          timestamp: Date.now(),
          operationId: this.generateOperationId(operation),
          warnings: [],
        },
      };

      logger.debug(
        `Enhanced normal matrix computation completed in ${executionTime}ms`
      );
      return success(enhancedResult);
    } catch (err) {
      const executionTime = Date.now() - startTime;
      const telemetryService = this.serviceContainer.getTelemetryService();

      if (telemetryService && options.useTelemetry !== false) {
        telemetryService.trackOperation(operation, executionTime, false);
      }

      return error(
        `Enhanced normal matrix computation failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Batch matrix operations with enhanced error handling
   */
  async performBatchOperations<T>(
    operations: Array<() => Promise<Result<EnhancedMatrixResult<T>, string>>>,
    options: EnhancedMatrixOptions & { continueOnError?: boolean } = {}
  ): Promise<Result<EnhancedMatrixResult<T>[], string>> {
    const startTime = Date.now();
    const batchOperation = 'batchOperations';

    logger.debug(
      `Performing batch operations (${operations.length} operations)`
    );

    try {
      const results: EnhancedMatrixResult<T>[] = [];
      const errors: string[] = [];
      let successCount = 0;

      for (let i = 0; i < operations.length; i++) {
        try {
          const operation = operations[i];
          if (!operation) continue;

          const result = await operation();

          if (result.success) {
            results.push(result.data);
            successCount++;
          } else {
            errors.push(`Operation ${i}: ${result.error}`);
            if (!options.continueOnError) {
              break;
            }
          }
        } catch (err) {
          const errorMsg = `Operation ${i}: ${err instanceof Error ? err.message : String(err)}`;
          errors.push(errorMsg);
          if (!options.continueOnError) {
            break;
          }
        }
      }

      const executionTime = Date.now() - startTime;
      const telemetryService = this.serviceContainer.getTelemetryService();

      // Track batch operation in telemetry
      if (telemetryService && options.useTelemetry !== false) {
        telemetryService.trackOperation(batchOperation, executionTime, errors.length === 0, {
          additionalData: {
            totalOperations: operations.length,
            successfulOperations: successCount,
            failedOperations: errors.length,
          },
        });
      }

      if (errors.length > 0 && !options.continueOnError) {
        return error(`Batch operations failed: ${errors.join('; ')}`);
      }

      logger.debug(
        `Batch operations completed: ${successCount}/${operations.length} successful`
      );
      return success(results);
    } catch (err) {
      const executionTime = Date.now() - startTime;
      const telemetryService = this.serviceContainer.getTelemetryService();

      if (telemetryService && options.useTelemetry !== false) {
        telemetryService.trackOperation(batchOperation, executionTime, false);
      }

      return error(`Batch operations failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): {
    telemetry?: unknown;
    cache?: unknown;
    validation?: unknown;
    conversion?: unknown;
  } {
    logger.debug('Generating performance report');

    const report: Record<string, unknown> = {};

    try {
      const telemetryService = this.serviceContainer.getTelemetryService();
      if (telemetryService) {
        report.telemetry = telemetryService.generateReport();
      }

      const cacheService = this.serviceContainer.getCacheService();
      if (cacheService) {
        report.cache = cacheService.getStats();
      }

      const validationService = this.serviceContainer.getValidationService();
      if (validationService) {
        report.validation = validationService.getPerformanceMetrics();
      }

      const conversionService = this.serviceContainer.getConversionService();
      if (conversionService) {
        report.conversion = conversionService.getPerformanceMetrics();
      }
    } catch (err) {
      logger.error(
        'Failed to generate performance report:',
        err
      );
    }

    return report;
  }

  /**
   * Optimize configuration based on usage patterns
   */
  async optimizeConfiguration(): Promise<Result<void, string>> {
    logger.debug(
      'Optimizing configuration based on usage patterns'
    );

    try {
      const configManager = this.serviceContainer.getConfigManager();
      const telemetryService = this.serviceContainer.getTelemetryService();

      if (!configManager || !telemetryService) {
        return error('Configuration manager or telemetry service not available');
      }

      // Get performance metrics from telemetry
      const telemetryReport = telemetryService.generateReport();
      const operationMetrics: Record<string, { averageTime: number; count: number }> = {};

      for (const [operation, breakdown] of Object.entries(telemetryReport.operationBreakdown)) {
        operationMetrics[operation] = {
          averageTime: breakdown.averageTime,
          count: breakdown.count,
        };
      }

      // Get threshold adjustment suggestions
      const adjustments = configManager.suggestPerformanceThresholdAdjustments(operationMetrics);

      if (adjustments.length > 0) {
        logger.debug(
          `Applying ${adjustments.length} performance optimizations`
        );
        const result = configManager.applyPerformanceThresholdAdjustments(adjustments);

        if (!result.success) {
          return error(`Failed to apply optimizations: ${result.error}`);
        }
      }

      logger.debug('Configuration optimization completed');
      return success(undefined);
    } catch (err) {
      return error(
        `Configuration optimization failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Get service container health status
   */
  async getHealthStatus() {
    return await this.serviceContainer.performHealthCheck();
  }

  /**
   * Shutdown integration service
   */
  async shutdown(): Promise<void> {
    logger.debug('Shutting down integration service');
    await this.serviceContainer.shutdown();
  }
}

// Export singleton instance
export const matrixIntegrationService = new MatrixIntegrationService();
