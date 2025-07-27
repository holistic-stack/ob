/**
 * @file openscad-globals-slice.types.ts
 * @description Type definitions for OpenSCAD global variables slice providing type-safe
 * management of OpenSCAD special variables ($fn, $fa, $fs, $t, etc.) with proper validation
 * and immutable state structures following functional programming patterns.
 *
 * @architectural_decision
 * **OpenSCAD Special Variables**: This slice manages all OpenSCAD special variables that
 * affect geometry generation, animation, viewport, and debugging. These variables are
 * global in OpenSCAD scope and influence how primitives and operations are rendered.
 *
 * **Immutable State Design**: All interfaces use `readonly` modifiers to enforce
 * immutability and enable efficient change detection through structural sharing.
 *
 * **Validation Types**: Each variable has specific validation rules based on OpenSCAD
 * specifications to ensure valid values and prevent rendering errors.
 *
 * @performance_considerations
 * - **Memory Efficiency**: Readonly types enable structural sharing
 * - **Type Safety**: Strict typing prevents invalid OpenSCAD variable values
 * - **Bundle Size**: Tree-shakable exports minimize runtime overhead
 *
 * @example Type Usage
 * ```typescript
 * import type { OpenSCADGlobalsState, OpenSCADGlobalsActions } from './openscad-globals-slice.types';
 *
 * const state: OpenSCADGlobalsState = {
 *   $fn: undefined,
 *   $fa: 12,
 *   $fs: 2,
 *   $t: 0,
 *   // ... other variables
 * };
 * ```
 */

import type { Result } from '../../../../shared/types/result.types.js';

/**
 * @interface Vector3
 * @description Three-dimensional vector for viewport and transformation operations.
 */
export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * @interface OpenSCADGeometryResolution
 * @description Geometry resolution settings that control the quality of curved surfaces.
 * These variables work together to determine how circles, spheres, and cylinders are tessellated.
 */
export interface OpenSCADGeometryResolution {
  /**
   * Number of fragments for circles/spheres/cylinders.
   * - undefined: Use $fa and $fs to calculate fragments
   * - 0: Use $fa and $fs to calculate fragments
   * - >0: Use exactly this many fragments
   */
  readonly $fn: number | undefined;

  /**
   * Minimum angle for a fragment in degrees.
   * Must be > 0. Default: 12 degrees.
   * Smaller values create smoother curves but more polygons.
   */
  readonly $fa: number;

  /**
   * Minimum size of a fragment in units.
   * Must be > 0. Default: 2 units.
   * Smaller values create smoother curves but more polygons.
   */
  readonly $fs: number;
}

/**
 * @interface OpenSCADAnimation
 * @description Animation-related variables for time-based modeling.
 */
export interface OpenSCADAnimation {
  /**
   * Animation time step (0.0 to 1.0).
   * Used for creating animated models and time-based variations.
   */
  readonly $t: number;
}

/**
 * @interface OpenSCADViewport
 * @description Viewport and camera-related variables for 3D scene control.
 */
export interface OpenSCADViewport {
  /**
   * Viewport rotation angles in degrees [x, y, z].
   * Controls the camera orientation in the 3D scene.
   */
  readonly $vpr: readonly [number, number, number];

  /**
   * Viewport translation [x, y, z].
   * Controls the camera position offset in the 3D scene.
   */
  readonly $vpt: readonly [number, number, number];

  /**
   * Viewport distance (camera distance from origin).
   * Must be > 0. Controls zoom level.
   */
  readonly $vpd: number;
}

/**
 * @interface OpenSCADModuleSystem
 * @description Module system variables for hierarchical modeling.
 */
export interface OpenSCADModuleSystem {
  /**
   * Number of children in the current module context.
   * Read-only variable set by the OpenSCAD interpreter.
   */
  readonly $children: number;
}

/**
 * @interface OpenSCADDebug
 * @description Debug and preview mode variables.
 */
export interface OpenSCADDebug {
  /**
   * Whether the model is in preview mode.
   * Affects rendering quality and performance.
   */
  readonly $preview: boolean;
}

/**
 * @interface OpenSCADGlobalsState
 * @description Complete state interface for OpenSCAD global variables combining all categories.
 */
