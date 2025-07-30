/**
 * @file index.ts
 * @description Polygon Validator Service exports for OpenSCAD Geometry Builder.
 * Provides advanced polygon validation including self-intersection detection,
 * winding order validation, and complex polygon analysis.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

export type {
  HoleValidation,
  PolygonData,
  PolygonValidationResult,
  PolygonValidatorResult,
  WindingOrder,
} from './polygon-validator';
export { PolygonValidator } from './polygon-validator';
