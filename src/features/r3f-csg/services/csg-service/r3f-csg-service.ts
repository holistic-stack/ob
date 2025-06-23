/**
 * @file R3F CSG Service
 * 
 * React Three Fiber CSG operations service using three-csg-ts library.
 * Provides functional programming patterns for CSG operations with comprehensive error handling.
 * 
 * Features:
 * - Union, difference, and intersection operations
 * - Result<T,E> types for safe error handling
 * - Performance optimization with caching
 * - Memory management and resource cleanup
 * - Comprehensive logging and metrics
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import type {
  CSGService,
  CSGOperationResult,
  CSGOperation,
  CSGOperationType,
  Result
} from '../../types/r3f-csg-types';

// ============================================================================
// CSG Service Configuration
// ============================================================================

/**
 * Configuration for CSG operations
 */
export interface CSGServiceConfig {
  readonly enableCaching?: boolean;
  readonly enableOptimization?: boolean;
  readonly enableLogging?: boolean;
  readonly maxCacheSize?: number;
  readonly operationTimeout?: number;
}

/**
 * Default CSG service configuration
 */
const DEFAULT_CSG_CONFIG: Required<CSGServiceConfig> = {
  enableCaching: true,
  enableOptimization: true,
  enableLogging: true,
  maxCacheSize: 100,
  operationTimeout: 30000 // 30 seconds
} as const;

/**
 * CSG operation metrics
 */
interface CSGMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  cacheHits: number;
  cacheMisses: number;
  averageOperationTime: number;
}

// ============================================================================
// R3F CSG Service Implementation
// ============================================================================

/**
 * React Three Fiber CSG service implementation
 * 
 * Provides CSG operations using three-csg-ts library with functional programming patterns,
 * comprehensive error handling, and performance optimization.
 */
export class R3FCSGService implements CSGService {
  private readonly config: Required<CSGServiceConfig>;
  private readonly operationCache = new Map<string, THREE.BufferGeometry>();
  private readonly metrics: CSGMetrics;
  private readonly disposables: Set<THREE.BufferGeometry> = new Set();

  constructor(config: CSGServiceConfig = {}) {
    console.log('[INIT] Creating R3F CSG Service');
    
    this.config = { ...DEFAULT_CSG_CONFIG, ...config };
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageOperationTime: 0
    };

