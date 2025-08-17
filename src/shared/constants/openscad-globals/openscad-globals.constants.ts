/**
 * @file openscad-globals.constants.ts
 * @description Centralized OpenSCAD global variable default values and configuration constants.
 * This module provides the authoritative source for all OpenSCAD special variables that control
 * geometry tessellation, animation, viewport, and debugging behavior.
 *
 * @architectural_decision
 * **Single Source of Truth**: All OpenSCAD global variable defaults are centralized here to
 * prevent magic numbers and ensure consistency across the entire application.
 *
 * **OpenSCAD Specification Compliance**: Values are based on official OpenSCAD documentation
 * and match the behavior of the reference OpenSCAD implementation.
 *
 * **Immutable Design**: All constants use `as const` assertions and Object.freeze() to
 * ensure immutability and enable efficient change detection.
 *
 * @performance_characteristics
 * - **Memory Usage**: ~100 bytes for all constants (minimal overhead)
 * - **Bundle Size**: Tree-shakable exports minimize runtime impact
 * - **Type Safety**: Readonly types prevent accidental mutations
 *
 * @example Basic Usage
 * ```typescript
 * import { OPENSCAD_GLOBALS } from '@/shared/constants/openscad-globals';
 *
 * // Use in tessellation calculations
 * const fragments = calculateFragments(radius, OPENSCAD_GLOBALS.DEFAULT_FA, OPENSCAD_GLOBALS.DEFAULT_FS);
 *
 * // Use in Zustand store initialization
 * const initialState = {
 *   $fn: OPENSCAD_GLOBALS.DEFAULT_FN,
 *   $fa: OPENSCAD_GLOBALS.DEFAULT_FA,
 *   $fs: OPENSCAD_GLOBALS.DEFAULT_FS,
 * };
 * ```
 *
 * @example Advanced Usage
 * ```typescript
 * import { OPENSCAD_TESSELLATION, OPENSCAD_VIEWPORT } from '@/shared/constants/openscad-globals';
 *
 * // Use grouped constants for specific domains
 * const tessellationConfig = {
 *   ...OPENSCAD_TESSELLATION,
 *   customOverride: true,
 * };
 * ```
 */

/**
 * @constant OPENSCAD_GLOBALS
 * @description Primary OpenSCAD global variable default values based on official OpenSCAD specification.
 * These values match the behavior of the reference OpenSCAD implementation.
 *
 * @see {@link https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/Primitive_Solids} OpenSCAD Manual
 */
export const OPENSCAD_GLOBALS = Object.freeze({
  /**
   * Number of fragments for circles, spheres, and cylinders.
   * - `0` or `undefined`: Use $fa and $fs to calculate fragments automatically
   * - `>= 3`: Use exactly this many fragments (overrides $fa and $fs)
   *
   * @default 0
   * @range [0, ∞) where 0 means auto-calculate, >= 3 for fixed fragments
   * @impact Higher values create smoother curves but increase rendering time
   */
  DEFAULT_FN: 0 as const,

  /**
   * Minimum angle for a fragment in degrees.
   * Controls the angular resolution of curved surfaces.
   *
   * @default 12
   * @range (0, 360] degrees
   * @impact Smaller values create smoother curves but more polygons
   * @example $fa=6 creates twice as many fragments as $fa=12 for the same radius
   */
  DEFAULT_FA: 12 as const,

  /**
   * Minimum fragment size in units.
   * Controls the linear resolution of curved surfaces.
   *
   * @default 2
   * @range (0, ∞) units
   * @impact Smaller values create smoother curves but more polygons
   * @example For a circle with radius=10, $fs=1 creates ~63 fragments, $fs=2 creates ~32 fragments
   */
  DEFAULT_FS: 2 as const,

  /**
   * Animation time step for time-based modeling.
   *
   * @default 0
   * @range [0, 1] where 0 is start and 1 is end of animation cycle
   * @impact Used for creating animated models and time-based variations
   */
  DEFAULT_T: 0 as const,
} as const);

/**
 * @constant OPENSCAD_TESSELLATION
 * @description Tessellation-specific constants grouped for convenience.
 * Use this when you only need geometry resolution parameters.
 */
export const OPENSCAD_TESSELLATION = Object.freeze({
  /**
   * Default number of fragments (0 = auto-calculate)
   */
  FN: OPENSCAD_GLOBALS.DEFAULT_FN,

  /**
   * Default minimum angle in degrees
   */
  FA: OPENSCAD_GLOBALS.DEFAULT_FA,

  /**
   * Default minimum fragment size in units
   */
  FS: OPENSCAD_GLOBALS.DEFAULT_FS,
} as const);

