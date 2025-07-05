/**
 * React Three Fiber Scene Component
 *
 * A proper R3F scene component that renders OpenSCAD AST nodes
 * as Three.js objects within the React Three Fiber context.
 */

import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type * as React from 'react';
import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import { createLogger } from '../../../shared/services/logger.service';
import type { CameraConfig } from '../../../shared/types/common.types';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import { renderASTNode } from '../services/primitive-renderer';
import type { Mesh3D, RenderingMetrics } from '../types/renderer.types';

// Create logger instance for this component
const logger = createLogger('R3FScene');

/**
 * Props for the R3F scene component
 */
interface R3FSceneProps {
  readonly astNodes: ReadonlyArray<ASTNode>;
  readonly camera: CameraConfig;
  readonly onCameraChange?: (camera: CameraConfig) => void;
  readonly onRenderComplete?: (meshes: ReadonlyArray<Mesh3D>) => void;
  readonly onRenderError?: (error: { message: string }) => void;
}

/**
 * Simple performance measurement utility
 */
const _measureTime = <T,>(fn: () => T): { result: T; duration: number } => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, duration: end - start };
};

/**
 * Async performance measurement utility
 */
const measureTimeAsync = async <T,>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, duration: end - start };
};

/**
 * R3F Scene component that renders AST nodes
 */
export const R3FScene: React.FC<R3FSceneProps> = ({
  astNodes,
  camera,
  onCameraChange,
  onRenderComplete,
  onRenderError,
}) => {
  const { scene } = useThree();
  const meshesRef = useRef<Mesh3D[]>([]);

  /**
   * Update scene when AST nodes change
   */
  useEffect(() => {
    const updateScene = async () => {
      logger.debug(`Updating scene with ${astNodes.length} AST nodes`);

      try {
        const { result: meshes, duration: renderTime } = await measureTimeAsync(async () => {
          // Clear existing meshes using proper disposal
          meshesRef.current.forEach((mesh3D) => {
            scene.remove(mesh3D.mesh);
            mesh3D.dispose(); // Use the Mesh3D disposal method
          });
          meshesRef.current = [];

          // Create new meshes from AST nodes using proper service
          const newMeshes: Mesh3D[] = [];

          // Process nodes sequentially to maintain order
          for (let index = 0; index < astNodes.length; index++) {
            const node = astNodes[index];
            if (!node) {
              logger.warn(`Skipping undefined node at index ${index}`);
              continue;
            }

            try {
              const result = await renderASTNode(node, index);
              if (result.success) {
                const mesh3D = result.data;

                // Position meshes in a grid for multiple objects
                const gridSize = Math.ceil(Math.sqrt(astNodes.length));
                const x = (index % gridSize) * 2.5 - (gridSize - 1) * 1.25;
                const z = Math.floor(index / gridSize) * 2.5 - (gridSize - 1) * 1.25;
                (mesh3D.mesh as THREE.Mesh).position.set(x, 0, z);

                scene.add(mesh3D.mesh);
                newMeshes.push(mesh3D);

                logger.debug(`Successfully created mesh for ${node.type} at index ${index}`);
              } else {
                // Type narrowing: result.success is false, so result.error exists
                logger.error(`Failed to render AST node ${index} (${node.type}):`, result.error);
                onRenderError?.({ message: result.error });
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              logger.error(`Failed to create mesh for node ${index} (${node.type}):`, errorMessage);
              onRenderError?.({ message: errorMessage });
            }
          }

          return newMeshes;
        });

        meshesRef.current = meshes;

        // Report render completion
        logger.debug(`Calling onRenderComplete with ${meshes.length} meshes`);
        onRenderComplete?.(meshes);
      } catch (error) {
        logger.error('Failed to update scene:', error);
        onRenderError?.({
          message: error instanceof Error ? error.message : 'Unknown scene update error',
        });
      }
    };

    // Call the async function
    void updateScene().catch((error) => {
      logger.error('Failed to update scene:', error);
      onRenderError?.({
        message: error instanceof Error ? error.message : 'Unknown scene update error',
      });
    });
  }, [astNodes, scene, onRenderComplete, onRenderError]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />

      {/* Camera controls */}
      <OrbitControls
        target={[...camera.target] as [number, number, number]}
        onChange={(event) => {
          if (event?.target && onCameraChange) {
            const controls = event.target as unknown as {
              object: { position: { x: number; y: number; z: number } };
              target: { x: number; y: number; z: number };
            };
            const newCamera: CameraConfig = {
              position: [
                controls.object.position.x,
                controls.object.position.y,
                controls.object.position.z,
              ] as const,
              target: [controls.target.x, controls.target.y, controls.target.z] as const,
              zoom: camera.zoom,
              fov: camera.fov,
              near: camera.near,
              far: camera.far,
              enableControls: camera.enableControls,
              enableAutoRotate: camera.enableAutoRotate,
              autoRotateSpeed: camera.autoRotateSpeed,
            };
            onCameraChange(newCamera);
          }
        }}
      />
    </>
  );
};

export default R3FScene;
