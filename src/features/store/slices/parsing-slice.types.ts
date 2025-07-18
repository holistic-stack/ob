/**
 * @file parsing-slice.types.ts
 * @description Type definitions for the parsing slice providing comprehensive type safety
 * for OpenSCAD Abstract Syntax Tree (AST) processing operations. These types enable
 * functional programming patterns, immutable data structures, and Result<T,E> error
 * handling for robust parsing operations with Tree-sitter integration.
 *
 * @architectural_decision
 * **Immutable State Types**: All state interfaces use readonly modifiers to enforce
 * immutability and prevent accidental state mutations. This design enables safe
 * state sharing, efficient change detection, and predictable update patterns.
 *
 * **Operation-Centric Design**: Types are organized around parsing operations with
 * comprehensive metadata tracking, performance metrics, and error reporting to
 * support debugging, optimization, and monitoring of parsing performance.
 *
 * **Extensible Configuration**: ParseOptions interface provides flexible configuration
 * for different parsing scenarios (development vs production, simple vs complex files)
 * while maintaining backward compatibility through optional properties.
 *
 * **Functional Interface Design**: All action interfaces return Result types for
 * consistent error handling and enable functional composition of parsing operations
 * without exception-based error handling.
 *
 * @example Type-Safe Parsing Operations
 * ```typescript
 * import type { ParsingActions, ParseOptions, ParsingState } from './parsing-slice.types';
 * import { useAppStore } from '@/features/store';
 *
 * function TypeSafeParsingComponent() {
 *   const parsingActions: ParsingActions = useAppStore(state => ({
 *     parseCode: state.parseCode,
 *     clearParsingState: state.clearParsingState,
 *     addParsingError: state.addParsingError,
 *     getParsingMetrics: state.getParsingMetrics
 *   }));
 *
 *   const parsingState: ParsingState = useAppStore(state => state.parsing);
 *
 *   const handleParseWithOptions = async (code: string) => {
 *     const options: ParseOptions = {
 *       enableWarnings: true,
 *       enableOptimizations: true,
 *       maxDepth: 100,
 *       timeout: 5000,
 *       preserveComments: false,
 *       includeMetadata: true
 *     };
 *
 *     const result = await parsingActions.parseCode(code, options);
 *     if (result.success) {
 *       console.log(`Parsed ${result.data.data.length} AST nodes successfully`);
 *     } else {
 *       console.error('Parse failed:', result.error.error.message);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <div>AST Nodes: {parsingState.ast.length}</div>
 *       <div>Parse Time: {parsingState.parseTime}ms</div>
 *       <div>Complexity: {parsingState.complexity}</div>
 *       <div>Operations: {parsingState.operations.length}</div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Advanced Parsing Configuration
 * ```typescript
 * import type { ParseOptions } from './parsing-slice.types';
 *
 * // Development parsing configuration
 * const developmentOptions: ParseOptions = {
 *   enableWarnings: true,
 *   enableOptimizations: false, // Disable for easier debugging
 *   maxDepth: 1000, // Allow deep recursion for testing
 *   timeout: 10000, // Longer timeout for debugging
 *   preserveComments: true, // Keep comments for documentation
 *   includeMetadata: true // Full metadata for analysis
 * };
 *
 * // Production parsing configuration
 * const productionOptions: ParseOptions = {
 *   enableWarnings: false, // Reduce noise in production
 *   enableOptimizations: true, // Maximum performance
 *   maxDepth: 100, // Reasonable limits for safety
 *   timeout: 3000, // Fast timeout for responsiveness
 *   preserveComments: false, // Minimal AST for performance
 *   includeMetadata: false // Reduce memory usage
 * };
 *
 * // Large file parsing configuration
 * const largeFileOptions: ParseOptions = {
 *   enableWarnings: true,
 *   enableOptimizations: true,
 *   maxDepth: 50, // Limit depth for large files
 *   timeout: 15000, // Extended timeout for complex parsing
 *   preserveComments: false,
 *   includeMetadata: true // Track performance for optimization
 * };
 * ```
 *
 * @example Error Handling with Types
 * ```typescript
 * import type { ParsingActions, OperationError } from './parsing-slice.types';
 * import { useAppStore } from '@/features/store';
 *
 * function ErrorHandlingExample() {
 *   const { parseCode, addParsingError, clearParsingErrors } = useAppStore(state => ({
 *     parseCode: state.parseCode,
 *     addParsingError: state.addParsingError,
 *     clearParsingErrors: state.clearParsingErrors
 *   }));
 *
 *   const handleParseWithErrorRecovery = async (code: string) => {
 *     try {
 *       clearParsingErrors();
 *
 *       const result = await parseCode(code);
 *
 *       if (!result.success) {
 *         // Handle parsing error with full type safety
 *         const error: OperationError = result.error.error;
 *         console.error('Parse error:', {
 *           code: error.code,
 *           message: error.message,
 *           context: error.context,
 *           severity: error.severity,
 *           timestamp: error.timestamp
 *         });
 *
 *         // Add additional context for user feedback
 *         addParsingError({
 *           ...error,
 *           context: {
 *             ...error.context,
 *             userFriendlyMessage: 'Failed to parse OpenSCAD code. Please check syntax.'
 *           }
 *         });
 *
 *         return null;
 *       }
 *
 *       return result.data.data;
 *     } catch (systemError) {
 *       // Handle system-level errors
 *       const operationError: OperationError = {
 *         code: 'SYSTEM_ERROR',
 *         message: systemError instanceof Error ? systemError.message : 'Unknown system error',
 *         context: { systemError: true },
 *         severity: 'error',
 *         timestamp: new Date(),
 *         operationId: 'manual-parse'
 *       };
 *
 *       addParsingError(operationError);
 *       return null;
 *     }
 *   };
 * }
 * ```
 *
 * @example Performance Monitoring with Types
 * ```typescript
 * import type { ParsingState, OperationMetadata } from './parsing-slice.types';
 * import { useAppStore } from '@/features/store';
 * import { useEffect, useState } from 'react';
 *
 * function ParsingPerformanceMonitor() {
 *   const parsingState: ParsingState = useAppStore(state => state.parsing);
 *   const getParsingMetrics = useAppStore(state => state.getParsingMetrics);
 *   const [performanceHistory, setPerformanceHistory] = useState<Array<{
 *     timestamp: Date;
 *     parseTime: number;
 *     nodeCount: number;
 *     complexity: number;
 *   }>>([]);
 *
 *   useEffect(() => {
 *     if (parsingState.lastParsed) {
 *       setPerformanceHistory(prev => [
 *         ...prev.slice(-50), // Keep last 50 entries
 *         {
 *           timestamp: parsingState.lastParsed!,
 *           parseTime: parsingState.parseTime,
 *           nodeCount: parsingState.nodeCount,
 *           complexity: parsingState.complexity
 *         }
 *       ]);
 *     }
 *   }, [parsingState.lastParsed, parsingState.parseTime, parsingState.nodeCount, parsingState.complexity]);
 *
 *   const metrics: ReadonlyArray<OperationMetadata> = getParsingMetrics();
 *
 *   const averageParseTime = performanceHistory.length > 0
 *     ? performanceHistory.reduce((sum, entry) => sum + entry.parseTime, 0) / performanceHistory.length
 *     : 0;
 *
 *   return (
 *     <div className="parsing-performance">
 *       <h3>Parsing Performance</h3>
 *       <div>Current Parse Time: {parsingState.parseTime}ms</div>
 *       <div>Average Parse Time: {averageParseTime.toFixed(1)}ms</div>
 *       <div>AST Nodes: {parsingState.nodeCount}</div>
 *       <div>Complexity Score: {parsingState.complexity.toFixed(2)}</div>
 *       <div>Active Operations: {parsingState.operations.length}</div>
 *       <div>Total Operations: {metrics.length}</div>
 *       <div>Performance History: {performanceHistory.length} entries</div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Testing with Type Safety
 * ```typescript
 * import type { ParsingSlice, ParseOptions, ParsingState } from './parsing-slice.types';
 * import { createAppStore } from '@/features/store';
 *
 * describe('Parsing Types', () => {
 *   let store: ReturnType<typeof createAppStore>;
 *   let parsingSlice: ParsingSlice;
 *
 *   beforeEach(() => {
 *     store = createAppStore({
 *       enableDevtools: false,
 *       enablePersistence: false,
 *       debounceConfig: { parseDelayMs: 0, renderDelayMs: 0, saveDelayMs: 0 }
 *     });
 *
 *     // Type-safe access to parsing slice
 *     parsingSlice = {
 *       ...store.getState().parsing,
 *       parseCode: store.getState().parseCode,
 *       clearParsingState: store.getState().clearParsingState,
 *       addParsingError: store.getState().addParsingError,
 *       clearParsingErrors: store.getState().clearParsingErrors,
 *       getParsingMetrics: store.getState().getParsingMetrics,
 *       cancelParsing: store.getState().cancelParsing,
 *       parseAST: store.getState().parseAST,
 *       debouncedParse: store.getState().debouncedParse
 *     };
 *   });
 *
 *   it('should have correct initial state types', () => {
 *     const state: ParsingState = parsingSlice;
 *
 *     expect(Array.isArray(state.ast)).toBe(true);
 *     expect(Array.isArray(state.errors)).toBe(true);
 *     expect(Array.isArray(state.warnings)).toBe(true);
 *     expect(typeof state.isLoading).toBe('boolean');
 *     expect(typeof state.parseTime).toBe('number');
 *     expect(typeof state.nodeCount).toBe('number');
 *     expect(typeof state.complexity).toBe('number');
 *   });
 *
 *   it('should handle typed parse options', async () => {
 *     const options: ParseOptions = {
 *       enableWarnings: true,
 *       maxDepth: 50,
 *       timeout: 1000
 *     };
 *
 *     const result = await parsingSlice.parseCode('cube(10);', options);
 *     expect(typeof result.success).toBe('boolean');
 *   });
 * });
 * ```
 */

