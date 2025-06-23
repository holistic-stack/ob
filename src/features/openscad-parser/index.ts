/**
 * @file OpenSCAD Parser Feature Index
 * 
 * Clean exports for the OpenSCAD parser feature including hooks and utilities.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

// Hook exports
export { 
  useOpenSCADParser,
  useOpenSCADParserSimple,
  useOpenSCADParserDebounced
} from './hooks/use-openscad-parser';

// Type exports
export type {
  UseOpenSCADParserConfig,
  UseOpenSCADParserResult
} from './hooks/use-openscad-parser';

// Re-export AST types from the parser package for convenience
export type {
  ASTNode,
  StatementNode,
  ExpressionNode,
  CubeNode,
  SphereNode,
  CylinderNode,
  TranslateNode,
  RotateNode,
  ScaleNode,
  UnionNode,
  DifferenceNode,
  IntersectionNode
} from '@holistic-stack/openscad-parser';
