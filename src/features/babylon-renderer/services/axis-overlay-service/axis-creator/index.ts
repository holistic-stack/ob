/**
 * @file axis-creator/index.ts
 * @description Exports for the axis creation module
 */

export type { AxisConfig, AxisCreationError, AxisCreationResult } from './axis-creator';
export { createCoordinateAxes, createInfiniteAxis } from './axis-creator';

// Screen-space axis creator exports
export type {
  ScreenSpaceAxisConfig,
  ScreenSpaceAxisResult,
  ScreenSpaceAxisError,
} from './screen-space-axis-creator';
export {
  createScreenSpaceAxis,
  createScreenSpaceCoordinateAxes,
} from './screen-space-axis-creator';
