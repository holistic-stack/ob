/**
 * @file Manifold Material Manager
 * Task 2.3: Add Material ID Reservation System (Green Phase)
 *
 * Manages material IDs for Manifold CSG operations using BabylonJS-inspired patterns
 * Following project guidelines:
 * - BabylonJS-inspired material ID reservation with `Manifold.reserveIDs()`
 * - Result<T,E> error handling patterns
 * - Integration with RAII memory management
 * - Prevention of material ID conflicts in multi-material CSG operations
 */

import { logger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import {
  createManagedResource,
  disposeManagedResource,
} from '../manifold-memory-manager/manifold-memory-manager';
import { ManifoldWasmLoader } from '../manifold-wasm-loader/manifold-wasm-loader';

/**
 * Material ID range reservation information
 */
export interface MaterialIDRange {
  startID: number; // Starting material ID
  endID: number; // Ending material ID (inclusive)
  count: number; // Number of IDs in range
  reservedAt: number; // Timestamp when reserved
}

/**
 * Material mapping between Three.js and Manifold
 */
export interface MaterialMapping {
  threeToManifold: Record<string, number>; // Three.js material ID -> Manifold material ID
  manifoldToThree: Record<number, string>; // Manifold material ID -> Three.js material ID
  reservedRange: MaterialIDRange; // Reserved ID range
  nextAvailableID: number; // Next available ID in range
}

/**
 * Material ID validation result
 */
export interface MaterialIDValidation {
  hasConflicts: boolean; // Whether conflicts were found
  totalReserved: number; // Total number of reserved IDs
  conflicts: Array<{
    // Conflict details
    range1: MaterialIDRange;
    range2: MaterialIDRange;
    overlapStart: number;
    overlapEnd: number;
  }>;
}

/**
 * MaterialIDManager configuration options
 */
export interface MaterialIDManagerOptions {
  maxMaterials?: number; // Maximum number of materials to support
  reservationSize?: number; // Size of ID reservation (default: 65536)
  autoExpand?: boolean; // Whether to auto-expand when running out of IDs
  cacheSize?: number; // Size of material lookup cache (default: 100)
  enableMetrics?: boolean; // Whether to collect performance metrics (default: false)
}

/**
 * Material ID performance metrics
 */
export interface MaterialIDMetrics {
  totalReservations: number; // Total number of reservations made
  totalMappings: number; // Total number of material mappings created
  cacheHits: number; // Number of cache hits
  cacheMisses: number; // Number of cache misses
  averageReservationTime: number; // Average time to reserve IDs (ms)
  averageMappingTime: number; // Average time to create mappings (ms)
}

/**
 * Reserve material IDs using Manifold.reserveIDs() pattern
 *
 * This function implements the BabylonJS-inspired material ID reservation
 * to prevent conflicts in multi-material CSG operations.
 *
 * @param count - Number of material IDs to reserve
 * @param manifoldModule - Optional pre-loaded Manifold WASM module
 * @returns Result<MaterialIDRange, string> with reservation details
 */
export async function reserveManifoldMaterialIDs(
  count: number,
  manifoldModule?: any
): Promise<Result<MaterialIDRange, string>> {
  try {
    logger.debug('[DEBUG][ManifoldMaterialManager] Reserving material IDs', { count });

    // Validate input
    if (count <= 0) {
      return {
        success: false,
        error: 'Invalid count: Must reserve at least 1 material ID',
      };
    }

    if (count > 1000000) {
      return {
        success: false,
        error: `Invalid count: Cannot reserve more than 1,000,000 IDs, requested ${count}`,
      };
    }

    // Load Manifold module if not provided
    if (!manifoldModule) {
      const loader = new ManifoldWasmLoader();
      const loadResult = await loader.load();
      if (!loadResult) {
        // Fallback to local ID management when WASM is not available
        return createLocalMaterialIDReservation(count);
      }
      manifoldModule = loadResult;
    }

    // Use Manifold.reserveIDs() if available
    if (manifoldModule && typeof manifoldModule.reserveIDs === 'function') {
      try {
        const startID = manifoldModule.reserveIDs(count);

        const reservation: MaterialIDRange = {
          startID,
          endID: startID + count - 1,
          count,
          reservedAt: Date.now(),
        };

        logger.debug(
          '[DEBUG][ManifoldMaterialManager] Material IDs reserved successfully',
          reservation
        );

        return { success: true, data: reservation };
      } catch (error) {
        logger.warn(
          '[WARN][ManifoldMaterialManager] Manifold.reserveIDs() failed, using fallback',
          { error }
        );
        return createLocalMaterialIDReservation(count);
      }
    } else {
      // Fallback when reserveIDs is not available
      return createLocalMaterialIDReservation(count);
    }
  } catch (error) {
    const errorMessage = `Failed to reserve material IDs: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldMaterialManager] Material ID reservation failed', {
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Create local material ID reservation when Manifold WASM is not available
 * Provides fallback functionality for material ID management
 */
let nextLocalID = 100000; // Start high to avoid conflicts with default IDs

function createLocalMaterialIDReservation(count: number): Result<MaterialIDRange, string> {
  try {
    const startID = nextLocalID;
    const endID = startID + count - 1;

    // Update next available ID
    nextLocalID = endID + 1;

    const reservation: MaterialIDRange = {
      startID,
      endID,
      count,
      reservedAt: Date.now(),
    };

    logger.debug(
      '[DEBUG][ManifoldMaterialManager] Local material ID reservation created',
      reservation
    );

    return { success: true, data: reservation };
  } catch (error) {
    const errorMessage = `Failed to create local material ID reservation: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Create material mapping for Three.js materials
 *
 * Maps Three.js material identifiers to reserved Manifold material IDs
 * to ensure consistent material handling in CSG operations.
 *
 * @param materials - Array of Three.js materials to map
 * @param reservedRange - Reserved material ID range
 * @param existingMapping - Optional existing mapping to update
 * @returns Result<MaterialMapping, string> with mapping details
 */
export function createMaterialMapping(
  materials: Array<{ id: string; name?: string }>,
  reservedRange: MaterialIDRange,
  existingMapping?: MaterialMapping
): Result<MaterialMapping, string> {
  try {
    logger.debug('[DEBUG][ManifoldMaterialManager] Creating material mapping', {
      materialCount: materials.length,
      reservedRange,
    });

    // Initialize mapping
    const threeToManifold: Record<string, number> = existingMapping?.threeToManifold || {};
    const manifoldToThree: Record<number, string> = existingMapping?.manifoldToThree || {};
    let nextAvailableID = existingMapping?.nextAvailableID || reservedRange.startID;

    // Map new materials
    for (const material of materials) {
      if (!threeToManifold[material.id]) {
        // Check if we have available IDs
        if (nextAvailableID > reservedRange.endID) {
          return {
            success: false,
            error: `Insufficient reserved material IDs: Need ${materials.length} but only have ${reservedRange.count} reserved`,
          };
        }

        // Assign new ID
        const manifoldID = nextAvailableID++;
        threeToManifold[material.id] = manifoldID;
        manifoldToThree[manifoldID] = material.id;

        logger.debug('[DEBUG][ManifoldMaterialManager] Mapped material', {
          threeID: material.id,
          manifoldID,
          name: material.name,
        });
      }
    }

    const mapping: MaterialMapping = {
      threeToManifold,
      manifoldToThree,
      reservedRange,
      nextAvailableID,
    };

    logger.debug('[DEBUG][ManifoldMaterialManager] Material mapping created successfully', {
      mappedCount: Object.keys(threeToManifold).length,
      nextAvailableID,
    });

    return { success: true, data: mapping };
  } catch (error) {
    const errorMessage = `Failed to create material mapping: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldMaterialManager] Material mapping failed', {
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Validate material ID ranges for conflicts
 *
 * Checks multiple material ID ranges to ensure no overlaps or conflicts
 * that could cause issues in CSG operations.
 *
 * @param ranges - Array of material ID ranges to validate
 * @returns Result<MaterialIDValidation, string> with validation results
 */
export function validateMaterialIDs(
  ranges: MaterialIDRange[]
): Result<MaterialIDValidation, string> {
  try {
    logger.debug('[DEBUG][ManifoldMaterialManager] Validating material ID ranges', {
      rangeCount: ranges.length,
    });

    const conflicts: MaterialIDValidation['conflicts'] = [];
    let totalReserved = 0;

    // Check each range against all others
    for (let i = 0; i < ranges.length; i++) {
      const range1 = ranges[i];
      totalReserved += range1.count;

      for (let j = i + 1; j < ranges.length; j++) {
        const range2 = ranges[j];

        // Check for overlap
        const overlapStart = Math.max(range1.startID, range2.startID);
        const overlapEnd = Math.min(range1.endID, range2.endID);

        if (overlapStart <= overlapEnd) {
          conflicts.push({
            range1,
            range2,
            overlapStart,
            overlapEnd,
          });
        }
      }
    }

    const validation: MaterialIDValidation = {
      hasConflicts: conflicts.length > 0,
      totalReserved,
      conflicts,
    };

    if (validation.hasConflicts) {
      logger.warn('[WARN][ManifoldMaterialManager] Material ID conflicts detected', {
        conflictCount: conflicts.length,
      });
    } else {
      logger.debug('[DEBUG][ManifoldMaterialManager] No material ID conflicts found');
    }

    return { success: true, data: validation };
  } catch (error) {
    const errorMessage = `Failed to validate material IDs: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldMaterialManager] Material ID validation failed', {
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * MaterialIDManager class for managing material IDs with automatic reservation
 *
 * This class provides a high-level interface for material ID management,
 * handling reservation, mapping, and cleanup automatically.
 */
export class MaterialIDManager {
  private options: Required<MaterialIDManagerOptions>;
  private reservation: MaterialIDRange | null = null;
  private mapping: MaterialMapping | null = null;
  private isInitialized = false;
  private managedResource: any = null;
  private materialCache: Map<string, number> = new Map();
  private metrics: MaterialIDMetrics = {
    totalReservations: 0,
    totalMappings: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageReservationTime: 0,
    averageMappingTime: 0,
  };

  constructor(options: MaterialIDManagerOptions = {}) {
    this.options = {
      maxMaterials: options.maxMaterials || 1000,
      reservationSize: options.reservationSize || 65536,
      autoExpand: options.autoExpand !== false,
      cacheSize: options.cacheSize || 100,
      enableMetrics: options.enableMetrics || false,
    };

    logger.debug('[DEBUG][MaterialIDManager] Created with options', this.options);
  }

  /**
   * Initialize the material ID manager
   * Reserves material IDs and sets up the mapping system
   */
  async initialize(): Promise<Result<void, string>> {
    try {
      if (this.isInitialized) {
        return { success: true, data: undefined };
      }

      logger.debug('[DEBUG][MaterialIDManager] Initializing material ID manager');

      // Reserve material IDs
      const reservationResult = await reserveManifoldMaterialIDs(this.options.reservationSize);
      if (!reservationResult.success) {
        return {
          success: false,
          error: `Failed to reserve material IDs: ${reservationResult.error}`,
        };
      }

      this.reservation = reservationResult.data;

      // Create initial empty mapping
      const mappingResult = createMaterialMapping([], this.reservation);
      if (!mappingResult.success) {
        return {
          success: false,
          error: `Failed to create material mapping: ${mappingResult.error}`,
        };
      }

      this.mapping = mappingResult.data;

      // Register with memory manager
      this.managedResource = createManagedResource(this);

      this.isInitialized = true;

      logger.debug('[DEBUG][MaterialIDManager] Initialized successfully', {
        reservedRange: this.reservation,
        reservationSize: this.options.reservationSize,
      });

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to initialize MaterialIDManager: ${error instanceof Error ? error.message : String(error)}`;
      logger.error('[ERROR][MaterialIDManager] Initialization failed', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get or create a Manifold material ID for a Three.js material
   * Optimized with caching for improved performance
   *
   * @param threeJSMaterialID - Three.js material identifier
   * @returns Manifold material ID
   */
  getMaterialID(threeJSMaterialID: string): number {
    const startTime = this.options.enableMetrics ? performance.now() : 0;

    if (!this.isInitialized || !this.mapping || !this.reservation) {
      throw new Error('MaterialIDManager not initialized. Call initialize() first.');
    }

    // Check cache first for performance
    if (this.materialCache.has(threeJSMaterialID)) {
      if (this.options.enableMetrics) {
        this.metrics.cacheHits++;
      }
      return this.materialCache.get(threeJSMaterialID)!;
    }

    // Check mapping
    if (this.mapping.threeToManifold[threeJSMaterialID] !== undefined) {
      const manifoldID = this.mapping.threeToManifold[threeJSMaterialID];

      // Update cache
      this.updateCache(threeJSMaterialID, manifoldID);

      if (this.options.enableMetrics) {
        this.metrics.cacheMisses++;
      }

      return manifoldID;
    }

    // Create new mapping
    const materials = [{ id: threeJSMaterialID }];
    const mappingResult = createMaterialMapping(materials, this.reservation, this.mapping);

    if (!mappingResult.success) {
      if (this.options.autoExpand) {
        // Try to expand reservation
        logger.warn('[WARN][MaterialIDManager] Attempting to expand material ID reservation');
        // For now, throw error - expansion could be implemented later
        throw new Error(`Material ID reservation exhausted: ${mappingResult.error}`);
      } else {
        throw new Error(`Failed to create material mapping: ${mappingResult.error}`);
      }
    }

    this.mapping = mappingResult.data;

    const manifoldID = this.mapping.threeToManifold[threeJSMaterialID];

    // Update cache
    this.updateCache(threeJSMaterialID, manifoldID);

    // Update metrics
    if (this.options.enableMetrics) {
      this.metrics.totalMappings++;
      this.metrics.cacheMisses++;
      const endTime = performance.now();
      this.updateAverageTime('mapping', endTime - startTime);
    }

    logger.debug('[DEBUG][MaterialIDManager] Created new material mapping', {
      threeJSMaterialID,
      manifoldID,
    });

    return manifoldID;
  }

  /**
   * Get Three.js material ID from Manifold material ID
   *
   * @param manifoldMaterialID - Manifold material ID
   * @returns Three.js material ID or undefined if not found
   */
  getThreeJSMaterialID(manifoldMaterialID: number): string | undefined {
    if (!this.isInitialized || !this.mapping) {
      throw new Error('MaterialIDManager not initialized. Call initialize() first.');
    }

    return this.mapping.manifoldToThree[manifoldMaterialID];
  }

  /**
   * Get current material mapping statistics
   * Enhanced with performance metrics and cache statistics
   */
  getStats(): {
    totalReserved: number;
    totalUsed: number;
    availableIDs: number;
    isInitialized: boolean;
    cacheSize: number;
    cacheHitRate: number;
    metrics?: MaterialIDMetrics;
  } {
    if (!this.isInitialized || !this.mapping || !this.reservation) {
      return {
        totalReserved: 0,
        totalUsed: 0,
        availableIDs: 0,
        isInitialized: false,
        cacheSize: 0,
        cacheHitRate: 0,
        metrics: this.options.enableMetrics ? this.metrics : undefined,
      };
    }

    const totalUsed = Object.keys(this.mapping.threeToManifold).length;
    const availableIDs = this.reservation.count - totalUsed;
    const totalCacheAccess = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheAccess > 0 ? this.metrics.cacheHits / totalCacheAccess : 0;

    return {
      totalReserved: this.reservation.count,
      totalUsed,
      availableIDs,
      isInitialized: this.isInitialized,
      cacheSize: this.materialCache.size,
      cacheHitRate,
      metrics: this.options.enableMetrics ? this.metrics : undefined,
    };
  }

  /**
   * Dispose of the material ID manager and clean up resources
   */
  dispose(): Result<void, string> {
    try {
      logger.debug('[DEBUG][MaterialIDManager] Disposing material ID manager');

      // Dispose managed resource
      if (this.managedResource) {
        disposeManagedResource(this.managedResource);
        this.managedResource = null;
      }

      // Clear state
      this.reservation = null;
      this.mapping = null;
      this.isInitialized = false;
      this.materialCache.clear();

      logger.debug('[DEBUG][MaterialIDManager] Disposed successfully');

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to dispose MaterialIDManager: ${error instanceof Error ? error.message : String(error)}`;
      logger.error('[ERROR][MaterialIDManager] Disposal failed', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update material cache with LRU eviction
   * Private helper method for cache management
   */
  private updateCache(threeJSMaterialID: string, manifoldID: number): void {
    // Remove oldest entry if cache is full
    if (this.materialCache.size >= this.options.cacheSize) {
      const firstKey = this.materialCache.keys().next().value;
      if (firstKey) {
        this.materialCache.delete(firstKey);
      }
    }

    // Add new entry
    this.materialCache.set(threeJSMaterialID, manifoldID);
  }

  /**
   * Update average timing metrics
   * Private helper method for performance tracking
   */
  private updateAverageTime(operation: 'reservation' | 'mapping', newTime: number): void {
    if (operation === 'reservation') {
      const count = this.metrics.totalReservations;
      this.metrics.averageReservationTime =
        (this.metrics.averageReservationTime * count + newTime) / (count + 1);
    } else {
      const count = this.metrics.totalMappings;
      this.metrics.averageMappingTime =
        (this.metrics.averageMappingTime * count + newTime) / (count + 1);
    }
  }

  /**
   * Clear performance metrics
   * Useful for resetting statistics during testing or monitoring
   */
  clearMetrics(): void {
    this.metrics = {
      totalReservations: 0,
      totalMappings: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageReservationTime: 0,
      averageMappingTime: 0,
    };

    logger.debug('[DEBUG][MaterialIDManager] Metrics cleared');
  }

  /**
   * Optimize cache by removing unused entries
   * Can be called periodically to maintain cache efficiency
   */
  optimizeCache(): void {
    if (!this.mapping) return;

    // Remove cache entries that are no longer in the mapping
    const validIDs = new Set(Object.keys(this.mapping.threeToManifold));

    for (const [threeID] of this.materialCache) {
      if (!validIDs.has(threeID)) {
        this.materialCache.delete(threeID);
      }
    }

    logger.debug('[DEBUG][MaterialIDManager] Cache optimized', {
      cacheSize: this.materialCache.size,
      validMappings: validIDs.size,
    });
  }
}
