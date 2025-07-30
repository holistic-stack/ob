/**
 * @file axis-creator.ts
 * @description Pure functions for creating 3D axis lines in BabylonJS scenes
 * Follows SRP by focusing solely on axis geometry creation
 */

import {
  Color3,
  type Mesh,
  MeshBuilder,
  type Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { OPENSCAD_FALLBACK } from '@/shared/constants/openscad-globals/openscad-globals.constants.js';
import { createLogger } from '../../../../../shared/services/logger.service';
import type { Result } from '../../../../../shared/types/result.types';

const logger = createLogger('AxisCreator');

/**
 * Configuration for creating a single axis
 */
export interface AxisConfig {
  readonly name: string;
  readonly origin: Vector3;
  readonly direction: Vector3;
  readonly length: number;
  readonly color: Color3;
  readonly diameter: number;
}

/**
 * Result of axis creation operation
 */
export interface AxisCreationResult {
  readonly mesh: Mesh;
  readonly material: StandardMaterial;
}

/**
 * Error types for axis creation
 */
export type AxisCreationError = {
  readonly type: 'SCENE_NULL' | 'MESH_CREATION_FAILED' | 'MATERIAL_CREATION_FAILED';
  readonly message: string;
  readonly details?: unknown;
};

/**
 * Creates a single infinite axis line extending from -infinity to +infinity
 *
 * @param scene - BabylonJS scene to create the axis in
 * @param config - Configuration for the axis
 * @returns Result containing the created mesh and material, or error
 *
 * @example
 * ```typescript
 * const result = createInfiniteAxis(scene, {
 *   name: 'X',
 *   origin: new Vector3(0, 0, 0),
 *   direction: new Vector3(1, 0, 0),
 *   length: 1000,
 *   color: new Color3(1, 0, 0),
 *   diameter: 0.3
 * });
 *
 * if (result.success) {
 *   console.log('Axis created:', result.data.mesh.name);
 * }
 * ```
 */
export function createInfiniteAxis(
  scene: Scene | null,
  config: AxisConfig
): Result<AxisCreationResult, AxisCreationError> {
  if (!scene) {
    return {
      success: false,
      error: {
        type: 'SCENE_NULL',
        message: 'Scene is null, cannot create axis',
      },
    };
  }

  try {
    // Create a cylinder for the full axis (from -infinity to +infinity)
    const fullAxis = MeshBuilder.CreateCylinder(
      `${config.name}AxisFull`,
      {
        height: config.length * 2, // Full length from negative to positive
        diameter: config.diameter,
        tessellation: OPENSCAD_FALLBACK.MIN_TESSELLATION,
      },
      scene
    );

    if (!fullAxis) {
      return {
        success: false,
        error: {
          type: 'MESH_CREATION_FAILED',
          message: `Failed to create cylinder mesh for ${config.name}-axis`,
        },
      };
    }

    // Position at origin (cylinder center)
    fullAxis.position = config.origin.clone();

    // Rotate cylinder to align with axis direction
    if (config.name === 'Y') {
      // Y-axis is already aligned with cylinder default orientation
    } else if (config.name === 'X') {
      fullAxis.rotation.z = Math.PI / 2; // Rotate 90 degrees around Z
    } else if (config.name === 'Z') {
      fullAxis.rotation.x = Math.PI / 2; // Rotate 90 degrees around X
    }

    // Create bright material for maximum visibility
    const material = new StandardMaterial(`${config.name}Material`, scene);
    if (!material) {
      fullAxis.dispose();
      return {
        success: false,
        error: {
          type: 'MATERIAL_CREATION_FAILED',
          message: `Failed to create material for ${config.name}-axis`,
        },
      };
    }

    material.diffuseColor = config.color;
    material.emissiveColor = new Color3(
      config.color.r * 0.8,
      config.color.g * 0.8,
      config.color.b * 0.8
    ); // Strong glow
    material.specularColor = new Color3(1, 1, 1); // White specular highlights
    fullAxis.material = material;

    fullAxis.isVisible = true;

    const negativeEnd = new Vector3(
      config.origin.x - config.direction.x * config.length,
      config.origin.y - config.direction.y * config.length,
      config.origin.z - config.direction.z * config.length
    );

    const positiveEnd = new Vector3(
      config.origin.x + config.direction.x * config.length,
      config.origin.y + config.direction.y * config.length,
      config.origin.z + config.direction.z * config.length
    );

    logger.info(
      `[INFO][AxisCreator] Created ${config.name}-axis: full line from (${negativeEnd.x}, ${negativeEnd.y}, ${negativeEnd.z}) to (${positiveEnd.x}, ${positiveEnd.y}, ${positiveEnd.z})`
    );

    return {
      success: true,
      data: {
        mesh: fullAxis,
        material,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'MESH_CREATION_FAILED',
        message: `Axis creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      },
    };
  }
}

/**
 * Creates all three coordinate axes (X, Y, Z) with standard colors
 *
 * @param scene - BabylonJS scene to create axes in
 * @param origin - Origin point for all axes
 * @param length - Length of each axis (extends from -length to +length)
 * @param diameter - Diameter of axis cylinders
 * @returns Result containing arrays of created meshes and materials, or error
 *
 * @example
 * ```typescript
 * const result = createCoordinateAxes(scene, new Vector3(0, 0, 0), 1000, 0.3);
 * if (result.success) {
 *   console.log(`Created ${result.data.meshes.length} axes`);
 * }
 * ```
 */
export function createCoordinateAxes(
  scene: Scene | null,
  origin: Vector3,
  length: number,
  diameter: number
): Result<{ meshes: Mesh[]; materials: StandardMaterial[] }, AxisCreationError> {
  const meshes: Mesh[] = [];
  const materials: StandardMaterial[] = [];

  // Define standard axis configurations
  const axisConfigs: AxisConfig[] = [
    {
      name: 'X',
      origin,
      direction: new Vector3(1, 0, 0),
      length,
      color: new Color3(1, 0, 0), // Red
      diameter,
    },
    {
      name: 'Y',
      origin,
      direction: new Vector3(0, 1, 0),
      length,
      color: new Color3(0, 1, 0), // Green
      diameter,
    },
    {
      name: 'Z',
      origin,
      direction: new Vector3(0, 0, 1),
      length,
      color: new Color3(0, 0, 1), // Blue
      diameter,
    },
  ];

  // Create each axis
  for (const config of axisConfigs) {
    const result = createInfiniteAxis(scene, config);
    if (!result.success) {
      // Clean up any previously created axes
      meshes.forEach((mesh) => mesh.dispose());
      materials.forEach((material) => material.dispose());
      return result;
    }

    meshes.push(result.data.mesh);
    materials.push(result.data.material);
  }

  logger.info(`[INFO][AxisCreator] Created ${meshes.length} coordinate axes`);

  return {
    success: true,
    data: {
      meshes,
      materials,
    },
  };
}
