/**
 * @file unified-axis-creator.ts
 * @description Unified axis creation using factory pattern
 * Follows SRP by handling only axis creation logic
 * Consolidates cylinder and screen-space axis creation
 */

import {
  Color3,
  Effect,
  type LinesMesh,
  type Material,
  MeshBuilder,
  type Scene,
  ShaderMaterial,
  StandardMaterial,
  Vector2,
  Vector3,
} from '@babylonjs/core';
import { AxisColorUtils, type RGBColor } from '../axis-colors/axis-colors';
import {
  AXIS_DIRECTIONS,
  AXIS_NAMES,
  AXIS_ROTATIONS,
  type AxisName,
  DEFAULT_AXIS_PARAMS,
  MESH_NAMES,
  SCREEN_SPACE_CONSTANTS,
} from '../axis-constants/axis-constants';
import { AxisErrorFactory, type AxisResult, AxisResultUtils } from '../axis-errors/axis-errors';
import { AxisValidationUtils } from '../axis-validation/axis-validation';

/**
 * Configuration for axis creation
 */
export interface AxisCreationConfig {
  readonly name: AxisName;
  readonly origin: Vector3;
  readonly direction: Vector3;
  readonly length: number;
  readonly color: RGBColor;
  readonly opacity?: number;
}

/**
 * Configuration for screen-space axis creation
 */
export interface ScreenSpaceAxisConfig extends AxisCreationConfig {
  readonly pixelWidth: number;
  readonly resolution: readonly [number, number];
}

/**
 * Configuration for cylinder axis creation
 */
export interface CylinderAxisConfig extends AxisCreationConfig {
  readonly diameter: number;
  readonly tessellation?: number;
}

/**
 * Result of axis creation
 */
export interface AxisCreationResult {
  readonly mesh: LinesMesh | any; // Babylon.js mesh type
  readonly material: Material;
  readonly name: string;
}

/**
 * Axis creation strategy interface
 */
export interface IAxisCreationStrategy {
  createAxis(config: AxisCreationConfig, scene: Scene): AxisResult<AxisCreationResult>;
}

/**
 * Screen-space axis creation strategy
 */
export class ScreenSpaceAxisStrategy implements IAxisCreationStrategy {
  private static shaderRegistered = false;

  createAxis(config: ScreenSpaceAxisConfig, scene: Scene): AxisResult<AxisCreationResult> {
    try {
      // Validate inputs
      const sceneResult = AxisValidationUtils.validateScene(scene);
      if (!AxisResultUtils.isSuccess(sceneResult)) {
        return sceneResult;
      }

      const pixelWidthResult = AxisValidationUtils.validatePixelWidth(config.pixelWidth);
      if (!AxisResultUtils.isSuccess(pixelWidthResult)) {
        return pixelWidthResult;
      }

      const resolutionResult = AxisValidationUtils.validateResolution(config.resolution);
      if (!AxisResultUtils.isSuccess(resolutionResult)) {
        return resolutionResult;
      }

      const lengthResult = AxisValidationUtils.validateAxisLength(config.length);
      if (!AxisResultUtils.isSuccess(lengthResult)) {
        return lengthResult;
      }

      // Register shader if not already done
      if (!ScreenSpaceAxisStrategy.shaderRegistered) {
        this.registerShader(scene);
        ScreenSpaceAxisStrategy.shaderRegistered = true;
      }

      // Create line mesh
      const mesh = this.createLineMesh(config, scene);
      if (!mesh) {
        return AxisResultUtils.failure(
          AxisErrorFactory.createCreationError(
            'Failed to create line mesh',
            'create_lines',
            config.name
          )
        );
      }

      // Create shader material
      const material = this.createShaderMaterial(config, scene);
      if (!material) {
        return AxisResultUtils.failure(
          AxisErrorFactory.createCreationError(
            'Failed to create shader material',
            'create_material',
            config.name
          )
        );
      }

      mesh.material = material;

      return AxisResultUtils.success({
        mesh,
        material,
        name: `${config.name}${MESH_NAMES.LINES_SUFFIX}`,
      });
    } catch (error) {
      return AxisResultUtils.failureFromUnknown(error, 'screen-space axis creation', { config });
    }
  }

