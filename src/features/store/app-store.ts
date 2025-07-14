/**
 * Main Application Store
 *
 * Zustand store implementation with functional programming patterns,
 * Result<T,E> error handling, and 300ms debouncing for OpenSCAD operations.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createLogger } from '../../shared/services/logger.service.js';
import type { AppConfig, CameraConfig } from '../../shared/types/common.types.js';
import type { ASTNode } from '../openscad-parser/ast/ast-types.js';
import { getParserInitializationService } from '../openscad-parser/services/parser-initialization.service.js';
import { createConfigSlice } from './slices/config-slice.js';
import { createEditorSlice } from './slices/editor-slice.js';
import { createParsingSlice } from './slices/parsing-slice.js';

import { createBabylonRenderingSlice, createInitialBabylonRenderingState } from './slices/babylon-rendering-slice';
import type { AppState, AppStore, StoreOptions } from './types/store.types.js';

const logger = createLogger('Store');

/**
 * Default application configuration
 */
export const DEFAULT_CONFIG: AppConfig = {
  debounceMs: 300,
  enableAutoSave: false,
  enableRealTimeParsing: true,
  enableRealTimeRendering: true,
  theme: 'dark',
  performance: {
    enableMetrics: true,
    maxRenderTime: 16,
    enableWebGL2: true,
    enableHardwareAcceleration: true,
  },
};

/**
 * Default camera configuration
 */
export const DEFAULT_CAMERA: CameraConfig = {
  position: [10, 10, 10],
  target: [0, 0, 0],
  zoom: 1,
  fov: 75,
  near: 0.1,
  far: 1000,
  enableControls: true,
  enableAutoRotate: false,
  autoRotateSpeed: 1,
};

/**
 * Default OpenSCAD code for initialization
 */
export const DEFAULT_OPENSCAD_CODE = 'sphere(5);';

/**
 * Parser initialization is now handled by the parser initialization service
 * in the parsing slice. This ensures proper singleton pattern and prevents
 * multiple initialization calls that could cause import hangs.
 */

/**
 * Initial application state
 */
const createInitialState = (options?: StoreOptions): AppState => ({
  editor: {
    code: options?.initialState?.editor?.code ?? DEFAULT_OPENSCAD_CODE,
    cursorPosition: { line: 1, column: 1 },
    selection: null,
    isDirty: false,
    lastSaved: null,
  },
  parsing: {
    ast: [] as ReadonlyArray<ASTNode>,
    errors: [],
    warnings: [],
    isLoading: false,
    lastParsed: null,
    lastParsedCode: null,
    parseTime: 0,
  },
  babylonRendering: createInitialBabylonRenderingState(),
  config: {
    ...DEFAULT_CONFIG,
    ...options?.initialState?.config,
  },
});

/**
 * Create the Zustand store with all actions and middleware
 */
export const createAppStore = (
  options: StoreOptions = {
    enableDevtools: true,
    enablePersistence: false,
    debounceConfig: {
      parseDelayMs: 300,
      renderDelayMs: 300,
      saveDelayMs: 1000,
    },
  }
) => {
  const storeCreator = immer<AppStore>((set, get) => ({
    ...(createInitialState(options) as AppStore),
    ...createEditorSlice(set, get, {
      debounceConfig: options.debounceConfig,
    }),
    ...createParsingSlice(set, get),
    
    ...createBabylonRenderingSlice(set, get),
    ...createConfigSlice(set, get, { DEFAULT_CONFIG }),
  }));

  const withPersistence = options.enablePersistence
    ? persist(storeCreator, {
        name: 'openscad-app-store',
        partialize: (state: AppStore) => ({
          config: state.config,
          editor: {
            code: state.editor.code,
            lastSaved: state.editor.lastSaved,
          },
          babylonRendering: {
            camera: state.babylonRendering?.camera,
          },
        }),
      })
    : storeCreator;

  return create<AppStore>()(
    devtools(withPersistence as any, {
      enabled: options.enableDevtools,
      name: 'OpenSCAD App Store',
    })
  );
};

/**
 * Initialize store with default content
 */
const initializeStore = async (store: ReturnType<typeof createAppStore>) => {
  const state = store.getState();

  logger.init('Initializing store with current code:', {
    codeLength: state.editor.code.length,
    astLength: state.parsing.ast.length,
    enableRealTimeParsing: state.config.enableRealTimeParsing,
  });

  // Parse current code if we have any code and no AST yet
  if (state.editor.code.length > 0 && state.parsing.ast.length === 0) {
    logger.init('Triggering initial parsing of current code');

    // Trigger initial parsing of current code
    await state.parseCode(state.editor.code);

    logger.init('Initial code parsed successfully');
  }
};

/**
 * Create and export the main app store instance
 */
const appStore = createAppStore({
  enableDevtools: true,
  enablePersistence: true, // Enable persistence to save editor content between sessions
  debounceConfig: {
    parseDelayMs: 300,
    renderDelayMs: 300,
    saveDelayMs: 1000,
  },
});

// Initialize the store after creating it
void initializeStore(appStore);

/**
 * Export the store for testing and direct access
 */
export const appStoreInstance = appStore;

/**
 * Hook to use the app store.
 * This hook connects to the single, centralized appStore instance.
 */
export const useAppStore = appStore;

export type { AppState, AppStore };
