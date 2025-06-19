/**
 * @file Mesh Positioning Utility
 * 
 * Utility for applying ghost positioning to Babylon.js meshes and calculating
 * optimal camera positioning for viewing both transformed and ghost objects.
 * 
 * Following DRY, KISS, and SRP principles:
 * - DRY: Reusable mesh positioning logic
 * - KISS: Simple, clear mesh manipulation
 * - SRP: Single responsibility for mesh positioning
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import type { Vector3D, BoundingBox } from './ghost-positioning';

/**
 * Minimal Babylon.js Vector3 interface for positioning
 * Compatible with actual Babylon.js Vector3 type
 */
export interface BabylonVector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Minimal Babylon.js BoundingInfo interface
 */
export interface BabylonBoundingInfo {
  boundingBox: {
    minimum: BabylonVector3;
    maximum: BabylonVector3;
    center: BabylonVector3;
  };
}

/**
 * Minimal Babylon.js Mesh interface for positioning
 * Compatible with actual Babylon.js Mesh type
 */
export interface BabylonMesh {
  name: string;
  position: BabylonVector3;
  computeWorldMatrix(force?: boolean): void;
  refreshBoundingInfo(): void;
  getBoundingInfo(): BabylonBoundingInfo;
  getWorldMatrix(): any;
}

/**
 * Camera positioning result
 */
export interface CameraPositioning {
  readonly center: Vector3D;
  readonly distance: number;
  readonly position: Vector3D;
}

/**
 * Applies ghost positioning offset to a collection of meshes
 * 
 * @param ghostMeshes - Array of ghost meshes to position
 * @param offset - The offset vector to apply
 */
export function applyGhostPositioning(ghostMeshes: BabylonMesh[], offset: Vector3D): void {
  if (!ghostMeshes || ghostMeshes.length === 0) {
    return;
  }

  ghostMeshes.forEach(mesh => {
    if (mesh && mesh.position) {
      mesh.position.x = offset.x;
      mesh.position.y = offset.y;
      mesh.position.z = offset.z;
    }
  });
}

/**
 * Calculates the combined bounding box for a collection of meshes
 * 
 * @param meshes - Array of meshes to calculate bounds for
 * @returns The combined bounding box
 */
export function calculateMeshBounds(meshes: BabylonMesh[]): BoundingBox {
  if (!meshes || meshes.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 }
    };
  }

  let minX = Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;
  let minZ = Number.MAX_VALUE;
  let maxX = -Number.MAX_VALUE;
  let maxY = -Number.MAX_VALUE;
  let maxZ = -Number.MAX_VALUE;

  meshes.forEach(mesh => {
    if (!mesh) return;

    // Force bounding info computation
    mesh.computeWorldMatrix(true);
    mesh.refreshBoundingInfo();

    const boundingInfo = mesh.getBoundingInfo();
    const worldMatrix = mesh.getWorldMatrix();

    // Get local bounds
    const localMin = boundingInfo.boundingBox.minimum;
    const localMax = boundingInfo.boundingBox.maximum;

    // Transform bounds to world space (simplified for positioning)
    const worldMin = transformVector3(localMin, worldMatrix, mesh.position);
    const worldMax = transformVector3(localMax, worldMatrix, mesh.position);

    // Update global bounds
    minX = Math.min(minX, worldMin.x, worldMax.x);
    minY = Math.min(minY, worldMin.y, worldMax.y);
    minZ = Math.min(minZ, worldMin.z, worldMax.z);
    maxX = Math.max(maxX, worldMin.x, worldMax.x);
    maxY = Math.max(maxY, worldMin.y, worldMax.y);
    maxZ = Math.max(maxZ, worldMin.z, worldMax.z);
  });

  // Handle case where no valid bounds were found
  if (minX === Number.MAX_VALUE) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 }
    };
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ }
  };
}

/**
 * Transforms a vector from local to world space (simplified)
 * 
 * @param localVector - Vector in local space
 * @param worldMatrix - World transformation matrix
 * @param meshPosition - Mesh position for fallback
 * @returns Vector in world space
 */
function transformVector3(
  localVector: BabylonVector3, 
  worldMatrix: any, 
  meshPosition: BabylonVector3
): Vector3D {
  // Simplified transformation - in real implementation, this would use proper matrix math
  // For ghost positioning, we primarily care about the mesh position offset
  return {
    x: localVector.x + meshPosition.x,
    y: localVector.y + meshPosition.y,
    z: localVector.z + meshPosition.z
  };
}

/**
 * Calculates optimal camera position to view both transformed and ghost objects
 * 
 * @param combinedBounds - Combined bounding box of all objects
 * @returns Camera positioning information
 */
export function calculateOptimalCameraPosition(combinedBounds: BoundingBox): CameraPositioning {
  // Calculate center of all objects
  const center: Vector3D = {
    x: (combinedBounds.min.x + combinedBounds.max.x) * 0.5,
    y: (combinedBounds.min.y + combinedBounds.max.y) * 0.5,
    z: (combinedBounds.min.z + combinedBounds.max.z) * 0.5
  };

  // Calculate size of the combined scene
  const size: Vector3D = {
    x: combinedBounds.max.x - combinedBounds.min.x,
    y: combinedBounds.max.y - combinedBounds.min.y,
    z: combinedBounds.max.z - combinedBounds.min.z
  };

  // Calculate optimal camera distance
  const maxDimension = Math.max(size.x, size.y, size.z);
  const distance = Math.max(maxDimension * 2.5, 15); // Minimum distance of 15 units

  // Position camera at optimal viewing angle (isometric-style)
  const position: Vector3D = {
    x: center.x + distance * 0.8,
    y: center.y + distance * 0.8,
    z: center.z + distance * 0.8
  };

  return {
    center,
    distance,
    position
  };
}

/**
 * Utility function to convert Vector3D to Babylon Vector3 format
 * 
 * @param vector - Vector3D to convert
 * @returns String representation for logging
 */
export function formatVector3ForLogging(vector: Vector3D): string {
  return `{X: ${vector.x} Y: ${vector.y} Z: ${vector.z}}`;
}
