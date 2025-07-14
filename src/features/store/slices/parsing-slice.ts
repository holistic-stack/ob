/**
 * Zustand Store Slice: Parsing
 *
 * Manages OpenSCAD code parsing, AST generation, and error handling
 * by delegating to the unified parsing service.
 */

import type { WritableDraft } from 'immer';
import type { StateCreator } from 'zustand';
import { createLogger } from '../../../shared/services/logger.service.js';
import type {
  AsyncOperationResult,
  OperationError,
  OperationMetadata,
} from '../../../shared/types/operations.types.js';
import { isSuccess } from '../../../shared/types/result.types.js';
import { operationUtils } from '../../../shared/types/utils.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import { unifiedParseOpenSCAD } from '../../openscad-parser/services/parsing.service.js';
import type { AppStore } from '../types/store.types.js';
import type { ParseOptions, ParsingActions } from './parsing-slice.types.js';

const logger = createLogger('ParsingSlice');

type ParsingSliceConfig = {};

export const createParsingSlice = (
  set: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[0],
  get: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[1],
  _config?: ParsingSliceConfig
): ParsingActions => {
  return {
    parseCode: async (
      code: string,
      _options?: ParseOptions
    ): AsyncOperationResult<ReadonlyArray<ASTNode>, OperationError> => {
      const operationId = operationUtils.generateOperationId();
      const metadata = operationUtils.createMetadata(
        operationId,
        operationUtils.createOperationType('parse'),
        { priority: 'normal', tags: ['parsing', 'ast', 'unified'] }
      );

      set((state) => {
        state.parsing.isLoading = true;
        state.parsing.errors = [];
      });

      // Cache check
      const currentState = get();
      if (
        !currentState.parsing.isLoading &&
        currentState.parsing.lastParsedCode === code &&
        currentState.parsing.errors.length === 0
      ) {
        logger.debug('Code unchanged since last successful parse, returning cached AST.');
        return operationUtils.createSuccess(currentState.parsing.ast, metadata);
      }

      // Delegate all parsing logic to the unified service
      const parseResult = await unifiedParseOpenSCAD(code);

      if (isSuccess(parseResult)) {
        // Extract AST from the nested structure: parseResult.data.data contains the actual AST
        const ast = Array.isArray(parseResult.data.data) ? parseResult.data.data : [];

        set((state: WritableDraft<AppStore>) => {
          state.parsing.ast = [...ast];
          state.parsing.isLoading = false;
          state.parsing.lastParsed = new Date();
          state.parsing.lastParsedCode = code;
          state.parsing.errors = [];
        });

        // Trigger 3D rendering if enabled
        const { config } = get();
        if (config.enableRealTimeRendering && ast.length > 0) {
          logger.debug('Triggering real-time rendering after unified parsing.');
          void get().renderAST(ast);
        }
        return operationUtils.createSuccess(ast, metadata);
      } else {
        // Handle parsing failure
        const errorMessage = parseResult.error.error?.message || 'Unknown parsing error';
        set((state: WritableDraft<AppStore>) => {
          state.parsing.isLoading = false;
          state.parsing.errors = [errorMessage];
          state.parsing.lastParsedCode = null; // Invalidate cache
        });
        logger.error(`Unified parsing failed: ${errorMessage}`);
        return operationUtils.createError(parseResult.error.error, metadata);
      }
    },

    parseAST: async (
      code: string,
      options?: ParseOptions
    ): AsyncOperationResult<ReadonlyArray<ASTNode>, OperationError> => {
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
        state.parsing.lastParsedCode = null;
      });
    },

    debouncedParse: (code: string) => {
      // This is handled by the editor slice's debounced function
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
      set((state) => {
        state.parsing.isLoading = false;
      });
    },

    getParsingMetrics: (): ReadonlyArray<OperationMetadata> => {
      return [];
    },
  };
};
