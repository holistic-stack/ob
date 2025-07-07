/**
 * Matrix Cache Service Stub
 *
 * @deprecated This service is a minimal stub for compatibility.
 * Use MatrixOperationsAPI for caching functionality.
 * This stub prevents import errors but provides minimal functionality.
 */

import { createLogger } from '../../../shared/services/logger.service.js';

const logger = createLogger('MatrixCacheService');

/**
 * Minimal matrix cache service for compatibility
 */
export class MatrixCacheService {
  private cache = new Map<string, unknown>();

  get(key: string): unknown | undefined {
    logger.debug(`Cache get: ${key} (stub)`);
    return this.cache.get(key);
  }

  set(key: string, value: unknown): void {
    logger.debug(`Cache set: ${key} (stub)`);
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    logger.debug(`Cache delete: ${key} (stub)`);
    return this.cache.delete(key);
  }

  clear(): void {
    logger.debug('Cache clear (stub)');
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): Record<string, unknown> {
    return {
      size: this.cache.size,
      hitRate: 0,
      missRate: 0,
    };
  }
}

export const matrixCacheService = new MatrixCacheService();
