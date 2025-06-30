/**
 * React Three Fiber Scene Component
 *
 * A proper R3F scene component that renders OpenSCAD AST nodes
 * as Three.js objects within the React Three Fiber context.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type * as React from 'react';
import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import type { CameraConfig } from '../../../shared/types/common.types';
import { renderASTNode } from '../services/primitive-renderer';
import type { Mesh3D, RenderingMetrics } from '../types/renderer.types';

/**
 * Props for the R3F scene component
 */
interface R3FSceneProps {
  readonly astNodes: ReadonlyArray<ASTNode>;
  readonly camera: CameraConfig;
  readonly onCameraChange?: (camera: CameraConfig) => void;
  readonly onPerformanceUpdate?: (metrics: RenderingMetrics) => void;
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
  onPerformanceUpdate,
  onRenderComplete,
  onRenderError,
}) => {
  const { scene, gl } = useThree();
  const meshesRef = useRef<Mesh3D[]>([]);
  const frameCount = useRef(0);
  const lastPerformanceUpdate = useRef(0);

  /**
   * Update scene when AST nodes change
   */
  useEffect(() => {
    const updateScene = async () => {
      console.log(`[DEBUG][R3FScene] Updating scene with ${astNodes.length} AST nodes`);

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
            console.warn(`[DEBUG][R3FScene] Skipping undefined node at index ${index}`);
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

              console.log(
                `[DEBUG][R3FScene] Successfully created mesh for ${node.type} at index ${index}`
              );
            } else {
              // Type narrowing: result.success is false, so result.error exists
              console.error(
                `[ERROR][R3FScene] Failed to render AST node ${index} (${node.type}):`,
                result.error
              );
              onRenderError?.({ message: result.error });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(
              `[ERROR][R3FScene] Failed to create mesh for node ${index} (${node.type}):`,
              errorMessage
            );
            onRenderError?.({ message: errorMessage });
          }
        }

        return newMeshes;
      });

      meshesRef.current = meshes;

      // Report render completion
      onRenderComplete?.(meshes);

      // Update performance metrics
      const memoryUsage =
        (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize ?? 0;
      const triangleCount = meshes.reduce((total, mesh3D) => {
        const geometry = (mesh3D.mesh as THREE.Mesh).geometry;
        if (geometry.index) {
          return total + (geometry.index as THREE.BufferAttribute).count / 3;
        } else if (geometry.attributes.position) {
          return total + (geometry.attributes.position as THREE.BufferAttribute).count / 3;
        }
        return total;
      }, 0);

      const vertexCount = meshes.reduce((total, mesh3D) => {
        const geometry = (mesh3D.mesh as THREE.Mesh).geometry;
        return total + ((geometry.attributes.position as THREE.BufferAttribute)?.count ?? 0);
      }, 0);

      onPerformanceUpdate?.({
        renderTime,
        parseTime: 0, // AST parsing happens elsewhere
        memoryUsage: memoryUsage / (1024 * 1024), // Convert to MB
        frameRate: 60, // Approximate - will be updated in frame loop
        meshCount: meshes.length,
        triangleCount,
        vertexCount,
        drawCalls: meshes.length, // Approximate - one draw call per mesh
        textureMemory: 0, // Not tracking texture memory yet
        bufferMemory: 0, // Not tracking buffer memory yet
      });
    };

    // Call the async function
    void updateScene().catch((error) => {
      console.error('[ERROR][R3FScene] Failed to update scene:', error);
      onRenderError?.({
        message: error.message ?? 'Unknown scene update error',
      });
    });
  }, [astNodes, scene, onRenderComplete, onRenderError, onPerformanceUpdate]);

  /**
   * Frame loop for performance monitoring
   */
  useFrame(() => {
    frameCount.current++;

    // Update performance metrics every second
    const now = performance.now();
    if (now - lastPerformanceUpdate.current > 1000) {
      const frameRate = frameCount.current;
      frameCount.current = 0;
      lastPerformanceUpdate.current = now;

      const memoryUsage =
        (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize ?? 0;
      const currentMeshes = meshesRef.current;

      onPerformanceUpdate?.({
        renderTime: gl.info.render.frame > 0 ? 16.67 : 0, // Approximate frame time
        parseTime: 0,
        memoryUsage: memoryUsage / (1024 * 1024),
        frameRate,
        meshCount: currentMeshes.length,
        triangleCount: currentMeshes.reduce((total, mesh3D) => {
          const geometry = (mesh3D.mesh as THREE.Mesh).geometry;
          if (geometry.index) {
            return total + (geometry.index as THREE.BufferAttribute).count / 3;
          } else if (geometry.attributes.position as THREE.BufferAttribute) {
            return total + (geometry.attributes.position as THREE.BufferAttribute).count / 3;
          }
          return total;
        }, 0),
        vertexCount: currentMeshes.reduce((total, mesh3D) => {
          const geometry = (mesh3D.mesh as THREE.Mesh).geometry;
          return total + ((geometry.attributes.position as THREE.BufferAttribute)?.count ?? 0);
        }, 0),
        drawCalls: currentMeshes.length,
        textureMemory: 0,
        bufferMemory: 0,
      });
    }
  });

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
