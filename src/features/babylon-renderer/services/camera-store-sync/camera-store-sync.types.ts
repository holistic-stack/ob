/**
 * @file Camera Store Synchronization Types
 * @description Type definitions for camera state synchronization between BabylonJS
 * camera and Zustand store. Provides type-safe configuration and error handling
 * for bidirectional camera state management.
 *
 * @architectural_decision
 * **Unidirectional Sync**: This service implements camera → store synchronization only.
 * Store → camera updates are handled by other services to prevent circular updates
 * and maintain clear separation of concerns.
 *
 * **Debounced Updates**: Camera changes are debounced to prevent excessive store
 * updates during smooth camera movements while maintaining responsive user experience.
 *
 * @example Basic Configuration
 * ```typescript
 * const config: CameraStoreSyncConfig = {
 *   camera: arcRotateCamera,
 *   store: appStore,
 *   debounceMs: 300,
 *   enabled: true
 * };
 * ```
 *
 * @example Advanced Configuration with Callbacks
 * ```typescript
 * const config: CameraStoreSyncConfig = {
 *   camera: arcRotateCamera,
 *   store: appStore,
 *   debounceMs: 200,
 *   enabled: true,
 *   onCameraStateChange: (state) => console.log('Camera updated:', state),
 *   onSyncError: (error) => console.error('Sync error:', error)
 * };
 * ```
 */

import type { ArcRotateCamera } from '@babylonjs/core';
import type { CameraConfig } from '@/shared';

/**
 * Configuration for camera store synchronization service
 */
export interface CameraStoreSyncConfig {
  /** BabylonJS ArcRotateCamera to monitor for changes */
  readonly camera: ArcRotateCamera;

  /** Zustand store instance to update with camera state */
  readonly store: ReturnType<typeof import('../../../store/app-store.js').createAppStore>;

  /** Debounce delay in milliseconds for camera updates (default: 300ms) */
  readonly debounceMs?: number;

  /** Whether synchronization is enabled (default: true) */
  readonly enabled?: boolean;

  /** Callback fired when camera state changes */
  readonly onCameraStateChange?: (state: Partial<CameraConfig>) => void;

  /** Callback fired when synchronization errors occur */
  readonly onSyncError?: (error: CameraStoreSyncError) => void;

  /** Custom state mapping function for advanced use cases */
  readonly stateMapper?: (camera: ArcRotateCamera) => Partial<CameraConfig>;
}

/**
 * Camera store synchronization error types
 */
export type CameraStoreSyncErrorCode =
  | 'CAMERA_NOT_SUPPORTED'
  | 'STORE_NOT_AVAILABLE'
  | 'INITIALIZATION_FAILED'
  | 'STATE_UPDATE_FAILED'
  | 'OBSERVER_SETUP_FAILED'
  | 'DISPOSAL_FAILED';

/**
 * Camera store synchronization error
 */
export interface CameraStoreSyncError {
  readonly code: CameraStoreSyncErrorCode;
  readonly message: string;
  readonly cause?: unknown;
  readonly timestamp: Date;
}

/**
 * Internal state for camera store synchronization service
 */
export interface CameraStoreSyncState {
  readonly isInitialized: boolean;
  readonly isEnabled: boolean;
  readonly isDisposed: boolean;
  readonly lastCameraPosition: readonly [number, number, number] | null;
  readonly lastCameraTarget: readonly [number, number, number] | null;
  readonly lastUpdateTime: number;
  readonly updateCount: number;
}

/**
 * Camera state change event data
 */
export interface CameraStateChangeEvent {
  readonly previousState: Partial<CameraConfig> | null;
  readonly currentState: Partial<CameraConfig>;
  readonly timestamp: Date;
  readonly source: 'user_interaction' | 'programmatic' | 'animation';
}

/**
 * Default configuration values
 */
export const DEFAULT_CAMERA_STORE_SYNC_CONFIG = {
  debounceMs: 300,
  enabled: true,
} as const;

/**
 * Performance metrics for camera synchronization
 */
export interface CameraStoreSyncMetrics {
  readonly totalUpdates: number;
  readonly averageUpdateTime: number;
  readonly lastUpdateDuration: number;
  readonly skippedUpdates: number;
  readonly errorCount: number;
}
