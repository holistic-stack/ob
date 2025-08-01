/**
 * @file transformation-gizmo.service.ts
 * @description BabylonJS transformation gizmo service providing position, rotation, and scale
 * manipulation capabilities for 3D meshes. Implements service-based architecture with
 * Result<T,E> error handling and observable transformation events.
 *
 * @example Basic Usage
 * ```typescript
 * const service = new TransformationGizmoService();
 * const initResult = await service.initialize(scene);
 *
 * if (initResult.success) {
 *   const attachResult = service.attachToMesh(selectedMesh);
 *   service.setMode('position');
 * }
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-23
 */

import type { AbstractMesh, Scene } from '@babylonjs/core';
import { GizmoManager, Observable } from '@babylonjs/core';
import type { Result } from '@/shared';
import { createLogger } from '@/shared';

const logger = createLogger('TransformationGizmoService');

/**
 * Transformation gizmo modes
 */
export type GizmoMode = 'position' | 'rotation' | 'scale';

/**
 * Transformation gizmo error types
 */
export interface TransformationGizmoError {
  readonly code: 'INIT_FAILED' | 'ATTACH_FAILED' | 'MODE_CHANGE_FAILED' | 'DISPOSAL_FAILED';
  readonly message: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * Transformation event data
 */
export interface TransformationEvent {
  readonly mesh: AbstractMesh;
  readonly mode: GizmoMode;
  readonly position: { x: number; y: number; z: number };
  readonly rotation: { x: number; y: number; z: number };
  readonly scaling: { x: number; y: number; z: number };
  readonly timestamp: Date;
}

/**
 * Gizmo configuration options
 */
export interface TransformationGizmoConfig {
  readonly size: number;
  readonly snapToGrid: boolean;
  readonly gridSize: number;
  readonly enablePointerToAttach: boolean;
}

/**
 * Default transformation gizmo configuration
 */
export const DEFAULT_TRANSFORMATION_GIZMO_CONFIG: TransformationGizmoConfig = {
  size: 1.0,
  snapToGrid: false,
  gridSize: 1.0,
  enablePointerToAttach: false,
} as const;

/**
 * BabylonJS transformation gizmo service
 *
 * Provides position, rotation, and scale manipulation capabilities for 3D meshes
 * using BabylonJS GizmoManager with React integration and store connectivity.
 */
export class TransformationGizmoService {
  private gizmoManager: GizmoManager | null = null;
  private scene: Scene | null = null;
  private currentMode: GizmoMode = 'position';
  private attachedMesh: AbstractMesh | null = null;
  private config: TransformationGizmoConfig;
  private isInitialized = false;

  // Observable for transformation events
  public readonly onTransformationObservable = new Observable<TransformationEvent>();

  constructor(config: Partial<TransformationGizmoConfig> = {}) {
    this.config = Object.freeze({
      ...DEFAULT_TRANSFORMATION_GIZMO_CONFIG,
      ...config,
    });

    logger.init('[INIT][TransformationGizmoService] Service created');
  }

  /**
   * Initialize the transformation gizmo service with a BabylonJS scene
   */
  async initialize(scene: Scene): Promise<Result<void, TransformationGizmoError>> {
    try {
      logger.debug('[DEBUG][TransformationGizmoService] Initializing with scene');

      if (this.isInitialized) {
        logger.warn('[WARN][TransformationGizmoService] Service already initialized');
        return { success: true, data: undefined };
      }

      this.scene = scene;

      // Create gizmo manager
      this.gizmoManager = new GizmoManager(scene);

      // Configure gizmo manager
      this.gizmoManager.usePointerToAttachGizmos = this.config.enablePointerToAttach;

      // Set initial mode (position gizmo enabled by default)
      this.gizmoManager.positionGizmoEnabled = true;
      this.gizmoManager.rotationGizmoEnabled = false;
      this.gizmoManager.scaleGizmoEnabled = false;

      // Setup transformation event handlers
      this.setupTransformationEvents();

      this.isInitialized = true;
      logger.debug('[DEBUG][TransformationGizmoService] Service initialized successfully');

      return { success: true, data: undefined };
    } catch (error) {
      const gizmoError: TransformationGizmoError = {
        code: 'INIT_FAILED',
        message: `Failed to initialize transformation gizmo service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        details: { originalError: error },
      };

      logger.error(`[ERROR][TransformationGizmoService] ${gizmoError.message}`);
      return { success: false, error: gizmoError };
    }
  }

  /**
   * Attach gizmo to a specific mesh
   */
  attachToMesh(mesh: AbstractMesh): Result<void, TransformationGizmoError> {
    try {
      if (!this.gizmoManager) {
        return {
          success: false,
          error: {
            code: 'ATTACH_FAILED',
            message: 'Gizmo manager not initialized',
            timestamp: new Date(),
          },
        };
      }

      this.gizmoManager.attachToMesh(mesh);
      this.attachedMesh = mesh;

      logger.debug(`[DEBUG][TransformationGizmoService] Gizmo attached to mesh: ${mesh.name}`);
      return { success: true, data: undefined };
    } catch (error) {
      const gizmoError: TransformationGizmoError = {
        code: 'ATTACH_FAILED',
        message: `Failed to attach gizmo to mesh: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        details: { meshName: mesh.name, originalError: error },
      };

      logger.error(`[ERROR][TransformationGizmoService] ${gizmoError.message}`);
      return { success: false, error: gizmoError };
    }
  }

