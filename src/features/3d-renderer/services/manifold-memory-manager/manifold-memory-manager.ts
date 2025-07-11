/**
 * @file Manifold Memory Manager
 * RAII memory management for Manifold WASM resources with FinalizationRegistry safety nets
 * Part of Manifold CSG migration - Task 1.6
 */

import { logger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import type {
  ManifoldError,
  ManifoldMemoryStats,
  ManifoldResource,
} from '../manifold-types/manifold-types';
import {
  createManifoldError,
  createManifoldResource,
  createManifoldSuccess,
} from '../manifold-types/manifold-types';

/**
 * Global memory statistics (mutable for internal updates)
 */
let memoryStats = {
  totalAllocated: 0,
  totalFreed: 0,
  currentUsage: 0,
  peakUsage: 0,
  activeResources: 0,
};

/**
 * Set to track active resources
 */
const activeResources = new Set<ManifoldResource<any>>();

/**
 * Map to track resource metadata and disposal state
 */
const resourceMetadata = new WeakMap<
  object,
  { id: number; allocated: number; disposed: boolean }
>();

/**
 * Memory leak detection state
 */
let memoryLeakDetectionEnabled = false;

/**
 * Resource ID counter
 */
let resourceIdCounter = 0;

/**
 * Manifold Memory Manager class
 * Provides RAII memory management for WASM resources
 */
export class ManifoldMemoryManager {
  constructor() {
    logger.init('[MEMORY][ManifoldMemoryManager] Initializing memory manager');
  }

  /**
   * Get current memory statistics
   */
  getStats(): ManifoldMemoryStats {
    return { ...memoryStats };
  }

  /**
   * Clear all managed resources (for testing)
   */
  clearAll(): void {
    logger.debug('[MEMORY][ManifoldMemoryManager] Clearing all resources');

    // Dispose all active resources
    for (const resource of activeResources) {
      try {
        if (
          !resource.disposed &&
          resource.resource &&
          typeof resource.resource.delete === 'function'
        ) {
          resource.resource.delete();
        }
      } catch (error) {
        logger.error(
          `[MEMORY][ManifoldMemoryManager] Error disposing resource during clearAll: ${error}`
        );
      }
    }

    // Reset state
    activeResources.clear();
    memoryStats = {
      totalAllocated: 0,
      totalFreed: 0,
      currentUsage: 0,
      peakUsage: 0,
      activeResources: 0,
    };
  }

  /**
   * Enable memory leak detection
   */
  enableLeakDetection(): void {
    memoryLeakDetectionEnabled = true;
    logger.debug('[MEMORY][ManifoldMemoryManager] Memory leak detection enabled');
  }

  /**
   * Disable memory leak detection
   */
  disableLeakDetection(): void {
    memoryLeakDetectionEnabled = false;
    logger.debug('[MEMORY][ManifoldMemoryManager] Memory leak detection disabled');
  }
}

/**
 * Create a managed resource with RAII patterns
 */
export function createManagedResource<T extends { delete(): void }>(
  wasmObject: T
): Result<ManifoldResource<T>, string> {
  try {
    if (!wasmObject || typeof wasmObject.delete !== 'function') {
      return { success: false, error: 'Invalid WASM object: must have delete() method' };
    }

    const resourceId = ++resourceIdCounter;
    const managedResource = createManifoldResource(wasmObject);

    // Track in active resources
    activeResources.add(managedResource);

    // Store metadata
    resourceMetadata.set(wasmObject, {
      id: resourceId,
      allocated: Date.now(),
      disposed: false,
    });

    // Register with enhanced FinalizationRegistry for automatic cleanup
    enhancedFinalizationRegistry.register(managedResource, {
      resource: wasmObject,
      id: resourceId,
      resourceType: wasmObject.constructor?.name || 'Unknown',
    });

    // Update memory statistics
    memoryStats.totalAllocated++;
    memoryStats.currentUsage++;
    memoryStats.activeResources++;

    if (memoryStats.currentUsage > memoryStats.peakUsage) {
      memoryStats.peakUsage = memoryStats.currentUsage;
    }

    logger.debug(
      `[MEMORY][createManagedResource] Created resource ${resourceId}, active: ${memoryStats.activeResources}`
    );

    // Check for memory pressure
    checkMemoryPressure();

    return { success: true, data: managedResource };
  } catch (error) {
    const errorMessage = `Failed to create managed resource: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(`[MEMORY][createManagedResource] ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Dispose a managed resource
 */
export function disposeManagedResource<T extends { delete(): void }>(
  managedResource: ManifoldResource<T>
): Result<void, string> {
  try {
    // Get metadata to check disposal state
    const metadata = resourceMetadata.get(managedResource.resource);

    // Check if already disposed
    if (metadata?.disposed || managedResource.disposed) {
      return { success: false, error: 'Resource already disposed' };
    }

    // Check if resource is valid
    if (!managedResource.resource || typeof managedResource.resource.delete !== 'function') {
      return { success: false, error: 'Invalid resource: missing delete() method' };
    }

    const resourceId = metadata?.id || 'unknown';

    try {
      // Call the WASM delete method
      managedResource.resource.delete();
    } catch (deleteError) {
      const errorMessage = `WASM deletion failed: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`;
      logger.error(`[MEMORY][disposeManagedResource] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }

    // Mark as disposed in metadata
    if (metadata) {
      metadata.disposed = true;
    }

    // Remove from active resources
    activeResources.delete(managedResource);

    // Update memory statistics
    memoryStats.totalFreed++;
    memoryStats.currentUsage--;
    memoryStats.activeResources--;

    logger.debug(
      `[MEMORY][disposeManagedResource] Disposed resource ${resourceId}, active: ${memoryStats.activeResources}`
    );

    return { success: true, data: undefined };
  } catch (error) {
    const errorMessage = `Failed to dispose resource: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(`[MEMORY][disposeManagedResource] ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get current memory statistics
 */
export function getMemoryStats(): ManifoldMemoryStats {
  return {
    totalAllocated: memoryStats.totalAllocated,
    totalFreed: memoryStats.totalFreed,
    currentUsage: memoryStats.currentUsage,
    peakUsage: memoryStats.peakUsage,
    activeResources: memoryStats.activeResources,
  };
}

/**
 * Clear all managed resources
 */
export function clearAllResources(): void {
  const manager = new ManifoldMemoryManager();
  manager.clearAll();
}

/**
 * Enable memory leak detection
 */
export function enableMemoryLeakDetection(): void {
  memoryLeakDetectionEnabled = true;
  logger.debug('[MEMORY][enableMemoryLeakDetection] Memory leak detection enabled');
}

/**
 * Disable memory leak detection
 */
export function disableMemoryLeakDetection(): void {
  memoryLeakDetectionEnabled = false;
  logger.debug('[MEMORY][disableMemoryLeakDetection] Memory leak detection disabled');
}

/**
 * Check for memory leaks (if detection is enabled)
 */
export function checkForMemoryLeaks(): ManifoldMemoryStats & { leaksDetected: boolean } {
  const stats = getMemoryStats();
  const leaksDetected = memoryLeakDetectionEnabled && stats.activeResources > 0;

  if (leaksDetected) {
    logger.warn(
      `[MEMORY][checkForMemoryLeaks] Potential memory leaks detected: ${stats.activeResources} active resources`
    );
  }

  return {
    ...stats,
    leaksDetected,
  };
}

/**
 * Get detailed information about active resources (for debugging)
 */
export function getActiveResourcesInfo(): Array<{ id: number; allocated: number; age: number }> {
  const now = Date.now();
  const info: Array<{ id: number; allocated: number; age: number }> = [];

  for (const resource of activeResources) {
    const metadata = resourceMetadata.get(resource.resource);
    if (metadata && !metadata.disposed) {
      info.push({
        id: metadata.id,
        allocated: metadata.allocated,
        age: now - metadata.allocated,
      });
    }
  }

  return info.sort((a, b) => b.age - a.age); // Sort by age, oldest first
}

/**
 * Enhanced FinalizationRegistry safety net with resource validation
 */
const enhancedFinalizationRegistry = new FinalizationRegistry<{
  resource: any;
  id: number;
  resourceType: string;
}>((heldValue) => {
  logger.warn(
    `[MEMORY][FinalizationRegistry] Auto-cleaning up ${heldValue.resourceType} resource ${heldValue.id}`
  );

  try {
    // Validate resource before cleanup
    if (heldValue.resource && typeof heldValue.resource.delete === 'function') {
      // Check if resource is still valid (not already deleted)
      try {
        heldValue.resource.delete();
        logger.debug(
          `[MEMORY][FinalizationRegistry] Successfully auto-cleaned resource ${heldValue.id}`
        );
      } catch (deleteError) {
        // Resource might already be deleted, which is fine
        logger.debug(
          `[MEMORY][FinalizationRegistry] Resource ${heldValue.id} already cleaned or invalid: ${deleteError}`
        );
      }
    } else {
      logger.warn(`[MEMORY][FinalizationRegistry] Resource ${heldValue.id} has no delete method`);
    }
  } catch (error) {
    logger.error(
      `[MEMORY][FinalizationRegistry] Failed to auto-cleanup resource ${heldValue.id}: ${error}`
    );
  }
});

/**
 * Memory pressure monitoring
 */
let memoryPressureThreshold = 1000; // Default threshold for active resources
let memoryPressureCallback: ((stats: ManifoldMemoryStats) => void) | null = null;

/**
 * Set memory pressure monitoring
 */
export function setMemoryPressureMonitoring(
  threshold: number,
  callback: (stats: ManifoldMemoryStats) => void
): void {
  memoryPressureThreshold = threshold;
  memoryPressureCallback = callback;
  logger.debug(`[MEMORY][setMemoryPressureMonitoring] Set threshold to ${threshold} resources`);
}

/**
 * Check for memory pressure and trigger callback if needed
 */
function checkMemoryPressure(): void {
  if (memoryPressureCallback && memoryStats.activeResources >= memoryPressureThreshold) {
    logger.warn(
      `[MEMORY][checkMemoryPressure] Memory pressure detected: ${memoryStats.activeResources} >= ${memoryPressureThreshold}`
    );
    try {
      memoryPressureCallback(getMemoryStats());
    } catch (error) {
      logger.error(`[MEMORY][checkMemoryPressure] Error in pressure callback: ${error}`);
    }
  }
}

/**
 * Force garbage collection of disposed resources (cleanup utility)
 */
export function forceGarbageCollection(): { cleaned: number; errors: number } {
  logger.debug('[MEMORY][forceGarbageCollection] Starting forced cleanup');

  let cleaned = 0;
  let errors = 0;
  const resourcesToRemove: ManifoldResource<any>[] = [];

  // Find disposed resources that are still in the active set
  for (const resource of activeResources) {
    const metadata = resourceMetadata.get(resource.resource);
    if (metadata?.disposed || resource.disposed) {
      resourcesToRemove.push(resource);
    }
  }

  // Remove disposed resources from active set
  for (const resource of resourcesToRemove) {
    try {
      activeResources.delete(resource);
      cleaned++;
    } catch (error) {
      logger.error(`[MEMORY][forceGarbageCollection] Error removing resource: ${error}`);
      errors++;
    }
  }

  // Update stats to reflect cleanup
  memoryStats.activeResources = activeResources.size;
  memoryStats.currentUsage = activeResources.size;

  logger.debug(`[MEMORY][forceGarbageCollection] Cleaned ${cleaned} resources, ${errors} errors`);

  return { cleaned, errors };
}

/**
 * Get memory health report
 */
export function getMemoryHealthReport(): {
  stats: ManifoldMemoryStats;
  health: 'good' | 'warning' | 'critical';
  recommendations: string[];
} {
  const stats = getMemoryStats();
  const activeResourcesInfo = getActiveResourcesInfo();
  const recommendations: string[] = [];

  let health: 'good' | 'warning' | 'critical' = 'good';

  // Check for high resource count
  if (stats.activeResources > 500) {
    health = 'critical';
    recommendations.push(
      'High number of active resources detected. Consider disposing unused resources.'
    );
  } else if (stats.activeResources > 100) {
    health = 'warning';
    recommendations.push('Moderate number of active resources. Monitor for potential leaks.');
  }

  // Check for old resources (potential leaks)
  const oldResources = activeResourcesInfo.filter((r) => r.age > 60000); // 1 minute
  if (oldResources.length > 10) {
    health = health === 'good' ? 'warning' : 'critical';
    recommendations.push(
      `${oldResources.length} resources older than 1 minute detected. Check for memory leaks.`
    );
  }

  // Check memory efficiency
  const efficiency = stats.totalFreed / Math.max(stats.totalAllocated, 1);
  if (efficiency < 0.8 && stats.totalAllocated > 10) {
    health = health === 'good' ? 'warning' : health;
    recommendations.push(
      `Low disposal efficiency (${(efficiency * 100).toFixed(1)}%). Ensure proper resource cleanup.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Memory usage is healthy.');
  }

  return { stats, health, recommendations };
}
