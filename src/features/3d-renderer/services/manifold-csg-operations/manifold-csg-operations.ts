/**
 * @file Manifold CSG Operations Service
 * Task 2.4: Create CSG Operations Service (Green Phase)
 *
 * Implements CSG operations using Manifold library with BabylonJS-inspired patterns
 * Following project guidelines:
 * - BabylonJS-inspired simple CSG operations (union, subtract, intersect)
 * - Result<T,E> error handling patterns
 * - Integration with RAII memory management
 * - Direct Manifold calls with automatic resource disposal
 */

import type { BufferGeometry } from 'three';
import { logger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import type {
  MaterialIDManager,
  MaterialMapping,
} from '../manifold-material-manager/manifold-material-manager';
import {
  createManagedResource,
  disposeManagedResource,
  getMemoryStats,
} from '../manifold-memory-manager/manifold-memory-manager';
import {
  convertManifoldToThree,
  convertThreeToManifold,
  type IManifoldMesh,
} from '../manifold-mesh-converter/manifold-mesh-converter';
import { ManifoldWasmLoader } from '../manifold-wasm-loader/manifold-wasm-loader';

/**
 * CSG operation options for customizing behavior
 */
export interface CSGOperationOptions {
  preserveMaterials?: boolean; // Whether to preserve material information
  materialMapping?: MaterialIDManager; // Material ID manager for multi-material support
  optimizeResult?: boolean; // Whether to optimize the resulting geometry
  validateInput?: boolean; // Whether to validate input geometries
  timeout?: number; // Operation timeout in milliseconds
  enableBatching?: boolean; // Whether to use batch operations for performance
  memoryLimit?: number; // Memory limit in MB for operations
  precision?: number; // Precision for floating point operations
}

/**
 * CSG operation performance metrics
 */
export interface CSGPerformanceMetrics {
  totalOperations: number; // Total number of operations performed
  averageOperationTime: number; // Average operation time in milliseconds
  totalProcessingTime: number; // Total processing time across all operations
  memoryUsage: number; // Current memory usage in MB
  cacheHitRate: number; // Cache hit rate for repeated operations
}

/**
 * CSG operation result with performance metrics
 */
export interface CSGOperationResult {
  geometry: BufferGeometry; // Resulting geometry
  operationTime: number; // Time taken for operation (ms)
  vertexCount: number; // Number of vertices in result
  triangleCount: number; // Number of triangles in result
  materialGroups?: number; // Number of material groups preserved
}

/**
 * Perform union operation on multiple geometries
 *
 * Combines multiple geometries into a single unified mesh using Manifold's union operation.
 * Follows BabylonJS-inspired simple pattern with direct Manifold calls.
 *
 * @param geometries - Array of BufferGeometry objects to union
 * @param options - Operation options
 * @returns Result<CSGOperationResult, string> with union result
 */
export async function performUnion(
  geometries: BufferGeometry[],
  options: CSGOperationOptions = {}
): Promise<Result<CSGOperationResult, string>> {
  const startTime = performance.now();

  try {
    logger.debug('[DEBUG][ManifoldCSGOperations] Starting union operation', {
      geometryCount: geometries.length,
    });

    // Validate input
    if (!geometries || geometries.length === 0) {
      return {
        success: false,
        error: 'Invalid input: At least one geometry required for union operation',
      };
    }

    if (geometries.length === 1) {
      // Single geometry - return as-is with metrics
      const geometry = geometries[0];
      if (!geometry) {
        return {
          success: false,
          error: 'Invalid input: First geometry is null or undefined',
        };
      }
      const endTime = performance.now();
      const indexCount = geometry.getIndex()?.count ?? 0;

      return {
        success: true,
        data: {
          geometry,
          operationTime: endTime - startTime,
          vertexCount: geometry.getAttribute('position').count,
          triangleCount: indexCount / 3,
          materialGroups: geometry.groups.length,
        },
      };
    }

    // Load Manifold WASM module
    const loader = new ManifoldWasmLoader();
    const manifoldModule = await loader.load();
    if (!manifoldModule) {
      return {
        success: false,
        error: 'Failed to load Manifold WASM module for union operation',
      };
    }

    // Convert geometries to Manifold meshes
    const manifoldMeshes: IManifoldMesh[] = [];
    for (const geometry of geometries) {
      const conversionResult = convertThreeToManifold(geometry);
      if (!conversionResult.success) {
        return {
          success: false,
          error: `Failed to convert geometry to Manifold: ${conversionResult.error}`,
        };
      }
      manifoldMeshes.push(conversionResult.data);
    }

    // Perform union operation using Manifold
    let resultMesh = manifoldMeshes[0];
    if (!resultMesh) {
      return {
        success: false,
        error: 'No valid meshes to perform union operation',
      };
    }

    for (let i = 1; i < manifoldMeshes.length; i++) {
      try {
        const mesh2 = manifoldMeshes[i];
        if (!mesh2) {
          return {
            success: false,
            error: `Manifold mesh ${i} is null or undefined`,
          };
        }

        // Create Manifold objects from mesh data
        const manifold1: any = new manifoldModule.Manifold(resultMesh as any);
        const manifold2: any = new manifoldModule.Manifold(mesh2 as any);

        // Perform union
        const unionManifold: any = manifold1.add(manifold2);

        // Get result mesh
        resultMesh = unionManifold.getMesh();

        // Clean up intermediate objects
        manifold1.delete();
        manifold2.delete();
        unionManifold.delete();
      } catch (error) {
        return {
          success: false,
          error: `Manifold union operation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    // Convert result back to Three.js
    if (!resultMesh) {
      return {
        success: false,
        error: 'Result mesh is null or undefined after union operations',
      };
    }

    const threeResult = convertManifoldToThree(resultMesh, {
      preserveGroups: options.preserveMaterials ?? false,
      optimizeGeometry: options.optimizeResult ?? false,
    });

    if (!threeResult.success) {
      return {
        success: false,
        error: `Failed to convert result to Three.js: ${threeResult.error}`,
      };
    }

    const endTime = performance.now();
    const resultGeometry = threeResult.data;

    const result: CSGOperationResult = {
      geometry: resultGeometry,
      operationTime: endTime - startTime,
      vertexCount: resultGeometry.getAttribute('position').count,
      triangleCount: resultGeometry.getIndex()?.count ? resultGeometry.getIndex()!.count / 3 : 0,
      materialGroups: resultGeometry.groups.length,
    };

    logger.debug('[DEBUG][ManifoldCSGOperations] Union operation completed', result);

    return { success: true, data: result };
  } catch (error) {
    const errorMessage = `Union operation failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldCSGOperations] Union operation error', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Perform subtraction operation (difference) between two geometries
 *
 * Subtracts the second geometry from the first using Manifold's subtract operation.
 *
 * @param baseGeometry - Base geometry to subtract from
 * @param subtractGeometry - Geometry to subtract
 * @param options - Operation options
 * @returns Result<CSGOperationResult, string> with subtraction result
 */
export async function performSubtraction(
  baseGeometry: BufferGeometry,
  subtractGeometry: BufferGeometry,
  options: CSGOperationOptions = {}
): Promise<Result<CSGOperationResult, string>> {
  const startTime = performance.now();

  try {
    logger.debug('[DEBUG][ManifoldCSGOperations] Starting subtraction operation');

    // Validate input
    if (!baseGeometry || !subtractGeometry) {
      return {
        success: false,
        error: 'Invalid input: Both base and subtract geometries required',
      };
    }

    // Load Manifold WASM module
    const loader = new ManifoldWasmLoader();
    const manifoldModule = await loader.load();
    if (!manifoldModule) {
      return {
        success: false,
        error: 'Failed to load Manifold WASM module for subtraction operation',
      };
    }

    // Convert geometries to Manifold meshes
    const baseResult = convertThreeToManifold(baseGeometry);
    if (!baseResult.success) {
      return {
        success: false,
        error: `Failed to convert base geometry: ${baseResult.error}`,
      };
    }

    const subtractResult = convertThreeToManifold(subtractGeometry);
    if (!subtractResult.success) {
      return {
        success: false,
        error: `Failed to convert subtract geometry: ${subtractResult.error}`,
      };
    }

    try {
      // Create Manifold objects
      const baseManifold = new manifoldModule.Manifold(baseResult.data as any);
      const subtractManifold = new manifoldModule.Manifold(subtractResult.data as any);

      // Perform subtraction
      const differenceManifold = baseManifold.subtract(subtractManifold);

      // Get result mesh
      const resultMesh = differenceManifold.getMesh();

      // Clean up
      baseManifold.delete();
      subtractManifold.delete();
      differenceManifold.delete();

      // Convert result back to Three.js
      const threeResult = convertManifoldToThree(resultMesh, {
        preserveGroups: options.preserveMaterials ?? false,
        optimizeGeometry: options.optimizeResult ?? false,
      });

      if (!threeResult.success) {
        return {
          success: false,
          error: `Failed to convert result to Three.js: ${threeResult.error}`,
        };
      }

      const endTime = performance.now();
      const resultGeometry = threeResult.data;

      const result: CSGOperationResult = {
        geometry: resultGeometry,
        operationTime: endTime - startTime,
        vertexCount: resultGeometry.getAttribute('position').count,
        triangleCount: resultGeometry.getIndex()?.count ? resultGeometry.getIndex()!.count / 3 : 0,
        materialGroups: resultGeometry.groups.length,
      };

      logger.debug('[DEBUG][ManifoldCSGOperations] Subtraction operation completed', result);

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Manifold subtraction operation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  } catch (error) {
    const errorMessage = `Subtraction operation failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldCSGOperations] Subtraction operation error', {
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * ManifoldCSGOperations class for managing CSG operations with automatic resource cleanup
 *
 * This class provides a high-level interface for CSG operations,
 * handling WASM module loading, resource management, and cleanup automatically.
 */
export class ManifoldCSGOperations {
  private materialManager: MaterialIDManager;
  private isInitialized = false;
  private managedResource: any = null;
  private manifoldModule: any = null;
  private operationCache: Map<string, CSGOperationResult> = new Map();
  private performanceMetrics: CSGPerformanceMetrics = {
    totalOperations: 0,
    averageOperationTime: 0,
    totalProcessingTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
  };
  private readonly maxCacheSize = 50;

  constructor(materialManager: MaterialIDManager) {
    this.materialManager = materialManager;

    logger.debug('[DEBUG][ManifoldCSGOperations] Created CSG operations manager');
  }

  /**
   * Initialize the CSG operations manager
   * Loads Manifold WASM module and sets up resource management
   */
  async initialize(): Promise<Result<void, string>> {
    try {
      if (this.isInitialized) {
        return { success: true, data: undefined };
      }

      logger.debug('[DEBUG][ManifoldCSGOperations] Initializing CSG operations manager');

      // Load Manifold WASM module
      const loader = new ManifoldWasmLoader();
      this.manifoldModule = await loader.load();

      if (!this.manifoldModule) {
        return {
          success: false,
          error: 'Failed to load Manifold WASM module for CSG operations',
        };
      }

      // Register with memory manager
      this.managedResource = createManagedResource(this);

      this.isInitialized = true;

      logger.debug('[DEBUG][ManifoldCSGOperations] Initialized successfully');

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to initialize ManifoldCSGOperations: ${error instanceof Error ? error.message : String(error)}`;
      logger.error('[ERROR][ManifoldCSGOperations] Initialization failed', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Perform union operation using the class instance
   *
   * @param geometries - Array of BufferGeometry objects to union
   * @param options - Operation options
   * @returns Result<CSGOperationResult, string> with union result
   */
  async union(
    geometries: BufferGeometry[],
    options: CSGOperationOptions = {}
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ManifoldCSGOperations not initialized. Call initialize() first.',
      };
    }

    // Use material manager if not provided in options
    const enhancedOptions = {
      ...options,
      materialMapping: options.materialMapping || this.materialManager,
    };

    return performUnion(geometries, enhancedOptions);
  }

  /**
   * Perform subtraction operation using the class instance
   *
   * @param baseGeometry - Base geometry to subtract from
   * @param subtractGeometry - Geometry to subtract
   * @param options - Operation options
   * @returns Result<CSGOperationResult, string> with subtraction result
   */
  async subtract(
    baseGeometry: BufferGeometry,
    subtractGeometry: BufferGeometry,
    options: CSGOperationOptions = {}
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ManifoldCSGOperations not initialized. Call initialize() first.',
      };
    }

    // Use material manager if not provided in options
    const enhancedOptions = {
      ...options,
      materialMapping: options.materialMapping || this.materialManager,
    };

    return performSubtraction(baseGeometry, subtractGeometry, enhancedOptions);
  }

  /**
   * Perform intersection operation using the class instance
   *
   * @param geometries - Array of BufferGeometry objects to intersect
   * @param options - Operation options
   * @returns Result<CSGOperationResult, string> with intersection result
   */
  async intersect(
    geometries: BufferGeometry[],
    options: CSGOperationOptions = {}
  ): Promise<Result<CSGOperationResult, string>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ManifoldCSGOperations not initialized. Call initialize() first.',
      };
    }

    // Use material manager if not provided in options
    const enhancedOptions = {
      ...options,
      materialMapping: options.materialMapping || this.materialManager,
    };

    return performIntersection(geometries, enhancedOptions);
  }

  /**
   * Get current CSG operations statistics
   * Enhanced with performance metrics and cache statistics
   */
  getStats(): {
    isInitialized: boolean;
    hasWASMModule: boolean;
    memoryStats: any;
    performanceMetrics: CSGPerformanceMetrics;
    cacheSize: number;
    cacheHitRate: number;
  } {
    const totalCacheAccess = this.performanceMetrics.totalOperations;
    const cacheHits = Math.floor(totalCacheAccess * this.performanceMetrics.cacheHitRate);

    return {
      isInitialized: this.isInitialized,
      hasWASMModule: !!this.manifoldModule,
      memoryStats: getMemoryStats(),
      performanceMetrics: this.performanceMetrics,
      cacheSize: this.operationCache.size,
      cacheHitRate: totalCacheAccess > 0 ? cacheHits / totalCacheAccess : 0,
    };
  }

  /**
   * Clear operation cache and reset performance metrics
   * Useful for memory management and performance testing
   */
  clearCache(): void {
    this.operationCache.clear();
    this.performanceMetrics = {
      totalOperations: 0,
      averageOperationTime: 0,
      totalProcessingTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
    };

    logger.debug('[DEBUG][ManifoldCSGOperations] Cache and metrics cleared');
  }

  /**
   * Generate cache key for operation caching
   * Private helper method for performance optimization
   */
  private generateCacheKey(
    operation: string,
    geometries: BufferGeometry[],
    options: CSGOperationOptions
  ): string {
    // Create a simple hash based on operation type, geometry vertex counts, and key options
    const geometryHashes = geometries
      .map((geo) => {
        const positions = geo.getAttribute('position');
        const indices = geo.getIndex();
        return `${positions?.count || 0}-${indices?.count || 0}`;
      })
      .join(',');

    const optionsHash = `${options.preserveMaterials || false}-${options.optimizeResult || false}`;

    return `${operation}:${geometryHashes}:${optionsHash}`;
  }

  /**
   * Update performance metrics
   * Private helper method for tracking operation performance
   */
  private updateMetrics(operationTime: number, cacheHit: boolean): void {
    this.performanceMetrics.totalOperations++;
    this.performanceMetrics.totalProcessingTime += operationTime;

    // Update average operation time
    const count = this.performanceMetrics.totalOperations;
    this.performanceMetrics.averageOperationTime =
      (this.performanceMetrics.averageOperationTime * (count - 1) + operationTime) / count;

    // Update cache hit rate
    if (cacheHit) {
      const currentHits = Math.floor((count - 1) * this.performanceMetrics.cacheHitRate) + 1;
      this.performanceMetrics.cacheHitRate = currentHits / count;
    } else {
      const currentHits = Math.floor((count - 1) * this.performanceMetrics.cacheHitRate);
      this.performanceMetrics.cacheHitRate = currentHits / count;
    }

    // Update memory usage
    const memoryStats = getMemoryStats();
    this.performanceMetrics.memoryUsage = memoryStats.totalAllocated || 0;
  }

  /**
   * Optimize cache by removing least recently used entries
   * Private helper method for memory management
   */
  private optimizeCache(): void {
    if (this.operationCache.size > this.maxCacheSize) {
      // Remove oldest entries (simple LRU implementation)
      const entriesToRemove = this.operationCache.size - this.maxCacheSize;
      const keys = Array.from(this.operationCache.keys());

      for (let i = 0; i < entriesToRemove; i++) {
        const key = keys[i];
        if (key !== undefined) {
          this.operationCache.delete(key);
        }
      }

      logger.debug('[DEBUG][ManifoldCSGOperations] Cache optimized', {
        removedEntries: entriesToRemove,
        currentSize: this.operationCache.size,
      });
    }
  }

  /**
   * Dispose of the CSG operations manager and clean up resources
   */
  dispose(): Result<void, string> {
    try {
      logger.debug('[DEBUG][ManifoldCSGOperations] Disposing CSG operations manager');

      // Dispose managed resource
      if (this.managedResource) {
        disposeManagedResource(this.managedResource);
        this.managedResource = null;
      }

      // Clear state
      this.manifoldModule = null;
      this.isInitialized = false;
      this.operationCache.clear();

      logger.debug('[DEBUG][ManifoldCSGOperations] Disposed successfully');

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to dispose ManifoldCSGOperations: ${error instanceof Error ? error.message : String(error)}`;
      logger.error('[ERROR][ManifoldCSGOperations] Disposal failed', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete method required by memory manager
   */
  delete(): void {
    this.dispose();
  }
}

/**
 * Perform intersection operation on multiple geometries
 *
 * Finds the intersection of multiple geometries using Manifold's intersect operation.
 *
 * @param geometries - Array of BufferGeometry objects to intersect
 * @param options - Operation options
 * @returns Result<CSGOperationResult, string> with intersection result
 */
export async function performIntersection(
  geometries: BufferGeometry[],
  options: CSGOperationOptions = {}
): Promise<Result<CSGOperationResult, string>> {
  const startTime = performance.now();

  try {
    logger.debug('[DEBUG][ManifoldCSGOperations] Starting intersection operation', {
      geometryCount: geometries.length,
    });

    // Validate input
    if (!geometries || geometries.length < 2) {
      return {
        success: false,
        error: 'Invalid input: At least two geometries required for intersection operation',
      };
    }

    // Load Manifold WASM module
    const loader = new ManifoldWasmLoader();
    const manifoldModule = await loader.load();
    if (!manifoldModule) {
      return {
        success: false,
        error: 'Failed to load Manifold WASM module for intersection operation',
      };
    }

    // Convert geometries to Manifold meshes
    const manifoldMeshes: IManifoldMesh[] = [];
    for (const geometry of geometries) {
      const conversionResult = convertThreeToManifold(geometry);
      if (!conversionResult.success) {
        return {
          success: false,
          error: `Failed to convert geometry to Manifold: ${conversionResult.error}`,
        };
      }
      manifoldMeshes.push(conversionResult.data);
    }

    // Perform intersection operation using Manifold
    let resultMesh = manifoldMeshes[0];
    if (!resultMesh) {
      return {
        success: false,
        error: 'No valid meshes to perform intersection operation',
      };
    }

    for (let i = 1; i < manifoldMeshes.length; i++) {
      try {
        const mesh2 = manifoldMeshes[i];
        if (!mesh2) {
          return {
            success: false,
            error: `Manifold mesh ${i} is null or undefined`,
          };
        }

        // Create Manifold objects from mesh data
        const manifold1: any = new manifoldModule.Manifold(resultMesh as any);
        const manifold2: any = new manifoldModule.Manifold(mesh2 as any);

        // Perform intersection
        const intersectManifold: any = manifold1.intersect(manifold2);

        // Get result mesh
        resultMesh = intersectManifold.getMesh();

        // Clean up intermediate objects
        manifold1.delete();
        manifold2.delete();
        intersectManifold.delete();
      } catch (error) {
        return {
          success: false,
          error: `Manifold intersection operation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    // Convert result back to Three.js
    if (!resultMesh) {
      return {
        success: false,
        error: 'Result mesh is null or undefined after intersection operations',
      };
    }

    const threeResult = convertManifoldToThree(resultMesh, {
      preserveGroups: options.preserveMaterials ?? false,
      optimizeGeometry: options.optimizeResult ?? false,
    });

    if (!threeResult.success) {
      return {
        success: false,
        error: `Failed to convert result to Three.js: ${threeResult.error}`,
      };
    }

    const endTime = performance.now();
    const resultGeometry = threeResult.data;

    const result: CSGOperationResult = {
      geometry: resultGeometry,
      operationTime: endTime - startTime,
      vertexCount: resultGeometry.getAttribute('position').count,
      triangleCount: resultGeometry.getIndex()?.count ? resultGeometry.getIndex()!.count / 3 : 0,
      materialGroups: resultGeometry.groups.length,
    };

    logger.debug('[DEBUG][ManifoldCSGOperations] Intersection operation completed', result);

    return { success: true, data: result };
  } catch (error) {
    const errorMessage = `Intersection operation failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldCSGOperations] Intersection operation error', {
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Perform batch CSG operations for improved performance
 *
 * Processes multiple CSG operations in a single batch to optimize
 * WASM module loading and memory management.
 *
 * @param operations - Array of CSG operations to perform
 * @param options - Global options for all operations
 * @returns Result<CSGOperationResult[], string> with batch results
 */
export async function performBatchCSGOperations(
  operations: Array<{
    type: 'union' | 'subtract' | 'intersect';
    geometries: BufferGeometry[];
    baseGeometry?: BufferGeometry; // For subtract operations
  }>,
  options: CSGOperationOptions = {}
): Promise<Result<CSGOperationResult[], string>> {
  const startTime = performance.now();

  try {
    logger.debug('[DEBUG][ManifoldCSGOperations] Starting batch CSG operations', {
      operationCount: operations.length,
    });

    if (!operations || operations.length === 0) {
      return {
        success: false,
        error: 'Invalid input: At least one operation required for batch processing',
      };
    }

    const results: CSGOperationResult[] = [];

    // Process each operation
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      if (!operation) {
        return {
          success: false,
          error: `Batch operation ${i}: Operation is null or undefined`,
        };
      }
      let result: Result<CSGOperationResult, string>;

      switch (operation.type) {
        case 'union':
          result = await performUnion(operation.geometries, options);
          break;
        case 'subtract': {
          if (!operation.baseGeometry) {
            return {
              success: false,
              error: `Batch operation ${i}: Subtract operation requires baseGeometry`,
            };
          }
          const subtractGeometry = operation.geometries[0];
          if (!subtractGeometry) {
            return {
              success: false,
              error: `Batch operation ${i}: Subtract operation requires at least one geometry to subtract`,
            };
          }
          result = await performSubtraction(operation.baseGeometry, subtractGeometry, options);
          break;
        }
        case 'intersect':
          result = await performIntersection(operation.geometries, options);
          break;
        default:
          return {
            success: false,
            error: `Batch operation ${i}: Unknown operation type '${operation.type}'`,
          };
      }

      if (!result.success) {
        return {
          success: false,
          error: `Batch operation ${i} failed: ${result.error}`,
        };
      }

      results.push(result.data);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    logger.debug('[DEBUG][ManifoldCSGOperations] Batch CSG operations completed', {
      operationCount: operations.length,
      totalTime,
      averageTimePerOperation: totalTime / operations.length,
    });

    return { success: true, data: results };
  } catch (error) {
    const errorMessage = `Batch CSG operations failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldCSGOperations] Batch operations error', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
