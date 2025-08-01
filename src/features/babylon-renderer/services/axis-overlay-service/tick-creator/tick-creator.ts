/**
 * @file tick-creator.ts
 * @description Pure functions for creating tick marks and labels for 3D axes
 * Follows SRP by focusing solely on tick mark and label creation
 */

import { type Color3, type LinesMesh, MeshBuilder, type Scene, Vector3 } from '@babylonjs/core';
import { type AdvancedDynamicTexture, Control, TextBlock } from '@babylonjs/gui';
import type { Result } from '@/shared';
import { createLogger } from '@/shared';

const logger = createLogger('TickCreator');

/**
 * Configuration for creating tick marks
 */
export interface TickConfig {
  readonly axis: 'x' | 'y' | 'z';
  readonly origin: Vector3;
  readonly majorCount: number;
  readonly minorCount: number;
  readonly interval: number;
  readonly tickLength: number;
  readonly color: Color3;
}

/**
 * Configuration for creating labels
 */
export interface LabelConfig {
  readonly axis: 'x' | 'y' | 'z';
  readonly value: number;
  readonly text: string;
  readonly fontSize: number;
  readonly color: Color3;
  readonly position: Vector3;
}

/**
 * Result of tick creation operation
 */
export interface TickCreationResult {
  readonly majorTicks: LinesMesh[];
  readonly minorTicks: LinesMesh[];
}

/**
 * Result of label creation operation
 */
export interface LabelCreationResult {
  readonly labelBlock: TextBlock;
}

/**
 * Error types for tick/label creation
 */
export type TickCreationError = {
  readonly type: 'SCENE_NULL' | 'GUI_NULL' | 'TICK_CREATION_FAILED' | 'LABEL_CREATION_FAILED';
  readonly message: string;
  readonly details?: unknown;
};

/**
 * Gets the position for a tick mark on a specific axis
 *
 * @param axis - The axis ('x', 'y', or 'z')
 * @param origin - The origin point
 * @param distance - Distance along the axis
 * @param offset - Offset perpendicular to the axis
 * @returns Vector3 position for the tick
 */
export function getTickPosition(
  axis: 'x' | 'y' | 'z',
  origin: Vector3,
  distance: number,
  offset: number
): Vector3 {
  switch (axis) {
    case 'x':
      return new Vector3(origin.x + distance, origin.y + offset, origin.z);
    case 'y':
      return new Vector3(origin.x + offset, origin.y + distance, origin.z);
    case 'z':
      return new Vector3(origin.x, origin.y + offset, origin.z + distance);
    default:
      return origin.clone();
  }
}

/**
 * Creates tick marks for a specific axis
 *
 * @param scene - BabylonJS scene to create ticks in
 * @param config - Configuration for the ticks
 * @returns Result containing created tick meshes, or error
 *
 * @example
 * ```typescript
 * const result = createAxisTicks(scene, {
 *   axis: 'x',
 *   origin: new Vector3(0, 0, 0),
 *   majorCount: 10,
 *   minorCount: 5,
 *   interval: 1,
 *   tickLength: 0.5,
 *   color: new Color3(1, 0, 0)
 * });
 * ```
 */
export function createAxisTicks(
  scene: Scene | null,
  config: TickConfig
): Result<TickCreationResult, TickCreationError> {
  if (!scene) {
    return {
      success: false,
      error: {
        type: 'SCENE_NULL',
        message: 'Scene is null, cannot create ticks',
      },
    };
  }

  try {
    const majorTicks: LinesMesh[] = [];
    const minorTicks: LinesMesh[] = [];

    // Create major ticks
    for (let i = -config.majorCount; i <= config.majorCount; i++) {
      if (i === 0) continue; // Skip origin

      const distance = i * config.interval;
      const tickStart = getTickPosition(config.axis, config.origin, distance, -config.tickLength);
      const tickEnd = getTickPosition(config.axis, config.origin, distance, config.tickLength);

      const majorTick = MeshBuilder.CreateLines(
        `${config.axis}MajorTick${i}`,
        {
          points: [tickStart, tickEnd],
        },
        scene
      );

      if (majorTick) {
        majorTick.color = config.color;
        majorTicks.push(majorTick);

        // Create minor ticks between major ticks
        if (i < config.majorCount) {
          for (let j = 1; j < config.minorCount; j++) {
            const minorDistance = distance + (j * config.interval) / config.minorCount;
            const minorTickStart = getTickPosition(
              config.axis,
              config.origin,
              minorDistance,
              -config.tickLength * 0.5
            );
            const minorTickEnd = getTickPosition(
              config.axis,
              config.origin,
              minorDistance,
              config.tickLength * 0.5
            );

            const minorTick = MeshBuilder.CreateLines(
              `${config.axis}MinorTick${i}_${j}`,
              {
                points: [minorTickStart, minorTickEnd],
              },
              scene
            );

            if (minorTick) {
              minorTick.color = config.color;
              minorTicks.push(minorTick);
            }
          }
        }
      }
    }

    logger.debug(
      `[DEBUG][TickCreator] Created ${majorTicks.length} major ticks and ${minorTicks.length} minor ticks for ${config.axis}-axis`
    );

    return {
      success: true,
      data: {
        majorTicks,
        minorTicks,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'TICK_CREATION_FAILED',
        message: `Tick creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      },
    };
  }
}

/**
 * Creates a label for a specific axis value
 *
 * @param guiTexture - BabylonJS GUI texture to create label in
 * @param config - Configuration for the label
 * @returns Result containing created label block, or error
 *
 * @example
 * ```typescript
 * const result = createAxisLabel(guiTexture, {
 *   axis: 'x',
 *   value: 10,
 *   text: '10',
 *   fontSize: 12,
 *   color: new Color3(1, 0, 0),
 *   position: new Vector3(10, 0, 0)
 * });
 * ```
 */
export function createAxisLabel(
  guiTexture: AdvancedDynamicTexture | null,
  config: LabelConfig
): Result<LabelCreationResult, TickCreationError> {
  if (!guiTexture) {
    return {
      success: false,
      error: {
        type: 'GUI_NULL',
        message: 'GUI texture is null, cannot create label',
      },
    };
  }

  try {
    const labelBlock = new TextBlock(`${config.axis}Label${config.value}`, config.text);
    labelBlock.fontSizeInPixels = config.fontSize;
    labelBlock.color = `rgb(${Math.round(config.color.r * 255)}, ${Math.round(config.color.g * 255)}, ${Math.round(config.color.b * 255)})`;
    labelBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    labelBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    // Position the label (simplified positioning for now)
    labelBlock.leftInPixels = config.position.x * 10; // Simple scaling
    labelBlock.topInPixels = -config.position.y * 10; // Invert Y for screen coordinates

    guiTexture.addControl(labelBlock);

    logger.debug(
      `[DEBUG][TickCreator] Created label "${config.text}" for ${config.axis}-axis at value ${config.value}`
    );

    return {
      success: true,
      data: {
        labelBlock,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'LABEL_CREATION_FAILED',
        message: `Label creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      },
    };
  }
}
