/**
 * @file performance-debounce-config.ts
 * @description High-performance debouncing configuration optimized for <10ms frame times.
 * Provides aggressive optimization settings for render performance improvements.
 *
 * @example
 * ```typescript
 * import { HIGH_PERFORMANCE_DEBOUNCE_CONFIG } from '@/shared/config/performance-debounce-config';
 *
 * // Use for high-performance rendering
 * const debouncedRender = debounce(renderAST, HIGH_PERFORMANCE_DEBOUNCE_CONFIG.renderDelayMs);
 *
 * // Use for real-time parsing
 * const debouncedParse = debounce(parseCode, HIGH_PERFORMANCE_DEBOUNCE_CONFIG.parseDelayMs);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import type { DebounceConfig } from '@/shared';

/**
 * High-performance debouncing configuration for <10ms frame times
 *
 * Optimized for maximum responsiveness and smooth 60+ FPS rendering.
 * These settings prioritize performance over battery life and CPU usage.
 */
export const HIGH_PERFORMANCE_DEBOUNCE_CONFIG: Readonly<DebounceConfig> = Object.freeze({
  parseDelayMs: 50, // Ultra-fast parsing for immediate feedback
  renderDelayMs: 16, // 60 FPS target (16.67ms per frame)
  saveDelayMs: 500, // Frequent auto-save for data safety
} as const);

/**
 * Ultra-high-performance debouncing for 120+ FPS displays
 *
 * Designed for high-refresh displays and gaming scenarios.
 * Requires powerful hardware and may impact battery life.
 */
export const ULTRA_PERFORMANCE_DEBOUNCE_CONFIG: Readonly<DebounceConfig> = Object.freeze({
  parseDelayMs: 25, // Near-instant parsing
  renderDelayMs: 8, // 120 FPS target (8.33ms per frame)
  saveDelayMs: 250, // Very frequent auto-save
} as const);

/**
 * Balanced performance configuration for production use
 *
 * Provides good performance while maintaining reasonable resource usage.
 * Suitable for most production deployments.
 */
export const BALANCED_PERFORMANCE_DEBOUNCE_CONFIG: Readonly<DebounceConfig> = Object.freeze({
  parseDelayMs: 100, // Fast parsing with reasonable CPU usage
  renderDelayMs: 33, // 30 FPS target (33.33ms per frame)
  saveDelayMs: 1000, // Standard auto-save interval
} as const);

/**
 * Performance configuration for low-end devices
 *
 * Optimized for devices with limited CPU/GPU resources.
 * Prioritizes stability over maximum performance.
 */
export const LOW_END_PERFORMANCE_DEBOUNCE_CONFIG: Readonly<DebounceConfig> = Object.freeze({
  parseDelayMs: 200, // Conservative parsing to avoid overwhelming CPU
  renderDelayMs: 66, // 15 FPS target (66.67ms per frame)
  saveDelayMs: 2000, // Less frequent auto-save to reduce I/O
} as const);

/**
 * Performance targets for different configurations
 */
export const PERFORMANCE_TARGETS = Object.freeze({
  ULTRA: {
    targetFPS: 120,
    maxFrameTime: 8.33,
    maxParseTime: 25,
    description: 'Ultra-high performance for gaming/high-refresh displays',
  },
  HIGH: {
    targetFPS: 60,
    maxFrameTime: 16.67,
    maxParseTime: 50,
    description: 'High performance for smooth interaction',
  },
  BALANCED: {
    targetFPS: 30,
    maxFrameTime: 33.33,
    maxParseTime: 100,
    description: 'Balanced performance for production use',
  },
  LOW_END: {
    targetFPS: 15,
    maxFrameTime: 66.67,
    maxParseTime: 200,
    description: 'Conservative performance for low-end devices',
  },
} as const);

/**
 * Automatically select performance configuration based on device capabilities
 *
 * @returns Appropriate debounce configuration for the current device
 */
