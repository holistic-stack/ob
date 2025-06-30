/**
 * Main Application Store
 *
 * Zustand store implementation with functional programming patterns,
 * Result<T,E> error handling, and 300ms debouncing for OpenSCAD operations.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { AppStore, AppState, StoreOptions } from './types/store.types.js';
import type {
  AppConfig,
  CameraConfig
} from '../../shared/types/common.types.js';
import { UnifiedParserService } from '../openscad-parser/services/unified-parser-service.js';
import { createPerformanceSlice } from './slices/performance-slice.js';
import { createEditorSlice } from './slices/editor-slice.js';
import { createParsingSlice } from './slices/parsing-slice.js';
import { createRenderingSlice } from './slices/rendering-slice.js';
import { createConfigSlice } from './slices/config-slice.js';

/**
 * Default application configuration
 */
export const DEFAULT_CONFIG: AppConfig = {
  debounceMs: 300,
  enableAutoSave: false,
  enableRealTimeParsing: true,
  enableRealTimeRendering: true,
  theme: "dark",
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
export const DEFAULT_OPENSCAD_CODE = "cube([10,10,10]);";

/**
 * Shared parser service instance
 */
const parserService = new UnifiedParserService({
  enableLogging: true,
  retryAttempts: 3,
  timeoutMs: 10000,
});

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
    ast: [],
    errors: [],
    warnings: [],
    isLoading: false,
    lastParsed: null,
    parseTime: 0,
  },
  rendering: {
    meshes: [],
    isRendering: false,
    renderErrors: [],
    lastRendered: null,
    renderTime: 0,
    camera: options?.initialState?.rendering?.camera ?? DEFAULT_CAMERA,
  },
  performance: {
    metrics: {
      renderTime: 0,
      parseTime: 0,
      memoryUsage: 0,
      frameRate: 60,
    },
    isMonitoring: false,
    violations: [],
    lastUpdated: null,
  },
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
  },
) => {
  return create<AppStore>()(
    devtools(
      persist(
        immer((set, get) => ({
          ...(createInitialState(options) as AppStore),
          ...createEditorSlice(set, get, {
            parserService,
            debounceConfig: options.debounceConfig,
          }),
          ...createParsingSlice(set, get, { parserService }),
          ...createRenderingSlice(set, get),
          ...createPerformanceSlice(set, get),
          ...createConfigSlice(set, get, { DEFAULT_CONFIG }),
        })),
        {
          name: "openscad-app-store",
          partialize: (state) => ({
            config: state.config,
            editor: {
              code: state.editor.code,
              lastSaved: state.editor.lastSaved,
            },
            rendering: {
              camera: state.rendering.camera,
            },
          }),
        },
      ),
      {
        enabled: options.enableDevtools,
        name: "OpenSCAD App Store",
      },
    ),
  );
};

/**
 * Initialize store with default content
 */
const initializeStore = async (store: ReturnType<typeof createAppStore>) => {
  const state = store.getState();

  console.log("[INIT][Store] Initializing store with current code:", {
    codeLength: state.editor.code.length,
    astLength: state.parsing.ast.length,
    enableRealTimeParsing: state.config.enableRealTimeParsing,
  });

  // Parse current code if we have any code and no AST yet
  if (state.editor.code.length > 0 && state.parsing.ast.length === 0) {
    console.log("[INIT][Store] Triggering initial parsing of current code");

    // Trigger initial parsing of current code
    await state.parseCode(state.editor.code);

    console.log("[INIT][Store] Initial code parsed successfully");
  }
};

/**
 * Create and export the main app store instance
 */
const appStore = createAppStore();

// Initialize the store after creating it
void initializeStore(appStore);

/**
 * Export the store for testing and direct access
 */
export const appStoreInstance = appStore;

/**
 * Hook to use the app store with flattened properties for backwards compatibility
 * Supports both selector and non-selector usage patterns
 */
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, get) => {
        const defaultStoreOptions: StoreOptions = {
          enableDevtools: true,
          enablePersistence: false,
          debounceConfig: {
            parseDelayMs: 300,
            renderDelayMs: 300,
            saveDelayMs: 1000,
          },
        };
        return {
          ...createInitialState(defaultStoreOptions),
          ...createEditorSlice(set, get, { parserService, debounceConfig: defaultStoreOptions.debounceConfig }),
          ...createParsingSlice(set, get, { parserService }),
          ...createRenderingSlice(set, get),
          ...createPerformanceSlice(set, get),
          ...createConfigSlice(set, get, { DEFAULT_CONFIG }),
        };
      }),
      {
        name: "openscad-app-store",
        partialize: (state) => ({
          config: state.config,
          editor: {
            code: state.editor.code,
            lastSaved: state.editor.lastSaved,
          },
          rendering: {
            camera: state.rendering.camera,
          },
        }),
      },
    ),
    {
      enabled: true,
      name: "OpenSCAD App Store",
    },
  ),
);

export type { AppState, AppStore };
