/**
 * OpenSCAD Parser Manager
 *
 * Comprehensive parser manager for @holistic-stack/openscad-parser integration
 * with lifecycle management, caching, performance monitoring, and functional patterns.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import { OpenscadParser, SimpleErrorHandler } from '@holistic-stack/openscad-parser';
import type { AsyncResult, Result } from '../../../shared/types/result.types.js';
import {
  error,
  success,
  tryCatch,
  tryCatchAsync,
} from '../../../shared/utils/functional/result.js';
import type {
  ASTOptimizationResult,
  ASTValidationResult,
  CacheEntry,
  ParseResult,
  ParserConfig,
  ParserContext,
  ParserEvent,
  ParserEventListener,
  ParserManager,
  PerformanceStats,
} from '../types/parser.types.js';

// Inline performance measurement to avoid import issues
const measureTimeAsync = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, duration: end - start };
};

/**
 * Default parser configuration
 */
const DEFAULT_CONFIG: ParserConfig = {
  enableOptimization: true,
  enableValidation: true,
  maxParseTime: 5000,
  maxASTNodes: 10000,
  enableCaching: true,
  cacheSize: 100,
  enablePerformanceMonitoring: true,
  logLevel: 'info',
};

/**
 * Create cache key from code
 */
const createCacheKey = (code: string): string => {
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `parse_${Math.abs(hash).toString(36)}`;
};

/**
 * Count AST nodes recursively
 */
const countASTNodes = (nodes: ReadonlyArray<ASTNode>): number => {
  let count = nodes.length;
  for (const node of nodes) {
    if ('children' in node && Array.isArray(node.children)) {
      count += countASTNodes(node.children);
    }
  }
  return count;
};

/**
 * Simple AST validation function
 */
