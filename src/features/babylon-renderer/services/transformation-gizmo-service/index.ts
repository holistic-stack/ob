/**
 * @file index.ts
 * @description Barrel export for transformation gizmo service module
 */

export {
  DEFAULT_TRANSFORMATION_GIZMO_CONFIG,
  TransformationGizmoService,
} from './transformation-gizmo.service';
export type {
  GizmoMode,
  TransformationEvent,
  TransformationGizmoConfig,
  TransformationGizmoError,
} from './transformation-gizmo.service';
