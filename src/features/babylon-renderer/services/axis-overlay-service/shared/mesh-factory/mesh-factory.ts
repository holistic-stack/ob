/**
 * @file mesh-factory.ts
 * @description Factory for creating standardized meshes for axis rendering
 * Centralizes mesh creation logic to eliminate duplication across axis creators
 */

import { type LinesMesh, MeshBuilder, type Scene, type Vector3 } from '@babylonjs/core';
import type { Result } from '@/shared';

/**
 * Configuration for creating line meshes
 */
export interface LineConfig {
  readonly name: string;
  readonly points: readonly Vector3[];
  readonly updatable?: boolean;
}

/**
 * Configuration for creating dashed line meshes
 */
export interface DashedLineConfig extends LineConfig {
  readonly dashSize?: number;
  readonly gapSize?: number;
  readonly dashNb?: number;
}

/**
 * Configuration for creating cylinder meshes
 */
export interface CylinderConfig {
  readonly name: string;
  readonly height: number;
  readonly diameter: number;
  readonly tessellation?: number;
  readonly position?: Vector3;
  readonly rotation?: Vector3;
}

/**
 * Error types for mesh creation
 */
export interface MeshCreationError {
  readonly type: 'SCENE_NULL' | 'MESH_CREATION_FAILED' | 'INVALID_POINTS';
  readonly message: string;
  readonly details?: unknown;
}

/**
 * Factory for creating standardized meshes for axis rendering
 *
 * @example
 * ```typescript
 * const factory = new MeshFactory();
 * const result = factory.createSolidLine(scene, {
 *   name: 'XAxis',
 *   points: [Vector3.Zero(), new Vector3(100, 0, 0)]
 * });
 * ```
 */
export class MeshFactory {
  /**
   * Creates a solid line mesh
   *
   * @param scene - BabylonJS scene
   * @param config - Line configuration
   * @returns Result containing the created mesh or error
   */
  createSolidLine(scene: Scene | null, config: LineConfig): Result<LinesMesh, MeshCreationError> {
    if (!scene) {
      return {
        success: false,
        error: {
          type: 'SCENE_NULL',
          message: 'Scene is null, cannot create line mesh',
        },
      };
    }

    if (config.points.length < 2) {
      return {
        success: false,
        error: {
          type: 'INVALID_POINTS',
          message: 'At least 2 points are required to create a line',
        },
      };
    }

    try {
      const mesh = MeshBuilder.CreateLines(
        config.name,
        {
          points: config.points as Vector3[],
          updatable: config.updatable ?? false,
        },
        scene
      );

      if (!mesh) {
        return {
          success: false,
          error: {
            type: 'MESH_CREATION_FAILED',
            message: `Failed to create line mesh: ${config.name}`,
          },
        };
      }

      return {
        success: true,
        data: mesh,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'MESH_CREATION_FAILED',
          message: `Line mesh creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
        },
      };
    }
  }

  /**
   * Creates a dashed line mesh for dotted axis appearance
   *
   * @param scene - BabylonJS scene
   * @param config - Dashed line configuration
   * @returns Result containing the created mesh or error
   */
  createDashedLine(
    scene: Scene | null,
    config: DashedLineConfig
  ): Result<LinesMesh, MeshCreationError> {
    if (!scene) {
      return {
        success: false,
        error: {
          type: 'SCENE_NULL',
          message: 'Scene is null, cannot create dashed line mesh',
        },
      };
    }

    if (config.points.length < 2) {
      return {
        success: false,
        error: {
          type: 'INVALID_POINTS',
          message: 'At least 2 points are required to create a dashed line',
        },
      };
    }

    try {
      const mesh = MeshBuilder.CreateDashedLines(
        config.name,
        {
          points: config.points as Vector3[],
          dashSize: config.dashSize ?? 0.3, // Small for dot-like appearance
          gapSize: config.gapSize ?? 1.0, // Visible spacing
          dashNb: config.dashNb ?? 100, // Sufficient number of dashes
          updatable: config.updatable ?? false,
        },
        scene
      );

      if (!mesh) {
        return {
          success: false,
          error: {
            type: 'MESH_CREATION_FAILED',
            message: `Failed to create dashed line mesh: ${config.name}`,
          },
        };
      }

      return {
        success: true,
        data: mesh,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'MESH_CREATION_FAILED',
          message: `Dashed line mesh creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
        },
      };
    }
  }

  /**
   * Creates a cylinder mesh for 3D axis representation
   *
   * @param scene - BabylonJS scene
   * @param config - Cylinder configuration
   * @returns Result containing the created mesh or error
   */
  createCylinder(
    scene: Scene | null,
    config: CylinderConfig
  ): Result<import('@babylonjs/core').Mesh, MeshCreationError> {
    if (!scene) {
      return {
        success: false,
        error: {
          type: 'SCENE_NULL',
          message: 'Scene is null, cannot create cylinder mesh',
        },
      };
    }

    try {
      const mesh = MeshBuilder.CreateCylinder(
        config.name,
        {
          height: config.height,
          diameter: config.diameter,
          tessellation: config.tessellation ?? 8,
        },
        scene
      );

      if (!mesh) {
        return {
          success: false,
          error: {
            type: 'MESH_CREATION_FAILED',
            message: `Failed to create cylinder mesh: ${config.name}`,
          },
        };
      }

      // Apply position and rotation if provided
      if (config.position) {
        mesh.position = config.position.clone();
      }

      if (config.rotation) {
        mesh.rotation = config.rotation.clone();
      }

      return {
        success: true,
        data: mesh,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'MESH_CREATION_FAILED',
          message: `Cylinder mesh creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
        },
      };
    }
  }
}

/**
 * Default mesh factory instance
 */
export const defaultMeshFactory = new MeshFactory();
