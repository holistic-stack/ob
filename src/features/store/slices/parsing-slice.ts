/**
 * Zustand Store Slice: Parsing
 *
 * Manages OpenSCAD code parsing, AST generation, and error handling
 * with performance monitoring and functional error patterns.
 */

import type { WritableDraft } from 'immer';
import type { StateCreator } from 'zustand';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { CoreNode } from '../../../shared/types/ast.types.js';
import type {
  AsyncOperationResult,
  OperationError,
  OperationMetadata,
} from '../../../shared/types/operations.types.js';
import { isSuccess } from '../../../shared/types/result.types.js';
import { operationUtils } from '../../../shared/types/utils.js';
import {
  clearSourceCodeForRestructuring,
  restructureAST,
  setSourceCodeForRestructuring,
} from '../../3d-renderer/services/ast-restructuring-service.js';
import type { OpenscadParser } from '../../openscad-parser/openscad-parser.ts';
import {
  getInitializedParser,
  initializeParser,
  isParserReady,
} from '../../openscad-parser/services/parser-initialization.service.js';
import { normalizeWhitespace, hasProblematicWhitespace } from '../../openscad-parser/utils/whitespace-normalizer.js';
import type { AppStore } from '../types/store.types.js';
import type { ParseOptions, ParsingActions } from './parsing-slice.types.js';

const logger = createLogger('ParsingSlice');

type ParsingSliceConfig = {};

/**
 * Validates if a syntax error is likely spurious based on OpenSCAD syntax patterns.
 * Tree-sitter can sometimes report false positives when parser state is inconsistent.
 *
 * @param code - The source code being parsed
 * @param errorMessage - The error message from the parser
 * @returns true if the error appears to be spurious
 */
