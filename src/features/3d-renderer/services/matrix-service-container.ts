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
 * Matrix service container configuration options
 */
export interface MatrixServiceContainerOptions {
  readonly enableTelemetry?: boolean;
  readonly enableValidation?: boolean;
  readonly enableConfigManager?: boolean;
  readonly autoStartServices?: boolean;
}

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

  isHealthy(): boolean {
    return true;
  }

  getValidationService(): null {
    logger.debug('Validation service (stub)');
    return null;
  }

  getTelemetryService(): null {
    logger.debug('Telemetry service (stub)');
    return null;
  }

  getCacheService(): {
    getStats: () => {
      cacheHitRate: number;
      size: number;
      maxSize: number;
    };
  } {
    return {
      getStats: () => ({
        cacheHitRate: 0.8,
        size: 0,
        maxSize: 100,
      }),
    };
  }

  getConfigManager(): null {
    logger.debug('Config manager (stub)');
    return null;
  }

  getOperationsAPI(): Record<string, unknown> {
    logger.debug('Operations API (stub)');
    return {};
  }

  async shutdown(): Promise<void> {
    logger.debug('Matrix service container shutdown (stub)');
  }
}

/**
 * Get matrix service container instance
 */
export async function getMatrixServiceContainer(
  _options?: MatrixServiceContainerOptions
): Promise<MatrixServiceContainer> {
  return MatrixServiceContainer.getInstance();
}

/**
 * Export singleton instance for compatibility
 */
export const matrixServiceContainer = MatrixServiceContainer.getInstance();
