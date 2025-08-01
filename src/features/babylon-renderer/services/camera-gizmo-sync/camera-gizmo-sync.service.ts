/**
 * @file Camera Gizmo Synchronization Service
 * @description Service for bidirectional synchronization between camera controls
 * and orientation gizmo. Handles camera movement updates to gizmo and gizmo
 * axis selection to camera animation with smooth transitions and proper state
 * management through Zustand store integration.
 *
 * @architectural_decision
 * **Bidirectional Synchronization**: This service acts as a bridge between
 * the camera control system and the orientation gizmo:
 * - **Camera → Gizmo**: Updates gizmo orientation when camera moves
 * - **Gizmo → Camera**: Animates camera when gizmo axis is selected
 * - **Store Integration**: Synchronizes state through Zustand store
 * - **Performance Optimized**: Debounced updates to prevent excessive rendering
 *
 * **Observer Pattern**: Uses event-driven architecture to respond to camera
 * changes and gizmo interactions without tight coupling between components.
 *
 * @example Basic Usage
 * ```typescript
 * const syncService = new CameraGizmoSyncService(scene, store);
 *
 * // Initialize synchronization
 * const result = await syncService.initialize({
 *   camera: arcRotateCamera,
 *   gizmoService: orientationGizmoService,
 *   enableBidirectionalSync: true,
 *   animationDuration: 500
 * });
 *
 * if (result.success) {
 *   console.log('Camera-gizmo sync initialized');
 * }
 * ```
 *
 * @example Advanced Configuration
 * ```typescript
 * const syncService = new CameraGizmoSyncService(scene, store);
 *
 * await syncService.initialize({
 *   camera: camera,
 *   gizmoService: gizmoService,
 *   enableBidirectionalSync: true,
 *   animationDuration: 750,
 *   updateThrottleMs: 16, // 60fps
 *   easingFunction: 'cubic',
 *   onCameraMove: (position) => console.log('Camera moved:', position),
 *   onGizmoSelect: (axis) => console.log('Gizmo axis selected:', axis)
 * });
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-23
 */

import type { Animatable, ArcRotateCamera, Scene } from '@babylonjs/core';
import { Animation, EasingFunction, QuadraticEase, Vector3 } from '@babylonjs/core';
import type { AxisDirection } from '@/features/babylon-renderer/types';
import type { AppStore } from '@/features/store';
import type { Result } from '@/shared';
import { createLogger } from '@/shared';
import type { OrientationGizmoService } from '../orientation-gizmo-service/orientation-gizmo.service';

const logger = createLogger('CameraGizmoSync');

/**
 * Camera gizmo synchronization configuration
 */
export interface CameraGizmoSyncConfig {
  readonly camera: ArcRotateCamera;
  readonly gizmoService: OrientationGizmoService;
  readonly enableBidirectionalSync?: boolean;
  readonly animationDuration?: number; // milliseconds
  readonly updateThrottleMs?: number;
  readonly easingFunction?: 'linear' | 'quadratic' | 'cubic';
  readonly onCameraMove?: (position: Vector3, rotation: Vector3) => void;
  readonly onGizmoSelect?: (axis: AxisDirection) => void;
  readonly onAnimationStart?: () => void;
  readonly onAnimationComplete?: () => void;
}

/**
 * Camera gizmo sync error types
 */
export interface CameraGizmoSyncError {
  readonly code:
    | 'INITIALIZATION_FAILED'
    | 'CAMERA_NOT_SUPPORTED'
    | 'GIZMO_SERVICE_INVALID'
    | 'ANIMATION_FAILED'
    | 'SYNC_FAILED';
  readonly message: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * Sync state interface
 */
interface SyncState {
  readonly isInitialized: boolean;
  readonly isAnimating: boolean;
  readonly lastCameraPosition: Vector3 | null;
  readonly lastCameraRotation: Vector3 | null;
  readonly selectedAxis: AxisDirection | null;
}

/**
 * Camera Gizmo Synchronization Service
 *
 * Provides bidirectional synchronization between camera controls and
 * orientation gizmo with smooth animations and state management.
 */
export class CameraGizmoSyncService {
  private readonly scene: Scene;
  private readonly store: ReturnType<typeof import('../../../store/app-store').createAppStore>;
  private config: CameraGizmoSyncConfig | null = null;
  private camera: ArcRotateCamera | null = null;
  private gizmoService: OrientationGizmoService | null = null;
  private easingFunction: EasingFunction | null = null;
  private updateThrottleId: number | null = null;
  private animationGroup: Animatable[] = [];
  private storeUnsubscribe: (() => void) | null = null;

  private state: SyncState = {
    isInitialized: false,
    isAnimating: false,
    lastCameraPosition: null,
    lastCameraRotation: null,
    selectedAxis: null,
  };

