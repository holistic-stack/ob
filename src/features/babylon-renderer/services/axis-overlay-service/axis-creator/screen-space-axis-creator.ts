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
  ShaderMaterial,
  Vector3,
  Effect,
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
}

/**
 * Result of screen-space axis creation
 */
export interface ScreenSpaceAxisResult {
  readonly mesh: LinesMesh;
  readonly material: ShaderMaterial;
}

/**
 * Error types for screen-space axis creation
 */
export type ScreenSpaceAxisError = {
  readonly type: 'SCENE_NULL' | 'MESH_CREATION_FAILED' | 'MATERIAL_CREATION_FAILED' | 'SHADER_COMPILATION_FAILED';
  readonly message: string;
  readonly details?: unknown;
};

/**
 * Vertex shader for screen-space constant width lines
 * Based on techniques from WebGL fundamentals and screen-space projection
 */
const SCREEN_SPACE_VERTEX_SHADER = `
attribute vec3 position;
attribute vec3 normal; // Used to store line direction

uniform mat4 worldViewProjection;
uniform mat4 projection;
uniform mat4 view;
uniform float pixelWidth;
uniform vec2 resolution;

void main() {
    // Transform position to clip space
    vec4 clipPosition = worldViewProjection * vec4(position, 1.0);
    
    // Calculate screen-space position
    vec2 screenPos = clipPosition.xy / clipPosition.w;
    
    // Convert pixel width to normalized device coordinates
    // Account for aspect ratio and resolution
    vec2 pixelSize = vec2(pixelWidth) / resolution;
    
    // Apply screen-space offset based on normal (line direction)
    screenPos += normal.xy * pixelSize * clipPosition.w;
    
    // Convert back to clip space
    gl_Position = vec4(screenPos * clipPosition.w, clipPosition.z, clipPosition.w);
}
`;

/**
 * Fragment shader for screen-space lines
 */
const SCREEN_SPACE_FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 color;
uniform float opacity;

void main() {
    gl_FragColor = vec4(color, opacity);
}
`;

/**
 * Creates a screen-space axis line with constant pixel width
 * 
 * @param scene - BabylonJS scene
 * @param config - Screen-space axis configuration
 * @returns Result containing LinesMesh and ShaderMaterial
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
    // Register the shader if not already registered
    const shaderName = 'screenSpaceAxis';
    if (!Effect.ShadersStore[`${shaderName}VertexShader`]) {
      Effect.ShadersStore[`${shaderName}VertexShader`] = SCREEN_SPACE_VERTEX_SHADER;
      Effect.ShadersStore[`${shaderName}FragmentShader`] = SCREEN_SPACE_FRAGMENT_SHADER;
    }

    // Create line points from -length to +length along the axis direction
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

    // Create lines mesh
    const lines = MeshBuilder.CreateLines(
      `${config.name}AxisScreenSpace`,
      {
        points: [negativeEnd, positiveEnd],
        updatable: false,
      },
      scene
    );

    if (!lines) {
      return {
        success: false,
        error: {
          type: 'MESH_CREATION_FAILED',
          message: `Failed to create lines mesh for ${config.name}-axis`,
        },
      };
    }

    // Create custom shader material for screen-space thickness
    const material = new ShaderMaterial(
      `${config.name}ScreenSpaceMaterial`,
      scene,
      {
        vertex: shaderName,
        fragment: shaderName,
      },
      {
        attributes: ['position', 'normal'],
        uniforms: [
          'worldViewProjection',
          'projection', 
          'view',
          'pixelWidth',
          'resolution',
          'color',
          'opacity'
        ],
      }
    );

    if (!material) {
      lines.dispose();
      return {
        success: false,
        error: {
          type: 'MATERIAL_CREATION_FAILED',
          message: `Failed to create shader material for ${config.name}-axis`,
        },
      };
    }

    // Set shader uniforms
    const engine = scene.getEngine();
    const canvas = engine.getRenderingCanvas();
    const resolution = canvas ? [canvas.width, canvas.height] : [1920, 1080];

    material.setFloat('pixelWidth', config.pixelWidth);
    material.setVector2('resolution', new Vector3(resolution[0], resolution[1], 0));
    material.setColor3('color', config.color);
    material.setFloat('opacity', 1.0);

    // Apply material to lines
    lines.material = material;
    lines.isVisible = true;

    // Update resolution when canvas resizes
    const updateResolution = () => {
      const canvas = engine.getRenderingCanvas();
      if (canvas && material) {
        material.setVector2('resolution', new Vector3(canvas.width, canvas.height, 0));
      }
    };

    // Listen for resize events
    engine.onResizeObservable.add(updateResolution);

    logger.info(
      `[INFO][ScreenSpaceAxisCreator] Created screen-space ${config.name}-axis with ${config.pixelWidth}px width`
    );

    return {
      success: true,
      data: {
        mesh: lines,
        material,
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
 * Creates all three coordinate axes with screen-space constant thickness
 * 
 * @param scene - BabylonJS scene
 * @param origin - Origin point for all axes
 * @param length - Length of each axis
 * @param pixelWidth - Width in screen pixels
 * @returns Result containing arrays of meshes and materials
 * 
 * @example
 * ```typescript
 * const result = createScreenSpaceCoordinateAxes(scene, new Vector3(0, 0, 0), 1000, 2.0);
 * if (result.success) {
 *   console.log(`Created ${result.data.meshes.length} screen-space axes`);
 * }
 * ```
 */
export function createScreenSpaceCoordinateAxes(
  scene: Scene | null,
  origin: Vector3,
  length: number,
  pixelWidth: number
): Result<{ meshes: LinesMesh[]; materials: ShaderMaterial[] }, ScreenSpaceAxisError> {
  const meshes: LinesMesh[] = [];
  const materials: ShaderMaterial[] = [];

  // Define standard axis configurations with SketchUp colors
  const axisConfigs: ScreenSpaceAxisConfig[] = [
    {
      name: 'X',
      origin,
      direction: new Vector3(1, 0, 0),
      length,
      color: new Color3(1, 0, 0), // Red
      pixelWidth,
    },
    {
      name: 'Y',
      origin,
      direction: new Vector3(0, 1, 0),
      length,
      color: new Color3(0, 1, 0), // Green
      pixelWidth,
    },
    {
      name: 'Z',
      origin,
      direction: new Vector3(0, 0, 1),
      length,
      color: new Color3(0, 0, 1), // Blue
      pixelWidth,
    },
  ];

  // Create each axis
  for (const config of axisConfigs) {
    const result = createScreenSpaceAxis(scene, config);
    if (!result.success) {
      // Clean up any previously created axes
      meshes.forEach((mesh) => mesh.dispose());
      materials.forEach((material) => material.dispose());
      return result;
    }

    meshes.push(result.data.mesh);
    materials.push(result.data.material);
  }

  logger.info(`[INFO][ScreenSpaceAxisCreator] Created ${meshes.length} screen-space coordinate axes`);

  return {
    success: true,
    data: {
      meshes,
      materials,
    },
  };
}