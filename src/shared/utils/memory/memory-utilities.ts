/**
 * @file memory-utilities.ts
 * @description Reusable memory management utilities extracted from existing services.
 * Provides memory pressure detection, resource size estimation, memory statistics calculation,
 * and memory monitoring patterns to eliminate code duplication and improve reusability across the codebase.
 *
 * @example
 * ```typescript
 * // Memory pressure detection
 * const detector = new MemoryPressureDetector();
 * const pressure = detector.detectPressure();
 *
 * // Resource size estimation
 * const estimator = new ResourceSizeEstimator();
 * const sizeMB = estimator.estimateSize(resource);
 *
 * // Memory statistics calculation
 * const calculator = new MemoryStatisticsCalculator();
 * const score = calculator.calculateEfficiencyScore(cacheStats, poolStats);
 *
 * // Memory monitoring
 * const monitor = new MemoryMonitor();
 * const snapshot = monitor.takeSnapshot();
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

/**
 * Memory pressure levels
 */
export type MemoryPressureLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

/**
 * Memory pressure information
 */
export interface MemoryPressureInfo {
  readonly level: MemoryPressureLevel;
  readonly usagePercentage: number;
  readonly usedMB: number;
  readonly totalMB: number;
  readonly recommendedAction: string;
}

/**
 * Memory usage snapshot
 */
export interface MemorySnapshot {
  readonly timestamp: number;
  readonly usagePercentage: number;
  readonly usedMB: number;
  readonly totalMB: number;
  readonly pressure: MemoryPressureLevel;
}

/**
 * Memory usage trend
 */
export type MemoryTrend = 'increasing' | 'decreasing' | 'stable';

/**
 * Generic resource interface for size estimation
 */
export interface Resource {
  readonly type?: string;
  readonly id?: string;
  readonly metadata?: {
    readonly estimatedSizeMB?: number;
  };
  readonly geometry?: {
    getVerticesData?: (kind: string) => Float32Array | null;
    getIndices?: () => Uint32Array | null;
  };
  readonly getSize?: () => { width: number; height: number };
}

/**
 * Memory pressure detector for detecting memory usage levels
 */
export class MemoryPressureDetector {
  /**
   * Detect current memory pressure
   *
   * @returns Memory pressure information
   */
  detectPressure(): MemoryPressureInfo {
    // Use performance.memory if available (Chrome/Edge)
    if (this.hasPerformanceMemory()) {
      const memory = this.getPerformanceMemory();
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      const totalMB = memory.totalJSHeapSize / (1024 * 1024);
      const usagePercentage = (usedMB / totalMB) * 100;

      const level = this.classifyPressureLevel(usagePercentage);
      const recommendedAction = this.generateRecommendation(level);

      return {
        level,
        usagePercentage,
        usedMB,
        totalMB,
        recommendedAction,
      };
    }

    // Fallback for browsers without performance.memory
    return {
      level: 'unknown',
      usagePercentage: 0,
      usedMB: 0,
      totalMB: 0,
      recommendedAction: 'Memory monitoring not available',
    };
  }

  /**
   * Classify memory pressure level based on usage percentage
   *
   * @param usagePercentage - Memory usage percentage
   * @returns Memory pressure level
   */
  classifyPressureLevel(usagePercentage: number): MemoryPressureLevel {
    if (usagePercentage >= 90) return 'critical';
    if (usagePercentage >= 80) return 'high';
    if (usagePercentage >= 60) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendation based on pressure level
   *
   * @param level - Memory pressure level
   * @returns Recommended action
   */
  generateRecommendation(level: MemoryPressureLevel): string {
    switch (level) {
      case 'critical':
        return 'Immediate cleanup required - dispose unused resources';
      case 'high':
        return 'Perform cleanup - free pooled resources';
      case 'medium':
        return 'Monitor usage - consider cleanup if needed';
      case 'low':
        return 'Memory usage is healthy';
      default:
        return 'Memory monitoring not available';
    }
  }

  /**
   * Check if performance.memory is available
   */
  private hasPerformanceMemory(): boolean {
    return (
      typeof performance !== 'undefined' &&
      (performance as Performance & { memory?: unknown }).memory !== undefined
    );
  }

  /**
   * Get performance.memory object
   */
  private getPerformanceMemory(): {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } {
    return (
      performance as Performance & {
        memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      }
    ).memory;
  }
}

/**
 * Resource size estimator for calculating memory usage of different resource types
 */
export class ResourceSizeEstimator {
  /**
   * Estimate memory size of a resource
   *
   * @param resource - Resource to estimate
   * @returns Estimated size in MB
   */
  estimateSize(resource: Resource): number {
    // Check if metadata already has size estimate
    if (resource.metadata?.estimatedSizeMB) {
      return resource.metadata.estimatedSizeMB;
    }

    // Estimate based on resource type
    if (resource.geometry) {
      return this.estimateMeshSize(resource);
    }

    if (resource.getSize) {
      return this.estimateTextureSize(resource);
    }

    // Default fallback
    return 0.1; // 100KB default
  }

