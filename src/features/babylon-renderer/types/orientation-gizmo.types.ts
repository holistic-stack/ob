/**
 * @file Orientation Gizmo Type Definitions
 * @description Comprehensive TypeScript interfaces for the orientation gizmo system
 * following functional programming patterns with readonly properties and Result<T,E>
 * error handling. Provides type-safe configuration and state management for 3D
 * navigation gizmo integration with BabylonJS and Zustand store.
 *
 * @architectural_decision
 * **Immutable Configuration**: All configuration objects use readonly properties
 * to ensure immutability and prevent accidental mutations during runtime.
 *
 * **Result<T,E> Pattern**: All operations that can fail return Result types
 * for explicit error handling without exceptions.
 *
 * **Branded Types**: Use branded types for IDs to prevent mixing different
 * identifier types and improve type safety.
 *
 * @example Basic Gizmo Configuration
 * ```typescript
 * const gizmoConfig: GizmoConfig = {
 *   size: 90,
 *   padding: 8,
 *   showSecondary: true,
 *   colors: {
 *     x: ['#f73c3c', '#942424'],
 *     y: ['#6ccb26', '#417a17'],
 *     z: ['#178cf0', '#0e5490']
 *   }
 * };
 * ```
 *
 * @example Gizmo State Management
 * ```typescript
 * const gizmoState: GizmoState = {
 *   isVisible: true,
 *   position: GizmoPosition.TOP_RIGHT,
 *   config: gizmoConfig,
 *   isAnimating: false,
 *   selectedAxis: null,
 *   lastInteraction: new Date()
 * };
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-23
 */

import type { ArcRotateCamera, Vector3 } from '@babylonjs/core';
import type { Brand, Result } from '@/shared';

/**
 * Branded type for gizmo instance identification
 */
export type GizmoId = Brand<string, 'GizmoId'>;

/**
 * Gizmo position options for UI placement
 */
export enum GizmoPosition {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
}

/**
 * Axis direction enumeration for gizmo interactions
 */
export enum AxisDirection {
  POSITIVE_X = '+x',
  NEGATIVE_X = '-x',
  POSITIVE_Y = '+y',
  NEGATIVE_Y = '-y',
  POSITIVE_Z = '+z',
  NEGATIVE_Z = '-z',
}

/**
 * Gizmo axis configuration for visual representation
 */
export interface GizmoAxis {
  readonly axis: AxisDirection;
  readonly direction: Vector3;
  readonly size: number;
  readonly color: readonly [string, string]; // [primary, secondary]
  readonly line?: number;
  readonly label?: string;
}

/**
 * Color configuration for gizmo axes
 */
export interface GizmoColors {
  readonly x: readonly [string, string]; // [primary, secondary]
  readonly y: readonly [string, string];
  readonly z: readonly [string, string];
}

/**
 * Font configuration for gizmo labels
 */
export interface GizmoFontConfig {
  readonly fontSize: string;
  readonly fontFamily: string;
  readonly fontWeight: string;
  readonly fontColor: string;
  readonly fontYAdjust: number;
}

/**
 * Animation configuration for camera transitions
 */
export interface GizmoAnimationConfig {
  readonly enableAnimations: boolean;
  readonly animationDuration: number; // milliseconds
  readonly easingFunction: 'linear' | 'quadratic' | 'cubic';
  readonly frameRate: number;
}

/**
 * Comprehensive gizmo configuration interface
 */
export interface GizmoConfig {
  readonly size: number;
  readonly padding: number;
  readonly bubbleSizePrimary: number;
  readonly bubbleSizeSecondary: number;
  readonly showSecondary: boolean;
  readonly lineWidth: number;
  readonly colors: GizmoColors;
  readonly font: GizmoFontConfig;
  readonly animation: GizmoAnimationConfig;
  readonly sensitivity: number;
  readonly enableInteraction: boolean;
}

/**
 * Mouse interaction state for gizmo
 */
export interface GizmoMouseState {
  readonly position: Vector3 | null;
  readonly isHovering: boolean;
  readonly hoveredAxis: AxisDirection | null;
  readonly isDragging: boolean;
}

/**
 * Camera animation state
 */
export interface GizmoCameraAnimation {
  readonly isAnimating: boolean;
  readonly targetPosition: Vector3 | null;
  readonly startTime: number;
  readonly duration: number;
  readonly easingFunction: string;
}

/**
 * Main gizmo state interface for Zustand store
 */
export interface GizmoState {
  readonly id: GizmoId;
  readonly isVisible: boolean;
  readonly position: GizmoPosition;
  readonly config: GizmoConfig;
  readonly selectedAxis: AxisDirection | null;
  readonly mouseState: GizmoMouseState;
  readonly cameraAnimation: GizmoCameraAnimation;
  readonly lastInteraction: Date | null;
  readonly isInitialized: boolean;
  readonly error: GizmoError | null;
}

