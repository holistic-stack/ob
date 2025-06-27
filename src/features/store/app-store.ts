/**
 * Main Application Store
 * 
 * Zustand store implementation with functional programming patterns,
 * Result<T,E> error handling, and 300ms debouncing for OpenSCAD operations.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import type * as THREE from 'three';

import type { AppStore, AppState, StoreOptions } from './types/store.types';
import type { 
  EditorPosition, 
  EditorSelection, 
  Camera3D, 
  AppConfig, 
  PerformanceMetrics 
} from '../../shared/types/common.types';
import type { AsyncResult } from '../../shared/types/result.types';
import { success, error, tryCatchAsync } from '../../shared/utils/functional/result';
import { debounce } from '../../shared/utils/functional/pipe';
import { UnifiedParserService } from '../openscad-parser/services';
import { restructureAST } from '../3d-renderer/services/ast-restructuring-service';

/**
 * Default application configuration
 */
const DEFAULT_CONFIG: AppConfig = {
  debounceMs: 300,
  enableAutoSave: false,
  enableRealTimeParsing: true,
  enableRealTimeRendering: true,
  theme: 'dark',
  performance: {
    enableMetrics: true,
    maxRenderTime: 16,
    enableWebGL2: true,
    enableHardwareAcceleration: true
  }
};

/**
 * Default camera configuration
 */
const DEFAULT_CAMERA: Camera3D = {
  position: [10, 10, 10],
  target: [0, 0, 0],
  zoom: 1
};

/**
 * Default OpenSCAD code for initialization
 */
const DEFAULT_OPENSCAD_CODE = 'cube([10,10,10]);';

/**
 * Shared parser service instance
 */
const parserService = new UnifiedParserService({
  enableLogging: true,
  retryAttempts: 3,
  timeoutMs: 10000
});

/**
 * Initial application state
 */
const createInitialState = (options?: StoreOptions): AppState => ({
  editor: {
    code: DEFAULT_OPENSCAD_CODE,
    cursorPosition: { line: 1, column: 1 },
    selection: null,
    isDirty: false,
    lastSaved: null
  },
  parsing: {
    ast: [],
    errors: [],
    warnings: [],
    isLoading: false,
    lastParsed: null,
    parseTime: 0
  },
  rendering: {
    meshes: [],
    isRendering: false,
    renderErrors: [],
    lastRendered: null,
    renderTime: 0,
    camera: DEFAULT_CAMERA
  },
  performance: {
    metrics: {
      renderTime: 0,
      parseTime: 0,
      memoryUsage: 0,
      frameRate: 60
    },
    isMonitoring: false,
    violations: [],
    lastUpdated: null
  },
  config: {
    ...DEFAULT_CONFIG,
    ...options?.initialState?.config
  }
});

/**
 * Create the Zustand store with all actions and middleware
 */