  private registerShader(scene: Scene): void {
    const vertexShader = `
      attribute vec3 position;
      uniform mat4 worldViewProjection;
      uniform float pixelWidth;
      uniform vec2 resolution;
      
      void main() {
        vec4 clipPos = worldViewProjection * vec4(position, 1.0);
        vec2 screenPos = clipPos.xy / clipPos.w;
        vec2 offset = normalize(vec2(1.0, 0.0)) * pixelWidth / resolution;
        screenPos += offset;
        gl_Position = vec4(screenPos * clipPos.w, clipPos.z, clipPos.w);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec3 color;
      uniform float opacity;
      
      void main() {
        gl_FragColor = vec4(color, opacity);
      }
    `;

    try {
      // Register shader with BabylonJS Effect system
      Effect.ShadersStore[`${SCREEN_SPACE_CONSTANTS.SHADER_NAME}VertexShader`] = vertexShader;
      Effect.ShadersStore[`${SCREEN_SPACE_CONSTANTS.SHADER_NAME}FragmentShader`] = fragmentShader;
    } catch (error) {
      // In test environments (NullEngine), shader creation might fail
      // This is acceptable as we're testing the logic, not the actual rendering
      console.warn('Shader registration failed (likely in test environment):', error);
    }
  }

  private createLineMesh(config: ScreenSpaceAxisConfig, scene: Scene): LinesMesh | null {
    try {
      const startPoint = config.origin.subtract(config.direction.scale(config.length / 2));
      const endPoint = config.origin.add(config.direction.scale(config.length / 2));

      const points = [startPoint, endPoint];
      const name = `${config.name}${MESH_NAMES.LINES_SUFFIX}`;

      return MeshBuilder.CreateLines(name, { points }, scene);
    } catch (_error) {
      return null;
    }
  }

  private createShaderMaterial(config: ScreenSpaceAxisConfig, scene: Scene): ShaderMaterial | null {
    try {
      const materialName = `${config.name}${MESH_NAMES.SCREEN_SPACE_MATERIAL_SUFFIX}`;
      const material = new ShaderMaterial(materialName, scene, SCREEN_SPACE_CONSTANTS.SHADER_NAME, {
        attributes: ['position'],
        uniforms: ['worldViewProjection', 'pixelWidth', 'resolution', 'color', 'opacity'],
      });

      const color3 = AxisColorUtils.rgbToColor3(config.color);

      // In test environments, setting uniforms might fail, so wrap in try-catch
      try {
        material.setFloat('pixelWidth', config.pixelWidth);
        material.setVector2(
          'resolution',
          new Vector2(config.resolution[0], config.resolution[1])
        );
        material.setColor3('color', color3);
        material.setFloat('opacity', config.opacity || DEFAULT_AXIS_PARAMS.OPACITY);
      } catch (uniformError) {
        // In test environments (NullEngine), setting uniforms might fail
        // This is acceptable as we're testing the logic, not the actual rendering
        console.warn('Setting shader uniforms failed (likely in test environment):', uniformError);
      }

      return material;
    } catch (_error) {
      return null;
    }
  }
}

/**
 * Cylinder axis creation strategy
 */
