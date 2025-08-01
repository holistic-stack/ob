/**
 * @file Camera Control Service
 *
 * Service for CAD-optimized camera controls with orbit, pan, and zoom functionality.
 * Provides smooth, responsive camera movement optimized for 3D model inspection.
 *
 * @example
 * ```typescript
 * const cameraService = new CameraControlService(scene);
 *
 * // Setup CAD camera controls
 * const result = await cameraService.setupCADCamera({
 *   target: Vector3.Zero(),
 *   radius: 10,
 *   enableOrbit: true,
 *   enablePan: true,
 *   enableZoom: true
 * });
 * ```
 */

import {
  ArcRotateCamera,
  type ArcRotateCameraMouseWheelInput,
  type ArcRotateCameraPointersInput,
  type Mesh,
  type Scene,
  Vector3,
} from '@babylonjs/core';
import type { Result } from '@/shared';
import { createLogger, tryCatchAsync } from '@/shared';

const logger = createLogger('CameraControl');

/**
 * CAD camera configuration
 */
export interface CADCameraConfig {
  readonly target?: Vector3;
  readonly radius?: number;
  readonly alpha?: number;
  readonly beta?: number;
  readonly enableOrbit?: boolean;
  readonly enablePan?: boolean;
  readonly enableZoom?: boolean;
  readonly orbitSensitivity?: number;
  readonly panSensitivity?: number;
  readonly zoomSensitivity?: number;
  readonly minRadius?: number;
  readonly maxRadius?: number;
  readonly minBeta?: number;
  readonly maxBeta?: number;
  readonly smoothing?: boolean;
  readonly smoothingFactor?: number;
}

/**
 * Camera bounds for automatic framing
 */
export interface CameraBounds {
  readonly min: Vector3;
  readonly max: Vector3;
  readonly center: Vector3;
  readonly size: Vector3;
}

/**
 * Camera control error
 */
export interface CameraControlError {
  readonly code:
    | 'SETUP_FAILED'
    | 'CAMERA_NOT_FOUND'
    | 'INVALID_PARAMETERS'
    | 'BOUNDS_CALCULATION_FAILED';
  readonly message: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * Camera Control Service
 *
 * Provides CAD-optimized camera controls for 3D model inspection.
 * Handles orbit, pan, zoom with smooth interpolation and constraints.
 */
export class CameraControlService {
  private readonly scene: Scene;
  private camera: ArcRotateCamera | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    logger.init('[INIT] CameraControl service initialized');
  }

