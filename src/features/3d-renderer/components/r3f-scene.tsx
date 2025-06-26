/**
 * React Three Fiber Scene Component
 *
 * A proper R3F scene component that renders OpenSCAD AST nodes
 * as Three.js objects within the React Three Fiber context.
 */

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import type { CameraConfig, RenderingMetrics } from '../types/renderer.types';
import { useAppStore } from '../../store/app-store';

/**
 * Props for the R3F scene component
 */
interface R3FSceneProps {
  readonly astNodes: ReadonlyArray<ASTNode>;
  readonly camera: CameraConfig;
  readonly onCameraChange?: (camera: CameraConfig) => void;
  readonly onPerformanceUpdate?: (metrics: RenderingMetrics) => void;
  readonly onRenderComplete?: (meshes: ReadonlyArray<any>) => void;
  readonly onRenderError?: (error: { message: string }) => void;
}

/**
 * Simple performance measurement utility
 */
const measureTime = <T,>(fn: () => T): { result: T; duration: number } => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, duration: end - start };
};

/**
 * Convert AST node to Three.js mesh
 */
const createMeshFromASTNode = (node: ASTNode): THREE.Mesh | null => {
  try {
    console.log(`[DEBUG][R3FScene] Creating mesh for ${node.type} with parameters:`, node.parameters);

    let geometry: THREE.BufferGeometry;

    switch (node.type) {
      case 'cube': {
        // Handle both direct size parameter and nested parameter structure
        let size: [number, number, number] = [1, 1, 1];

        if (node.parameters?.size) {
          // Direct size parameter
          size = Array.isArray(node.parameters.size)
            ? node.parameters.size as [number, number, number]
            : [node.parameters.size as number, node.parameters.size as number, node.parameters.size as number];
        } else if (node.parameters?.value && Array.isArray(node.parameters.value)) {
          // Handle parser output format: parameters: { value: [10, 10, 10] }
          size = node.parameters.value as [number, number, number];
        }

        console.log(`[DEBUG][R3FScene] Creating cube with size:`, size);
        geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        break;
      }
      case 'sphere': {
        // Handle various radius parameter formats
        let radius = 1;

        if (node.parameters?.r !== undefined) {
          radius = node.parameters.r as number;
        } else if (node.parameters?.radius !== undefined) {
          radius = node.parameters.radius as number;
        } else if (node.parameters?.value !== undefined) {
          radius = node.parameters.value as number;
        }

        console.log(`[DEBUG][R3FScene] Creating sphere with radius:`, radius);
        geometry = new THREE.SphereGeometry(radius, 32, 16);
        break;
      }
      case 'cylinder': {
        // Handle various cylinder parameter formats
        let radius = 1;
        let height = 1;

        if (node.parameters?.r !== undefined) {
          radius = node.parameters.r as number;
        } else if (node.parameters?.radius !== undefined) {
          radius = node.parameters.radius as number;
        }

        if (node.parameters?.h !== undefined) {
          height = node.parameters.h as number;
        } else if (node.parameters?.height !== undefined) {
          height = node.parameters.height as number;
        }

        console.log(`[DEBUG][R3FScene] Creating cylinder with radius:`, radius, 'height:', height);
        geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        break;
      }
      default:
        console.warn(`[R3FScene] Unsupported AST node type: ${node.type}`);
        return null;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      metalness: 0.1,
      roughness: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    console.log(`[DEBUG][R3FScene] Successfully created mesh for ${node.type}`);

    return mesh;
  } catch (error) {
    console.error(`[R3FScene] Error creating mesh for ${node.type}:`, error);
    console.error(`[R3FScene] Node parameters:`, node.parameters);
    return null;
  }
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
  onRenderError
}) => {
  const { scene, gl } = useThree();
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const frameCount = useRef(0);
  const lastPerformanceUpdate = useRef(0);

  // Store hook for updating mesh count
  const updateMeshCount = useAppStore((state) => state.updateMeshCount);

  /**
   * Update scene when AST nodes change
   */
  useEffect(() => {
    console.log(`[DEBUG][R3FScene] Updating scene with ${astNodes.length} AST nodes`);
    
    const { result: meshes, duration: renderTime } = measureTime(() => {
      // Clear existing meshes
      meshesRef.current.forEach(mesh => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      meshesRef.current = [];

      // Create new meshes from AST nodes
      const newMeshes: THREE.Mesh[] = [];
      astNodes.forEach((node, index) => {
        try {
          const mesh = createMeshFromASTNode(node);
          if (mesh) {
            // Position meshes in a grid for multiple objects
            const gridSize = Math.ceil(Math.sqrt(astNodes.length));
            const x = (index % gridSize) * 2.5 - (gridSize - 1) * 1.25;
            const z = Math.floor(index / gridSize) * 2.5 - (gridSize - 1) * 1.25;
            mesh.position.set(x, 0, z);
            
            scene.add(mesh);
            newMeshes.push(mesh);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[ERROR][R3FScene] Failed to create mesh for node ${index}:`, errorMessage);
          onRenderError?.({ message: errorMessage });
        }
      });

      return newMeshes;
    });

    meshesRef.current = meshes;

    // Update store with mesh count
    updateMeshCount(meshes.length);

    // Report render completion
    onRenderComplete?.(meshes);

    // Update performance metrics
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    onPerformanceUpdate?.({
      renderTime,
      parseTime: 0, // AST parsing happens elsewhere
      memoryUsage: memoryUsage / (1024 * 1024) // Convert to MB
    });

  }, [astNodes, scene, onRenderComplete, onRenderError, onPerformanceUpdate, updateMeshCount]);

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
      
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      onPerformanceUpdate?.({
        renderTime: gl.info.render.frame > 0 ? 16.67 : 0, // Approximate frame time
        parseTime: 0,
        memoryUsage: memoryUsage / (1024 * 1024)
      });
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.8}
        castShadow
      />
      
      {/* Camera controls */}
      <OrbitControls
        target={camera.target}
        onChange={(event) => {
          if (event?.target && onCameraChange) {
            const controls = event.target as any;
            const newCamera: CameraConfig = {
              position: [
                controls.object.position.x,
                controls.object.position.y,
                controls.object.position.z
              ],
              target: [
                controls.target.x,
                controls.target.y,
                controls.target.z
              ]
            };
            onCameraChange(newCamera);
          }
        }}
      />
    </>
  );
};

export default R3FScene;
