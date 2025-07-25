/**
 * @file refactored-axis-creator.ts
 * @description Refactored unified axis creator using shared utilities
 * Eliminates code duplication and follows SRP principles
 */

import type { LinesMesh, Mesh, Scene, StandardMaterial } from '@babylonjs/core';
import { createLogger } from '../../../../../shared/services/logger.service';
import type { Result } from '../../../../../shared/types/result.types';
import { AxisColorUtils } from '../axis-colors/axis-colors';
import { AxisResultUtils } from '../axis-errors/axis-errors';
import { AxisValidationUtils } from '../axis-validation/axis-validation';
import {
  AXIS_DIRECTIONS,
  AXIS_NAMES,
  type AxisConfig,
  AxisConfigUtils,
  type AxisName,
  type CoordinateAxesConfig,
  type CylinderAxisConfig,
  type LineAxisConfig,
} from '../shared/axis-config/axis-config';
import { GeometryUtils } from '../shared/geometry-utils/geometry-utils';
import { defaultMaterialFactory } from '../shared/material-factory/material-factory';
import { defaultMeshFactory } from '../shared/mesh-factory/mesh-factory';

const logger = createLogger('RefactoredAxisCreator');

/**
 * Result of axis creation
 */
export interface AxisCreationResult {
  readonly mesh: LinesMesh | Mesh;
  readonly material: StandardMaterial;
  readonly name: string;
  readonly type: 'line' | 'cylinder';
}

/**
 * Error types for axis creation
 */
export interface AxisCreationError {
  readonly type:
    | 'SCENE_NULL'
    | 'INVALID_CONFIG'
    | 'MESH_CREATION_FAILED'
    | 'MATERIAL_CREATION_FAILED';
  readonly message: string;
  readonly details?: unknown;
}

/**
 * Refactored unified axis creator that eliminates code duplication
 * Uses shared utilities for material creation, mesh creation, and geometry calculations
 *
 * @example
 * ```typescript
 * const creator = new RefactoredAxisCreator();
 * const result = creator.createAxis(scene, {
 *   type: 'line',
 *   name: 'X',
 *   color: new Color3(1, 0, 0),
 *   length: 100
 * });
 * ```
 */
export class RefactoredAxisCreator {
  /**
   * Creates a single axis based on configuration
   *
   * @param scene - BabylonJS scene
   * @param config - Axis configuration
   * @returns Result containing created axis or error
   */
  createAxis(
    scene: Scene | null,
    config: AxisConfig
  ): Result<AxisCreationResult, AxisCreationError> {
    // Validate scene
    const sceneResult = AxisValidationUtils.validateScene(scene);
    if (!AxisResultUtils.isSuccess(sceneResult)) {
      return {
        success: false,
        error: {
          type: 'SCENE_NULL',
          message: sceneResult.error.message,
        },
      };
    }

    // Extract validated scene
    const validatedScene = sceneResult.data;

    // Validate configuration
    if (!AxisConfigUtils.isValidConfig(config)) {
      return {
        success: false,
        error: {
          type: 'INVALID_CONFIG',
          message: `Invalid axis configuration for ${config.name}`,
        },
      };
    }

    // Create axis based on type
    if (config.type === 'line') {
      return this.createLineAxis(validatedScene, config);
    } else {
      return this.createCylinderAxis(validatedScene, config);
    }
  }