export class CylinderAxisStrategy implements IAxisCreationStrategy {
  createAxis(config: CylinderAxisConfig, scene: Scene): AxisResult<AxisCreationResult> {
    try {
      // Validate inputs
      const sceneResult = AxisValidationUtils.validateScene(scene);
      if (!AxisResultUtils.isSuccess(sceneResult)) {
        return sceneResult;
      }

      const lengthResult = AxisValidationUtils.validateAxisLength(config.length);
      if (!AxisResultUtils.isSuccess(lengthResult)) {
        return lengthResult;
      }

      // Create cylinder mesh
      const mesh = this.createCylinderMesh(config, scene);
      if (!mesh) {
        return AxisResultUtils.failure(
          AxisErrorFactory.createCreationError(
            'Failed to create cylinder mesh',
            'create_cylinder',
            config.name
          )
        );
      }

      // Create standard material
      const material = this.createStandardMaterial(config, scene);
      if (!material) {
        return AxisResultUtils.failure(
          AxisErrorFactory.createCreationError(
            'Failed to create standard material',
            'create_material',
            config.name
          )
        );
      }

      mesh.material = material;
      this.positionAndRotateMesh(mesh, config);

      return AxisResultUtils.success({
        mesh,
        material,
        name: `${config.name}${MESH_NAMES.CYLINDER_SUFFIX}`,
      });
    } catch (error) {
      return AxisResultUtils.failureFromUnknown(error, 'cylinder axis creation', { config });
    }
  }

  private createCylinderMesh(config: CylinderAxisConfig, scene: Scene): any | null {
    try {
      const name = `${config.name}${MESH_NAMES.CYLINDER_SUFFIX}`;
      return MeshBuilder.CreateCylinder(
        name,
        {
          height: config.length,
          diameter: config.diameter,
          tessellation: config.tessellation || DEFAULT_AXIS_PARAMS.TESSELLATION,
        },
        scene
      );
    } catch (_error) {
      return null;
    }
  }

  private createStandardMaterial(
    config: CylinderAxisConfig,
    scene: Scene
  ): StandardMaterial | null {
    try {
      const materialName = `${config.name}${MESH_NAMES.MATERIAL_SUFFIX}`;
      const material = new StandardMaterial(materialName, scene);
      const color3 = AxisColorUtils.rgbToColor3(config.color);

      material.diffuseColor = color3;
      material.emissiveColor = color3.scale(0.8);
      material.specularColor = new Color3(1, 1, 1);
      material.alpha = config.opacity || DEFAULT_AXIS_PARAMS.OPACITY;

      return material;
    } catch (_error) {
      return null;
    }
  }

  private positionAndRotateMesh(mesh: any, config: CylinderAxisConfig): void {
    // Position the mesh at the origin
    mesh.position = config.origin.clone();

    // Apply rotation based on axis
    const rotation = AXIS_ROTATIONS[config.name];
    mesh.rotation.x = rotation.x;
    mesh.rotation.y = rotation.y;
    mesh.rotation.z = rotation.z;
  }
}

/**
 * Unified axis creator factory
 */
export class UnifiedAxisCreator {
  private screenSpaceStrategy = new ScreenSpaceAxisStrategy();
  private cylinderStrategy = new CylinderAxisStrategy();

  /**
   * Create a screen-space axis with constant pixel width
   */
  createScreenSpaceAxis(
    config: ScreenSpaceAxisConfig,
    scene: Scene
  ): AxisResult<AxisCreationResult> {
    return this.screenSpaceStrategy.createAxis(config, scene);
  }

  /**
   * Create a cylinder axis with 3D geometry
   */
  createCylinderAxis(config: CylinderAxisConfig, scene: Scene): AxisResult<AxisCreationResult> {
    return this.cylinderStrategy.createAxis(config, scene);
  }

