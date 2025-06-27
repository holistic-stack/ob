/**
 * Matrix Configuration
 * 
 * Centralized configuration for matrix operations, performance thresholds,
 * and operational parameters following bulletproof-react configuration patterns.
 */

export const MATRIX_CONFIG = {
  /**
   * Performance thresholds for matrix operations
   */
  performance: {
    /** Maximum matrix size for direct operations (rows * cols) */
    maxDirectOperationSize: 10000,
    /** Maximum matrix size for cached operations */
    maxCacheableSize: 1000000,
    /** Matrix operation timeout in milliseconds */
    operationTimeout: 5000,
    /** Maximum memory usage for matrix operations (bytes) */
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    /** Performance monitoring threshold (ms) */
    performanceThreshold: 16, // <16ms requirement
    /** Large matrix threshold for special handling */
    largeMatrixThreshold: 1000000,
    /** Batch operation size for large matrices */
    batchSize: 10000
  },

  /**
   * Caching configuration
   */
  cache: {
    /** Maximum number of cached matrices */
    maxCacheSize: 100,
    /** Cache TTL in milliseconds */
    cacheTTL: 300000, // 5 minutes
    /** Enable LRU eviction */
    enableLRU: true,
    /** Cache key prefix */
    keyPrefix: 'matrix_',
    /** Enable cache compression */
    enableCompression: false,
    /** Cache memory limit (bytes) */
    memoryLimit: 50 * 1024 * 1024 // 50MB
  },

  /**
   * Matrix operation defaults
   */
  operations: {
    /** Default precision for floating point operations */
    precision: 1e-10,
    /** Enable parallel processing for large matrices */
    enableParallel: true,
    /** Number of worker threads for parallel operations */
    workerThreads: 4,
    /** Enable SIMD optimizations */
    enableSIMD: true,
    /** Default matrix initialization value */
    defaultValue: 0,
    /** Enable bounds checking */
    enableBoundsChecking: true
  },

  /**
   * Three.js integration settings
   */
  threeJS: {
    /** Enable automatic Three.js matrix conversion */
    enableAutoConversion: true,
    /** Cache Three.js matrix conversions */
    cacheConversions: true,
    /** Three.js matrix update threshold */
    updateThreshold: 1e-6,
    /** Enable matrix decomposition caching */
    cacheDecompositions: true,
    /** Maximum cached decompositions */
    maxDecompositions: 50
  },

  /**
   * CSG integration settings
   */
  csg: {
    /** Enable matrix-optimized CSG operations */
    enableMatrixCSG: true,
    /** Matrix-based transformation threshold */
    transformationThreshold: 100,
    /** Enable batch transformations */
    enableBatchTransforms: true,
    /** Batch transformation size */
    batchTransformSize: 1000,
    /** Enable transformation caching */
    cacheTransformations: true
  },

  /**
   * Debugging and monitoring
   */
  debug: {
    /** Enable performance logging */
    enablePerformanceLogging: true,
    /** Enable operation tracing */
    enableTracing: false,
    /** Log level for matrix operations */
    logLevel: 'INFO' as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    /** Enable memory usage monitoring */
    enableMemoryMonitoring: true,
    /** Performance log interval (ms) */
    performanceLogInterval: 10000
  },

  /**
   * Error handling configuration
   */
  errorHandling: {
    /** Enable automatic error recovery */
    enableAutoRecovery: true,
    /** Maximum retry attempts */
    maxRetries: 3,
    /** Retry delay in milliseconds */
    retryDelay: 1000,
    /** Enable fallback to simple operations */
    enableFallback: true,
    /** Timeout for error recovery */
    recoveryTimeout: 2000
  }
} as const;

/**
 * Type for matrix configuration
 */
export type MatrixConfig = typeof MATRIX_CONFIG;

/**
 * Get performance thresholds
 */
export const getPerformanceThresholds = () => MATRIX_CONFIG.performance;

/**
 * Get cache configuration
 */
export const getCacheConfig = () => MATRIX_CONFIG.cache;

/**
 * Get operation defaults
 */
export const getOperationDefaults = () => MATRIX_CONFIG.operations;

/**
 * Get Three.js integration settings
 */
export const getThreeJSConfig = () => MATRIX_CONFIG.threeJS;

/**
 * Get CSG integration settings
 */
export const getCSGConfig = () => MATRIX_CONFIG.csg;

/**
 * Validate if matrix size is within performance limits
 */
export const isMatrixSizeValid = (rows: number, cols: number): boolean => {
  const size = rows * cols;
  return size <= MATRIX_CONFIG.performance.maxDirectOperationSize;
};

/**
 * Validate if matrix is cacheable
 */
export const isMatrixCacheable = (rows: number, cols: number): boolean => {
  const size = rows * cols;
  return size <= MATRIX_CONFIG.performance.maxCacheableSize;
};

/**
 * Check if matrix is considered large
 */
export const isLargeMatrix = (rows: number, cols: number): boolean => {
  const size = rows * cols;
  return size >= MATRIX_CONFIG.performance.largeMatrixThreshold;
};

/**
 * Get recommended batch size for matrix operations
 */
export const getBatchSize = (matrixSize: number): number => {
  if (matrixSize <= MATRIX_CONFIG.performance.batchSize) {
    return matrixSize;
  }
  return MATRIX_CONFIG.performance.batchSize;
};

/**
 * Validate memory usage for matrix operation
 */
export const isMemoryUsageValid = (estimatedBytes: number): boolean => {
  return estimatedBytes <= MATRIX_CONFIG.performance.maxMemoryUsage;
};

/**
 * Get cache key for matrix operation
 */
export const getCacheKey = (operation: string, ...params: (string | number)[]): string => {
  return `${MATRIX_CONFIG.cache.keyPrefix}${operation}_${params.join('_')}`;
};

/**
 * Check if operation should use parallel processing
 */
export const shouldUseParallel = (matrixSize: number): boolean => {
  return MATRIX_CONFIG.operations.enableParallel && 
         matrixSize >= MATRIX_CONFIG.performance.largeMatrixThreshold;
};

/**
 * Get worker thread count for parallel operations
 */
export const getWorkerThreadCount = (): number => {
  return Math.min(MATRIX_CONFIG.operations.workerThreads, navigator.hardwareConcurrency || 4);
};

/**
 * Validate matrix operation timeout
 */
export const getOperationTimeout = (matrixSize: number): number => {
  const baseTimeout = MATRIX_CONFIG.performance.operationTimeout;
  const sizeMultiplier = Math.max(1, matrixSize / MATRIX_CONFIG.performance.maxDirectOperationSize);
  return Math.min(baseTimeout * sizeMultiplier, baseTimeout * 5);
};
