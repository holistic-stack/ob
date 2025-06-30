import type { CubeNode, CylinderNode, SphereNode } from '@holistic-stack/openscad-parser';
import * as THREE from 'three';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch } from '../../../../shared/utils/functional/result';

/**
 * Convert cube AST node to Three.js mesh
 */
export const convertCubeToMesh = (
  node: CubeNode,
  material: THREE.Material
): Result<THREE.Mesh, string> => {
  return tryCatch(
    () => {
      console.log(`[DEBUG][PrimitiveConverter] Converting cube node:`, {
        size: node.size,
        center: node.center,
      });

      // Extract size parameters with proper defaults
      const size = Array.isArray(node.size) ? node.size : [node.size, node.size, node.size];
      const width = Number(size[0]) || 1;
      const height = Number(size[1]) || 1;
      const depth = Number(size[2]) || 1;

      // Create cube geometry
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const mesh = new THREE.Mesh(geometry, material);

      // Handle centering
      if (!node.center) {
        // OpenSCAD default: cube is positioned with one corner at origin
        mesh.position.set(width / 2, height / 2, depth / 2);
      }

      mesh.updateMatrix();
      console.log(`[DEBUG][PrimitiveConverter] Created cube mesh: ${width}x${height}x${depth}`);

      return mesh;
    },
    (err) => `Failed to convert cube node: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Convert sphere AST node to Three.js mesh
 */
export const convertSphereToMesh = (
  node: SphereNode,
  material: THREE.Material
): Result<THREE.Mesh, string> => {
  return tryCatch(
    () => {
      console.log(`[DEBUG][PrimitiveConverter] Converting sphere node:`, {
        radius: node.radius,
      });

      const radius = Number(node.radius) || 1;

      // Create sphere geometry with reasonable detail
      const geometry = new THREE.SphereGeometry(radius, 32, 16);
      const mesh = new THREE.Mesh(geometry, material);

      mesh.updateMatrix();
      console.log(`[DEBUG][PrimitiveConverter] Created sphere mesh: radius=${radius}`);

      return mesh;
    },
    (err) => `Failed to convert sphere node: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Convert cylinder AST node to Three.js mesh
 */
export const convertCylinderToMesh = (
  node: CylinderNode,
  material: THREE.Material
): Result<THREE.Mesh, string> => {
  return tryCatch(
    () => {
      console.log(`[DEBUG][PrimitiveConverter] Converting cylinder node:`, {
        h: node.h,
        r: node.r,
        center: node.center,
      });

      const height = Number(node.h) || 1;
      const radius = Number(node.r) || 1;

      // Create cylinder geometry
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      const mesh = new THREE.Mesh(geometry, material);

      // Handle centering
      if (!node.center) {
        // OpenSCAD default: cylinder base is at z=0
        mesh.position.setY(height / 2);
      }

      mesh.updateMatrix();
      console.log(`[DEBUG][PrimitiveConverter] Created cylinder mesh: r=${radius}, h=${height}`);

      return mesh;
    },
    (err: unknown) =>
      `Failed to convert cylinder node: ${err instanceof Error ? err.message : String(err)}`
  );
};
