/**
 * @file CSG Processor Feature Index
 * 
 * Clean exports for the CSG processor feature including types, core processor,
 * and utility functions.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

// Core processor exports
export { 
  processASTToCSGTree,
  traverseCSGTree,
  findCSGNodeById,
  validateCSGTree
} from './core/csg-tree-processor';

// Type exports
export type {
  CSGTree,
  CSGTreeNode,
  CSGProcessingResult,
  CSGProcessorConfig,
  CSGError,
  CSGNode,
  CSGPrimitiveNode,
  CSGCube,
  CSGSphere,
  CSGCylinder,
  CSGCone,
  CSGPolyhedron,
  CSGOperation,
  CSGUnion,
  CSGDifference,
  CSGIntersection,
  CSGTransform,
  CSGGroup,
  CSGMaterial,
  Transform3D,
  Vector3,
  Vector2,
  Color,
  Result,
  CSGTreeVisitor,
  CSGTreeTransformer,
  CSGTreeFilter
} from './types/csg-tree-types';

// Type guard exports
export {
  isCSGPrimitive,
  isCSGOperation,
  isCSGCube,
  isCSGSphere,
  isCSGCylinder,
  isCSGUnion,
  isCSGDifference,
  isCSGIntersection,
  isCSGTransform,
  isCSGGroup
} from './types/csg-tree-types';
