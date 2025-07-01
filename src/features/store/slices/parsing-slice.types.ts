/**
 * Parsing Slice Type Definitions
 *
 * Type definitions for the parsing slice of the Zustand store,
 * following functional programming patterns and immutable data structures.
 */

import type { AsyncResult } from '../../../shared/types/result.types.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';

/**
 * Parsing state for OpenSCAD AST processing
 */
export interface ParsingState {
  readonly ast: ReadonlyArray<ASTNode>;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
  readonly isLoading: boolean;
  readonly lastParsed: Date | null;
  readonly parseTime: number;
}

/**
 * Parsing actions interface
 */
export interface ParsingActions {
  parseCode: (code: string) => AsyncResult<ReadonlyArray<ASTNode>, string>;
  parseAST: (code: string) => AsyncResult<ReadonlyArray<ASTNode>, string>;
  clearParsingState: () => void;
  debouncedParse: (code: string) => void;
  addParsingError: (error: string) => void;
  clearParsingErrors: () => void;
}

/**
 * Combined parsing slice type
 */
export type ParsingSlice = ParsingState & ParsingActions;