  /**
   * Creates a line-based axis (solid or dashed)
   *
   * @param scene - BabylonJS scene
   * @param config - Line axis configuration
   * @returns Result containing created line axis or error
   */
  private createLineAxis(
    scene: Scene,
    config: LineAxisConfig
  ): Result<AxisCreationResult, AxisCreationError> {
    try {
      // Calculate line points
      const linePoints = GeometryUtils.createLinePoints(
        config.origin,
        config.origin.add(config.direction.scale(config.length))
      );

      // Create mesh based on dotted flag
      const meshResult = config.isDotted
        ? defaultMeshFactory.createDashedLine(scene, {
            name: config.name,
            points: linePoints,
            ...(config.dashSize !== undefined && { dashSize: config.dashSize }),
            ...(config.gapSize !== undefined && { gapSize: config.gapSize }),
            ...(config.dashNb !== undefined && { dashNb: config.dashNb }),
          })
        : defaultMeshFactory.createSolidLine(scene, {
            name: config.name,
            points: linePoints,
          });

      if (!meshResult.success) {
        return {
          success: false,
          error: {
            type: 'MESH_CREATION_FAILED',
            message: meshResult.error.message,
            details: meshResult.error.details,
          },
        };
      }

      // Create material
      const materialResult = config.isDotted
        ? defaultMaterialFactory.createDottedLineMaterial(
            scene,
            `${config.name}Material`,
            config.color
          )
        : defaultMaterialFactory.createSolidLineMaterial(
            scene,
            `${config.name}Material`,
            config.color
          );

      if (!materialResult.success) {
        meshResult.data.dispose();
        return {
          success: false,
          error: {
            type: 'MATERIAL_CREATION_FAILED',
            message: materialResult.error.message,
            details: materialResult.error.details,
          },
        };
      }

      // Apply material and opacity
      const mesh = meshResult.data;
      const material = materialResult.data;

      if (config.opacity !== undefined) {
        material.alpha = config.opacity;
      }

      mesh.material = material;

      logger.info(
        `[INFO][RefactoredAxisCreator] Created ${config.isDotted ? 'dashed' : 'solid'} line axis: ${config.name}`
      );

      return {
        success: true,
        data: {
          mesh,
          material,
          name: config.name,
          type: 'line',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'MESH_CREATION_FAILED',
          message: `Line axis creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
        },
      };
    }
  }

  /**
   * Creates a cylinder-based 3D axis
   *
   * @param scene - BabylonJS scene
   * @param config - Cylinder axis configuration
   * @returns Result containing created cylinder axis or error
   */
  private createCylinderAxis(
    scene: Scene,
    config: CylinderAxisConfig
  ): Result<AxisCreationResult, AxisCreationError> {
    try {
      // Create cylinder mesh
      const meshResult = defaultMeshFactory.createCylinder(scene, {
        name: config.name,
        height: config.length,
        diameter: config.diameter,
        ...(config.tessellation !== undefined && { tessellation: config.tessellation }),
        position: config.origin,
        rotation: GeometryUtils.getAxisRotation(config.name as AxisName),
      });

      if (!meshResult.success) {
        return {
          success: false,
          error: {
            type: 'MESH_CREATION_FAILED',
            message: meshResult.error.message,
            details: meshResult.error.details,
          },
        };
      }

      // Create material
      const materialResult = defaultMaterialFactory.createCylinderMaterial(
        scene,
        `${config.name}Material`,
        config.color,
        config.opacity
      );

      if (!materialResult.success) {
        meshResult.data.dispose();
        return {
          success: false,
          error: {
            type: 'MATERIAL_CREATION_FAILED',
            message: materialResult.error.message,
            details: materialResult.error.details,
          },
        };
      }

      // Apply material
      const mesh = meshResult.data;
      const material = materialResult.data;
      mesh.material = material;

      logger.info(`[INFO][RefactoredAxisCreator] Created cylinder axis: ${config.name}`);

      return {
        success: true,
        data: {
          mesh,
          material,
          name: config.name,
          type: 'cylinder',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'MESH_CREATION_FAILED',
          message: `Cylinder axis creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
        },
      };
    }
  }

  /**
   * Creates all three coordinate axes (X, Y, Z)
   *
   * @param scene - BabylonJS scene
   * @param config - Coordinate axes configuration
   * @returns Result containing array of created axes or error
   */
  createCoordinateAxes(
    scene: Scene | null,
    config: CoordinateAxesConfig
  ): Result<AxisCreationResult[], AxisCreationError> {
    const results: AxisCreationResult[] = [];
    const colors = AxisColorUtils.getAllAxisColors3(config.colorScheme || 'STANDARD');
    const finalConfig = AxisConfigUtils.createCoordinateAxesConfig(config);

    for (const axisName of Object.values(AXIS_NAMES)) {
      const axisConfig: AxisConfig =
        finalConfig.type === 'line'
          ? AxisConfigUtils.createLineConfig({
              name: axisName,
              color: colors[axisName],
              ...(finalConfig.origin && { origin: finalConfig.origin }),
              direction: AXIS_DIRECTIONS[axisName],
              ...(finalConfig.length !== undefined && { length: finalConfig.length }),
              ...(finalConfig.opacity !== undefined && { opacity: finalConfig.opacity }),
              ...(finalConfig.pixelWidth !== undefined && { pixelWidth: finalConfig.pixelWidth }),
              ...(finalConfig.dashSize !== undefined && { dashSize: finalConfig.dashSize }),
              ...(finalConfig.gapSize !== undefined && { gapSize: finalConfig.gapSize }),
            })
          : AxisConfigUtils.createCylinderConfig({
              name: axisName,
              color: colors[axisName],
              ...(finalConfig.origin && { origin: finalConfig.origin }),
              direction: AXIS_DIRECTIONS[axisName],
              ...(finalConfig.length !== undefined && { length: finalConfig.length }),
              ...(finalConfig.opacity !== undefined && { opacity: finalConfig.opacity }),
              ...(finalConfig.diameter !== undefined && { diameter: finalConfig.diameter }),
              ...(finalConfig.tessellation !== undefined && {
                tessellation: finalConfig.tessellation,
              }),
            });

      const result = this.createAxis(scene, axisConfig);
      if (!result.success) {
        // Clean up previously created axes
        results.forEach((axis) => {
          axis.mesh.dispose();
          axis.material.dispose();
        });
        return result;
      }

      results.push(result.data);
    }

    logger.info(`[INFO][RefactoredAxisCreator] Created ${results.length} coordinate axes`);

    return {
      success: true,
      data: results,
    };
  }
}

/**
 * Default refactored axis creator instance
 */
export const defaultRefactoredAxisCreator = new RefactoredAxisCreator();
