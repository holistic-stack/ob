/**
 * @file Camera Configuration Service
 *
 * Provides predefined camera configurations for consistent visual regression testing.
 * Supports multiple viewing angles including perspective and orthogonal views with
 * reproducible positioning for reliable screenshot comparison.
 *
 * @example
 * ```typescript
 * import { getCameraConfiguration, applyCameraConfiguration } from './camera-configurations.service';
 *
 * const config = getCameraConfiguration('isometric');
 * await applyCameraConfiguration(camera, config);
 * ```
 */

import { ArcRotateCamera, type Scene, Vector3 } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services';
import type { Result } from '../../../../shared/types';
import { tryCatch } from '../../../../shared/utils/functional';
import type { CameraAngle, VisualTestCameraConfig } from '../../types/visual-testing.types';

const logger = createLogger('CameraConfigurationService');

/**
 * Error types for camera configuration operations
 */
export type CameraConfigurationError =
  | 'INVALID_ANGLE'
  | 'CAMERA_NOT_FOUND'
  | 'CONFIGURATION_FAILED'
  | 'SCENE_NOT_AVAILABLE';

/**
 * Predefined camera configurations for visual testing
 * Each configuration provides consistent positioning for reproducible screenshots
 */
const CAMERA_CONFIGURATIONS: Record<CameraAngle, VisualTestCameraConfig> = {
  front: {
    angle: 'front',
    position: [0, 0, 20],
    target: [0, 0, 0],
    alpha: 0,
    beta: Math.PI / 2,
    radius: 20,
  },
  top: {
    angle: 'top',
    position: [0, 20, 0],
    target: [0, 0, 0],
    alpha: 0,
    beta: 0,
    radius: 20,
  },
  isometric: {
    angle: 'isometric',
    position: [15, 15, 15],
    target: [0, 0, 0],
    alpha: Math.PI / 4,
    beta: Math.PI / 3,
    radius: 25.98, // sqrt(15^2 + 15^2 + 15^2)
  },
  side: {
    angle: 'side',
    position: [20, 0, 0],
    target: [0, 0, 0],
    alpha: Math.PI / 2,
    beta: Math.PI / 2,
    radius: 20,
  },
  back: {
    angle: 'back',
    position: [0, 0, -20],
    target: [0, 0, 0],
    alpha: Math.PI,
    beta: Math.PI / 2,
    radius: 20,
  },
} as const;

/**
 * Get camera configuration for a specific angle
 *
 * @param angle - The camera angle to get configuration for
 * @returns Camera configuration or error
 *
 * @example
 * ```typescript
 * const config = getCameraConfiguration('isometric');
 * if (config.success) {
 *   console.log('Camera position:', config.data.position);
 * }
 * ```
 */
export const getCameraConfiguration = (
  angle: CameraAngle
): Result<VisualTestCameraConfig, CameraConfigurationError> => {
  return tryCatch(
    () => {
      const config = CAMERA_CONFIGURATIONS[angle];
      if (!config) {
        throw new Error(`Invalid camera angle: ${angle}`);
      }

      logger.debug(`[DEBUG][CameraConfiguration] Retrieved config for angle: ${angle}`);
      return config;
    },
    () => 'INVALID_ANGLE' as CameraConfigurationError
  );
};

/**
 * Apply camera configuration to a BabylonJS ArcRotateCamera
 *
 * @param camera - The BabylonJS camera to configure
 * @param config - The camera configuration to apply
 * @returns Success result or error
 *
 * @example
 * ```typescript
 * const camera = new ArcRotateCamera('testCamera', 0, 0, 10, Vector3.Zero(), scene);
 * const config = getCameraConfiguration('front');
 *
 * if (config.success) {
 *   const result = await applyCameraConfiguration(camera, config.data);
 *   if (result.success) {
 *     console.log('Camera configured successfully');
 *   }
 * }
 * ```
 */
export const applyCameraConfiguration = async (
  camera: ArcRotateCamera,
  config: VisualTestCameraConfig
): Promise<Result<void, CameraConfigurationError>> => {
  try {
    logger.debug(`[DEBUG][CameraConfiguration] Applying ${config.angle} configuration`);

    // Set camera parameters
    camera.alpha = config.alpha;
    camera.beta = config.beta;
    camera.radius = config.radius;
    camera.setTarget(new Vector3(...config.target));

    // Disable camera controls for consistent screenshots
    camera.attachControl(camera.getScene()?.getEngine()?.getRenderingCanvas(), false);

    logger.debug(`[DEBUG][CameraConfiguration] Camera configured for ${config.angle} view`);

    return { success: true, data: undefined };
  } catch (_error) {
    return { success: false, error: 'CONFIGURATION_FAILED' as CameraConfigurationError };
  }
};

/**
 * Create a new ArcRotateCamera with the specified configuration
 *
 * @param scene - The BabylonJS scene to create the camera in
 * @param angle - The camera angle configuration to use
 * @param name - Optional name for the camera (defaults to 'visualTestCamera')
 * @returns Configured camera or error
 *
 * @example
 * ```typescript
 * const cameraResult = await createConfiguredCamera(scene, 'isometric');
 * if (cameraResult.success) {
 *   const camera = cameraResult.data;
 *   scene.activeCamera = camera;
 * }
 * ```
 */
export const createConfiguredCamera = async (
  scene: Scene,
  angle: CameraAngle,
  name = 'visualTestCamera'
): Promise<Result<ArcRotateCamera, CameraConfigurationError>> => {
  try {
    logger.init(`[INIT][CameraConfiguration] Creating camera for ${angle} view`);

    // Get configuration
    const configResult = getCameraConfiguration(angle);
    if (!configResult.success) {
      throw new Error(`Failed to get configuration for angle: ${angle}`);
    }

    const config = configResult.data;

    // Create camera
    const camera = new ArcRotateCamera(
      name,
      config.alpha,
      config.beta,
      config.radius,
      new Vector3(...config.target),
      scene
    );

    // Apply configuration
    const applyResult = await applyCameraConfiguration(camera, config);
    if (!applyResult.success) {
      throw new Error('Failed to apply camera configuration');
    }

    logger.debug(`[DEBUG][CameraConfiguration] Camera created successfully for ${angle}`);
    return { success: true, data: camera };
  } catch (error: unknown) {
    logger.error(`[ERROR][CameraConfiguration] Failed to create camera: ${error}`);
    return { success: false, error: 'CONFIGURATION_FAILED' as CameraConfigurationError };
  }
};

/**
 * Get all available camera angles
 *
 * @returns Array of available camera angles
 *
 * @example
 * ```typescript
 * const angles = getAvailableCameraAngles();
 * console.log('Available angles:', angles); // ['front', 'top', 'isometric', 'side']
 * ```
 */
export const getAvailableCameraAngles = (): readonly CameraAngle[] => {
  return Object.keys(CAMERA_CONFIGURATIONS) as CameraAngle[];
};

/**
 * Validate if a camera angle is supported
 *
 * @param angle - The angle to validate
 * @returns True if the angle is supported, false otherwise
 *
 * @example
 * ```typescript
 * if (isValidCameraAngle('isometric')) {
 *   // Proceed with isometric view
 * }
 * ```
 */
export const isValidCameraAngle = (angle: string): angle is CameraAngle => {
  return angle in CAMERA_CONFIGURATIONS;
};
