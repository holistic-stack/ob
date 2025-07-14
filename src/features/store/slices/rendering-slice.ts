/**
 * Zustand Store Slice: Rendering
 *
 * Manages 3D rendering state, including meshes, camera controls,
 * and render error handling with performance monitoring.
 */

// TODO: Replace with BabylonJS imports
import type { StateCreator } from 'zustand';
import { createLogger } from '../../../shared/services/logger.service';
import type { CameraConfig } from '../../../shared/types/common.types.js';
import type { AsyncResult } from '../../../shared/types/result.types.js';
import { tryCatchAsync } from '../../../shared/utils/functional/result.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import type { GenericMeshData } from '../../ast-to-csg-converter/types/conversion.types';
import { ASTToMeshConversionService } from '../../ast-to-csg-converter/services/ast-to-mesh-converter/ast-to-mesh-converter';
import type { AppStore, RenderingActions, RenderingError } from '../types/store.types.js';

const logger = createLogger('Store');

export const createRenderingSlice = (
  set: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[0],
  get: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[1]
): RenderingActions => {
  return {
    updateMeshes: (meshes: ReadonlyArray<unknown>) => { // TODO: Replace with BabylonJS mesh type
      set((state) => {
        if (state.rendering) {
          // Dispose of old meshes to prevent memory leaks
          if (state.rendering.meshes && Array.isArray(state.rendering.meshes)) {
            state.rendering.meshes.forEach((mesh) => {
              if (mesh.geometry) {
                mesh.geometry.dispose();
              }
              if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach((material) => material.dispose());
                } else {
                  mesh.material.dispose();
                }
              }
            });
          }

          state.rendering.meshes = [...meshes];
          state.rendering.lastRendered = new Date();
        }
      });
    },

    renderFromAST: async (
      ast: ReadonlyArray<ASTNode>
    ): AsyncResult<ReadonlyArray<THREE.Mesh>, string> => {
      logger.debug(`[RENDER] Starting renderFromAST with ${ast.length} nodes using conversion service`);

      set((state) => {
        if (state.rendering) {
          state.rendering.isRendering = true;
          state.rendering.renderErrors = [];
        }
      });

      return tryCatchAsync(
        async () => {
          logger.debug(`[CONVERT] Processing ${ast.length} AST nodes through conversion layer`);

          // Use the conversion service instead of direct rendering
          const conversionService = new ASTToMeshConversionService();
          const initResult = await conversionService.initialize();

          if (!initResult.success) {
            throw new Error(`Failed to initialize conversion service: ${initResult.error}`);
          }

          // Convert AST to generic mesh data
          const conversionResult = await conversionService.convert(ast, {
            optimizeResult: true,
            preserveMaterials: false,
            enableCaching: true,
          });

          if (!conversionResult.success) {
            conversionService.dispose();
            throw new Error(`AST conversion failed: ${conversionResult.error}`);
          }

          // Convert generic mesh data to Three.js meshes
          const meshes: THREE.Mesh[] = [];

          for (const genericMesh of conversionResult.data.meshes) {
            try {
              // Create Three.js material from generic material config
              const material = new THREE.MeshStandardMaterial({
                color: genericMesh.material.color,
                metalness: genericMesh.material.metalness,
                roughness: genericMesh.material.roughness,
                opacity: genericMesh.material.opacity,
                transparent: genericMesh.material.transparent,
                side: genericMesh.material.side === 'double' ? THREE.DoubleSide :
                      genericMesh.material.side === 'back' ? THREE.BackSide : THREE.FrontSide,
              });

              // Create Three.js mesh
              const mesh = new THREE.Mesh(genericMesh.geometry, material);
              mesh.applyMatrix4(genericMesh.transform);

              meshes.push(mesh);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              logger.error(`[ERROR] Failed to create Three.js mesh from generic data:`, errorMessage);
            }
          }

          // Clean up conversion service
          conversionService.dispose();

          set((state) => {
            if (state.rendering) {
              state.rendering.isRendering = false;
              state.rendering.lastRendered = new Date();
              // Update meshes directly
              state.rendering.meshes = [...meshes];
            }
          });

          logger.debug(`[RENDER] renderFromAST completed with ${meshes.length} meshes via conversion service`);
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

    /**
     * Render generic mesh data directly (preferred method for new architecture)
     */
    renderFromMeshData: async (
      meshData: ReadonlyArray<GenericMeshData>
    ): AsyncResult<ReadonlyArray<THREE.Mesh>, string> => {
      logger.debug(`[RENDER] Starting renderFromMeshData with ${meshData.length} generic meshes`);

      set((state) => {
        if (state.rendering) {
          state.rendering.isRendering = true;
          state.rendering.renderErrors = [];
        }
      });

      return tryCatchAsync(
        async () => {
          logger.debug(`[CONVERT] Processing ${meshData.length} generic mesh data objects`);

          // Convert generic mesh data to Three.js meshes
          const meshes: THREE.Mesh[] = [];

          for (const genericMesh of meshData) {
            try {
              // Create Three.js material from generic material config
              const material = new THREE.MeshStandardMaterial({
                color: genericMesh.material.color,
                metalness: genericMesh.material.metalness,
                roughness: genericMesh.material.roughness,
                opacity: genericMesh.material.opacity,
                transparent: genericMesh.material.transparent,
                side: genericMesh.material.side === 'double' ? THREE.DoubleSide :
                      genericMesh.material.side === 'back' ? THREE.BackSide : THREE.FrontSide,
                wireframe: genericMesh.material.wireframe || false,
              });

              // Create Three.js mesh
              const mesh = new THREE.Mesh(genericMesh.geometry, material);
              mesh.applyMatrix4(genericMesh.transform);

              // Configure for CSG operations
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              meshes.push(mesh);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              logger.error(`[ERROR] Failed to create Three.js mesh from generic data:`, errorMessage);
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

          logger.debug(`[RENDER] renderFromMeshData completed with ${meshes.length} meshes`);
          return meshes;
        },
        (err) => {
          const errorMessage = err instanceof Error ? err.message : String(err);

          logger.error(`renderFromMeshData failed:`, errorMessage);

          set((state) => {
            if (state.rendering) {
              state.rendering.isRendering = false;
            }
          });
          get().addRenderError({
            type: 'geometry',
            message: errorMessage,
          });

          return `Render from mesh data failed: ${errorMessage}`;
        }
      );
    },

    clearScene: () => {
      set((state) => {
        if (state.rendering) {
          // Properly dispose of Three.js meshes to prevent memory leaks
          state.rendering.meshes.forEach((mesh) => {
            if (mesh.geometry) {
              mesh.geometry.dispose();
            }
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((material) => material.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          });

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
          if (cameraUpdate && typeof cameraUpdate === 'object') {
            Object.keys(cameraUpdate).forEach((key) => {
              if (key !== 'position' && key !== 'target') {
                (updatedCamera as any)[key] = (cameraUpdate as any)[key];
              }
            });
          }

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
