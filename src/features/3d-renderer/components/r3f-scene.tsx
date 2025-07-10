/**
 * React Three Fiber Scene Component
 *
 * A proper R3F scene component that renders OpenSCAD AST nodes
 * as Three.js objects within the React Three Fiber context.
 */

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createLogger } from '../../../shared/services/logger.service';
import type { NodeId, NodeType } from '../../../shared/types/ast.types';
import type { CameraConfig } from '../../../shared/types/common.types';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import { renderASTNode } from '../services/primitive-renderer';
import type { Mesh3D } from '../types/renderer.types';

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
  const [isRendering, setIsRendering] = useState(false);

  /**
   * Effect to render AST nodes asynchronously using real renderASTNode function
   */
  useEffect(() => {
    const renderMeshes = async () => {
      logger.debug(`Rendering meshes from ${astNodes.length} AST nodes`);
      setIsRendering(true);

      // Clear existing meshes using proper disposal
      meshesRef.current.forEach((mesh3D) => {
        scene.remove(mesh3D.mesh);
        mesh3D.dispose(); // Use the Mesh3D disposal method
      });
      meshesRef.current = [];

      // For empty astNodes, complete immediately
      if (astNodes.length === 0) {
        setIsRendering(false);
        onRenderComplete?.([]);
        return;
      }

      // Create new meshes from AST nodes using real renderASTNode function
      const newMeshes: Mesh3D[] = [];
      let hasErrors = false;

      // Process nodes asynchronously
      for (let index = 0; index < astNodes.length; index++) {
        const node = astNodes[index];
        if (!node) {
          logger.warn(`Skipping undefined node at index ${index}`);
          continue;
        }

        try {
          logger.debug(`Rendering AST node ${index}: ${node.type}`);

          // Use the real renderASTNode function
          const meshResult = await renderASTNode(node, index);

          if (meshResult.success) {
            const mesh3D = meshResult.data;

            // DO NOT apply grid positioning - let OpenSCAD transformations handle positioning
            // The geometry translation fix already applies transformations to the geometry vertices
            // Grid positioning would override OpenSCAD translate() operations

            // Add the real THREE.Mesh to the scene (without overriding position)
            scene.add(mesh3D.mesh);
            newMeshes.push(mesh3D);
          } else {
            throw new Error(meshResult.error);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Failed to create mesh for node ${index} (${node.type}):`, errorMessage);
          onRenderError?.({ message: errorMessage });
          hasErrors = true;
        }
      }

      // Update meshes reference and complete rendering
      meshesRef.current = newMeshes;
      setIsRendering(false);

      // Report render completion
      if (!hasErrors) {
        logger.debug(`Calling onRenderComplete with ${newMeshes.length} meshes`);
        onRenderComplete?.(newMeshes);
      }
    };

    // Call the async render function
    renderMeshes().catch((error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to render meshes:', errorMessage);
      setIsRendering(false);
      onRenderError?.({ message: errorMessage });
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
