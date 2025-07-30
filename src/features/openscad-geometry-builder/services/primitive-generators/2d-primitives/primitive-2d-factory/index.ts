/**
 * @file index.ts
 * @description 2D Primitive Factory Service exports for OpenSCAD Geometry Builder.
 * Provides unified API for all 2D primitive generation with type safety and performance optimization.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

export type {
  Primitive2DGenerationRequest,
  Primitive2DGeometryData,
  Primitive2DParameters,
  Primitive2DResult,
  Primitive2DType,
} from './primitive-2d-factory';
export { Primitive2DFactory } from './primitive-2d-factory';