export const getOptimalPerformanceConfig = (): Readonly<DebounceConfig> => {
  // Check for high-refresh display
  if (typeof window !== 'undefined' && window.screen) {
    const refreshRate = (window.screen as any).refreshRate;
    if (refreshRate && refreshRate >= 120) {
      return ULTRA_PERFORMANCE_DEBOUNCE_CONFIG;
    }
  }

  // Check for hardware acceleration support
  if (typeof window !== 'undefined' && window.navigator) {
    const hardwareConcurrency = window.navigator.hardwareConcurrency || 1;
    const memory = (window.navigator as Navigator & { deviceMemory?: number }).deviceMemory || 1;

    // High-end device detection
    if (hardwareConcurrency >= 8 && memory >= 8) {
      return HIGH_PERFORMANCE_DEBOUNCE_CONFIG;
    }

    // Low-end device detection
    if (hardwareConcurrency <= 2 || memory <= 2) {
      return LOW_END_PERFORMANCE_DEBOUNCE_CONFIG;
    }
  }

  // Default to balanced configuration
  return BALANCED_PERFORMANCE_DEBOUNCE_CONFIG;
};

/**
 * Create custom performance configuration with validation
 *
 * @param targetFPS - Target frames per second
 * @param parseDelayMs - Optional custom parse delay
 * @returns Validated performance configuration
 */
export const createPerformanceConfig = (
  targetFPS: number,
  parseDelayMs?: number
): Readonly<DebounceConfig> => {
  if (targetFPS <= 0 || targetFPS > 240) {
    throw new Error(`Invalid target FPS: ${targetFPS}. Must be between 1 and 240.`);
  }

  const renderDelayMs = Math.floor(1000 / targetFPS);
  const calculatedParseDelayMs = parseDelayMs ?? Math.max(renderDelayMs * 2, 25);

  return Object.freeze({
    parseDelayMs: calculatedParseDelayMs,
    renderDelayMs,
    saveDelayMs: Math.max(renderDelayMs * 30, 500), // 30 frames worth of delay
  } as const);
};

/**
 * Performance monitoring utilities
 */
export const PERFORMANCE_MONITORING = Object.freeze({
  /**
   * Check if current performance meets target
   */
  meetsPerformanceTarget: (actualFrameTime: number, config: DebounceConfig): boolean => {
    return actualFrameTime <= config.renderDelayMs;
  },

  /**
   * Calculate performance score (0-100)
   */
  calculatePerformanceScore: (actualFrameTime: number, targetFrameTime: number): number => {
    if (actualFrameTime <= targetFrameTime) return 100;
    const ratio = targetFrameTime / actualFrameTime;
    const score = ratio * 100;
    return Math.max(0, Math.min(100, score));
  },

  /**
   * Get performance recommendation based on current metrics
   */
  getPerformanceRecommendation: (
    averageFrameTime: number,
    currentConfig: DebounceConfig
  ): {
    recommendation: 'upgrade' | 'downgrade' | 'maintain';
    suggestedConfig: DebounceConfig;
    reason: string;
  } => {
    const currentTarget = currentConfig.renderDelayMs;

    if (averageFrameTime < currentTarget * 0.5) {
      // Performance is much better than target, can upgrade
      return {
        recommendation: 'upgrade',
        suggestedConfig: createPerformanceConfig(Math.floor(1000 / (averageFrameTime * 1.2))),
        reason: 'Performance significantly exceeds target, can increase quality',
      };
    }

    if (averageFrameTime > currentTarget * 1.5) {
      // Performance is worse than target, should downgrade
      return {
        recommendation: 'downgrade',
        suggestedConfig: createPerformanceConfig(Math.floor(1000 / (averageFrameTime * 0.8))),
        reason: 'Performance below target, should reduce quality for stability',
      };
    }

    // Performance is within acceptable range
    return {
      recommendation: 'maintain',
      suggestedConfig: currentConfig,
      reason: 'Performance within acceptable range',
    };
  },
} as const);
