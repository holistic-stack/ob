/**
 * Zustand Store Slice: Parsing
 *
 * Manages OpenSCAD code parsing, AST generation, and error handling
 * with performance monitoring and functional error patterns.
 */

import type { WritableDraft } from 'immer';
import type { StateCreator } from 'zustand';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { AsyncResult } from '../../../shared/types/result.types.js';
import { tryCatchAsync } from '../../../shared/utils/functional/result.js';
import { restructureAST } from '../../3d-renderer/services/ast-restructuring-service.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import type { OpenscadParser } from '../../openscad-parser/openscad-parser.ts';
import type { AppStore } from '../app-store.js';
import type { ParsingActions } from './parsing-slice.types.js';

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
    parseCode: async (code: string): AsyncResult<ReadonlyArray<ASTNode>, string> => {
      set((state) => {
        state.parsing.isLoading = true;
        state.parsing.errors = [];
      });

      const startTime = performance.now();

      return tryCatchAsync(
        async () => {
          logger.debug(`Starting parse of ${code.length} characters`);

          // Ensure parser is initialized
          await parserService.initialize();

          // Use unified parser service
          const parseResult = await parserService.parseDocument(code);

          if (parseResult.success && parseResult.data.ast) {
            const rawAST = parseResult.data.ast;

            // Apply AST restructuring to fix hierarchical relationships
            logger.debug(`Restructuring AST with ${rawAST.length} nodes`);
            const restructureResult = restructureAST(rawAST, {
              enableLogging: true,
              enableSourceLocationAnalysis: true,
            });

            if (!restructureResult.success) {
              logger.warn(
                `AST restructuring failed: ${restructureResult.error}, using original AST`
              );
            }

            const ast = restructureResult.success ? restructureResult.data : rawAST;
            const endTime = performance.now();
            const parseTime = endTime - startTime;

            set((state: WritableDraft<AppStore>) => {
              state.parsing.ast = [...ast];
              state.parsing.isLoading = false;
              state.parsing.lastParsed = new Date();
              state.parsing.parseTime = parseTime;
            });

            // Record performance metrics
            get().recordParseTime(parseTime);

            logger.debug(
              `Parsed ${rawAST.length} raw AST nodes, restructured to ${ast.length} nodes in ${parseTime.toFixed(2)}ms`
            );
            return ast;
          } else {
            const errorMessage = parseResult.success
              ? parseResult.data.errors.map((e: { message: string }) => e.message).join('; ')
              : parseResult.error;
            throw new Error(errorMessage);
          }
        },
        (err: unknown) => {
          const endTime = performance.now();
          const parseTime = endTime - startTime;
          const errorMessage = err instanceof Error ? err.message : String(err);

          set((state: WritableDraft<AppStore>) => {
            state.parsing.isLoading = false;
            state.parsing.errors = [errorMessage];
            state.parsing.parseTime = parseTime;
          });

          logger.error(`Parse failed: ${errorMessage}`);
          return `Parse failed: ${errorMessage}`;
        }
      );
    },

    parseAST: async (code: string): AsyncResult<ReadonlyArray<ASTNode>, string> => {
      // Alias for backwards compatibility
      return get().parseCode(code);
    },

    clearParsingState: () => {
      set((state) => {
        state.parsing.ast = [];
        state.parsing.errors = [];
        state.parsing.warnings = [];
        state.parsing.isLoading = false;
        state.parsing.lastParsed = null;
        state.parsing.parseTime = 0;
      });
    },

    debouncedParse: (code: string) => {
      // This is handled by the editor slice's debounced function
      // This method exists for backwards compatibility
      void get().parseCode(code);
    },

    addParsingError: (error: string) => {
      set((state) => {
        state.parsing.errors = [...state.parsing.errors, error];
      });
    },

    clearParsingErrors: () => {
      set((state: WritableDraft<AppStore>) => {
        state.parsing.errors = [];
      });
    },
  };
};
