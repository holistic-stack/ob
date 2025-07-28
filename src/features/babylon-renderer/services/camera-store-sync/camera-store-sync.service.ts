/**
 * @file Camera Store Synchronization Service
 * @description Service for synchronizing BabylonJS camera state with Zustand store.
 * Provides unidirectional camera → store synchronization with debounced updates
 * to maintain responsive user experience while preventing excessive state updates.
 *
 * @architectural_decision
 * **Unidirectional Synchronization**: This service only handles camera → store updates
 * to prevent circular update loops. Store → camera updates are handled by other services
 * like CameraControlService and CameraGizmoSyncService.
 *
 * **Debounced Updates**: Camera changes are debounced using the project's standard
 * 300ms delay to match parser debouncing patterns and provide smooth user experience
 * during camera movements.
 *
 * **Observer Pattern**: Uses BabylonJS onViewMatrixChangedObservable for efficient
 * camera change detection without polling or render loop overhead.
 *
 * @example Basic Usage
 * ```typescript
 * const syncService = new CameraStoreSyncService();
 *
 * const result = await syncService.initialize({
 *   camera: arcRotateCamera,
 *   store: appStore,
 *   debounceMs: 300
 * });
 *
 * if (result.success) {
 *   console.log('Camera store sync initialized');
 * }
 * ```
 *
 * @example Advanced Usage with Callbacks
 * ```typescript
 * const syncService = new CameraStoreSyncService();
 *
 * await syncService.initialize({
 *   camera: camera,
 *   store: store,
 *   debounceMs: 200,
 *   onCameraStateChange: (state) => console.log('Camera updated:', state),
 *   onSyncError: (error) => console.error('Sync error:', error)
 * });
 * ```
 */

import type { ArcRotateCamera, Observer } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { CameraConfig } from '../../../../shared/types/common.types.js';
import type { Result } from '../../../../shared/types/result.types.js';
import { debounce } from '../../../../shared/utils/functional/pipe.js';
import {
  type CameraStoreSyncConfig,
  type CameraStoreSyncError,
  type CameraStoreSyncErrorCode,
  type CameraStoreSyncMetrics,
  type CameraStoreSyncState,
  DEFAULT_CAMERA_STORE_SYNC_CONFIG,
} from './camera-store-sync.types.js';

const logger = createLogger('CameraStoreSync');

/**
 * Camera Store Synchronization Service
 *
 * Provides efficient synchronization between BabylonJS camera state and Zustand store
 * with debounced updates and comprehensive error handling.
 */
export class CameraStoreSyncService {
  private config: CameraStoreSyncConfig | null = null;
  private camera: ArcRotateCamera | null = null;
  private store: ReturnType<typeof import('../../../store/app-store.js').createAppStore> | null =
    null;
  private viewMatrixObserver: Observer<ArcRotateCamera> | null = null;
  private debouncedUpdateStore: ((state: Partial<CameraConfig>) => void) | null = null;
  private state: CameraStoreSyncState = this.createInitialState();
  private metrics: CameraStoreSyncMetrics = this.createInitialMetrics();

