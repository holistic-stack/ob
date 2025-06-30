/**
 * Zustand Store Slice: Editor
 *
 * Manages editor-related state, including code content, cursor position,
 * selection, and file operations with debounced auto-parsing and auto-save.
 */

import type { StateCreator } from 'zustand';
import type { AppStore, EditorSlice } from '../types/store.types.js';
import type { EditorPosition, EditorSelection, DebounceConfig } from '../../../shared/types/common.types.js';
import type { AsyncResult } from '../../../shared/types/result.types.js';
import { tryCatchAsync } from '../../../shared/utils/functional/result.js';
import { debounce } from '../../../shared/utils/functional/pipe.js';
import type { UnifiedParserService } from '../../openscad-parser/services/unified-parser-service.js';

interface EditorSliceConfig {
  parserService: UnifiedParserService;
  debounceConfig: DebounceConfig;
}

export const createEditorSlice = (
  set: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[0],
  get: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[1],
  { parserService, debounceConfig }: EditorSliceConfig
): Omit<EditorSlice, keyof AppStore['editor']> => {
  // Debounced functions
  const debouncedParseInternal = debounce((code: string) => {
    const store = get();
    void store.parseCode(code);
  }, debounceConfig.parseDelayMs);

  const debouncedSaveInternal = debounce(async () => {
    const store = get();
    await store.saveCode();
  }, debounceConfig.saveDelayMs);

  return {
    updateCode: (code: string) => {
      set((state) => {
        state.editor.code = code;
        state.editor.isDirty = true;

        // Trigger debounced parsing if enabled
        if (state.config.enableRealTimeParsing) {
          debouncedParseInternal(code);
        }

        // Trigger debounced auto-save if enabled
        if (state.config.enableAutoSave) {
          void debouncedSaveInternal();
        }
      });
    },

    updateCursorPosition: (position: EditorPosition) => {
      set((state) => {
        state.editor.cursorPosition = position;
      });
    },

    updateSelection: (selection: EditorSelection | null) => {
      set((state) => {
        state.editor.selection = selection;
      });
    },

    markDirty: () => {
      set((state) => {
        state.editor.isDirty = true;
      });
    },

    markSaved: () => {
      set((state) => {
        state.editor.isDirty = false;
        state.editor.lastSaved = new Date();
      });
    },

    saveCode: async (): AsyncResult<void, string> => {
      return tryCatchAsync(
        async () => {
          // Mock save operation - in real implementation would save to file/server
          await new Promise((resolve) => setTimeout(resolve, 100));

          set((state) => {
            state.editor.isDirty = false;
            state.editor.lastSaved = new Date();
          });
        },
        (err) =>
          `Failed to save code: ${err instanceof Error ? err.message : String(err)}`,
      );
    },

    loadCode: async (source: string): AsyncResult<void, string> => {
      return tryCatchAsync(
        async () => {
          // Mock load operation - in real implementation would load from file/server
          await new Promise((resolve) => setTimeout(resolve, 50));

          set((state) => {
            state.editor.code = source;
            state.editor.isDirty = false;
            state.editor.lastSaved = new Date();
            state.editor.cursorPosition = { line: 1, column: 1 };
            state.editor.selection = null;
          });
        },
        (err) =>
          `Failed to load code: ${err instanceof Error ? err.message : String(err)}`,
      );
    },

    resetEditor: () => {
      set((state) => {
        state.editor.code = '';
        state.editor.cursorPosition = { line: 1, column: 1 };
        state.editor.selection = null;
        state.editor.isDirty = false;
        state.editor.lastSaved = null;
      });
    },
  };
};
