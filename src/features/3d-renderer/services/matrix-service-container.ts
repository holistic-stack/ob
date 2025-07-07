/**
 * Matrix Service Container Stub
 *
 * @deprecated This service is a minimal stub for compatibility.
 * Use MatrixOperationsAPI from './matrix-operations.api.js' for new code.
 * This stub prevents import errors but provides minimal functionality.
 */

import { createLogger } from '../../../shared/services/logger.service.js';

const logger = createLogger('MatrixServiceContainer');

/**
 * Minimal matrix service container for compatibility
 */
export class MatrixServiceContainer {
  private static instance: MatrixServiceContainer | null = null;

  static resetInstance(): void {
    MatrixServiceContainer.instance = null;
  }

  static getInstance(): MatrixServiceContainer {
    if (!MatrixServiceContainer.instance) {
      MatrixServiceContainer.instance = new MatrixServiceContainer();
    }
    return MatrixServiceContainer.instance;
  }

  getService(name: string): unknown {
    logger.debug(`Getting service: ${name} (stub)`);
    if (name === 'conversion') {
      return {
        convertMLMatrixToMatrix4: (_matrix: unknown, _options?: unknown) => {
          logger.debug('Converting ML Matrix to Matrix4 (stub implementation)');
          // Return Matrix4 directly, not wrapped in result object
          // Create a proper Matrix4 identity matrix as fallback
          const Matrix4 = require('three').Matrix4;
          const identityMatrix = new Matrix4();
          return {
            success: true,
            data: identityMatrix, // Return Matrix4 directly, not wrapped
          };
        },
      };
    }
    return null;
  }

  getValidationService(): {
    validate: () => {
      isValid: boolean;
      errors: string[];
      warnings: string[];
      suggestions: string[];
    };
    validateMatrix: (matrix: unknown) => {
      success: boolean;
      data?: unknown;
      error?: string;
    };
  } | null {
    logger.debug('Getting validation service (stub)');
    return {
      validate: () => ({ isValid: true, errors: [], warnings: [], suggestions: [] }),
      validateMatrix: (matrix: unknown) => ({ success: true, data: matrix }),
    };
  }

  isHealthy(): boolean {
    return true;
  }

  async shutdown(): Promise<void> {
    logger.debug('Matrix service container shutdown (stub)');
  }
}

/**
 * Get matrix service container instance
 */
export async function getMatrixServiceContainer(
  _config?: unknown
): Promise<MatrixServiceContainer> {
  logger.debug('Getting matrix service container (stub)');
  return MatrixServiceContainer.getInstance();
}

/**
 * Export singleton instance
 */
export const matrixServiceContainer = MatrixServiceContainer.getInstance();
