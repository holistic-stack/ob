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
import { restructureAST } from '../../3d-renderer/services/ast-restructuring-service.js';
import type { OpenscadParser } from '../../openscad-parser/openscad-parser.ts';
import type { AppStore } from '../types/store.types.js';
import type { ParseOptions, ParsingActions } from './parsing-slice.types.js';

const logger = createLogger('ParsingSlice');

interface ParsingSliceConfig {
  parserService: OpenscadParser;
}

export const createParsingSlice = (
  set: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[0],
  get: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[1],
  { parserService }: ParsingSliceConfig
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

        // Ensure parser is initialized
        await parserService.init();

        // Use unified parser service
        const parseResult = parserService.parseASTWithResult(code);

        if (!isSuccess(parseResult)) {
          const errorMessage = `Parse failed: ${parseResult.error}`;

          set((state: WritableDraft<AppStore>) => {
            state.parsing.isLoading = false;
            state.parsing.errors = [errorMessage];
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
          const restructureResult = restructureAST(parseResult.data, {
            enableLogging: true,
            enableSourceLocationAnalysis: true,
          });

          if (!restructureResult.success) {
            logger.warn(`AST restructuring failed: ${restructureResult.error}, using original AST`);
          }

          const ast = restructureResult.success ? restructureResult.data : parseResult.data;

          set((state: WritableDraft<AppStore>) => {
            state.parsing.ast = [...ast];
            state.parsing.isLoading = false;
            state.parsing.lastParsed = new Date();
          });

          // Performance metrics recording removed

          logger.debug(
            `Parsed ${parseResult.data.length} raw AST nodes, restructured to ${ast.length} nodes`
          );
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
