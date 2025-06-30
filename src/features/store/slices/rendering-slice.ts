/**
 * Zustand Store Slice: Rendering
 *
 * Manages 3D rendering state, including meshes, camera controls,
 * and render error handling with performance monitoring.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import type * as THREE from 'three';
import type { StateCreator } from 'zustand';
import type { CameraConfig } from '../../../shared/types/common.types.js';
import type { AsyncResult } from '../../../shared/types/result.types.js';
import { tryCatchAsync } from '../../../shared/utils/functional/result.js';
import type { AppStore, RenderingSlice } from '../types/store.types.js';

export const createRenderingSlice = (
  set: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[0],
  get: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[1]
): Omit<RenderingSlice, keyof AppStore['rendering']> => {
  return {
    updateMeshes: (meshes: ReadonlyArray<THREE.Mesh>) => {
      set((state) => {
        state.rendering.meshes = [...meshes];
        state.rendering.lastRendered = new Date();
      });
    },

    renderFromAST: async (
      ast: ReadonlyArray<ASTNode>
    ): AsyncResult<ReadonlyArray<THREE.Mesh>, string> => {
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
          await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate processing time

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

    updateCamera: (cameraUpdate: Partial<CameraConfig>) => {
      set((state) => {
        Object.assign(state.rendering.camera, cameraUpdate);
      });
    },

    resetCamera: () => {
      set((state) => {
        state.rendering.camera = {
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
      });
    },

    addRenderError: (error: string) => {
      set((state) => {
        state.rendering.renderErrors = [...state.rendering.renderErrors, error];
      });
    },

    clearRenderErrors: () => {
      set((state) => {
        state.rendering.renderErrors = [];
      });
    },
  };
};