  /**
   * Estimate total size for multiple resources
   *
   * @param resources - Array of resources
   * @returns Total estimated size in MB
   */
  estimateBatchSize(resources: readonly Resource[]): number {
    return resources.reduce((total, resource) => total + this.estimateSize(resource), 0);
  }

  /**
   * Estimate mesh resource size
   */
  private estimateMeshSize(resource: Resource): number {
    if (!resource.geometry) return 0.1;

    try {
      const vertexData = resource.geometry.getVerticesData?.('position');
      const indexData = resource.geometry.getIndices?.();

      const vertexBytes = vertexData ? vertexData.length * 4 : 0; // 4 bytes per float
      const indexBytes = indexData ? indexData.length * 4 : 0; // 4 bytes per index

      return (vertexBytes + indexBytes) / (1024 * 1024); // Convert to MB
    } catch {
      return 0.1; // Fallback on error
    }
  }

  /**
   * Estimate texture resource size
   */
  private estimateTextureSize(resource: Resource): number {
    if (!resource.getSize) return 0.1;

    try {
      const size = resource.getSize();
      const pixels = size.width * size.height;
      const bytes = pixels * 4; // Assume RGBA (4 bytes per pixel)

      return bytes / (1024 * 1024); // Convert to MB
    } catch {
      return 0.1; // Fallback on error
    }
  }
}

/**
 * Memory statistics calculator for performance monitoring and efficiency scoring
 */
export class MemoryStatisticsCalculator {
  /**
   * Calculate memory efficiency score (0-100)
   *
   * @param cacheStats - Cache statistics
   * @param poolStats - Pool statistics
   * @returns Efficiency score
   */
  calculateEfficiencyScore(
    cacheStats: { hitRate: number; totalMemoryMB: number },
    poolStats: { memoryPressure: { level: MemoryPressureLevel }; estimatedMemoryMB: number }
  ): number {
    // Base score from cache hit rate (0-50 points)
    const cacheScore = cacheStats.hitRate * 50;

    // Memory pressure penalty (0-30 points)
    const pressurePenalty = this.calculatePressurePenalty(poolStats.memoryPressure.level);
    const pressureScore = 30 - pressurePenalty;

    // Memory usage efficiency (0-20 points)
    const totalMemory = cacheStats.totalMemoryMB + poolStats.estimatedMemoryMB;
    const memoryScore = Math.max(0, 20 - (totalMemory / 100) * 5); // Penalty for high memory usage

    return Math.min(100, Math.max(0, cacheScore + pressureScore + memoryScore));
  }

  /**
   * Generate memory recommendations based on current state
   *
   * @param cacheStats - Cache statistics
   * @param poolStats - Pool statistics
   * @returns Array of recommendations
   */
  generateRecommendations(
    cacheStats: { hitRate: number; totalMemoryMB: number },
    poolStats: {
      memoryPressure: { level: MemoryPressureLevel };
      pooledResources: number;
      estimatedMemoryMB: number;
    }
  ): string[] {
    const recommendations: string[] = [];

    // Memory pressure recommendations
    if (poolStats.memoryPressure.level === 'critical') {
      recommendations.push('Immediate cleanup required - memory pressure critical');
    } else if (poolStats.memoryPressure.level === 'high') {
      recommendations.push('Perform memory cleanup - high memory pressure detected');
    }

    // Cache efficiency recommendations
    if (cacheStats.hitRate < 0.5) {
      recommendations.push('Optimize cache strategy - low hit rate detected');
    }

    // Pool size recommendations
    if (poolStats.pooledResources > 80) {
      recommendations.push('Consider reducing pool size - high resource count');
    }

    // Memory usage recommendations
    const totalMemory = cacheStats.totalMemoryMB + poolStats.estimatedMemoryMB;
    if (totalMemory > 200) {
      recommendations.push('High memory usage detected - consider optimization');
    }

    return recommendations;
  }

  /**
   * Calculate pressure penalty for efficiency scoring
   */
  private calculatePressurePenalty(level: MemoryPressureLevel): number {
    switch (level) {
      case 'critical':
        return 30;
      case 'high':
        return 20;
      case 'medium':
        return 10;
      case 'low':
        return 0;
      default:
        return 5;
    }
  }
}

/**
 * Memory monitor for real-time memory usage tracking
 */
export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private detector = new MemoryPressureDetector();