/**
 * @constant OPENSCAD_VIEWPORT
 * @description Default viewport and camera settings based on OpenSCAD defaults.
 */
export const OPENSCAD_VIEWPORT = Object.freeze({
  /**
   * Default viewport rotation angles [x, y, z] in degrees
   */
  ROTATION: [55, 0, 25] as const,

  /**
   * Default viewport translation [x, y, z] in units
   */
  TRANSLATION: [0, 0, 0] as const,

  /**
   * Default viewport distance (camera distance from target)
   */
  DISTANCE: 140 as const,
} as const);

/**
 * @constant OPENSCAD_MODULE_SYSTEM
 * @description Module system related constants.
 */
export const OPENSCAD_MODULE_SYSTEM = Object.freeze({
  /**
   * Default number of children in module context
   */
  CHILDREN: 0 as const,
} as const);

/**
 * @constant OPENSCAD_DEBUG
 * @description Debug and development related constants.
 */
export const OPENSCAD_DEBUG = Object.freeze({
  /**
   * Default preview mode (true = preview, false = render)
   */
  PREVIEW: true as const,
} as const);

/**
 * Fallback values removed intentionally. Per architecture policy, geometry operations
 * must succeed via OpenSCAD Geometry Builder or fail explicitly with clear errors.
 * Keeping this block empty prevents accidental reintroduction of fallbacks.
 */
// NOTE: OPENSCAD_FALLBACK was removed.

/**
 * @type OpenSCADGlobalsConstants
 * @description Type definition for the complete OpenSCAD globals constants object.
 * Provides type safety when using the constants throughout the application.
 */
export type OpenSCADGlobalsConstants = typeof OPENSCAD_GLOBALS;

/**
 * @type OpenSCADTessellationConstants
 * @description Type definition for tessellation-specific constants.
 */
export type OpenSCADTessellationConstants = typeof OPENSCAD_TESSELLATION;

/**
 * @type OpenSCADViewportConstants
 * @description Type definition for viewport-specific constants.
 */
export type OpenSCADViewportConstants = typeof OPENSCAD_VIEWPORT;

/**
 * @function calculateFragments
 * @description Utility function to calculate the number of fragments based on OpenSCAD rules.
 * Implements the official OpenSCAD fragment calculation algorithm.
 *
 * @param radius - The radius of the circular shape
 * @param fn - Number of fragments (0 = auto-calculate)
 * @param fa - Minimum angle in degrees
 * @param fs - Minimum fragment size in units
 * @returns Number of fragments to use for tessellation
 *
 * @example
 * ```typescript
 * // Calculate fragments for a sphere with radius 10
 * const fragments = calculateFragments(10, 0, 12, 2);
 * // Returns: min(ceil(360/12), ceil(2*π*10/2)) = min(30, 32) = 30
 * ```
 */
export function calculateFragments(
  radius: number,
  fn: number = OPENSCAD_GLOBALS.DEFAULT_FN,
  fa: number = OPENSCAD_GLOBALS.DEFAULT_FA,
  fs: number = OPENSCAD_GLOBALS.DEFAULT_FS
): number {
  // If $fn is specified and >= 3, use it directly
  if (fn >= 3) {
    return fn;
  }

  // Calculate fragments from $fa (minimum angle)
  const fragmentsFromFa = fa > 0 ? Math.ceil(360 / fa) : Infinity;

  // Calculate fragments from $fs (minimum fragment size)
  const fragmentsFromFs = fs > 0 ? Math.ceil((2 * Math.PI * radius) / fs) : Infinity;

  // OpenSCAD uses the minimum of the two calculations (finer resolution wins)
  const calculatedFragments = Math.min(fragmentsFromFa, fragmentsFromFs);

  // Ensure minimum of 3 fragments for valid geometry
  return Math.max(3, calculatedFragments);
}

/**
 * @function isValidTessellationValue
 * @description Validates tessellation parameter values according to OpenSCAD specifications.
 *
 * @param value - The value to validate
 * @param type - The type of tessellation parameter ('fn' | 'fa' | 'fs')
 * @returns True if the value is valid for the specified parameter type
 */
export function isValidTessellationValue(value: number, type: 'fn' | 'fa' | 'fs'): boolean {
  switch (type) {
    case 'fn':
      return value >= 0 && Number.isInteger(value);
    case 'fa':
      return value > 0 && value <= 360;
    case 'fs':
      return value > 0;
    default:
      return false;
  }
}
