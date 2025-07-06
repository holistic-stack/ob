/**
 * Zustand Store Slice: Rendering
 *
 * Manages 3D rendering state, including meshes, camera controls,
 * and render error handling with performance monitoring.
 */

import type * as THREE from 'three';
import type { StateCreator } from 'zustand';
import { createLogger } from '../../../shared/services/logger.service';
import type { CameraConfig } from '../../../shared/types/common.types.js';
import type { AsyncResult } from '../../../shared/types/result.types.js';
import { tryCatchAsync } from '../../../shared/utils/functional/result.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import type { AppStore, RenderingActions, RenderingError } from '../types/store.types.js';

const logger = createLogger('Store');

export const createRenderingSlice = (
  set: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[0],
  get: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[1]
): RenderingActions => {
  return {
    updateMeshes: (meshes: ReadonlyArray<THREE.Mesh>) => {
      set((state) => {
        if (state.rendering) {
          state.rendering.meshes = [...meshes];
          state.rendering.lastRendered = new Date();
        }
      });
    },

    renderFromAST: async (
      ast: ReadonlyArray<ASTNode>
    ): AsyncResult<ReadonlyArray<THREE.Mesh>, string> => {
      logger.debug(`Starting renderFromAST with ${ast.length} nodes`);

      set((state) => {
        if (state.rendering) {
          state.rendering.isRendering = true;
          state.rendering.renderErrors = [];
        }
      });

      return tryCatchAsync(
        async () => {
          logger.debug(`Processing ${ast.length} AST nodes for rendering`);

          // For now, we'll let the R3FScene handle the actual mesh creation
          // This function primarily manages the store state
          await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate processing time

          // The actual meshes are created by R3FScene component
          // We'll return an empty array here and let the R3FScene update the store
          const meshes: THREE.Mesh[] = [];

          set((state) => {
            if (state.rendering) {
              state.rendering.isRendering = false;
              state.rendering.lastRendered = new Date();
              // Don't update meshes here - let R3FScene handle that
            }
          });

          logger.debug(`renderFromAST completed`);
          return meshes;
        },
        (err) => {
          const errorMessage = err instanceof Error ? err.message : String(err);

          logger.error(`renderFromAST failed:`, errorMessage);

          set((state) => {
            if (state.rendering) {
              state.rendering.isRendering = false;
            }
          });
          get().addRenderError({
            type: 'geometry',
            message: errorMessage,
          }); // Use the new addRenderError

          return `Render failed: ${errorMessage}`;
        }
      );
    },

    clearScene: () => {
      set((state) => {
        if (state.rendering) {
          state.rendering.meshes = [];
          state.rendering.renderErrors = [];
          state.rendering.lastRendered = null;
        }
      });
    },

    updateCamera: (cameraUpdate: Partial<CameraConfig>) => {
      set((state) => {
        if (state.rendering) {
          state.rendering.camera = { ...state.rendering.camera, ...cameraUpdate };
        }
      });
    },

    resetCamera: () => {
      set((state) => {
        if (state.rendering) {
          Object.assign(state.rendering.camera, {
            position: [10, 10, 10] as const,
            target: [0, 0, 0] as const,
            zoom: 1,
            fov: 75,
            near: 0.1,
            far: 1000,
            enableControls: true,
            enableAutoRotate: false,
            autoRotateSpeed: 1,
          });
        }
      });
    },

    addRenderError: (error: RenderingError) => {
      set((state) => {
        if (state.rendering) {
          // Ensure renderErrors array exists before spreading
          const currentErrors = state.rendering.renderErrors || [];
          state.rendering.renderErrors = [...currentErrors, error];
        }
      });
    },

    clearRenderErrors: () => {
      set((state) => {
        if (state.rendering) {
          state.rendering.renderErrors = [];
        }
      });
    },
  };
};