  /**
   * Take a memory usage snapshot
   *
   * @returns Memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const pressure = this.detector.detectPressure();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usagePercentage: pressure.usagePercentage,
      usedMB: pressure.usedMB,
      totalMB: pressure.totalMB,
      pressure: pressure.level,
    };

    this.snapshots.push(snapshot);

    // Keep only last 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots = this.snapshots.slice(-100);
    }

    return snapshot;
  }

  /**
   * Get memory usage trend
   *
   * @returns Memory trend
   */
  getUsageTrend(): MemoryTrend {
    if (this.snapshots.length < 3) return 'stable';

    const recent = this.snapshots.slice(-3);
    const first = recent[0].usagePercentage;
    const last = recent[recent.length - 1].usagePercentage;
    const diff = last - first;

    if (diff > 5) return 'increasing';
    if (diff < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Detect potential memory leak
   *
   * @returns True if memory leak detected
   */
  detectMemoryLeak(): boolean {
    if (this.snapshots.length < 5) return false;

    const recent = this.snapshots.slice(-5);
    let increasingCount = 0;

    for (let i = 1; i < recent.length; i++) {
      if (recent[i].usagePercentage > recent[i - 1].usagePercentage) {
        increasingCount++;
      }
    }

    // Consider it a leak if memory increased in 4 out of 5 recent snapshots
    return increasingCount >= 4;
  }
}

/**
 * Resource lifecycle manager for tracking resource creation and disposal
 */
export class ResourceLifecycleManager {
  private trackedResources = new Map<string, { resource: Resource; createdAt: number }>();

  /**
   * Track a resource
   *
   * @param resource - Resource to track
   */
  trackResource(resource: Resource): void {
    if (resource.id) {
      this.trackedResources.set(resource.id, {
        resource,
        createdAt: Date.now(),
      });
    }
  }

  /**
   * Dispose a tracked resource
   *
   * @param resourceId - ID of resource to dispose
   */
  disposeResource(resourceId: string): void {
    this.trackedResources.delete(resourceId);
  }

  /**
   * Get count of tracked resources
   *
   * @returns Number of tracked resources
   */
  getTrackedResourceCount(): number {
    return this.trackedResources.size;
  }

  /**
   * Get cleanup candidates based on age
   *
   * @param maxAgeMs - Maximum age in milliseconds
   * @returns Array of resource IDs for cleanup
   */
  getCleanupCandidates(maxAgeMs: number): string[] {
    const now = Date.now();
    const candidates: string[] = [];

    for (const [id, entry] of this.trackedResources.entries()) {
      if (now - entry.createdAt > maxAgeMs) {
        candidates.push(id);
      }
    }

    return candidates;
  }
}

/**
 * Detect memory pressure (standalone utility)
 *
 * @returns Memory pressure information
 */
export function detectMemoryPressure(): MemoryPressureInfo {
  const detector = new MemoryPressureDetector();
  return detector.detectPressure();
}

/**
 * Estimate resource size (standalone utility)
 *
 * @param resource - Resource to estimate
 * @returns Estimated size in MB
 */
export function estimateResourceSize(resource: Resource): number {
  const estimator = new ResourceSizeEstimator();
  return estimator.estimateSize(resource);
}

/**
 * Calculate memory efficiency score (standalone utility)
 *
 * @param cacheStats - Cache statistics
 * @param poolStats - Pool statistics
 * @returns Efficiency score (0-100)
 */
export function calculateMemoryEfficiencyScore(
  cacheStats: { hitRate: number; totalMemoryMB: number },
  poolStats: { memoryPressure: { level: MemoryPressureLevel }; estimatedMemoryMB: number }
): number {
  const calculator = new MemoryStatisticsCalculator();
  return calculator.calculateEfficiencyScore(cacheStats, poolStats);
}

/**
 * Generate memory recommendations (standalone utility)
 *
 * @param cacheStats - Cache statistics
 * @param poolStats - Pool statistics
 * @returns Array of recommendations
 */
export function generateMemoryRecommendations(
  cacheStats: { hitRate: number; totalMemoryMB: number },
  poolStats: {
    memoryPressure: { level: MemoryPressureLevel };
    pooledResources: number;
    estimatedMemoryMB: number;
  }
): string[] {
  const calculator = new MemoryStatisticsCalculator();
  return calculator.generateRecommendations(cacheStats, poolStats);
}