export interface OpenSCADGlobalsState
  extends OpenSCADGeometryResolution,
    OpenSCADAnimation,
    OpenSCADViewport,
    OpenSCADModuleSystem,
    OpenSCADDebug {
  /**
   * Timestamp of last update for change tracking.
   */
  readonly lastUpdated: number;

  /**
   * Whether the global variables have been modified from defaults.
   */
  readonly isModified: boolean;
}

/**
 * @interface OpenSCADGlobalsValidationError
 * @description Error information for invalid OpenSCAD variable values.
 */
export interface OpenSCADGlobalsValidationError {
  readonly variable: keyof OpenSCADGlobalsState;
  readonly value: unknown;
  readonly message: string;
  readonly expectedRange?: string;
}

/**
 * @interface OpenSCADGlobalsActions
 * @description Action interface for updating OpenSCAD global variables with validation.
 */
export interface OpenSCADGlobalsActions {
  /**
   * Update geometry resolution variables ($fn, $fa, $fs).
   * @param resolution - New resolution settings
   * @returns Result indicating success or validation errors
   */
  updateGeometryResolution: (
    resolution: Partial<OpenSCADGeometryResolution>
  ) => Result<void, OpenSCADGlobalsValidationError[]>;

  /**
   * Update animation variables ($t).
   * @param animation - New animation settings
   * @returns Result indicating success or validation errors
   */
  updateAnimation: (
    animation: Partial<OpenSCADAnimation>
  ) => Result<void, OpenSCADGlobalsValidationError[]>;

  /**
   * Update viewport variables ($vpr, $vpt, $vpd).
   * @param viewport - New viewport settings
   * @returns Result indicating success or validation errors
   */
  updateViewport: (
    viewport: Partial<OpenSCADViewport>
  ) => Result<void, OpenSCADGlobalsValidationError[]>;

  /**
   * Update module system variables ($children).
   * @param moduleSystem - New module system settings
   * @returns Result indicating success or validation errors
   */
  updateModuleSystem: (
    moduleSystem: Partial<OpenSCADModuleSystem>
  ) => Result<void, OpenSCADGlobalsValidationError[]>;

  /**
   * Update debug variables ($preview).
   * @param debug - New debug settings
   * @returns Result indicating success or validation errors
   */
  updateDebug: (debug: Partial<OpenSCADDebug>) => Result<void, OpenSCADGlobalsValidationError[]>;

  /**
   * Update individual OpenSCAD variable by name.
   * @param variable - Variable name
   * @param value - New value
   * @returns Result indicating success or validation errors
   */
  updateVariable: <K extends keyof OpenSCADGlobalsState>(
    variable: K,
    value: OpenSCADGlobalsState[K]
  ) => Result<void, OpenSCADGlobalsValidationError>;

  /**
   * Reset all variables to OpenSCAD defaults.
   */
  resetToDefaults: () => void;

  /**
   * Reset specific category to defaults.
   * @param category - Category to reset
   */
  resetCategory: (category: 'geometry' | 'animation' | 'viewport' | 'modules' | 'debug') => void;

  /**
   * Extract and apply global variables from OpenSCAD AST nodes.
   * Processes assignment nodes for special variables like $fs, $fa, $fn, etc.
   * @param ast - Array of AST nodes to process
   * @returns Result indicating success or extraction errors
   */
  extractGlobalsFromAST: (
    ast: ReadonlyArray<any>
  ) => Result<void, OpenSCADGlobalsValidationError[]>;
}

/**
 * @type OpenSCADGlobalsSlice
 * @description Complete slice type combining state and actions.
 */
export type OpenSCADGlobalsSlice = OpenSCADGlobalsState & OpenSCADGlobalsActions;

/**
 * @interface OpenSCADGlobalsDefaults
 * @description Default values for OpenSCAD global variables based on OpenSCAD specifications.
 */
export interface OpenSCADGlobalsDefaults {
  readonly $fn: undefined;
  readonly $fa: 12;
  readonly $fs: 2;
  readonly $t: 0;
  readonly $vpr: readonly [55, 0, 25];
  readonly $vpt: readonly [0, 0, 0];
  readonly $vpd: 140;
  readonly $children: 0;
  readonly $preview: true;
  readonly lastUpdated: 0;
  readonly isModified: false;
}
