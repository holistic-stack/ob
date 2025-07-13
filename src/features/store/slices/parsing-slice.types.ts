/**
 * Parsing Slice Type Definitions
 *
 * Type definitions for the parsing slice of the Zustand store,
 * following functional programming patterns and immutable data structures.
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
