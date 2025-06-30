/**
 * Zustand Store Slice: Parsing
 *
 * Manages OpenSCAD code parsing, AST generation, and error handling
 * with performance monitoring and functional error patterns.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import type { StateCreator } from 'zustand';
import type { AsyncResult } from '../../../shared/types/result.types.js';
import { tryCatchAsync } from '../../../shared/utils/functional/result.js';
import { restructureAST } from '../../3d-renderer/services/ast-restructuring-service.js';
import type { UnifiedParserService } from '../../openscad-parser/services/unified-parser-service.js';
import type { AppStore, ParsingSlice } from '../types/store.types.js';

interface ParsingSliceConfig {
  parserService: UnifiedParserService;
}

export const createParsingSlice = (
  set: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[0],
  get: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[1],
  { parserService }: ParsingSliceConfig
): Omit<ParsingSlice, keyof AppStore['parsing']> => {
  return {
    parseCode: async (code: string): AsyncResult<ReadonlyArray<ASTNode>, string> => {
      set((state) => {
        state.parsing.isLoading = true;
        state.parsing.errors = [];
      });

      const startTime = performance.now();

      return tryCatchAsync(
        async () => {
          console.log(`[DEBUG][Store] Starting parse of ${code.length} characters`);

          // Ensure parser is initialized
          await parserService.initialize();

          // Use unified parser service
          const parseResult = await parserService.parseDocument(code);

          if (parseResult.success && parseResult.data.ast) {
            const rawAST = parseResult.data.ast;

            // Apply AST restructuring to fix hierarchical relationships
            console.log(`[DEBUG][Store] Restructuring AST with ${rawAST.length} nodes`);
            const restructureResult = restructureAST(rawAST, {
              enableLogging: true,
              enableSourceLocationAnalysis: true,
            });

            if (!restructureResult.success) {
              console.warn(
                `[WARN][Store] AST restructuring failed: ${restructureResult.error}, using original AST`
              );
            }

            const ast = restructureResult.success ? restructureResult.data : rawAST;
            const endTime = performance.now();
            const parseTime = endTime - startTime;

            set((state) => {
              state.parsing.ast = [...ast];
              state.parsing.isLoading = false;
              state.parsing.lastParsed = new Date();
              state.parsing.parseTime = parseTime;
            });

            // Record performance metrics
            get().recordParseTime(parseTime);

            console.log(
              `[DEBUG][Store] Parsed ${rawAST.length} raw AST nodes, restructured to ${ast.length} nodes in ${parseTime.toFixed(2)}ms`
            );
            return ast;
          } else {
            const errorMessage = parseResult.success
              ? parseResult.data.errors.map((e) => e.message).join('; ')
              : parseResult.error;
            throw new Error(errorMessage);
          }
        },
        (err) => {
          const endTime = performance.now();
          const parseTime = endTime - startTime;
          const errorMessage = err instanceof Error ? err.message : String(err);

          set((state) => {
            state.parsing.isLoading = false;
            state.parsing.errors = [errorMessage];
            state.parsing.parseTime = parseTime;
          });

          console.error(`[ERROR][Store] Parse failed: ${errorMessage}`);
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
      set((state) => {
        state.parsing.errors = [];
      });
    },
  };
};