import type {
  AsyncOperationResult,
  OperationError,
  OperationMetadata,
} from '../../../shared/types/operations.types.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';

/**
 * Parsing state for OpenSCAD AST processing
 */
export interface ParsingState {
  readonly ast: ReadonlyArray<ASTNode>;
  readonly errors: ReadonlyArray<OperationError>;
  readonly warnings: ReadonlyArray<string>;
  readonly isLoading: boolean;
  readonly lastParsed: Date | null;
  readonly parseTime: number;
  readonly operations: ReadonlyArray<OperationMetadata>;
  readonly nodeCount: number;
  readonly complexity: number;
}

/**
 * Parsing operation options
 */
export interface ParseOptions {
  readonly enableWarnings?: boolean;
  readonly enableOptimizations?: boolean;
  readonly maxDepth?: number;
  readonly timeout?: number;
  readonly preserveComments?: boolean;
  readonly includeMetadata?: boolean;
}

/**
 * Parsing actions interface using shared operation types
 */
export interface ParsingActions {
  parseCode: (
    code: string,
    options?: ParseOptions
  ) => AsyncOperationResult<ReadonlyArray<ASTNode>, OperationError>;
  parseAST: (
    code: string,
    options?: ParseOptions
  ) => AsyncOperationResult<ReadonlyArray<ASTNode>, OperationError>;
  clearParsingState: () => void;
  debouncedParse: (code: string, options?: ParseOptions) => void;
  addParsingError: (error: OperationError) => void;
  clearParsingErrors: () => void;
  getParsingMetrics: () => ReadonlyArray<OperationMetadata>;
  cancelParsing: (operationId: string) => void;
}

/**
 * Combined parsing slice type
 */
export type ParsingSlice = ParsingState & ParsingActions;
