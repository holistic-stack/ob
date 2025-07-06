/**
 * Matrix Integration Service Stub
 *
 * @deprecated This service is a minimal stub for compatibility.
 * Use MatrixOperationsAPI from './matrix-operations.api.js' for new code.
 * This stub prevents import errors but provides minimal functionality.
 */

import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { success } from '../../../shared/utils/functional/result.js';
import { Matrix } from '../types/matrix.types.js';

const logger = createLogger('MatrixIntegrationService');

/**
 * Enhanced matrix operation options
 */
export interface EnhancedMatrixOptions {
  readonly enableValidation?: boolean;
  readonly enableCaching?: boolean;
  readonly enableTelemetry?: boolean;
  readonly timeout?: number;
  readonly useValidation?: boolean;
  readonly useTelemetry?: boolean;
  readonly enableSVDFallback?: boolean;
}

/**
 * Enhanced matrix operation result
 */
export interface EnhancedMatrixResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly metadata?: {
    readonly operationTime: number;
    readonly cacheHit?: boolean;
    readonly validationPassed?: boolean;
  };
}

/**
 * Minimal matrix integration service for compatibility
 */
export class MatrixIntegrationService {
  private static instance: MatrixIntegrationService | null = null;

  static resetInstance(): void {
    MatrixIntegrationService.instance = null;
  }

  static getInstanceSync(): MatrixIntegrationService {
    if (!MatrixIntegrationService.instance) {
      MatrixIntegrationService.instance = new MatrixIntegrationService();
    }
    return MatrixIntegrationService.instance;
  }

  static async getInstance(): Promise<MatrixIntegrationService> {
    return MatrixIntegrationService.getInstanceSync();
  }

  async validateMatrix(_matrix: unknown): Promise<Result<boolean, string>> {
    logger.debug('Matrix validation (stub)');
    return success(true);
  }

  async performRobustInversion(matrix: unknown): Promise<Result<Matrix, string>> {
    logger.debug('Matrix inversion (stub)');
    // Return a stub Matrix instance for compatibility
    return success(new Matrix(4, 4));
  }

  async convertMatrix4ToGLMatrix(
    matrix4: unknown,
    _options?: EnhancedMatrixOptions
  ): Promise<EnhancedMatrixResult> {
    logger.debug('Matrix4 to GL Matrix conversion (stub)');
    return {
      success: true,
      data: matrix4,
      metadata: { operationTime: 0 },
    };
  }

  async convertGLMatrixToMatrix4(
    matrix: unknown,
    _options?: EnhancedMatrixOptions
  ): Promise<EnhancedMatrixResult> {
    logger.debug('GL Matrix to Matrix4 conversion (stub)');
    return {
      success: true,
      data: matrix,
      metadata: { operationTime: 0 },
    };
  }

  async computeEnhancedNormalMatrix(
    modelMatrix: unknown,
    _options?: EnhancedMatrixOptions
  ): Promise<EnhancedMatrixResult> {
    logger.debug('Enhanced normal matrix computation (stub)');
    return {
      success: true,
      data: modelMatrix,
      metadata: { operationTime: 0 },
    };
  }

  async performBatchOperations(
    operations: unknown[],
    _options?: EnhancedMatrixOptions
  ): Promise<EnhancedMatrixResult> {
    logger.debug('Batch operations (stub)');
    return {
      success: true,
      data: operations,
      metadata: { operationTime: 0 },
    };
  }

  getPerformanceReport(): { totalOperations: number; averageTime: number; cacheHitRate: number } {
    logger.debug('Performance report (stub)');
    return {
      totalOperations: 0,
      averageTime: 0,
      cacheHitRate: 0,
    };
  }

  async optimizeConfiguration(): Promise<EnhancedMatrixResult> {
    logger.debug('Configuration optimization (stub)');
    return {
      success: true,
      data: {},
      metadata: { operationTime: 0 },
    };
  }

  async shutdown(): Promise<void> {
    logger.debug('Matrix service shutdown (stub)');
  }

  async getHealthStatus(): Promise<{
    overall: string;
    services: Record<string, unknown>;
    timestamp: number;
    recommendations: string[];
  }> {
    return {
      overall: 'healthy',
      services: {},
      timestamp: Date.now(),
      recommendations: [],
    };
  }
}

/**
 * Get matrix integration service instance
 */
export async function getMatrixIntegrationService(): Promise<MatrixIntegrationService> {
  return MatrixIntegrationService.getInstance();
}
