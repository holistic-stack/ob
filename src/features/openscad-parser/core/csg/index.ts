/**
 * @file CSG Module Index
 *
 * Central export point for AST-to-CSG conversion functionality.
 * Provides comprehensive AST-to-CSG conversion with Three.js integration.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

// Core CSG converter
export {
  ASTToCSGConverter,
  type CSGConversionConfig,
  type CSGConversionResult,
  type CSGError,
  type CSGStatistics,
  type CSGWarning,
  DEFAULT_CSG_CONFIG,
} from './ast-to-csg-converter.js';

// Transformation matrix system
export {
  type TransformationError,
  TransformationMatrix,
  type TransformationParams,
} from './transformation-matrix.js';

// End of exports