/**
 * Gizmo error types for comprehensive error handling
 */
export enum GizmoErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  CAMERA_NOT_SUPPORTED = 'CAMERA_NOT_SUPPORTED',
  CANVAS_NOT_FOUND = 'CANVAS_NOT_FOUND',
  ANIMATION_FAILED = 'ANIMATION_FAILED',
  RENDER_FAILED = 'RENDER_FAILED',
  INTERACTION_FAILED = 'INTERACTION_FAILED',
  CONFIGURATION_INVALID = 'CONFIGURATION_INVALID',
}

/**
 * Gizmo error interface
 */
export interface GizmoError {
  readonly code: GizmoErrorCode;
  readonly message: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
  readonly stack?: string;
}

/**
 * Gizmo initialization options
 */
export interface GizmoInitOptions {
  readonly camera: ArcRotateCamera;
  readonly canvas: HTMLCanvasElement;
  readonly config?: Partial<GizmoConfig>;
  readonly position?: GizmoPosition;
  readonly enableDebug?: boolean;
}

/**
 * Gizmo update result for render loop
 */
export interface GizmoUpdateResult {
  readonly rendered: boolean;
  readonly frameTime: number;
  readonly interactionDetected: boolean;
  readonly selectedAxis: AxisDirection | null;
}

/**
 * Gizmo interaction event data
 */
export interface GizmoInteractionEvent {
  readonly axis: AxisDirection;
  readonly direction: Vector3;
  readonly timestamp: Date;
  readonly mousePosition: Vector3;
  readonly cameraPosition: Vector3;
}

/**
 * Result types for gizmo operations
 */
export type GizmoInitResult = Result<GizmoState, GizmoError>;
export type GizmoUpdateResult_Type = Result<GizmoUpdateResult, GizmoError>;
export type GizmoInteractionResult = Result<GizmoInteractionEvent, GizmoError>;
export type GizmoConfigResult = Result<GizmoConfig, GizmoError>;
export type GizmoDisposeResult = Result<void, GizmoError>;

/**
 * Gizmo service interface for dependency injection
 */
export interface IGizmoService {
  /**
   * Initialize the gizmo with camera and configuration
   */
  initialize(options: GizmoInitOptions): Promise<GizmoInitResult>;

  /**
   * Update gizmo rendering and interaction detection
   */
  update(): GizmoUpdateResult_Type;

  /**
   * Handle axis selection and camera animation
   */
  selectAxis(axis: AxisDirection): Promise<GizmoInteractionResult>;

  /**
   * Update gizmo configuration
   */
  updateConfig(config: Partial<GizmoConfig>): GizmoConfigResult;

  /**
   * Get current gizmo state
   */
  getState(): GizmoState;

  /**
   * Dispose of gizmo resources
   */
  dispose(): GizmoDisposeResult;
}

/**
 * Default gizmo configuration following OpenSCAD conventions
 */
export const DEFAULT_GIZMO_CONFIG: GizmoConfig = {
  size: 90,
  padding: 8,
  bubbleSizePrimary: 8,
  bubbleSizeSecondary: 6,
  showSecondary: true,
  lineWidth: 2,
  colors: {
    x: ['#f73c3c', '#942424'], // Red for X-axis
    y: ['#6ccb26', '#417a17'], // Green for Y-axis
    z: ['#178cf0', '#0e5490'], // Blue for Z-axis
  },
  font: {
    fontSize: '11px',
    fontFamily: 'arial',
    fontWeight: 'bold',
    fontColor: '#151515',
    fontYAdjust: 0,
  },
  animation: {
    enableAnimations: true,
    animationDuration: 500, // 500ms for smooth transitions
    easingFunction: 'quadratic',
    frameRate: 60,
  },
  sensitivity: 1.0,
  enableInteraction: true,
} as const;

/**
 * Factory function for creating gizmo IDs
 */
export const createGizmoId = (value: string): GizmoId => value as GizmoId;

/**
 * Type guard for checking if camera is supported
 */
export const isSupportedCamera = (camera: unknown): camera is ArcRotateCamera => {
  return (
    camera !== null &&
    typeof camera === 'object' &&
    'getClassName' in camera &&
    (camera as { getClassName(): string }).getClassName() === 'ArcRotateCamera'
  );
};

/**
 * Utility type for partial gizmo state updates
 */
export type GizmoStateUpdate = Partial<
  Pick<GizmoState, 'isVisible' | 'position' | 'config' | 'selectedAxis'>
>;

/**
 * Gizmo event handlers for React integration
 */
export interface GizmoEventHandlers {
  readonly onAxisSelected?: (event: GizmoInteractionEvent) => void;
  readonly onAnimationStart?: (axis: AxisDirection) => void;
  readonly onAnimationComplete?: (axis: AxisDirection) => void;
  readonly onError?: (error: GizmoError) => void;
  readonly onConfigChange?: (config: GizmoConfig) => void;
}
