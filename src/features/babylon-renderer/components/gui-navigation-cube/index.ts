/**
 * @file Professional CAD Navigation Cube Exports
 *
 * Centralized exports for professional CAD-style 2D GUI navigation cube system
 */

export {
  createCADNavigationCube,
  createEnhancedCADNavigationCube,
  createEnhancedGUINavigationCube, // Legacy compatibility
  CAD_NAVIGATION_CUBE_DEFAULT_CONFIG,
  CAD_FACE_DEFINITIONS
} from './gui-navigation-cube';

export type {
  CADNavigationCubeConfig,
  CADFaceButton,
  CADDirectionalControl,
  CADMiniCubeMenuItem,
  CADNavigationCubeData,
  CADNavigationCubeResult
} from './gui-navigation-cube';
