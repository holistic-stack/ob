/**
 * OpenSCAD Parser Type Definitions
 *
 * Comprehensive type definitions for @holistic-stack/openscad-parser integration
 * with lifecycle management, performance monitoring, and functional patterns.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';

export type { ASTNode } from '@holistic-stack/openscad-parser';

import type { AsyncResult, Result } from '../../../shared/types/result.types';

/**
 * Parser configuration options
 */
export interface ParserConfig {
  readonly enableOptimization: boolean;
  readonly enableValidation: boolean;
  readonly maxParseTime: number;
  readonly maxASTNodes: number;
  readonly enableCaching: boolean;
  readonly cacheSize: number;
  readonly enablePerformanceMonitoring?: boolean;
  readonly logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Parse operation result
 */
export interface ParseResult {
  readonly ast: ReadonlyArray<ASTNode>;
  readonly parseTime: number;
  readonly nodeCount: number;
  readonly fromCache?: boolean;
  readonly cacheKey?: string;
  readonly metadata?: ParseMetadata;
}

/**
 * Parse operation metadata
 */
export interface ParseMetadata {
  readonly sourceLength: number;
  readonly complexity: number;
  readonly memoryUsage: number;
  readonly warnings: ReadonlyArray<string>;
  readonly optimizations: ReadonlyArray<string>;
}

/**
 * AST validation result
 */
export interface ASTValidationResult {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
  readonly validationTime: number;
  readonly skipped?: boolean;
}

/**
 * AST optimization result
 */
export interface ASTOptimizationResult {
  readonly optimizedAST: ReadonlyArray<ASTNode>;
  readonly originalNodeCount: number;
  readonly optimizedNodeCount: number;
  readonly reductionPercentage: number;
  readonly optimizationTime: number;
  readonly optimizations: ReadonlyArray<string>;
  readonly skipped?: boolean;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  readonly totalParses: number;
  readonly totalValidations: number;
  readonly totalOptimizations: number;
  readonly averageParseTime: number;
  readonly averageValidationTime: number;
  readonly averageOptimizationTime: number;
  readonly cacheHitRate: number;
  readonly memoryUsage: number;
  readonly peakMemoryUsage: number;
}

/**
 * Cache entry for parsed results
 */
export interface CacheEntry {
  readonly key: string;
  readonly result: ParseResult;
  readonly timestamp: number;
  readonly accessCount: number;
  readonly lastAccessed: number;
}

/**
 * Parser error types
 */
export type ParserError =
  | {
      readonly type: 'syntax';
      readonly message: string;
      readonly line?: number;
      readonly column?: number;
    }
  | { readonly type: 'semantic'; readonly message: string; readonly node?: ASTNode }
  | { readonly type: 'timeout'; readonly message: string; readonly duration: number }
  | { readonly type: 'memory'; readonly message: string; readonly usage: number }
  | {
      readonly type: 'validation';
      readonly message: string;
      readonly errors: ReadonlyArray<string>;
    }
  | { readonly type: 'optimization'; readonly message: string; readonly stage: string };

/**
 * Parser event types
 */
export type ParserEvent =
  | { readonly type: 'parse-start'; readonly code: string }
  | { readonly type: 'parse-complete'; readonly result: ParseResult }
  | { readonly type: 'parse-error'; readonly error: ParserError }
  | { readonly type: 'validation-complete'; readonly result: ASTValidationResult }
  | { readonly type: 'optimization-complete'; readonly result: ASTOptimizationResult }
  | { readonly type: 'cache-hit'; readonly key: string }
  | { readonly type: 'cache-miss'; readonly key: string };

/**
 * Parser event listener
 */
export type ParserEventListener = (event: ParserEvent) => void;

/**
 * Parser manager interface
 */
export interface ParserManager {
  readonly parse: (code: string) => AsyncResult<ParseResult, string>;
  readonly validate: (ast: ReadonlyArray<ASTNode>) => AsyncResult<ASTValidationResult, string>;
  readonly optimize: (ast: ReadonlyArray<ASTNode>) => AsyncResult<ASTOptimizationResult, string>;
  readonly getConfig: () => ParserConfig;
  readonly updateConfig: (config: Partial<ParserConfig>) => Result<void, string>;
  readonly getPerformanceStats: () => PerformanceStats;
  readonly resetPerformanceStats: () => void;
  readonly clearCache: () => void;
  readonly addEventListener: (listener: ParserEventListener) => void;
  readonly removeEventListener: (listener: ParserEventListener) => void;
  readonly dispose: () => void;
}

/**
 * AST transformation options
 */
export interface TransformOptions {
  readonly removeComments?: boolean;
  readonly removeUnusedVariables?: boolean;
  readonly optimizeTransforms?: boolean;
  readonly mergeGeometry?: boolean;
  readonly simplifyExpressions?: boolean;
  readonly inlineConstants?: boolean;
}

/**
 * AST analysis result
 */
export interface ASTAnalysisResult {
  readonly nodeCount: number;
  readonly depth: number;
  readonly complexity: number;
  readonly memoryEstimate: number;
  readonly renderingComplexity: number;
  readonly dependencies: ReadonlyArray<string>;
  readonly variables: ReadonlyArray<string>;
  readonly functions: ReadonlyArray<string>;
  readonly modules: ReadonlyArray<string>;
}

/**
 * Parser factory options
 */
export interface ParserFactoryOptions {
  readonly config?: Partial<ParserConfig>;
  readonly enableEventLogging?: boolean;
  readonly customValidators?: ReadonlyArray<ASTValidator>;
  readonly customOptimizers?: ReadonlyArray<ASTOptimizer>;
}

/**
 * AST validator interface
 */
export interface ASTValidator {
  readonly name: string;
  readonly validate: (ast: ReadonlyArray<ASTNode>) => Result<ReadonlyArray<string>, string>;
}

/**
 * AST optimizer interface
 */
export interface ASTOptimizer {
  readonly name: string;
  readonly optimize: (ast: ReadonlyArray<ASTNode>) => Result<ReadonlyArray<ASTNode>, string>;
}

/**
 * Parser lifecycle hooks
 */
export interface ParserLifecycleHooks {
  readonly onParseStart?: (code: string) => void;
  readonly onParseComplete?: (result: ParseResult) => void;
  readonly onParseError?: (error: ParserError) => void;
  readonly onValidationComplete?: (result: ASTValidationResult) => void;
  readonly onOptimizationComplete?: (result: ASTOptimizationResult) => void;
  readonly onCacheHit?: (key: string) => void;
  readonly onCacheMiss?: (key: string) => void;
  readonly onDispose?: () => void;
}

/**
 * Parser context for operations
 */
export interface ParserContext {
  readonly config: ParserConfig;
  readonly cache: Map<string, CacheEntry>;
  readonly stats: PerformanceStats;
  readonly listeners: ReadonlyArray<ParserEventListener>;
  readonly hooks: ParserLifecycleHooks;
  readonly startTime: number;
  readonly disposed: boolean;
}

/**
 * Batch parsing options
 */
export interface BatchParseOptions {
  readonly concurrency?: number;
  readonly timeout?: number;
  readonly continueOnError?: boolean;
  readonly enableProgressReporting?: boolean;
}

/**
 * Batch parsing result
 */
export interface BatchParseResult {
  readonly results: ReadonlyArray<Result<ParseResult, string>>;
  readonly totalTime: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly averageTime: number;
}

/**
 * Parser worker interface for offloading heavy operations
 */
export interface ParserWorker {
  readonly parse: (code: string) => Promise<ParseResult>;
  readonly validate: (ast: ReadonlyArray<ASTNode>) => Promise<ASTValidationResult>;
  readonly optimize: (ast: ReadonlyArray<ASTNode>) => Promise<ASTOptimizationResult>;
  readonly isAvailable: boolean;
  readonly terminate: () => void;
}

/**
 * Parser pool for managing multiple workers
 */
export interface ParserPool {
  readonly parse: (code: string) => AsyncResult<ParseResult, string>;
  readonly getAvailableWorkers: () => number;
  readonly getTotalWorkers: () => number;
  readonly dispose: () => void;
}
