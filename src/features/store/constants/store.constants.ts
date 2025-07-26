/**
 * @file store.constants.ts
 * @description Store-related constants and default values to prevent circular dependencies
 * between slices and the main app store.
 */

import type { CameraConfig } from '../../../shared/types/common.types';

/**
 * Default camera configuration for BabylonJS 3D rendering.
 *
 * @architectural_decision
 * **Positioned for Optimal Viewing**: The default camera position [10, 10, 10] provides:
 * - Clear perspective view of objects at origin
 * - Good depth perception for 3D shapes
 * - Comfortable viewing angle for most OpenSCAD models
 * - Sufficient distance to avoid clipping issues
 *
 * **Conservative Settings**: Default values prioritize compatibility:
 * - Standard FOV (75°) works well across different screen sizes
 * - Wide near/far plane range (0.1-1000) accommodates various model scales
 * - Auto-rotate disabled by default to prevent disorienting movements
 * - Auto-frame disabled to maintain predictable camera behavior
 *
 * @example Camera Configuration Usage
 * ```typescript
 * import { DEFAULT_CAMERA } from '@/features/store/constants';
 *
 * // Use in component
 * const cameraConfig = {
 *   ...DEFAULT_CAMERA,
 *   enableAutoRotate: true, // Override specific settings
 *   autoRotateSpeed: 2
 * };
 * ```
 *
 * @example Custom Camera Presets
 * ```typescript
 * import { DEFAULT_CAMERA } from '@/features/store/constants';
 *
 * // Close-up view for detailed inspection
 * const DETAIL_CAMERA = {
 *   ...DEFAULT_CAMERA,
 *   position: [5, 5, 5],
 *   fov: 60
 * };
 *
 * // Wide view for large assemblies
 * const OVERVIEW_CAMERA = {
 *   ...DEFAULT_CAMERA,
 *   position: [20, 20, 20],
 *   fov: 90
 * };
 * ```
 */
export const DEFAULT_CAMERA: CameraConfig = {
  position: [10, 10, 10],
  target: [0, 0, 0],
  zoom: 1,
  fov: 75,
  near: 0.1,
  far: 1000,
  enableControls: true,
  enableAutoRotate: false,
  autoRotateSpeed: 1,
  enableAutoFrame: false, // Disabled by default to prevent disorienting camera movements
};

/**
 * Default OpenSCAD code for application initialization.
 *
 * @architectural_decision
 * **Simple Primitive**: Using `sphere(5)` as the default provides:
 * - Quick parsing validation (simple AST structure)
 * - Fast rendering performance (basic geometry)
 * - Immediate visual feedback (recognizable 3D shape)
 * - Non-intimidating starting point for new users
 *
 * @example Alternative Default Codes for Different Contexts
 * ```typescript
 * // For educational contexts
 * const EDUCATIONAL_DEFAULT = `
 * // Welcome to OpenSCAD!
 * // Try modifying these shapes:
 * union() {
 *   cube(10);
 *   translate([15, 0, 0]) sphere(5);
 * }
 * `;
 *
 * // For mechanical design contexts
 * const MECHANICAL_DEFAULT = `
 * // Basic bracket design
 * difference() {
 *   cube([20, 10, 5]);
 *   translate([10, 5, -1]) cylinder(h=7, r=3);
 * }
 * `;
 *
 * // For testing and development
 * const TESTING_DEFAULT = 'cube(1);'; // Minimal for fast tests
 * ```
 */
export const DEFAULT_OPENSCAD_CODE = 'sphere(5);';