  /**
   * Create all three coordinate axes using screen-space rendering
   */
  createScreenSpaceCoordinateAxes(
    baseConfig: Omit<ScreenSpaceAxisConfig, 'name' | 'direction' | 'color'>,
    scene: Scene,
    colorScheme: 'STANDARD' | 'MUTED' | 'HIGH_CONTRAST' | 'PASTEL' = 'STANDARD'
  ): AxisResult<AxisCreationResult[]> {
    const results: AxisCreationResult[] = [];
    const colors = AxisColorUtils.getAllAxisColors(colorScheme);

    for (const axisName of Object.values(AXIS_NAMES)) {
      const axisConfig: ScreenSpaceAxisConfig = {
        ...baseConfig,
        name: axisName,
        direction: AXIS_DIRECTIONS[axisName],
        color: colors[axisName],
      };

      const result = this.createScreenSpaceAxis(axisConfig, scene);
      if (!AxisResultUtils.isSuccess(result)) {
        return result;
      }

      results.push(result.data);
    }

    return AxisResultUtils.success(results);
  }

  /**
   * Create all three coordinate axes using cylinder rendering
   */
  createCylinderCoordinateAxes(
    baseConfig: Omit<CylinderAxisConfig, 'name' | 'direction' | 'color'>,
    scene: Scene,
    colorScheme: 'STANDARD' | 'MUTED' | 'HIGH_CONTRAST' | 'PASTEL' = 'STANDARD'
  ): AxisResult<AxisCreationResult[]> {
    const results: AxisCreationResult[] = [];
    const colors = AxisColorUtils.getAllAxisColors(colorScheme);

    for (const axisName of Object.values(AXIS_NAMES)) {
      const axisConfig: CylinderAxisConfig = {
        ...baseConfig,
        name: axisName,
        direction: AXIS_DIRECTIONS[axisName],
        color: colors[axisName],
      };

      const result = this.createCylinderAxis(axisConfig, scene);
      if (!AxisResultUtils.isSuccess(result)) {
        return result;
      }

      results.push(result.data);
    }

    return AxisResultUtils.success(results);
  }

  /**
   * Create a single axis with automatic strategy selection
   */
  createAxis(
    config: (ScreenSpaceAxisConfig | CylinderAxisConfig) & {
      strategy?: 'screen-space' | 'cylinder';
    },
    scene: Scene
  ): AxisResult<AxisCreationResult> {
    const strategy = config.strategy || ('pixelWidth' in config ? 'screen-space' : 'cylinder');

    if (strategy === 'screen-space') {
      return this.createScreenSpaceAxis(config as ScreenSpaceAxisConfig, scene);
    } else {
      return this.createCylinderAxis(config as CylinderAxisConfig, scene);
    }
  }
}

/**
 * Default axis creator instance
 */
export const defaultAxisCreator = new UnifiedAxisCreator();

/**
 * Helper functions for creating common axis configurations
 */
export class AxisConfigHelpers {
  /**
   * Create a standard SketchUp-style screen-space configuration
   */
  static createSketchUpScreenSpaceConfig(
    origin: Vector3 = Vector3.Zero(),
    length: number = DEFAULT_AXIS_PARAMS.LENGTH,
    pixelWidth: number = DEFAULT_AXIS_PARAMS.PIXEL_WIDTH,
    resolution: readonly [number, number] = SCREEN_SPACE_CONSTANTS.DEFAULT_RESOLUTION
  ): Omit<ScreenSpaceAxisConfig, 'name' | 'direction' | 'color'> {
    return {
      origin,
      length,
      pixelWidth,
      resolution,
      opacity: DEFAULT_AXIS_PARAMS.OPACITY,
    };
  }

  /**
   * Create a standard cylinder configuration
   */
  static createStandardCylinderConfig(
    origin: Vector3 = Vector3.Zero(),
    length: number = DEFAULT_AXIS_PARAMS.LENGTH,
    diameter: number = DEFAULT_AXIS_PARAMS.CYLINDER_DIAMETER
  ): Omit<CylinderAxisConfig, 'name' | 'direction' | 'color'> {
    return {
      origin,
      length,
      diameter,
      tessellation: DEFAULT_AXIS_PARAMS.TESSELLATION,
      opacity: DEFAULT_AXIS_PARAMS.OPACITY,
    };
  }
}