  /**
   * Setup CAD-optimized camera controls
   */
  async setupCADCamera(
    config: CADCameraConfig = {}
  ): Promise<Result<ArcRotateCamera, CameraControlError>> {
    logger.debug('[CAD_CAMERA] Setting up CAD camera controls...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Default configuration optimized for CAD viewing with OpenSCAD Z-up standard
        const defaultConfig: Required<CADCameraConfig> = {
          target: Vector3.Zero(),
          radius: 17.32, // sqrt(10^2 + 10^2 + 10^2) for consistent distance
          alpha: Math.PI / 4, // 45 degrees around Z-axis
          beta: Math.PI / 3, // 60 degrees from Z-axis (looking down)
          enableOrbit: true,
          enablePan: true,
          enableZoom: true,
          orbitSensitivity: 1.0,
          panSensitivity: 1.0,
          zoomSensitivity: 1.0,
          minRadius: 0.1,
          maxRadius: 1000,
          minBeta: 0.01,
          maxBeta: Math.PI - 0.01,
          smoothing: true,
          smoothingFactor: 0.1,
        };

        const finalConfig = { ...defaultConfig, ...config };

        // Create ArcRotateCamera for CAD-style controls
        this.camera = new ArcRotateCamera(
          'cadCamera',
          finalConfig.alpha,
          finalConfig.beta,
          finalConfig.radius,
          finalConfig.target,
          this.scene
        );

        // Configure camera constraints
        this.camera.lowerRadiusLimit = finalConfig.minRadius;
        this.camera.upperRadiusLimit = finalConfig.maxRadius;
        this.camera.lowerBetaLimit = finalConfig.minBeta;
        this.camera.upperBetaLimit = finalConfig.maxBeta;

        // Configure input sensitivity
        const pointersInput = this.camera.inputs.attached.pointers as ArcRotateCameraPointersInput;
        if (pointersInput) {
          pointersInput.angularSensibilityX = 1000 / finalConfig.orbitSensitivity;
          pointersInput.angularSensibilityY = 1000 / finalConfig.orbitSensitivity;
          pointersInput.panningSensibility = 1000 / finalConfig.panSensitivity;
        }

        const mousewheelInput = this.camera.inputs.attached
          .mousewheel as ArcRotateCameraMouseWheelInput;
        if (mousewheelInput) {
          mousewheelInput.wheelPrecision = 50 / finalConfig.zoomSensitivity;
        }

        // Enable/disable controls based on configuration
        if (!finalConfig.enableOrbit) {
          this.camera.inputs.removeByType('ArcRotateCameraPointersInput');
        }

        if (!finalConfig.enablePan) {
          const pointersInput = this.camera.inputs.attached
            .pointers as ArcRotateCameraPointersInput;
          if (pointersInput) {
            pointersInput.panningSensibility = 0;
          }
        }

        if (!finalConfig.enableZoom) {
          this.camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');
        }

        // Configure smoothing
        if (finalConfig.smoothing) {
          this.camera.inertia = finalConfig.smoothingFactor;
        } else {
          this.camera.inertia = 0;
        }

        // Set camera up vector for Z-up coordinate system (OpenSCAD standard)
        this.camera.upVector = new Vector3(0, 0, 1);

        // Attach camera controls to canvas
        const canvas = this.scene.getEngine().getRenderingCanvas();
        if (canvas) {
          this.camera.attachControl(canvas);
        }

        // Set as active camera
        this.scene.activeCamera = this.camera;

        logger.debug(
          `[CAD_CAMERA] CAD camera setup completed in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return this.camera;
      },
      (error) => this.createError('SETUP_FAILED', `CAD camera setup failed: ${error}`)
    );
  }

  /**
   * Frame all meshes in the scene
   */
  async frameAll(): Promise<Result<void, CameraControlError>> {
    logger.debug('[FRAME_ALL] Framing all meshes...');

    return tryCatchAsync(
      async () => {
        if (!this.camera) {
          throw this.createError('CAMERA_NOT_FOUND', 'Camera not initialized');
        }

        const bounds = this.calculateSceneBounds();
        if (!bounds) {
          throw this.createError('BOUNDS_CALCULATION_FAILED', 'No meshes found in scene');
        }

        // Calculate optimal camera position
        const diagonal = bounds.size.length();
        const optimalRadius = diagonal * 1.5; // 1.5x diagonal for good framing

        // Update camera target and radius
        this.camera.setTarget(bounds.center);
        this.camera.radius = optimalRadius;

        // Ensure camera is within limits
        if (this.camera.radius < (this.camera.lowerRadiusLimit || 0.1)) {
          this.camera.radius = (this.camera.lowerRadiusLimit || 0.1) * 2;
        }
        if (this.camera.radius > (this.camera.upperRadiusLimit || 1000)) {
          this.camera.radius = (this.camera.upperRadiusLimit || 1000) * 0.8;
        }

        logger.debug('[FRAME_ALL] Scene framed successfully');
      },
      (error) => this.createError('BOUNDS_CALCULATION_FAILED', `Frame all failed: ${error}`)
    );
  }

  /**
   * Frame specific meshes
   */
  async frameMeshes(meshes: Mesh[]): Promise<Result<void, CameraControlError>> {
    logger.debug(`[FRAME_MESHES] Framing ${meshes.length} meshes...`);

    return tryCatchAsync(
      async () => {
        if (!this.camera) {
          throw this.createError('CAMERA_NOT_FOUND', 'Camera not initialized');
        }

        if (meshes.length === 0) {
          throw this.createError('INVALID_PARAMETERS', 'No meshes provided');
        }

        const bounds = this.calculateMeshesBounds(meshes);
        const diagonal = bounds.size.length();
        const optimalRadius = diagonal * 1.5;

        this.camera.setTarget(bounds.center);
        this.camera.radius = Math.max(optimalRadius, (this.camera.lowerRadiusLimit || 0.1) * 2);

        logger.debug('[FRAME_MESHES] Meshes framed successfully');
      },
      (error) => this.createError('BOUNDS_CALCULATION_FAILED', `Frame meshes failed: ${error}`)
    );
  }

  /**
   * Set camera view to predefined angle
   */
  async setView(
    view: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'isometric'
  ): Promise<Result<void, CameraControlError>> {
    logger.debug(`[SET_VIEW] Setting view to: ${view}`);

    return tryCatchAsync(
      async () => {
        if (!this.camera) {
          throw this.createError('CAMERA_NOT_FOUND', 'Camera not initialized');
        }

        const viewAngles = {
          front: { alpha: 0, beta: Math.PI / 2 },
          back: { alpha: Math.PI, beta: Math.PI / 2 },
          left: { alpha: -Math.PI / 2, beta: Math.PI / 2 },
          right: { alpha: Math.PI / 2, beta: Math.PI / 2 },
          top: { alpha: 0, beta: 0.01 },
          bottom: { alpha: 0, beta: Math.PI - 0.01 },
          isometric: { alpha: Math.PI / 4, beta: Math.PI / 3 },
        };

        const angles = viewAngles[view];
        this.camera.alpha = angles.alpha;
        this.camera.beta = angles.beta;

        logger.debug(`[SET_VIEW] View set to ${view}`);
      },
      (error) => this.createError('SETUP_FAILED', `Set view failed: ${error}`)
    );
  }

  /**
   * Get current camera
   */
  getCamera(): ArcRotateCamera | null {
    return this.camera;
  }

  /**
   * Calculate scene bounds
   */
  private calculateSceneBounds(): CameraBounds | null {
    const meshes = this.scene.meshes.filter((mesh) => mesh.isVisible && mesh.isEnabled());
    if (meshes.length === 0) {
      return null;
    }

    return this.calculateMeshesBounds(meshes as Mesh[]);
  }

  /**
   * Calculate bounds for specific meshes
   */
  private calculateMeshesBounds(meshes: Mesh[]): CameraBounds {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;

    for (const mesh of meshes) {
      const boundingInfo = mesh.getBoundingInfo();
      const min = boundingInfo.boundingBox.minimumWorld;
      const max = boundingInfo.boundingBox.maximumWorld;

      minX = Math.min(minX, min.x);
      minY = Math.min(minY, min.y);
      minZ = Math.min(minZ, min.z);
      maxX = Math.max(maxX, max.x);
      maxY = Math.max(maxY, max.y);
      maxZ = Math.max(maxZ, max.z);
    }

    const min = new Vector3(minX, minY, minZ);
    const max = new Vector3(maxX, maxY, maxZ);
    const center = Vector3.Center(min, max);
    const size = max.subtract(min);

    return { min, max, center, size };
  }

  /**
   * Create a camera control error
   */
  private createError(
    code: CameraControlError['code'],
    message: string,
    details?: Record<string, unknown>
  ): CameraControlError {
    const error: CameraControlError = {
      code,
      message,
      timestamp: new Date(),
      ...(details && { details }),
    };

    return error;
  }

  /**
   * Dispose camera controls
   */
  dispose(): void {
    if (this.camera) {
      this.camera.dispose();
      this.camera = null;
    }
    logger.debug('[DISPOSE] Camera controls disposed');
  }
}