export const createAppStore = (options: StoreOptions = {
  enableDevtools: true,
  enablePersistence: false,
  debounceConfig: {
    parseDelayMs: 300,
    renderDelayMs: 300,
    saveDelayMs: 1000
  }
}) => {
  
  return create<AppStore>()(
    devtools(
      persist(
        immer((set, get) => {
          // Debounced functions
          const debouncedParseInternal = debounce(
            (code: string) => {
              const store = get();
              store.parseCode(code);
            },
            options.debounceConfig.parseDelayMs
          );

          const debouncedSaveInternal = debounce(
            () => {
              const store = get();
              store.saveCode();
            },
            options.debounceConfig.saveDelayMs
          );

          return {
            // Initial state
            ...createInitialState(options),

            // Editor Actions
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
                  debouncedSaveInternal();
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
              const state = get();
              
              return tryCatchAsync(
                async () => {
                  // Mock save operation - in real implementation would save to file/server
                  await new Promise(resolve => setTimeout(resolve, 100));
                  
                  set((state) => {
                    state.editor.isDirty = false;
                    state.editor.lastSaved = new Date();
                  });
                },
                (err) => `Failed to save code: ${err instanceof Error ? err.message : String(err)}`
              );
            },

            loadCode: async (source: string): AsyncResult<void, string> => {
              return tryCatchAsync(
                async () => {
                  // Mock load operation - in real implementation would load from file/server
                  await new Promise(resolve => setTimeout(resolve, 50));
                  
                  set((state) => {
                    state.editor.code = source;
                    state.editor.isDirty = false;
                    state.editor.lastSaved = new Date();
                    state.editor.cursorPosition = { line: 1, column: 1 };
                    state.editor.selection = null;
                  });
                },
                (err) => `Failed to load code: ${err instanceof Error ? err.message : String(err)}`
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

            // Parsing Actions
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
                      enableSourceLocationAnalysis: true
                    });

                    if (!restructureResult.success) {
                      console.warn(`[WARN][Store] AST restructuring failed: ${restructureResult.error}, using original AST`);
                    }

                    const ast = restructureResult.success ? restructureResult.data : rawAST;
                    const endTime = performance.now();
                    const parseTime = endTime - startTime;

                    set((state) => {
                      state.parsing.ast = ast;
                      state.parsing.isLoading = false;
                      state.parsing.lastParsed = new Date();
                      state.parsing.parseTime = parseTime;
                    });

                    // Record performance metrics
                    get().recordParseTime(parseTime);

                    console.log(`[DEBUG][Store] Parsed ${rawAST.length} raw AST nodes, restructured to ${ast.length} nodes in ${parseTime.toFixed(2)}ms`);
                    return ast;
                  } else {
                    const errorMessage = parseResult.success
                      ? parseResult.data.errors.map(e => e.message).join('; ')
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
              debouncedParseInternal(code);
            },

            addParsingError: (errorMessage: string) => {
              set((state) => {
                state.parsing.errors = [...state.parsing.errors, errorMessage];
              });
            },

            clearParsingErrors: () => {
              set((state) => {
                state.parsing.errors = [];
              });
            },

            // Rendering Actions
            updateMeshes: (meshes: ReadonlyArray<THREE.Mesh>) => {
              set((state) => {
                state.rendering.meshes = meshes;
                state.rendering.lastRendered = new Date();
              });
            },

            renderFromAST: async (ast: ReadonlyArray<ASTNode>): AsyncResult<ReadonlyArray<THREE.Mesh>, string> => {
              console.log(`[DEBUG][Store] Starting renderFromAST with ${ast.length} nodes`);

              set((state) => {
                state.rendering.isRendering = true;
                state.rendering.renderErrors = [];
              });

              const startTime = performance.now();

              return tryCatchAsync(
                async () => {
                  console.log(`[DEBUG][Store] Processing ${ast.length} AST nodes for rendering`);

                  // For now, we'll let the R3FScene handle the actual mesh creation
                  // This function primarily manages the store state
                  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate processing time

                  // The actual meshes are created by R3FScene component
                  // We'll return an empty array here and let the R3FScene update the store
                  const meshes: THREE.Mesh[] = [];
                  const endTime = performance.now();
                  const renderTime = endTime - startTime;

                  set((state) => {
                    state.rendering.isRendering = false;
                    state.rendering.lastRendered = new Date();
                    state.rendering.renderTime = renderTime;
                    // Don't update meshes here - let R3FScene handle that
                  });

                  // Record performance metrics
                  get().recordRenderTime(renderTime);

                  console.log(`[DEBUG][Store] renderFromAST completed in ${renderTime.toFixed(2)}ms`);
                  return meshes;
                },
                (err) => {
                  const endTime = performance.now();
                  const renderTime = endTime - startTime;
                  const errorMessage = err instanceof Error ? err.message : String(err);

                  console.error(`[ERROR][Store] renderFromAST failed:`, errorMessage);

                  set((state) => {
                    state.rendering.isRendering = false;
                    state.rendering.renderErrors = [errorMessage];
                    state.rendering.renderTime = renderTime;
                  });

                  return `Render failed: ${errorMessage}`;
                }
              );
            },

            clearScene: () => {
              set((state) => {
                state.rendering.meshes = [];
                state.rendering.renderErrors = [];
                state.rendering.lastRendered = null;
                state.rendering.renderTime = 0;
              });
            },

            updateCamera: (camera: Camera3D) => {
              set((state) => {
                state.rendering.camera = camera;
              });
            },

            resetCamera: () => {
              set((state) => {
                state.rendering.camera = DEFAULT_CAMERA;
              });
            },

            /**
             * Update mesh count from R3FScene component
             */
            updateMeshCount: (count: number) => {
              console.log(`[DEBUG][Store] Updating mesh count to ${count}`);
              set((state) => {
                state.rendering.meshes = new Array(count).fill(null); // Placeholder for mesh count
              });
            },

            addRenderError: (errorMessage: string) => {
              set((state) => {
                state.rendering.renderErrors = [...state.rendering.renderErrors, errorMessage];
              });
            },

            clearRenderErrors: () => {
              set((state) => {
                state.rendering.renderErrors = [];
              });
            },

            // Performance Actions
            updateMetrics: (metrics: PerformanceMetrics) => {
              set((state) => {
                state.performance.metrics = metrics;
                state.performance.lastUpdated = new Date();
              });
            },

            startMonitoring: () => {
              set((state) => {
                state.performance.isMonitoring = true;
              });
            },

            stopMonitoring: () => {
              set((state) => {
                state.performance.isMonitoring = false;
              });
            },

            recordParseTime: (duration: number) => {
              set((state) => {
                state.performance.metrics.parseTime = duration;
                state.performance.lastUpdated = new Date();
              });
            },

            recordRenderTime: (duration: number) => {
              set((state) => {
                state.performance.metrics.renderTime = duration;
                state.performance.lastUpdated = new Date();
              });
            },

            addPerformanceViolation: (violation: string) => {
              set((state) => {
                state.performance.violations = [...state.performance.violations, violation];
              });
            },

            clearPerformanceViolations: () => {
              set((state) => {
                state.performance.violations = [];
              });
            },

            // Configuration Actions
            updateConfig: (configUpdate: Partial<AppConfig>) => {
              set((state) => {
                state.config = { ...state.config, ...configUpdate };
              });
            },

            resetConfig: () => {
              set((state) => {
                state.config = DEFAULT_CONFIG;
              });
            },

            toggleRealTimeParsing: () => {
              set((state) => {
                state.config.enableRealTimeParsing = !state.config.enableRealTimeParsing;
              });
            },

            toggleRealTimeRendering: () => {
              set((state) => {
                state.config.enableRealTimeRendering = !state.config.enableRealTimeRendering;
              });
            },

            toggleAutoSave: () => {
              set((state) => {
                state.config.enableAutoSave = !state.config.enableAutoSave;
              });
            }
          };
        }),
        {
          name: 'openscad-app-store',
          enabled: options.enablePersistence,
          partialize: (state) => ({
            config: state.config,
            editor: {
              code: state.editor.code,
              lastSaved: state.editor.lastSaved
            }
          })
        }
      ),
      {
        enabled: options.enableDevtools,
        name: 'OpenSCAD App Store'
      }
    )
  );
};

/**
 * Initialize store with default content
 */
const initializeStore = async (store: AppStore) => {
  const state = store.getState();

  console.log('[INIT][Store] Initializing store with current code:', {
    codeLength: state.editor.code.length,
    code: state.editor.code,
    astLength: state.parsing.ast.length,
    enableRealTimeParsing: state.config.enableRealTimeParsing
  });

  // Parse current code if we have any code and no AST yet
  if (state.editor.code.length > 0 && state.parsing.ast.length === 0) {
    console.log('[INIT][Store] Triggering initial parsing of current code');

    // Trigger initial parsing of current code
    await state.parseCode(state.editor.code);

    console.log('[INIT][Store] Initial code parsed successfully');
  }
};

/**
 * Default store instance - singleton to prevent re-creation
 */
let _storeInstance: AppStore | null = null;

export const useAppStore = (() => {
  if (!_storeInstance) {
    console.log('[INIT][Store] Creating singleton store instance');
    _storeInstance = createAppStore();

    // Initialize the store with default content
    initializeStore(_storeInstance).catch(error => {
      console.error('[ERROR][Store] Failed to initialize store:', error);
    });
  }
  return _storeInstance;
})();