  constructor(
    scene: Scene,
    store: ReturnType<typeof import('../../../store/app-store').createAppStore>
  ) {
    this.scene = scene;
    this.store = store;
    logger.init('[INIT][CameraGizmoSync] Service initialized');
  }

  /**
   * Initialize camera-gizmo synchronization
   */
  async initialize(config: CameraGizmoSyncConfig): Promise<Result<void, CameraGizmoSyncError>> {
    try {
      logger.debug('[DEBUG][CameraGizmoSync] Initializing synchronization...');

      // Validate camera
      if (!config.camera || config.camera.getClassName() !== 'ArcRotateCamera') {
        return this.createErrorResult(
          'CAMERA_NOT_SUPPORTED',
          'Only ArcRotateCamera is supported for gizmo synchronization'
        );
      }

      // Validate gizmo service
      if (!config.gizmoService) {
        return this.createErrorResult(
          'GIZMO_SERVICE_INVALID',
          'Valid gizmo service is required for synchronization'
        );
      }

      this.config = {
        enableBidirectionalSync: true,
        animationDuration: 500,
        updateThrottleMs: 16, // 60fps
        easingFunction: 'quadratic',
        ...config,
      };

      this.camera = config.camera;
      this.gizmoService = config.gizmoService;

      // Setup easing function
      this.setupEasingFunction();

      // Setup camera change listeners
      if (this.config.enableBidirectionalSync) {
        this.setupCameraListeners();
      }

      // Setup store listeners for gizmo interactions
      this.setupStoreListeners();

      this.state = {
        ...this.state,
        isInitialized: true,
        lastCameraPosition: this.camera.position.clone(),
        lastCameraRotation: new Vector3(this.camera.alpha, this.camera.beta, 0),
      };

      logger.debug('[DEBUG][CameraGizmoSync] Synchronization initialized successfully');
      return { success: true, data: undefined };
    } catch (error) {
      return this.createErrorResult(
        'INITIALIZATION_FAILED',
        `Failed to initialize camera-gizmo sync: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  /**
   * Handle gizmo axis selection with camera animation
   */
  async animateCameraToAxis(axis: AxisDirection): Promise<Result<void, CameraGizmoSyncError>> {
    if (!this.camera || !this.config) {
      return this.createErrorResult(
        'ANIMATION_FAILED',
        'Camera or configuration not available for animation'
      );
    }

    // Check if camera is disposed
    if (this.isCameraDisposed()) {
      return this.createErrorResult(
        'ANIMATION_FAILED',
        'Camera has been disposed and is no longer available'
      );
    }

    try {
      logger.debug(`[DEBUG][CameraGizmoSync] Animating camera to axis: ${axis}`);

      this.state = { ...this.state, isAnimating: true, selectedAxis: axis };
      this.store.getState().setGizmoAnimating(true);
      this.config.onAnimationStart?.();

      // Calculate target camera position based on axis
      const targetPosition = this.calculateAxisCameraPosition(axis);
      const currentPosition = this.camera.position.clone();

      // Create smooth animation
      const animation = Animation.CreateAndStartAnimation(
        'cameraGizmoSync',
        this.camera,
        'position',
        60, // Frame rate
        Math.floor((this.config.animationDuration || 500) / 16), // Duration in frames
        currentPosition,
        targetPosition,
        0, // No loop
        this.easingFunction || undefined,
        () => {
          // Animation complete callback
          this.state = { ...this.state, isAnimating: false };
          this.store.getState().setGizmoAnimating(false);
          this.config?.onAnimationComplete?.();
          logger.debug('[DEBUG][CameraGizmoSync] Camera animation completed');
        }
      );

      if (!animation) {
        throw new Error('Failed to create camera animation');
      }

      this.animationGroup.push(animation);
      this.config.onGizmoSelect?.(axis);

      return { success: true, data: undefined };
    } catch (error) {
      this.state = { ...this.state, isAnimating: false };
      this.store.getState().setGizmoAnimating(false);

      return this.createErrorResult(
        'ANIMATION_FAILED',
        `Camera animation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { axis, originalError: error }
      );
    }
  }

  /**
   * Update gizmo when camera moves
   */
  private updateGizmoFromCamera(): void {
    if (!this.camera || !this.gizmoService || this.state.isAnimating) {
      return;
    }

    const currentPosition = this.camera.position.clone();
    const currentRotation = new Vector3(this.camera.alpha, this.camera.beta, 0);

    // Check if camera has actually moved (avoid unnecessary updates)
    if (
      this.state.lastCameraPosition?.equals(currentPosition) &&
      this.state.lastCameraRotation?.equals(currentRotation)
    ) {
      return;
    }

    // Update gizmo service (it will handle the rendering update)
    const updateResult = this.gizmoService.update();
    if (!updateResult.success) {
      logger.warn('[WARN][CameraGizmoSync] Failed to update gizmo from camera movement');
    }

    // Update state
    this.state = {
      ...this.state,
      lastCameraPosition: currentPosition,
      lastCameraRotation: currentRotation,
    };

    // Notify callback
    this.config?.onCameraMove?.(currentPosition, currentRotation);
  }