  /**
   * Detach gizmo from current mesh
   */
  detach(): Result<void, TransformationGizmoError> {
    try {
      if (!this.gizmoManager) {
        return {
          success: false,
          error: {
            code: 'ATTACH_FAILED',
            message: 'Gizmo manager not initialized',
            timestamp: new Date(),
          },
        };
      }

      this.gizmoManager.attachToMesh(null);
      this.attachedMesh = null;

      logger.debug('[DEBUG][TransformationGizmoService] Gizmo detached from mesh');
      return { success: true, data: undefined };
    } catch (error) {
      const gizmoError: TransformationGizmoError = {
        code: 'ATTACH_FAILED',
        message: `Failed to detach gizmo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        details: { originalError: error },
      };

      logger.error(`[ERROR][TransformationGizmoService] ${gizmoError.message}`);
      return { success: false, error: gizmoError };
    }
  }

  /**
   * Set the current gizmo mode (position, rotation, or scale)
   */
  setMode(mode: GizmoMode): Result<void, TransformationGizmoError> {
    try {
      if (!this.gizmoManager) {
        return {
          success: false,
          error: {
            code: 'MODE_CHANGE_FAILED',
            message: 'Gizmo manager not initialized',
            timestamp: new Date(),
          },
        };
      }

      // Disable all gizmos first
      this.gizmoManager.positionGizmoEnabled = false;
      this.gizmoManager.rotationGizmoEnabled = false;
      this.gizmoManager.scaleGizmoEnabled = false;

      // Enable the selected gizmo
      switch (mode) {
        case 'position':
          this.gizmoManager.positionGizmoEnabled = true;
          break;
        case 'rotation':
          this.gizmoManager.rotationGizmoEnabled = true;
          break;
        case 'scale':
          this.gizmoManager.scaleGizmoEnabled = true;
          break;
        default:
          return {
            success: false,
            error: {
              code: 'MODE_CHANGE_FAILED',
              message: `Invalid gizmo mode: ${mode}`,
              timestamp: new Date(),
            },
          };
      }

      this.currentMode = mode;
      logger.debug(`[DEBUG][TransformationGizmoService] Gizmo mode changed to: ${mode}`);

      return { success: true, data: undefined };
    } catch (error) {
      const gizmoError: TransformationGizmoError = {
        code: 'MODE_CHANGE_FAILED',
        message: `Failed to change gizmo mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        details: { requestedMode: mode, originalError: error },
      };

      logger.error(`[ERROR][TransformationGizmoService] ${gizmoError.message}`);
      return { success: false, error: gizmoError };
    }
  }

  /**
   * Get current gizmo mode
   */
  getCurrentMode(): GizmoMode {
    return this.currentMode;
  }

  /**
   * Get currently attached mesh
   */
  getAttachedMesh(): AbstractMesh | null {
    return this.attachedMesh;
  }

  /**
   * Check if service is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Setup transformation event handlers
   */
  private setupTransformationEvents(): void {
    if (!this.gizmoManager) return;

    // Position gizmo events
    if (this.gizmoManager.gizmos.positionGizmo) {
      this.gizmoManager.gizmos.positionGizmo.onDragEndObservable.add(() => {
        this.emitTransformationEvent('position');
      });
    }

    // Rotation gizmo events
    if (this.gizmoManager.gizmos.rotationGizmo) {
      this.gizmoManager.gizmos.rotationGizmo.onDragEndObservable.add(() => {
        this.emitTransformationEvent('rotation');
      });
    }

    // Scale gizmo events
    if (this.gizmoManager.gizmos.scaleGizmo) {
      this.gizmoManager.gizmos.scaleGizmo.onDragEndObservable.add(() => {
        this.emitTransformationEvent('scale');
      });
    }
  }

  /**
   * Emit transformation event
   */
  private emitTransformationEvent(mode: GizmoMode): void {
    if (!this.attachedMesh) return;

    const transformationEvent: TransformationEvent = {
      mesh: this.attachedMesh,
      mode,
      position: {
        x: this.attachedMesh.position.x,
        y: this.attachedMesh.position.y,
        z: this.attachedMesh.position.z,
      },
      rotation: {
        x: this.attachedMesh.rotation.x,
        y: this.attachedMesh.rotation.y,
        z: this.attachedMesh.rotation.z,
      },
      scaling: {
        x: this.attachedMesh.scaling.x,
        y: this.attachedMesh.scaling.y,
        z: this.attachedMesh.scaling.z,
      },
      timestamp: new Date(),
    };

    this.onTransformationObservable.notifyObservers(transformationEvent);
    logger.debug(
      `[DEBUG][TransformationGizmoService] Transformation event emitted for mode: ${mode}`
    );
  }

  /**
   * Dispose of the transformation gizmo service
   */
  dispose(): Result<void, TransformationGizmoError> {
    try {
      logger.debug('[DEBUG][TransformationGizmoService] Disposing service');

      this.onTransformationObservable.clear();

      if (this.gizmoManager) {
        this.gizmoManager.dispose();
        this.gizmoManager = null;
      }

      this.scene = null;
      this.attachedMesh = null;
      this.isInitialized = false;

      logger.end('[END][TransformationGizmoService] Service disposed');
      return { success: true, data: undefined };
    } catch (error) {
      const gizmoError: TransformationGizmoError = {
        code: 'DISPOSAL_FAILED',
        message: `Failed to dispose transformation gizmo service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        details: { originalError: error },
      };

      logger.error(`[ERROR][TransformationGizmoService] ${gizmoError.message}`);
      return { success: false, error: gizmoError };
    }
  }
}
