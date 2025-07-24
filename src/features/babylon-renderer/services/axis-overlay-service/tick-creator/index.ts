/**
 * @file tick-creator/index.ts
 * @description Exports for the tick and label creation module
 */

export type {
  LabelConfig,
  LabelCreationResult,
  TickConfig,
  TickCreationError,
  TickCreationResult,
} from './tick-creator';
export { createAxisLabel, createAxisTicks, getTickPosition } from './tick-creator';