    if (this.config.enableLogging) {
      console.log('[DEBUG] R3F CSG Service configuration:', this.config);
    }
  }

  /**
   * Check if CSG operations are supported
   */
  public isSupported(): boolean {
    try {
      // Test if three-csg-ts is available and working
      const testGeometry = new THREE.BoxGeometry(1, 1, 1);
      const testCSG = CSG.fromGeometry(testGeometry);
      testGeometry.dispose();
      return testCSG !== null && testCSG !== undefined;
    } catch (error) {
      if (this.config.enableLogging) {
        console.warn('[WARN] CSG operations not supported:', error);
      }
      return false;
    }
  }

  /**
   * Perform union operation on multiple geometries
   */
  public union(geometries: readonly THREE.BufferGeometry[]): CSGOperationResult {
    return this.performOperation('union', geometries);
  }

  /**
   * Perform difference operation on multiple geometries
   */
  public difference(geometries: readonly THREE.BufferGeometry[]): CSGOperationResult {
    return this.performOperation('difference', geometries);
  }

  /**
   * Perform intersection operation on multiple geometries
   */
  public intersection(geometries: readonly THREE.BufferGeometry[]): CSGOperationResult {
    return this.performOperation('intersection', geometries);
  }

  /**
   * Generic CSG operation performer
   */
  private performOperation(
    operationType: CSGOperationType,
    geometries: readonly THREE.BufferGeometry[]
  ): CSGOperationResult {
    const startTime = performance.now();
    (this.metrics as any).totalOperations++;

    if (this.config.enableLogging) {
      console.log(`[DEBUG] Performing ${operationType} operation on ${geometries.length} geometries`);
    }

    try {
      // Validate inputs
      const validationResult = this.validateGeometries(geometries, operationType);
      if (!validationResult.success) {
        (this.metrics as any).failedOperations++;
        return validationResult;
      }

      // Check cache if enabled
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(operationType, geometries);
        const cachedResult = this.operationCache.get(cacheKey);
        if (cachedResult) {
          (this.metrics as any).cacheHits++;
          if (this.config.enableLogging) {
            console.log(`[DEBUG] Cache hit for ${operationType} operation`);
          }
          return { success: true, data: cachedResult.clone() };
        }
        (this.metrics as any).cacheMisses++;
      }

      // Perform the actual CSG operation
      const operationResult = this.executeCSGOperation(operationType, geometries);
      
      if (!operationResult.success) {
        (this.metrics as any).failedOperations++;
        return operationResult;
      }

      // Cache the result if enabled
      if (this.config.enableCaching && operationResult.success) {
        const cacheKey = this.generateCacheKey(operationType, geometries);
        this.cacheResult(cacheKey, operationResult.data);
      }

      // Update metrics
      const operationTime = performance.now() - startTime;
      this.updateMetrics(operationTime, true);

      // Track for disposal
      this.disposables.add(operationResult.data);

      if (this.config.enableLogging) {
        console.log(`[DEBUG] ${operationType} operation completed in ${operationTime.toFixed(2)}ms`);
      }

      (this.metrics as any).successfulOperations++;
      return operationResult;

    } catch (error) {
      (this.metrics as any).failedOperations++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown CSG operation error';
      
      if (this.config.enableLogging) {
        console.error(`[ERROR] ${operationType} operation failed:`, errorMessage);
      }

      return { success: false, error: `${operationType} operation failed: ${errorMessage}` };
    }
  }

  /**
   * Execute the actual CSG operation using three-csg-ts
   */
  private executeCSGOperation(
    operationType: CSGOperationType,
    geometries: readonly THREE.BufferGeometry[]
  ): CSGOperationResult {
    try {
      const firstGeometry = geometries[0];
      if (!firstGeometry) {
        return { success: false, error: 'First geometry is missing.' };
      }
      // Convert first geometry to CSG
      let resultCSG = CSG.fromGeometry(firstGeometry);
      
      if (!resultCSG) {
        return { success: false, error: 'Failed to convert first geometry to CSG' };
      }

      // Apply operation to remaining geometries
      for (let i = 1; i < geometries.length; i++) {
        const nextGeometry = geometries[i];
        if (!nextGeometry) {
          return { success: false, error: `Failed to convert geometry ${i} to CSG` };
        }
        const nextCSG = CSG.fromGeometry(nextGeometry);
        
        if (!nextCSG) {
          return { success: false, error: `Failed to convert geometry ${i} to CSG` };
        }

        switch (operationType) {
          case 'union':
            resultCSG = resultCSG.union(nextCSG);
            break;
          case 'difference':
            resultCSG = resultCSG.subtract(nextCSG);
            break;
          case 'intersection':
            resultCSG = resultCSG.intersect(nextCSG);
            break;
          default:
            return { success: false, error: `Unsupported operation type: ${operationType}` };
        }

        if (!resultCSG) {
          return { success: false, error: `${operationType} operation failed at geometry ${i}` };
        }
      }

      // Convert back to BufferGeometry
      const resultGeometry = CSG.toGeometry(resultCSG, new THREE.Matrix4());
      
      if (!resultGeometry) {
        return { success: false, error: 'Failed to convert CSG result back to geometry' };
      }

      // Optimize geometry if enabled
      if (this.config.enableOptimization) {
        this.optimizeGeometry(resultGeometry);
      }

      return { success: true, data: resultGeometry };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown CSG execution error';
      return { success: false, error: `CSG execution failed: ${errorMessage}` };
    }
  }

  /**
   * Validate geometries before CSG operation
   */
  private validateGeometries(
    geometries: readonly THREE.BufferGeometry[],
    operationType: CSGOperationType
  ): Result<void, string> {
    if (!geometries || geometries.length === 0) {
      return { success: false, error: `${operationType} operation requires at least one geometry` };
    }

    if (operationType !== 'union' && geometries.length < 2) {
      return { success: false, error: `${operationType} operation requires at least two geometries` };
    }

    // Validate each geometry
    for (let i = 0; i < geometries.length; i++) {
      const geometry = geometries[i];
      
      if (!geometry) {
        return { success: false, error: `Geometry at index ${i} is null or undefined` };
      }

      if (!geometry.attributes.position) {
        return { success: false, error: `Geometry at index ${i} has no position attribute` };
      }

      if (geometry.attributes.position.count === 0) {
        return { success: false, error: `Geometry at index ${i} has no vertices` };
      }
    }

    return { success: true, data: undefined };
  }

  /**
   * Generate cache key for operation
   */
  private generateCacheKey(
    operationType: CSGOperationType,
    geometries: readonly THREE.BufferGeometry[]
  ): string {
    const geometryHashes = geometries.map(geometry => this.hashGeometry(geometry));
    return `${operationType}_${geometryHashes.join('_')}`;
  }

  /**
   * Generate hash for geometry (simple implementation)
   */
  private hashGeometry(geometry: THREE.BufferGeometry): string {
    const positions = geometry.attributes.position;
    if (!positions) {
      return 'no_position';
    }
    const vertexCount = positions.count;
    const firstVertex = `${positions.getX(0)}_${positions.getY(0)}_${positions.getZ(0)}`;
    const lastVertex = `${positions.getX(vertexCount - 1)}_${positions.getY(vertexCount - 1)}_${positions.getZ(vertexCount - 1)}`;
    return `${vertexCount}_${firstVertex}_${lastVertex}`;
  }

  /**
   * Cache operation result
   */
  private cacheResult(key: string, geometry: THREE.BufferGeometry): void {
    // Check cache size limit
    if (this.operationCache.size >= this.config.maxCacheSize) {
      // Remove oldest entry (simple LRU)
      const firstKey = this.operationCache.keys().next().value;
      if (firstKey) {
        const oldGeometry = this.operationCache.get(firstKey);
        if (oldGeometry) {
          oldGeometry.dispose();
        }
        this.operationCache.delete(firstKey);
      }
    }

    this.operationCache.set(key, geometry.clone());
  }

  /**
   * Optimize geometry for better performance
   */
  private optimizeGeometry(geometry: THREE.BufferGeometry): void {
    try {
      // Compute vertex normals if not present
      if (!geometry.attributes.normal) {
        geometry.computeVertexNormals();
      }

      // Compute bounding box and sphere
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      // Merge vertices if possible (removes duplicates)
      // Note: This is a simplified optimization
      // In a real implementation, you might use more sophisticated algorithms

    } catch (error) {
      if (this.config.enableLogging) {
        console.warn('[WARN] Geometry optimization failed:', error);
      }
    }
  }

  /**
   * Update operation metrics
   */
  private updateMetrics(operationTime: number, success: boolean): void {
    const totalTime = this.metrics.averageOperationTime * this.metrics.totalOperations + operationTime;
    (this.metrics as any).averageOperationTime = totalTime / (this.metrics.totalOperations + 1);
  }

  /**
   * Get CSG operation metrics
   */
  public getMetrics(): CSGMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear operation cache
   */
  public clearCache(): void {
    if (this.config.enableLogging) {
      console.log('[DEBUG] Clearing CSG operation cache');
    }

    this.operationCache.forEach(geometry => geometry.dispose());
    this.operationCache.clear();
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    if (this.config.enableLogging) {
      console.log('[DEBUG] Disposing R3F CSG Service');
    }

    // Dispose cached geometries
    this.clearCache();

    // Dispose tracked geometries
    this.disposables.forEach(geometry => geometry.dispose());
    this.disposables.clear();

    if (this.config.enableLogging) {
      console.log('[DEBUG] R3F CSG Service disposed successfully');
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new R3F CSG service instance
 */
export function createR3FCSGService(config?: CSGServiceConfig): CSGService {
  return new R3FCSGService(config);
}

// Default export
export default R3FCSGService;