  /**
   * Setup camera change listeners
   */
  private setupCameraListeners(): void {
    if (!this.camera) return;

    // Listen for camera position/rotation changes
    this.scene.registerBeforeRender(() => {
      if (this.updateThrottleId) return;

      this.updateThrottleId = window.setTimeout(() => {
        this.updateGizmoFromCamera();
        this.updateThrottleId = null;
      }, this.config?.updateThrottleMs || 16);
    });
  }

  /**
   * Setup store listeners for gizmo interactions
   */
  private setupStoreListeners(): void {
    let previousSelectedAxis: AxisDirection | null = null;

    // Subscribe to gizmo axis selection changes
    // Use the store instance directly since it's passed in constructor
    this.storeUnsubscribe = this.store.subscribe((state: AppStore) => {
      const selectedAxis = state.babylonRendering?.gizmo?.selectedAxis;

      // Only react to actual changes in selectedAxis
      if (selectedAxis !== previousSelectedAxis && selectedAxis && !this.state.isAnimating) {
        previousSelectedAxis = selectedAxis;
        // Axis was selected, animate camera (async but don't await to avoid blocking)
        this.animateCameraToAxis(selectedAxis).catch((error) => {
          logger.error('[ERROR][CameraGizmoSync] Failed to animate camera to axis:', error);
        });
      } else if (!selectedAxis) {
        previousSelectedAxis = null;
      }
    });
  }

  /**
   * Setup easing function based on configuration
   */
  private setupEasingFunction(): void {
    if (!this.config) return;

    switch (this.config.easingFunction) {
      case 'linear':
        this.easingFunction = null; // Linear is default
        break;
      case 'quadratic':
        this.easingFunction = new QuadraticEase();
        this.easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        break;
      case 'cubic':
        // Could add CubicEase if needed
        this.easingFunction = new QuadraticEase();
        this.easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        break;
      default:
        this.easingFunction = new QuadraticEase();
        this.easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    }
  }

  /**
   * Check if camera is disposed
   */
  private isCameraDisposed(): boolean {
    if (!this.camera) return true;

    // Check if camera has isDisposed method and use it
    if ('isDisposed' in this.camera && typeof this.camera.isDisposed === 'function') {
      return this.camera.isDisposed();
    }

    // Fallback: try to access camera properties - if disposed, this will throw
    try {
      this.camera.position;
      this.camera.radius;
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Calculate camera position for axis view
   */
  private calculateAxisCameraPosition(axis: AxisDirection): Vector3 {
    if (!this.camera) return Vector3.Zero();

    const radius = this.camera.radius;
    const target = this.camera.getTarget();

    // Define axis direction vectors
    const axisVectors: Record<AxisDirection, Vector3> = {
      '+x': new Vector3(1, 0, 0),
      '-x': new Vector3(-1, 0, 0),
      '+y': new Vector3(0, 1, 0),
      '-y': new Vector3(0, -1, 0),
      '+z': new Vector3(0, 0, 1),
      '-z': new Vector3(0, 0, -1),
    };

    const direction = axisVectors[axis];
    if (!direction) {
      logger.warn(`[WARN][CameraGizmoSync] Unknown axis direction: ${axis}`);
      return this.camera.position.clone();
    }

    // Calculate position: target + (direction * radius)
    return target.add(direction.scale(radius));
  }

  /**
   * Get current synchronization state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Dispose of synchronization service
   */
  dispose(): Result<void, CameraGizmoSyncError> {
    try {
      // Clear throttle timer
      if (this.updateThrottleId) {
        clearTimeout(this.updateThrottleId);
        this.updateThrottleId = null;
      }

      // Unsubscribe from store
      if (this.storeUnsubscribe) {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      }

      // Stop any running animations
      this.scene.stopAnimation(this.camera);
      this.animationGroup = [];

      // Reset state
      this.state = {
        isInitialized: false,
        isAnimating: false,
        lastCameraPosition: null,
        lastCameraRotation: null,
        selectedAxis: null,
      };

      this.config = null;
      this.camera = null;
      this.gizmoService = null;
      this.easingFunction = null;

      logger.debug('[DEBUG][CameraGizmoSync] Service disposed successfully');
      return { success: true, data: undefined };
    } catch (error) {
      return this.createErrorResult(
        'SYNC_FAILED',
        `Failed to dispose sync service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  /**
   * Create error result helper
   */
  private createErrorResult(
    code: CameraGizmoSyncError['code'],
    message: string,
    details?: Record<string, unknown>
  ): Result<never, CameraGizmoSyncError> {
    return {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date(),
        details: details ?? {},
      },
    };
  }
}