  /**
   * Initialize camera store synchronization
   */
  async initialize(config: CameraStoreSyncConfig): Promise<Result<void, CameraStoreSyncError>> {
    try {
      logger.init('[INIT][CameraStoreSync] Initializing camera store synchronization...');

      // Validate configuration
      const validationResult = this.validateConfig(config);
      if (!validationResult.success) {
        return validationResult;
      }

      // Store configuration with defaults
      this.config = {
        ...DEFAULT_CAMERA_STORE_SYNC_CONFIG,
        ...config,
      };

      this.camera = config.camera;
      this.store = config.store;

      // Setup debounced store update function
      this.setupDebouncedUpdate();

      // Setup camera change observer
      this.setupCameraObserver();

      // Restore camera position from store
      this.restoreCameraFromStore();

      // Update state
      this.state = {
        ...this.state,
        isInitialized: true,
        isEnabled: this.config.enabled ?? true,
      };

      logger.debug('[DEBUG][CameraStoreSync] Initialization completed successfully');
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: this.createError('INITIALIZATION_FAILED', `Initialization failed: ${error}`, error),
      };
    }
  }

  /**
   * Enable camera store synchronization
   */
  enable(): void {
    if (!this.state.isInitialized) {
      logger.warn('[WARN][CameraStoreSync] Cannot enable: service not initialized');
      return;
    }

    this.state = { ...this.state, isEnabled: true };
    logger.debug('[DEBUG][CameraStoreSync] Synchronization enabled');
  }

  /**
   * Disable camera store synchronization
   */
  disable(): void {
    this.state = { ...this.state, isEnabled: false };
    logger.debug('[DEBUG][CameraStoreSync] Synchronization disabled');
  }

  /**
   * Get current synchronization metrics
   */
  getMetrics(): CameraStoreSyncMetrics {
    return { ...this.metrics };
  }

  /**
   * Dispose of the service and cleanup resources
   */
  dispose(): void {
    try {
      logger.debug('[DEBUG][CameraStoreSync] Disposing service...');

      // Remove camera observer
      if (this.viewMatrixObserver && this.camera) {
        this.camera.onViewMatrixChangedObservable.remove(this.viewMatrixObserver);
        this.viewMatrixObserver = null;
      }

      // Clear references
      this.config = null;
      this.camera = null;
      this.store = null;
      this.debouncedUpdateStore = null;

      // Update state
      this.state = {
        ...this.state,
        isDisposed: true,
        isEnabled: false,
      };

      logger.debug('[DEBUG][CameraStoreSync] Service disposed successfully');
    } catch (error) {
      logger.error('[ERROR][CameraStoreSync] Error during disposal:', error);
    }
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: CameraStoreSyncConfig): Result<void, CameraStoreSyncError> {
    if (!config.camera) {
      return {
        success: false,
        error: this.createError('CAMERA_NOT_SUPPORTED', 'Camera is required'),
      };
    }

    if (config.camera.getClassName() !== 'ArcRotateCamera') {
      return {
        success: false,
        error: this.createError('CAMERA_NOT_SUPPORTED', 'Only ArcRotateCamera is supported'),
      };
    }

    if (!config.store) {
      return {
        success: false,
        error: this.createError('STORE_NOT_AVAILABLE', 'Store is required'),
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Setup debounced store update function
   */
  private setupDebouncedUpdate(): void {
    if (!this.config) return;

    this.debouncedUpdateStore = debounce((state: Partial<CameraConfig>) => {
      this.updateStoreState(state);
    }, this.config.debounceMs ?? 300);
  }

  /**
   * Restore camera position from store
   */
  private restoreCameraFromStore(): void {
    if (!this.camera || !this.store) return;

    try {
      const cameraState = this.store.getState().babylonRendering.camera;

      logger.debug('[DEBUG][CameraStoreSync] Restoring camera from store:', cameraState);

      // Check if camera state is different from defaults (indicating user has moved camera)
      const isDefaultPosition = this.isDefaultCameraState(cameraState);

      if (isDefaultPosition) {
        logger.debug('[DEBUG][CameraStoreSync] Camera state is default, skipping restoration');
        return;
      }

      // Restore camera position
      if (cameraState.position) {
        this.camera.position.x = cameraState.position[0];
        this.camera.position.y = cameraState.position[1];
        this.camera.position.z = cameraState.position[2];
      }

      // Restore camera target
      if (cameraState.target) {
        this.camera.target.x = cameraState.target[0];
        this.camera.target.y = cameraState.target[1];
        this.camera.target.z = cameraState.target[2];
      }

      // Restore zoom (convert back to radius for ArcRotateCamera)
      if (cameraState.zoom && cameraState.zoom > 0) {
        this.camera.radius = 1 / cameraState.zoom;
      }

      // Update internal state to match restored position
      this.updateInternalState({
        position: cameraState.position,
        target: cameraState.target,
        zoom: cameraState.zoom,
      });

      logger.debug('[DEBUG][CameraStoreSync] Camera position restored successfully');
    } catch (error) {
      logger.error('[ERROR][CameraStoreSync] Failed to restore camera from store:', error);
      this.config?.onSyncError?.(
        this.createError('STATE_UPDATE_FAILED', `Camera restoration failed: ${error}`, error)
      );
    }
  }

  /**
   * Check if camera state matches default values
   */
  private isDefaultCameraState(cameraState: Partial<CameraConfig>): boolean {
    const DEFAULT_POSITION = [10, 10, 10];
    const DEFAULT_TARGET = [0, 0, 0];
    const DEFAULT_ZOOM = 1;
    const threshold = 0.001;

    // Check position
    if (cameraState.position) {
      const positionMatches = cameraState.position.every(
        (value, index) => Math.abs(value - DEFAULT_POSITION[index]) < threshold
      );
      if (!positionMatches) return false;
    }

    // Check target
    if (cameraState.target) {
      const targetMatches = cameraState.target.every(
        (value, index) => Math.abs(value - DEFAULT_TARGET[index]) < threshold
      );
      if (!targetMatches) return false;
    }

    // Check zoom
    if (cameraState.zoom && Math.abs(cameraState.zoom - DEFAULT_ZOOM) > threshold) {
      return false;
    }

    return true;
  }

  /**
   * Setup camera change observer
   */
  private setupCameraObserver(): void {
    if (!this.camera) return;

    try {
      this.viewMatrixObserver = this.camera.onViewMatrixChangedObservable.add(() => {
        if (this.state.isEnabled && !this.state.isDisposed) {
          this.handleCameraChange();
        }
      });

      logger.debug('[DEBUG][CameraStoreSync] Camera observer setup completed');
    } catch (error) {
      logger.error('[ERROR][CameraStoreSync] Failed to setup camera observer:', error);
      this.config?.onSyncError?.(
        this.createError('OBSERVER_SETUP_FAILED', `Observer setup failed: ${error}`, error)
      );
    }
  }

  /**
   * Handle camera change event
   */
  private handleCameraChange(): void {
    if (!this.camera || !this.debouncedUpdateStore) return;

    try {
      const startTime = performance.now();

      // Extract camera state
      const cameraState = this.extractCameraState(this.camera);

      // Check if state actually changed to avoid unnecessary updates
      if (this.hasStateChanged(cameraState)) {
        this.debouncedUpdateStore(cameraState);

        // Update metrics
        const duration = performance.now() - startTime;
        this.updateMetrics(duration);

        // Update internal state
        this.updateInternalState(cameraState);

        // Notify callback
        this.config?.onCameraStateChange?.(cameraState);
      } else {
        this.metrics = {
          ...this.metrics,
          skippedUpdates: this.metrics.skippedUpdates + 1,
        };
      }
    } catch (error) {
      logger.error('[ERROR][CameraStoreSync] Error handling camera change:', error);
      this.metrics = {
        ...this.metrics,
        errorCount: this.metrics.errorCount + 1,
      };
      this.config?.onSyncError?.(
        this.createError('STATE_UPDATE_FAILED', `Camera change handling failed: ${error}`, error)
      );
    }
  }

  /**
   * Extract camera state for store update
   */
  private extractCameraState(camera: ArcRotateCamera): Partial<CameraConfig> {
    // Use custom state mapper if provided
    if (this.config?.stateMapper) {
      return this.config.stateMapper(camera);
    }

    // Default state mapping
    return {
      position: [camera.position.x, camera.position.y, camera.position.z] as const,
      target: [camera.target.x, camera.target.y, camera.target.z] as const,
      // Map radius to zoom (inverse relationship for intuitive zoom behavior)
      zoom: camera.radius > 0 ? 1 / camera.radius : 1,
    };
  }

  /**
   * Check if camera state has changed significantly
   */
  private hasStateChanged(newState: Partial<CameraConfig>): boolean {
    const threshold = 0.001; // Small threshold to avoid floating point precision issues

    // Check position change
    if (newState.position && this.state.lastCameraPosition) {
      const lastPosition = this.state.lastCameraPosition;
      const positionChanged = newState.position.some(
        (value, index) => Math.abs(value - (lastPosition?.[index] ?? 0)) > threshold
      );
      if (positionChanged) return true;
    }

    // Check target change
    if (newState.target && this.state.lastCameraTarget) {
      const lastTarget = this.state.lastCameraTarget;
      const targetChanged = newState.target.some(
        (value, index) => Math.abs(value - (lastTarget?.[index] ?? 0)) > threshold
      );
      if (targetChanged) return true;
    }

    // If no previous state, consider it changed
    return !this.state.lastCameraPosition || !this.state.lastCameraTarget;
  }

  /**
   * Update store with camera state
   */
  private updateStoreState(state: Partial<CameraConfig>): void {
    try {
      if (!this.store) return;

      this.store.getState().updateCamera(state);
      logger.debug('[DEBUG][CameraStoreSync] Store updated with camera state');
    } catch (error) {
      logger.error('[ERROR][CameraStoreSync] Failed to update store:', error);
      this.config?.onSyncError?.(
        this.createError('STATE_UPDATE_FAILED', `Store update failed: ${error}`, error)
      );
    }
  }

  /**
   * Update internal state tracking
   */
  private updateInternalState(state: Partial<CameraConfig>): void {
    this.state = {
      ...this.state,
      lastCameraPosition: state.position || this.state.lastCameraPosition,
      lastCameraTarget: state.target || this.state.lastCameraTarget,
      lastUpdateTime: performance.now(),
      updateCount: this.state.updateCount + 1,
    };
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(duration: number): void {
    const totalUpdates = this.metrics.totalUpdates + 1;
    const averageUpdateTime =
      (this.metrics.averageUpdateTime * this.metrics.totalUpdates + duration) / totalUpdates;

    this.metrics = {
      ...this.metrics,
      totalUpdates,
      averageUpdateTime,
      lastUpdateDuration: duration,
    };
  }

  /**
   * Create initial state
   */
  private createInitialState(): CameraStoreSyncState {
    return {
      isInitialized: false,
      isEnabled: false,
      isDisposed: false,
      lastCameraPosition: null,
      lastCameraTarget: null,
      lastUpdateTime: 0,
      updateCount: 0,
    };
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics(): CameraStoreSyncMetrics {
    return {
      totalUpdates: 0,
      averageUpdateTime: 0,
      lastUpdateDuration: 0,
      skippedUpdates: 0,
      errorCount: 0,
    };
  }

  /**
   * Create error object
   */
  private createError(
    code: CameraStoreSyncErrorCode,
    message: string,
    cause?: unknown
  ): CameraStoreSyncError {
    return {
      code,
      message,
      cause,
      timestamp: new Date(),
    };
  }
}