const validateASTNodes = (
  nodes: ReadonlyArray<ASTNode>
): { valid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const validateNode = (node: ASTNode): void => {
    // Check if node has required type property
    if (!node.type || typeof node.type !== 'string') {
      errors.push('Node missing required type property');
      return;
    }

    // Check for common node types and their required properties
    switch (node.type) {
      case 'cube':
        if (!('size' in node)) {
          warnings.push('Cube node missing size property');
        }
        break;
      case 'sphere':
        // SphereNode has 'radius' property, not 'r'
        if (!('radius' in node)) {
          warnings.push('Sphere node missing radius property');
        }
        break;
      case 'cylinder':
        // Check for cylinder properties (need to verify what properties actually exist)
        if (!('radius' in node) && !('r' in node)) {
          warnings.push('Cylinder node missing radius property');
        }
        if (!('height' in node) && !('h' in node)) {
          warnings.push('Cylinder node missing height property');
        }
        break;
    }

    // Recursively validate children if they exist
    if ('children' in node && Array.isArray(node.children)) {
      node.children.forEach(validateNode);
    }
  };

  nodes.forEach(validateNode);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate parser configuration
 */
const validateConfig = (config: ParserConfig): Result<void, string> => {
  return tryCatch(
    () => {
      if (config.maxParseTime <= 0) {
        throw new Error('maxParseTime must be positive');
      }

      if (config.maxASTNodes <= 0) {
        throw new Error('maxASTNodes must be positive');
      }

      if (config.cacheSize <= 0) {
        throw new Error('cacheSize must be positive');
      }

      return undefined;
    },
    (err) => `Invalid parser configuration: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Create parser manager implementation
 */
class ParserManagerImpl implements ParserManager {
  private context: ParserContext;
  private readonly parser: OpenscadParser;
  private initialized: boolean = false;

  constructor(config: ParserConfig) {
    const validationResult = validateConfig(config);
    if (!validationResult.success) {
      throw new Error(validationResult.error);
    }

    this.context = {
      config,
      cache: new Map<string, CacheEntry>(),
      stats: {
        totalParses: 0,
        totalValidations: 0,
        totalOptimizations: 0,
        averageParseTime: 0,
        averageValidationTime: 0,
        averageOptimizationTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
        peakMemoryUsage: 0,
      },
      listeners: [],
      hooks: {},
      startTime: Date.now(),
      disposed: false,
    };

    // Initialize OpenSCAD parser
    const errorHandler = new SimpleErrorHandler();
    this.parser = new OpenscadParser(errorHandler);

    console.log('[INIT][ParserManager] Parser manager initialized');
  }

  /**
   * Initialize the parser (must be called before use)
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.parser.init();
      this.initialized = true;
      console.log('[INIT][ParserManager] OpenSCAD parser initialized');
    }
  }

  /**
   * Parse OpenSCAD code to AST
   */
  async parse(code: string): AsyncResult<ParseResult, string> {
    if (this.context.disposed) {
      return error('Parser manager has been disposed');
    }

    const cacheKey = createCacheKey(code);

    // Check cache first
    if (this.context.config.enableCaching) {
      const cached = this.context.cache.get(cacheKey);
      if (cached) {
        // Update cache access with new object to maintain immutability
        const updatedCacheEntry = {
          ...cached,
          accessCount: cached.accessCount + 1,
          lastAccessed: Date.now(),
        };

        // Update the cache with the new entry
        this.context.cache.set(cacheKey, updatedCacheEntry);

        this.emitEvent({ type: 'cache-hit', key: cacheKey });

        return success({
          ...cached.result,
          fromCache: true,
          cacheKey,
        });
      } else {
        this.emitEvent({ type: 'cache-miss', key: cacheKey });
      }
    }

    this.emitEvent({ type: 'parse-start', code });

    const { result, duration } = await measureTimeAsync(async () => {
      return new Promise<Result<ParseResult, string>>((resolve) => {
        const timeoutId = setTimeout(() => {
          resolve(error(`Parse operation timed out after ${this.context.config.maxParseTime}ms`));
        }, this.context.config.maxParseTime);

        tryCatch(
          async () => {
            // Ensure parser is initialized
            await this.ensureInitialized();

            const ast = this.parser.parseAST(code);
            clearTimeout(timeoutId);

            const nodeCount = countASTNodes(ast);

            // Check node limit
            if (nodeCount > this.context.config.maxASTNodes) {
              throw new Error(
                `AST node limit exceeded: ${nodeCount} > ${this.context.config.maxASTNodes}`
              );
            }

            const parseResult: ParseResult = {
              ast,
              parseTime: 0, // Will be set by caller
              nodeCount,
              metadata: {
                sourceLength: code.length,
                complexity: nodeCount,
                memoryUsage: 0,
                warnings: [],
                optimizations: [],
              },
            };
            resolve(success(parseResult));
          },
          (err) => {
            clearTimeout(timeoutId);
            const errorMessage = `Parse failed: ${err instanceof Error ? err.message : String(err)}`;
            this.emitEvent({
              type: 'parse-error',
              error: { type: 'syntax', message: errorMessage },
            });
            resolve(error(errorMessage));
          }
        );
      });
    });

    if (result.success) {
      const parseResult: ParseResult = {
        ast: result.data.ast,
        parseTime: duration,
        nodeCount: result.data.nodeCount,
        metadata: {
          sourceLength: code.length,
          complexity: result.data.nodeCount,
          memoryUsage: 0, // Would be calculated in real implementation
          warnings: [],
          optimizations: [],
        },
      };

      // Cache result
      if (this.context.config.enableCaching) {
        this.addToCache(cacheKey, parseResult);
      }

      // Update statistics
      this.updateParseStats(duration);

      this.emitEvent({ type: 'parse-complete', result: parseResult });
      return success(parseResult);
    }

    return result;
  }

  /**
   * Validate AST
   */
  async validate(ast: ReadonlyArray<ASTNode>): AsyncResult<ASTValidationResult, string> {
    if (this.context.disposed) {
      return error('Parser manager has been disposed');
    }

    if (!this.context.config.enableValidation) {
      return success({
        isValid: true,
        errors: [],
        warnings: [],
        validationTime: 0,
        skipped: true,
      });
    }

    const { result, duration } = await measureTimeAsync(async () => {
      return tryCatchAsync(
        async () => {
          // Simple AST validation since validateAST is not exported from the package
          const validationResult = validateASTNodes(ast);

          const astValidationResult: ASTValidationResult = {
            isValid: validationResult.valid,
            errors: validationResult.errors || [],
            warnings: validationResult.warnings || [],
            validationTime: duration,
          };

          this.updateValidationStats(duration);
          this.emitEvent({ type: 'validation-complete', result: astValidationResult });

          return astValidationResult;
        },
        (err: unknown) => `Validation failed: ${err instanceof Error ? err.message : String(err)}`
      );
    });

    return result;
  }

  /**
   * Optimize AST
   */
  async optimize(ast: ReadonlyArray<ASTNode>): AsyncResult<ASTOptimizationResult, string> {
    if (this.context.disposed) {
      return error('Parser manager has been disposed');
    }

    if (!this.context.config.enableOptimization) {
      return success({
        optimizedAST: ast,
        originalNodeCount: countASTNodes(ast),
        optimizedNodeCount: countASTNodes(ast),
        reductionPercentage: 0,
        optimizationTime: 0,
        optimizations: [],
        skipped: true,
      });
    }

    const originalNodeCount = countASTNodes(ast);

    const { result, duration } = await measureTimeAsync(async () => {
      return tryCatchAsync(
        async () => {
          // Simple optimization: remove duplicate nodes
          const optimizedAST = this.removeDuplicateNodes(ast);
          const optimizedNodeCount = countASTNodes(optimizedAST);
          const reductionPercentage =
            originalNodeCount > 0
              ? Math.round(((originalNodeCount - optimizedNodeCount) / originalNodeCount) * 100)
              : 0;

          const optimizationResult: ASTOptimizationResult = {
            optimizedAST,
            originalNodeCount,
            optimizedNodeCount,
            reductionPercentage,
            optimizationTime: duration,
            optimizations: ['duplicate-removal'], // Simple optimization
          };

          this.updateOptimizationStats(duration);
          this.emitEvent({ type: 'optimization-complete', result: optimizationResult });

          return optimizationResult;
        },
        (err: unknown) => `Optimization failed: ${err instanceof Error ? err.message : String(err)}`
      );
    });

    return result;
  }

  /**
   * Get current configuration
   */
  getConfig(): ParserConfig {
    return { ...this.context.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ParserConfig>): Result<void, string> {
    const newConfig = { ...this.context.config, ...config };
    const validationResult = validateConfig(newConfig);

    if (!validationResult.success) {
      return validationResult;
    }

    // Update context immutably instead of direct assignment
    this.context = {
      ...this.context,
      config: newConfig,
    };

    // Clear cache if caching was disabled
    if (!newConfig.enableCaching) {
      this.clearCache();
    }

    console.log('[DEBUG][ParserManager] Configuration updated');

    return success(undefined);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    return { ...this.context.stats };
  }

  /**
   * Reset performance statistics
   */
  resetPerformanceStats(): void {
    // Update context immutably instead of direct assignment
    this.context = {
      ...this.context,
      stats: {
        totalParses: 0,
        totalValidations: 0,
        totalOptimizations: 0,
        averageParseTime: 0,
        averageValidationTime: 0,
        averageOptimizationTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
        peakMemoryUsage: 0,
      },
    };

    console.log('[DEBUG][ParserManager] Performance statistics reset');
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.context.cache.clear();
    console.log('[DEBUG][ParserManager] Cache cleared');
  }

  /**
   * Add event listener
   */
  addEventListener(listener: ParserEventListener): void {
    this.context = {
      ...this.context,
      listeners: [...this.context.listeners, listener],
    };
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: ParserEventListener): void {
    this.context = {
      ...this.context,
      listeners: this.context.listeners.filter((l) => l !== listener),
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.context.disposed) {
      return;
    }

    this.clearCache();

    // Dispose OpenSCAD parser
    if (this.initialized) {
      this.parser.dispose();
      this.initialized = false;
    }

    // Update context immutably instead of direct assignment
    this.context = {
      ...this.context,
      listeners: [],
      disposed: true,
    };

    console.log('[CLEANUP][ParserManager] Parser manager disposed');
  }

  /**
   * Simple optimization: remove duplicate nodes
   */
  private removeDuplicateNodes(nodes: ReadonlyArray<ASTNode>): ASTNode[] {
    const seen = new Set<string>();
    const result: ASTNode[] = [];

    for (const node of nodes) {
      const nodeKey = JSON.stringify(node);
      if (!seen.has(nodeKey)) {
        seen.add(nodeKey);

        // Recursively optimize children
        if ('children' in node && Array.isArray(node.children)) {
          const optimizedChildren = this.removeDuplicateNodes(node.children);
          result.push({ ...node, children: optimizedChildren });
        } else {
          result.push(node);
        }
      }
    }

    return result;
  }

  /**
   * Add result to cache
   */
  private addToCache(key: string, result: ParseResult): void {
    // Remove oldest entries if cache is full
    if (this.context.cache.size >= this.context.config.cacheSize) {
      const entries = Array.from(this.context.cache.entries());
      if (entries.length > 0) {
        const oldestEntry = entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)[0];
        if (oldestEntry) {
          this.context.cache.delete(oldestEntry[0]);
        }
      }
    }

    const entry: CacheEntry = {
      key,
      result,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    this.context.cache.set(key, entry);
  }

  /**
   * Update parse statistics
   */
  private updateParseStats(duration: number): void {
    const newTotalParses = this.context.stats.totalParses + 1;
    const newAverageParseTime =
      (this.context.stats.averageParseTime * (newTotalParses - 1) + duration) / newTotalParses;

    // Update cache hit rate
    const totalCacheAccesses = newTotalParses;
    const cacheHits = Array.from(this.context.cache.values()).reduce(
      (sum, entry) => sum + entry.accessCount - 1,
      0
    ); // -1 because first access is not a hit
    const newCacheHitRate = totalCacheAccesses > 0 ? (cacheHits / totalCacheAccesses) * 100 : 0;

    this.context = {
      ...this.context,
      stats: {
        ...this.context.stats,
        totalParses: newTotalParses,
        averageParseTime: newAverageParseTime,
        cacheHitRate: newCacheHitRate,
      },
    };
  }

  /**
   * Update validation statistics
   */
  private updateValidationStats(duration: number): void {
    const newTotalValidations = this.context.stats.totalValidations + 1;
    const newAverageValidationTime =
      (this.context.stats.averageValidationTime * (newTotalValidations - 1) + duration) /
      newTotalValidations;

    this.context = {
      ...this.context,
      stats: {
        ...this.context.stats,
        totalValidations: newTotalValidations,
        averageValidationTime: newAverageValidationTime,
      },
    };
  }

  /**
   * Update optimization statistics
   */
  private updateOptimizationStats(duration: number): void {
    const newTotalOptimizations = this.context.stats.totalOptimizations + 1;
    const newAverageOptimizationTime =
      (this.context.stats.averageOptimizationTime * (newTotalOptimizations - 1) + duration) /
      newTotalOptimizations;

    this.context = {
      ...this.context,
      stats: {
        ...this.context.stats,
        totalOptimizations: newTotalOptimizations,
        averageOptimizationTime: newAverageOptimizationTime,
      },
    };
  }

  /**
   * Emit parser event
   */
  private emitEvent(event: ParserEvent): void {
    this.context.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('[ERROR][ParserManager] Event listener error:', e);
      }
    });
  }
}

/**
 * Create parser manager with configuration
 */
export const createParserManager = (config: Partial<ParserConfig> = {}): ParserManager => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  return new ParserManagerImpl(fullConfig);
};

/**
 * Parse OpenSCAD code (standalone function)
 */
export const parseOpenSCADCode = async (
  code: string
): AsyncResult<ReadonlyArray<ASTNode>, string> => {
  try {
    const errorHandler = new SimpleErrorHandler();
    const parser = new OpenscadParser(errorHandler);

    try {
      await parser.init();
      const ast = parser.parseAST(code);
      return success(ast);
    } finally {
      parser.dispose();
    }
  } catch (err) {
    return error(`Parse failed: ${err instanceof Error ? err.message : String(err)}`);
  }
};

/**
 * Validate AST (standalone function)
 */
export const validateAST = async (
  ast: ReadonlyArray<ASTNode>
): AsyncResult<ASTValidationResult, string> => {
  const manager = createParserManager();
  const result = await manager.validate(ast);
  manager.dispose();

  return result;
};

/**
 * Optimize AST (standalone function)
 */
export const optimizeAST = async (
  ast: ReadonlyArray<ASTNode>
): AsyncResult<ASTOptimizationResult, string> => {
  const manager = createParserManager();
  const result = await manager.optimize(ast);
  manager.dispose();

  return result;
};

/**
 * Transform AST (standalone function)
 */
export const transformAST = async (
  ast: ReadonlyArray<ASTNode>
): AsyncResult<ReadonlyArray<ASTNode>, string> => {
  const manager = createParserManager();
  const result = await manager.optimize(ast);
  manager.dispose();

  if (result.success) {
    return success(result.data.optimizedAST);
  } else {
    return result;
  }
};

// Export the ParserManager interface for external use
export type { ParserManager } from '../types/parser.types.js';
