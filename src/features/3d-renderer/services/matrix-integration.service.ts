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

const logger = createLogger('MatrixIntegrationService');

/**
 * Minimal matrix integration service for compatibility
 */
export class MatrixIntegrationService {
  private static instance: MatrixIntegrationService | null = null;

  static getInstanceSync(): MatrixIntegrationService {
    if (!MatrixIntegrationService.instance) {
      MatrixIntegrationService.instance = new MatrixIntegrationService();
    }
    return MatrixIntegrationService.instance;
  }

  static async getInstance(): Promise<MatrixIntegrationService> {
    return MatrixIntegrationService.getInstanceSync();
  }

  async validateMatrix(matrix: any): Promise<Result<boolean, string>> {
    logger.debug('Matrix validation (stub)');
    return success(true);
  }

  async performRobustInversion(matrix: any): Promise<Result<any, string>> {
    logger.debug('Matrix inversion (stub)');
    return success(matrix);
  }

  async shutdown(): Promise<void> {
    logger.debug('Matrix service shutdown (stub)');
  }

  async getHealthStatus(): Promise<any> {
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
