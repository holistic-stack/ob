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

          // Import renderASTNode dynamically to avoid circular dependencies
          const { renderASTNode } = await import('../../3d-renderer/services/primitive-renderer');

          // Create meshes directly using the same logic as R3FScene
          const meshes: THREE.Mesh[] = [];

          for (let i = 0; i < ast.length; i++) {
            const node = ast[i];
            if (node) {
              try {
                const meshResult = await renderASTNode(node, i);
                if (meshResult.success) {
                  meshes.push(meshResult.data.mesh);
                } else {
                  logger.error(`Failed to render node ${i} (${node.type}):`, meshResult.error);
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`Exception rendering node ${i} (${node.type}):`, errorMessage);
              }
            }
          }

          set((state) => {
            if (state.rendering) {
              state.rendering.isRendering = false;
              state.rendering.lastRendered = new Date();
              // Update meshes directly
              state.rendering.meshes = [...meshes];
            }
          });

          logger.debug(`renderFromAST completed with ${meshes.length} meshes`);
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
          // Handle readonly array properties properly
          const updatedCamera = { ...state.rendering.camera };

          // Update non-array properties
          Object.keys(cameraUpdate).forEach((key) => {
            if (key !== 'position' && key !== 'target') {
              (updatedCamera as any)[key] = (cameraUpdate as any)[key];
            }
          });

          // Handle array properties with proper mutable assignment
          if (cameraUpdate.position) {
            updatedCamera.position = [
              cameraUpdate.position[0],
              cameraUpdate.position[1],
              cameraUpdate.position[2],
            ];
          }
          if (cameraUpdate.target) {
            updatedCamera.target = [
              cameraUpdate.target[0],
              cameraUpdate.target[1],
              cameraUpdate.target[2],
            ];
          }

          state.rendering.camera = updatedCamera;
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
