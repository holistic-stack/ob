/**
 * Matrix Integration Service
 * 
 * Integration layer that connects the new matrix services with existing CSG operations,
 * providing e      const enhancedResult: EnhancedMatrixResult<Matrix> = {
        result: matrix,
        performance: {
          executionTime,
          memoryUsed: conversionResult.data.performance.memoryUsed,
          cacheHit: conversionResult.data.performance.cacheHit,
          operationType: operation
        },
        metadata: {
          timestamp: Date.now(),
          operationId: this.generateOperationId(operation),
          matrixSize: [matrix.rows, matrix.columns]
        }
      };

      // Apply conditional assignment for exactOptionalPropertyTypes
      if (validation) {
        (enhancedResult as any).validation = validation;
      }operations with validation, telemetry, and robust error handling.
 */

import { Matrix } from 'ml-matrix';
import { Matrix3, Matrix4, Vector3, Quaternion } from 'three';
import { MatrixServiceContainer } from './matrix-service-container';
import type { MatrixOperationResult, MatrixValidationResult } from '../types/matrix.types';
import { success, error } from '../../../shared/utils/functional/result';
import type { Result } from '../../../shared/types/result.types';

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
    console.log('[INIT][MatrixIntegrationService] Initializing matrix integration service');
    
    this.serviceContainer = serviceContainer || new MatrixServiceContainer();
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(operation: string): string {
    const count = this.operationCounter.get(operation) || 0;
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
    
    console.log(`[DEBUG][MatrixIntegrationService] Enhanced Matrix4 to ml-matrix conversion`);

    try {
      const conversionService = this.serviceContainer.getConversionService();
      const validationService = this.serviceContainer.getValidationService();
      const telemetryService = this.serviceContainer.getTelemetryService();

      // Prepare conversion options with conditional assignment
      const conversionOptions: any = {};
      if (options.useCache !== undefined) {
        conversionOptions.useCache = options.useCache;
      }
      if (options.useValidation !== undefined) {
        conversionOptions.validateInput = options.useValidation;
      }
      if (options.precision !== undefined) {
        conversionOptions.precision = options.precision;
      }
      if (options.timeout !== undefined) {
        conversionOptions.timeout = options.timeout;
      }

      // Perform conversion
      const conversionResult = await conversionService.convertMatrix4ToMLMatrix(matrix4, conversionOptions);

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
        const validationOptions: any = {
          computeEigenvalues: false,
          computeSVD: false,
          enableDetailedAnalysis: true
        };
        if (options.useCache !== undefined) {
          validationOptions.useCache = options.useCache;
        }

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
          matrixSize: [4, 4]
        });
      }

      const enhancedResult: EnhancedMatrixResult<Matrix> = {
        result: matrix,
        ...(validation && { validation }),
        performance: {
          executionTime,
          memoryUsed: conversionResult.data.performance.memoryUsed,
          cacheHit: conversionResult.data.performance.cacheHit,
          operationType: operation
        },
        metadata: {
          timestamp: Date.now(),
          operationId: this.generateOperationId(operation),
          warnings
        }
      };

      console.log(`[DEBUG][MatrixIntegrationService] Enhanced conversion completed in ${executionTime}ms`);
      return success(enhancedResult);

    } catch (err) {
      const executionTime = Date.now() - startTime;
      const telemetryService = this.serviceContainer.getTelemetryService();
      
      if (telemetryService && options.useTelemetry !== false) {
        telemetryService.trackOperation(operation, executionTime, false);
      }

      return error(`Enhanced matrix conversion failed: ${err instanceof Error ? err.message : String(err)}`);
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
    
    console.log(`[DEBUG][MatrixIntegrationService] Enhanced robust matrix inversion`);

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
          enableDetailedAnalysis: true
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
        validateInput: false // Already validated above
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
          matrixSize: [matrix.rows, matrix.columns]
        });
      }

      const enhancedResult: EnhancedMatrixResult<Matrix> = {
        result: inversionResult.data.result,
        performance: {
          executionTime,
          memoryUsed: inversionResult.data.performance.memoryUsed,
          cacheHit: inversionResult.data.performance.cacheHit,
          operationType: operation
        },
        metadata: {
          timestamp: Date.now(),
          operationId: this.generateOperationId(operation),
          warnings
        }
      };

      // Apply conditional assignment for exactOptionalPropertyTypes
      if (validation) {
        (enhancedResult as any).validation = validation;
      }

      console.log(`[DEBUG][MatrixIntegrationService] Enhanced inversion completed in ${executionTime}ms`);
      return success(enhancedResult);

    } catch (err) {
      const executionTime = Date.now() - startTime;
      const telemetryService = this.serviceContainer.getTelemetryService();
      
      if (telemetryService && options.useTelemetry !== false) {
        telemetryService.trackOperation(operation, executionTime, false);
      }

      return error(`Enhanced matrix inversion failed: ${err instanceof Error ? err.message : String(err)}`);
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
    
    console.log(`[DEBUG][MatrixIntegrationService] Enhanced normal matrix computation`);

    try {
      const conversionService = this.serviceContainer.getConversionService();
      const telemetryService = this.serviceContainer.getTelemetryService();

      // Compute normal matrix using robust methods
      const conversionOptions: any = {
        enableSVDFallback: options.enableSVDFallback !== false
      };

      // Apply conditional assignments for exactOptionalPropertyTypes
      if (options.useCache !== undefined) {
        conversionOptions.useCache = options.useCache;
      }
      if (options.precision !== undefined) {
        conversionOptions.precision = options.precision;
      }
      if (options.useValidation !== undefined) {
        conversionOptions.validateInput = options.useValidation;
      }

      const normalResult = await conversionService.computeRobustNormalMatrix(modelMatrix, conversionOptions);

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
          matrixSize: [3, 3]
        });
      }

      const enhancedResult: EnhancedMatrixResult<Matrix3> = {
        result: normalResult.data.result,
        performance: {
          executionTime,
          memoryUsed: normalResult.data.performance.memoryUsed,
          cacheHit: normalResult.data.performance.cacheHit,
          operationType: operation
        },
        metadata: {
          timestamp: Date.now(),
          operationId: this.generateOperationId(operation),
          warnings: []
        }
      };

      console.log(`[DEBUG][MatrixIntegrationService] Enhanced normal matrix computation completed in ${executionTime}ms`);
      return success(enhancedResult);

    } catch (err) {
      const executionTime = Date.now() - startTime;
      const telemetryService = this.serviceContainer.getTelemetryService();
      
      if (telemetryService && options.useTelemetry !== false) {
        telemetryService.trackOperation(operation, executionTime, false);
      }

      return error(`Enhanced normal matrix computation failed: ${err instanceof Error ? err.message : String(err)}`);
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
    
    console.log(`[DEBUG][MatrixIntegrationService] Performing batch operations (${operations.length} operations)`);

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
            failedOperations: errors.length
          }
        });
      }

      if (errors.length > 0 && !options.continueOnError) {
        return error(`Batch operations failed: ${errors.join('; ')}`);
      }

      console.log(`[DEBUG][MatrixIntegrationService] Batch operations completed: ${successCount}/${operations.length} successful`);
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
    telemetry?: any;
    cache?: any;
    validation?: any;
    conversion?: any;
  } {
    console.log('[DEBUG][MatrixIntegrationService] Generating performance report');

    const report: any = {};

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
      console.error('[ERROR][MatrixIntegrationService] Failed to generate performance report:', err);
    }

    return report;
  }

  /**
   * Optimize configuration based on usage patterns
   */
  async optimizeConfiguration(): Promise<Result<void, string>> {
    console.log('[DEBUG][MatrixIntegrationService] Optimizing configuration based on usage patterns');

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
          count: breakdown.count
        };
      }

      // Get threshold adjustment suggestions
      const adjustments = configManager.suggestPerformanceThresholdAdjustments(operationMetrics);

      if (adjustments.length > 0) {
        console.log(`[DEBUG][MatrixIntegrationService] Applying ${adjustments.length} performance optimizations`);
        const result = configManager.applyPerformanceThresholdAdjustments(adjustments);
        
        if (!result.success) {
          return error(`Failed to apply optimizations: ${result.error}`);
        }
      }

      console.log('[DEBUG][MatrixIntegrationService] Configuration optimization completed');
      return success(undefined);

    } catch (err) {
      return error(`Configuration optimization failed: ${err instanceof Error ? err.message : String(err)}`);
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
    console.log('[DEBUG][MatrixIntegrationService] Shutting down integration service');
    await this.serviceContainer.shutdown();
  }
}

// Export singleton instance
export const matrixIntegrationService = new MatrixIntegrationService();
