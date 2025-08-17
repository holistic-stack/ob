/**
 * @file AST Bridge Converter Service Exports
 *
 * Exports for the AST Bridge Converter service that implements the Bridge Pattern
 * to convert OpenSCAD AST nodes to BabylonJS-Extended AST nodes.
 */

// Re-export types from babylon-ast.types
export type {
  BabylonJSError,
  BabylonJSNode,
  BridgeConversionResult,
  NodeGenerationResult,
  NodeValidationResult,
} from '../../types/babylon-ast.types';
export type { BridgeConversionConfig } from './ast-bridge-converter';
// Main bridge converter service
export { ASTBridgeConverter, DEFAULT_BRIDGE_CONFIG } from './ast-bridge-converter';
export { ControlFlowBabylonNode } from './control-flow-babylon-node';
export { CSGBabylonNode } from './csg-babylon-node';
export { ExtrusionBabylonNode } from './extrusion-babylon-node';
export { ModifierBabylonNode } from './modifier-babylon-node';
// Node implementations

export { PrimitiveBabylonNode } from './primitive-babylon-node';
export { TransformationBabylonNode } from './transformation-babylon-node';
