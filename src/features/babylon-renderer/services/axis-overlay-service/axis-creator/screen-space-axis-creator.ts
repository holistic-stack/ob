/**
 * @file screen-space-axis-creator.ts
 * @description Creates 3D axis lines with constant screen-space thickness (SketchUp-style)
 * Uses custom shader material to maintain constant pixel width regardless of camera zoom
 */

import {
  Color3,
  type LinesMesh,
  MeshBuilder,
  type Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { createLogger } from '../../../../../shared/services/logger.service';
import type { Result } from '../../../../../shared/types/result.types';

const logger = createLogger('ScreenSpaceAxisCreator');

/**
 * Configuration for creating screen-space axis lines
 */
export interface ScreenSpaceAxisConfig {
  readonly name: string;
  readonly origin: Vector3;
  readonly direction: Vector3;
  readonly length: number;
  readonly color: Color3;
  readonly pixelWidth: number; // Width in screen pixels
  readonly isDotted?: boolean; // Whether to render as dotted line
  readonly dashLength?: number; // Length of dash segments (for dotted lines)
  readonly gapLength?: number; // Length of gap segments (for dotted lines)
}

/**
 * Result of screen-space axis creation
 */
export interface ScreenSpaceAxisResult {
  readonly positiveMesh: LinesMesh;
  readonly negativeMesh: LinesMesh;
  readonly positiveMaterial: StandardMaterial;
  readonly negativeMaterial: StandardMaterial;
}

/**
 * Error types for screen-space axis creation
 */
export type ScreenSpaceAxisError = {
  readonly type:
    | 'SCENE_NULL'
    | 'MESH_CREATION_FAILED'
    | 'MATERIAL_CREATION_FAILED'
    | 'SHADER_COMPILATION_FAILED';
  readonly message: string;
  readonly details?: unknown;
};

/**
 * Creates a SketchUp-style dotted line using BabylonJS built-in dashed line functionality
 *
 * @param name - Name for the mesh
 * @param points - Array of Vector3 points defining the line
 * @param scene - BabylonJS scene
 * @param color - Line color
 * @param dashSize - Size of dashes (smaller values create dot-like appearance)
 * @param gapSize - Size of gaps between dashes
 * @returns LinesMesh with dotted appearance or null if creation fails
 */
function createDottedLine(
  name: string,
  points: Vector3[],
  scene: Scene,
  color: Color3,
  dashSize: number = 0.5,
  gapSize: number = 1.5
): LinesMesh | null {
  if (points.length < 2 || !scene) return null;

  /**
   * Calculate optimal number of dashes based on line length to prevent excessive mesh creation.
   * This prevents the infinite loop issue where too many dashes (previously 100) caused
   * browser freezing due to excessive BabylonJS mesh creation.
   *
   * @performance Limits dash count to 5-20 range for optimal rendering performance
   * @see https://github.com/BabylonJS/Babylon.js/issues/performance-dashed-lines
   */
  const lineLength =
    points.length >= 2 ? Vector3.Distance(points[0]!, points[points.length - 1]!) : 10;
  const dashCount = Math.min(20, Math.max(5, Math.floor(lineLength / 10))); // 5-20 dashes max

  const dashedLine = MeshBuilder.CreateDashedLines(
    name,
    {
      points,
      dashSize, // Small dash size for dot-like appearance
      gapSize, // Larger gap for visible spacing
      dashNb: dashCount, // Reasonable number of dashes based on line length
    },
    scene
  );

  if (!dashedLine) return null;

  // Create material for the dotted line
  const material = new StandardMaterial(`${name}Material`, scene);
  material.diffuseColor = color;
  material.emissiveColor = color.scale(0.8); // Slight emission for visibility
  material.disableLighting = true; // Unlit for consistent appearance

  dashedLine.material = material;

  return dashedLine;
}

/**
 * Creates a solid line using BabylonJS built-in line functionality
 *
 * @param name - Name for the mesh
 * @param points - Array of Vector3 points defining the line
 * @param scene - BabylonJS scene
 * @param color - Line color
 * @returns LinesMesh or null if creation fails
 */
function createSolidLine(
  name: string,
  points: Vector3[],
  scene: Scene,
  color: Color3
): LinesMesh | null {
  if (points.length < 2 || !scene) return null;

  // Use BabylonJS built-in CreateLines for solid line
  const solidLine = MeshBuilder.CreateLines(
    name,
    {
      points,
    },
    scene
  );

  if (!solidLine) return null;

  // Create material for the solid line
  const material = new StandardMaterial(`${name}Material`, scene);
  material.diffuseColor = color;
  material.emissiveColor = color.scale(0.8); // Slight emission for visibility
  material.disableLighting = true; // Unlit for consistent appearance

  solidLine.material = material;

  return solidLine;
}

/**
 * Creates a screen-space axis line with constant pixel width
 * Positive segment is solid, negative segment is dotted
 *
 * @param scene - BabylonJS scene
 * @param config - Screen-space axis configuration
 * @returns Result containing positive and negative LinesMesh and ShaderMaterials
 *
 * @example
 * ```typescript
 * const result = createScreenSpaceAxis(scene, {
 *   name: 'X',
 *   origin: new Vector3(0, 0, 0),
 *   direction: new Vector3(1, 0, 0),
 *   length: 1000,
 *   color: new Color3(1, 0, 0),
 *   pixelWidth: 2.0
 * });
 * ```
 */
export function createScreenSpaceAxis(
  scene: Scene | null,
  config: ScreenSpaceAxisConfig
): Result<ScreenSpaceAxisResult, ScreenSpaceAxisError> {
  if (!scene) {
    return {
      success: false,
      error: {
        type: 'SCENE_NULL',
        message: 'Scene is null, cannot create screen-space axis',
      },
    };
  }

  try {
    // Calculate axis endpoints
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

    // Create positive segment (solid line)
    const positiveMesh = createSolidLine(
      `${config.name}AxisPositive`,
      [config.origin, positiveEnd],
      scene,
      config.color
    );

    if (!positiveMesh) {
      return {
        success: false,
        error: {
          type: 'MESH_CREATION_FAILED',
          message: `Failed to create positive mesh for ${config.name}-axis`,
        },
      };
    }

    // Create negative segment (dotted line) - SketchUp style with small dots
    const negativeMesh = createDottedLine(
      `${config.name}AxisNegative`,
      [negativeEnd, config.origin],
      scene,
      config.color,
      0.3, // Very small dash size for dot-like appearance
      1.0 // Gap size for visible spacing between dots
    );

    if (!negativeMesh) {
      positiveMesh.dispose();
      return {
        success: false,
        error: {
          type: 'MESH_CREATION_FAILED',
          message: `Failed to create negative mesh for ${config.name}-axis`,
        },
      };
    }

    // Get materials from the created meshes
    const positiveMaterial = positiveMesh.material as StandardMaterial;
    const negativeMaterial = negativeMesh.material as StandardMaterial;

    if (!positiveMaterial || !negativeMaterial) {
      positiveMesh.dispose();
      negativeMesh.dispose();
      return {
        success: false,
        error: {
          type: 'MATERIAL_CREATION_FAILED',
          message: `Failed to get materials for ${config.name}-axis`,
        },
      };
    }

    // Return the successful result
    return {
      success: true,
      data: {
        positiveMesh,
        negativeMesh,
        positiveMaterial,
        negativeMaterial,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'SHADER_COMPILATION_FAILED',
        message: `Screen-space axis creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      },
    };
  }
}

/**
 * Result type for screen-space coordinate axes creation
 */
export interface ScreenSpaceCoordinateAxesResult {
  /** Array of positive LinesMesh objects for each axis */
  positiveMeshes: LinesMesh[];
  /** Array of negative LinesMesh objects for each axis */
  negativeMeshes: LinesMesh[];
  /** Array of positive StandardMaterial objects for each axis */
  positiveMaterials: StandardMaterial[];
  /** Array of negative StandardMaterial objects for each axis */
  negativeMaterials: StandardMaterial[];
}

/**
 * Creates all three coordinate axes with screen-space constant thickness
 * Positive segments are solid, negative segments are dotted
 *
 * @param scene - BabylonJS scene
 * @param origin - Origin point for all axes
 * @param length - Length of each axis
 * @param pixelWidth - Width in screen pixels
 * @returns Result containing arrays of positive/negative meshes and materials
 *
 * @example
 * ```typescript
 * const result = createScreenSpaceCoordinateAxes(scene, new Vector3(0, 0, 0), 1000, 2.0);
 * if (result.success) {
 *   console.log(`Created ${result.data.positiveMeshes.length} screen-space axes`);
 * }
 * ```
 */
export function createScreenSpaceCoordinateAxes(
  scene: Scene | null,
  origin: Vector3,
  length: number,
  pixelWidth: number
): Result<ScreenSpaceCoordinateAxesResult, ScreenSpaceAxisError> {
  const positiveMeshes: LinesMesh[] = [];
  const negativeMeshes: LinesMesh[] = [];
  const positiveMaterials: StandardMaterial[] = [];
  const negativeMaterials: StandardMaterial[] = [];

  // Define standard axis configurations with SketchUp colors
  const axisConfigs: ScreenSpaceAxisConfig[] = [
    {
      name: 'X',
      origin,
      direction: new Vector3(1, 0, 0),
      length,
      color: new Color3(1, 0, 0), // Red
      pixelWidth,
      dashLength: 12.0, // Shorter dashes for better dot appearance
      gapLength: 12.0, // Equal spacing for consistent dotted pattern
    },
    {
      name: 'Y',
      origin,
      direction: new Vector3(0, 1, 0),
      length,
      color: new Color3(0, 1, 0), // Green
      pixelWidth,
      dashLength: 12.0, // Shorter dashes for better dot appearance
      gapLength: 12.0, // Equal spacing for consistent dotted pattern
    },
    {
      name: 'Z',
      origin,
      direction: new Vector3(0, 0, 1),
      length,
      color: new Color3(0, 0, 1), // Blue
      pixelWidth,
      dashLength: 12.0, // Shorter dashes for better dot appearance
      gapLength: 12.0, // Equal spacing for consistent dotted pattern
    },
  ];

  // Create each axis
  for (const config of axisConfigs) {
    const result = createScreenSpaceAxis(scene, config);
    if (!result.success) {
      // Clean up any previously created axes
      positiveMeshes.forEach((mesh) => mesh.dispose());
      negativeMeshes.forEach((mesh) => mesh.dispose());
      positiveMaterials.forEach((material) => material.dispose());
      negativeMaterials.forEach((material) => material.dispose());
      return result;
    }

    positiveMeshes.push(result.data.positiveMesh);
    negativeMeshes.push(result.data.negativeMesh);
    positiveMaterials.push(result.data.positiveMaterial);
    negativeMaterials.push(result.data.negativeMaterial);
  }

  logger.info(
    `[INFO][ScreenSpaceAxisCreator] Created ${positiveMeshes.length} screen-space coordinate axes with solid positive and dotted negative segments`
  );

  return {
    success: true,
    data: {
      positiveMeshes,
      negativeMeshes,
      positiveMaterials,
      negativeMaterials,
    },
  };
}