const isLikelySpuriousError = (code: string, errorMessage: string): boolean => {
  // Check for common false positive patterns
  const spuriousPatterns = [
    // Error at opening bracket in valid translate/rotate/scale calls
    /Syntax error at line \d+, column \d+:.*translate\s*\(\s*\[/,
    /Syntax error at line \d+, column \d+:.*rotate\s*\(\s*\[/,
    /Syntax error at line \d+, column \d+:.*scale\s*\(\s*\[/,
    // Error at opening bracket in valid function calls
    /Syntax error at line \d+, column \d+:.*\w+\s*\(\s*\[/,
  ];

  // Check if error message matches spurious patterns
  const isSpurious = spuriousPatterns.some(pattern => pattern.test(errorMessage));

  if (isSpurious) {
    // Additional validation: check if the code around the error looks valid
    const lines = code.split('\n');
    const hasValidOpenSCADSyntax = lines.some(line =>
      /^\s*(translate|rotate|scale|cube|sphere|cylinder|union|difference|intersection)\s*\(/.test(line.trim())
    );

    return hasValidOpenSCADSyntax;
  }

  return false;
};

/**
 * Attempts to recover from parser errors by resetting parser state.
 * This is particularly useful when Tree-sitter's incremental parsing
 * gets into an inconsistent state.
 *
 * @param parser - The parser instance to reset
 * @param code - The code to re-parse after reset
 * @returns Result of the recovery attempt
 */
const attemptParserRecovery = async (
  parser: OpenscadParser,
  code: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    logger.debug('Attempting parser recovery by resetting state');

    // Dispose current parser to clear any inconsistent state
    parser.dispose();

    // Re-initialize parser with fresh state
    const initResult = await initializeParser();
    if (!initResult.success) {
      return { success: false, error: `Recovery failed: ${initResult.error}` };
    }

    const freshParser = getInitializedParser();
    if (!freshParser) {
      return { success: false, error: 'Recovery failed: Could not get fresh parser instance' };
    }

    // Parse with fresh parser state
    const parseResult = freshParser.parseASTWithResult(code);

    if (isSuccess(parseResult)) {
      logger.debug('Parser recovery successful');
      return { success: true, data: parseResult.data };
    } else {
      return { success: false, error: parseResult.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Parser recovery attempt failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const createParsingSlice = (
  set: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[0],
  get: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[1],
  _config?: ParsingSliceConfig
): ParsingActions => {
  return {
    parseCode: async (
      code: string,
      _options?: ParseOptions
    ): AsyncOperationResult<ReadonlyArray<CoreNode>, OperationError> => {
      const operationId = operationUtils.generateOperationId();
      const metadata = operationUtils.createMetadata(
        operationId,
        operationUtils.createOperationType('parse'),
        { priority: 'normal', tags: ['parsing', 'ast'] }
      );

      set((state) => {
        state.parsing.isLoading = true;
        state.parsing.errors = [];
      });

      try {
        logger.debug(`Starting parse of ${code.length} characters`);

        // Check if we're already parsing the exact same code to avoid redundant operations
        const currentState = get();
        if (currentState.parsing.isLoading && currentState.parsing.lastParsedCode === code) {
          logger.debug('Parse already in progress for same code, skipping duplicate request');
          const operationError = operationUtils.createOperationError(
            'DUPLICATE_OPERATION',
            'Parse operation already in progress for the same code',
            { recoverable: true }
          );
          return operationUtils.createError(operationError, metadata);
        }

        // Check if we're trying to parse the exact same code that was just parsed
        // This prevents redundant parsing and potential parser state issues
        if (currentState.parsing.lastParsedCode === code && currentState.parsing.ast.length > 0) {
          logger.debug('Code unchanged since last parse, returning cached AST');
          return operationUtils.createSuccess(currentState.parsing.ast, metadata);
        }

        // Ensure parser is initialized using singleton service
        const initResult = await initializeParser();
        if (!initResult.success) {
          const errorMessage = `Parser initialization failed: ${initResult.error}`;

          set((state: WritableDraft<AppStore>) => {
            state.parsing.isLoading = false;
            state.parsing.errors = [errorMessage];
          });

          logger.error(errorMessage);
          const operationError = operationUtils.createOperationError('INIT_ERROR', errorMessage, {
            recoverable: true,
          });
          return operationUtils.createError(operationError, metadata);
        }

        const parser = getInitializedParser();
        if (!parser) {
          const errorMessage = 'Parser not available after initialization';

          set((state: WritableDraft<AppStore>) => {
            state.parsing.isLoading = false;
            state.parsing.errors = [errorMessage];
          });

          logger.error(errorMessage);
          const operationError = operationUtils.createOperationError('PARSER_ERROR', errorMessage, {
            recoverable: true,
          });
          return operationUtils.createError(operationError, metadata);
        }

        // Normalize whitespace to prevent Tree-sitter grammar bugs
        let normalizedCode = code;
        if (hasProblematicWhitespace(code)) {
          logger.debug('Detected problematic whitespace patterns, normalizing code');
          normalizedCode = normalizeWhitespace(code);
        }

        // Use the initialized parser with enhanced error recovery strategy
        let parseResult = parser.parseASTWithResult(normalizedCode);

        // Check if parsing succeeded despite Tree-sitter syntax warnings
        const parseSucceeded = isSuccess(parseResult) && parseResult.data.length > 0;

        if (parseSucceeded) {
          // Parsing succeeded - suppress any Tree-sitter syntax warnings in console
          // These are often false positives from the Tree-sitter OpenSCAD grammar
          logger.debug(`Parse succeeded with ${parseResult.data.length} AST nodes, ignoring any Tree-sitter warnings`);
        }

        // Implement error recovery: if parsing fails, check for spurious errors and attempt recovery
        if (!isSuccess(parseResult)) {
          const errorMessage = parseResult.error;
          logger.warn(`Initial parse failed: ${errorMessage}`);

          // Check if this might be a spurious error due to parser state issues
          if (isLikelySpuriousError(normalizedCode, errorMessage)) {
            logger.debug('Detected likely spurious error, attempting parser recovery');

            const recoveryResult = await attemptParserRecovery(parser, normalizedCode);
            if (recoveryResult.success) {
              logger.debug('Parser recovery successful, using recovered AST');
              parseResult = { success: true, data: recoveryResult.data };
            } else {
              logger.warn(`Parser recovery failed: ${recoveryResult.error}`);
            }
          } else {
            logger.debug('Error appears to be genuine syntax error, not attempting recovery');
          }
        }

        if (!isSuccess(parseResult)) {
          const errorMessage = `Parse failed after recovery attempt: ${parseResult.error}`;

          set((state: WritableDraft<AppStore>) => {
            state.parsing.isLoading = false;
            state.parsing.errors = [errorMessage];
            state.parsing.lastParsedCode = null; // Clear last parsed code on error
          });

          logger.error(errorMessage);
          const operationError = operationUtils.createOperationError('PARSE_ERROR', errorMessage, {
            recoverable: true,
          });
          return operationUtils.createError(operationError, metadata);
        }

        if (parseResult.data.length > 0) {
          // Apply AST restructuring to fix hierarchical relationships
          logger.debug(`Restructuring AST with ${parseResult.data.length} nodes`);

          // Set source code for Tree-sitter grammar workarounds
          setSourceCodeForRestructuring(normalizedCode);

          const restructureResult = restructureAST(parseResult.data, {
            enableLogging: true,
            enableSourceLocationAnalysis: true,
          });

          // Clear source code after restructuring
          clearSourceCodeForRestructuring();

          if (!restructureResult.success) {
            logger.warn(`AST restructuring failed: ${restructureResult.error}, using original AST`);
          }

          const ast = restructureResult.success ? restructureResult.data : parseResult.data;

          set((state: WritableDraft<AppStore>) => {
            state.parsing.ast = [...ast];
            state.parsing.isLoading = false;
            state.parsing.lastParsed = new Date();
            state.parsing.lastParsedCode = code; // Store successfully parsed code
          });

          // Performance metrics recording removed

          logger.debug(
            `Parsed ${parseResult.data.length} raw AST nodes, restructured to ${ast.length} nodes`
          );

          // Trigger 3D rendering if enabled
          const { config } = get();
          if (config.enableRealTimeRendering && ast.length > 0) {
            logger.debug('Triggering real-time rendering after parsing');
            void get().renderFromAST(ast);
          }

          return operationUtils.createSuccess(ast as ReadonlyArray<CoreNode>, metadata);
        } else {
          // No AST nodes were parsed
          logger.warn('No AST nodes were parsed from the provided code');

          set((state: WritableDraft<AppStore>) => {
            state.parsing.ast = [];
            state.parsing.isLoading = false;
            state.parsing.lastParsed = new Date();
          });

          return operationUtils.createSuccess([] as ReadonlyArray<CoreNode>, metadata);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        set((state: WritableDraft<AppStore>) => {
          state.parsing.isLoading = false;
          state.parsing.errors = [errorMessage];
        });

        logger.error(`Parse failed: ${errorMessage}`);
        const operationError = operationUtils.createOperationError(
          'PARSE_EXCEPTION',
          errorMessage,
          { recoverable: false, ...(err instanceof Error && err.stack ? { stack: err.stack } : {}) }
        );
        return operationUtils.createError(operationError, metadata);
      }
    },

    parseAST: async (
      code: string,
      options?: ParseOptions
    ): AsyncOperationResult<ReadonlyArray<CoreNode>, OperationError> => {
      // Alias for backwards compatibility
      return get().parseCode(code, options);
    },

    clearParsingState: () => {
      set((state) => {
        state.parsing.ast = [];
        state.parsing.errors = [];
        state.parsing.warnings = [];
        state.parsing.isLoading = false;
        state.parsing.lastParsed = null;
        state.parsing.lastParsedCode = null; // Reset last parsed code
      });
    },

    debouncedParse: (code: string) => {
      // This is handled by the editor slice's debounced function
      // This method exists for backwards compatibility
      void get().parseCode(code);
    },

    addParsingError: (error: OperationError) => {
      set((state) => {
        state.parsing.errors = [...state.parsing.errors, error.message || String(error)];
      });
    },

    clearParsingErrors: () => {
      set((state: WritableDraft<AppStore>) => {
        state.parsing.errors = [];
      });
    },

    cancelParsing: (operationId: string) => {
      logger.debug('Cancelling parsing operation', { operationId });
      // Implementation would cancel the specific operation
      // For now, just clear the loading state
      set((state) => {
        state.parsing.isLoading = false;
      });
    },

    getParsingMetrics: (): ReadonlyArray<OperationMetadata> => {
      // Return empty array for now - metrics would be tracked separately
      return [];
    },
  };
};
