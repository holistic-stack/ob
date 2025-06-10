/**
 * @file OpenSCAD type definitions for AST nodes and operations
 * 
 * This module provides comprehensive TypeScript type definitions for OpenSCAD
 * Abstract Syntax Tree (AST) nodes, following functional programming principles
 * with immutable data structures and strict type safety.
 * 
 * @example
 * ```typescript
 * import { OpenSCADPrimitive, OpenSCADTransform } from './openscad-types.js';
 * 
 * const cube: OpenSCADPrimitive = {
 *   type: 'cube',
 *   parameters: { size: [10, 10, 10] },
 *   location: { start: { line: 1, column: 0 }, end: { line: 1, column: 15 } }
 * };
 * ```
 */

// Re-export types from @holistic-stack/openscad-parser for consistency
export type {
  ASTNode,
  ModuleDefinitionNode,
  FunctionDefinitionNode,
  ExpressionNode,
  StatementNode,
  Position,
  SourceLocation,
  CubeNode,
  SphereNode,
  CylinderNode,
  PolyhedronNode,
  PolygonNode,
  CircleNode,
  SquareNode,
  TextNode
} from '@holistic-stack/openscad-parser';

// Import SourceLocation for use in interfaces
import type { SourceLocation, CubeNode, SphereNode, CylinderNode } from '@holistic-stack/openscad-parser';

/**
 * OpenSCAD primitive shape types supported by the converter
 */
export type OpenSCADPrimitiveNode =
  | CubeNode
  | SphereNode
  | CylinderNode;

/**
 * OpenSCAD transformation types
 */
export type OpenSCADTransformType =
  | 'translate'
  | 'rotate'
  | 'scale'
  | 'mirror'
  | 'resize'
  | 'color'
  | 'hull'
  | 'minkowski';

/**
 * OpenSCAD CSG operation types
 */
export type OpenSCADCSGType =
  | 'union'
  | 'difference'
  | 'intersection';

/**
 * Base interface for all OpenSCAD operations
 */
export interface OpenSCADOperation {
  readonly type: string;
  readonly location: SourceLocation;
}

/**
 * OpenSCAD transformation operation
 */
export interface OpenSCADTransform extends OpenSCADOperation {
  readonly type: OpenSCADTransformType;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly children: readonly OpenSCADOperation[];
}

/**
 * OpenSCAD CSG boolean operation
 */
export interface OpenSCADCSG extends OpenSCADOperation {
  readonly type: OpenSCADCSGType;
  readonly children: readonly OpenSCADOperation[];
}

/**
 * OpenSCAD module call operation
 */
export interface OpenSCADModuleCall extends OpenSCADOperation {
  readonly type: 'module_call';
  readonly name: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly children: readonly OpenSCADOperation[];
}

/**
 * Union type for all OpenSCAD operations
 */
export type OpenSCADOperationNode =
  | OpenSCADPrimitiveNode
  | OpenSCADTransform
  | OpenSCADCSG
  | OpenSCADModuleCall;

/**
 * Type guard to check if a node is an OpenSCAD primitive
 */
export function isOpenSCADPrimitive(node: unknown): node is OpenSCADPrimitiveNode {
  return typeof node === 'object' &&
         node !== null &&
         'type' in node &&
         ['cube', 'sphere', 'cylinder'].includes((node as any).type);
}

/**
 * Type guard to check if a node is an OpenSCAD transform
 */
export function isOpenSCADTransform(node: unknown): node is OpenSCADTransform {
  return typeof node === 'object' && 
         node !== null && 
         'type' in node &&
         ['translate', 'rotate', 'scale', 'mirror', 'resize', 'color', 'hull', 'minkowski'].includes((node as any).type);
}

/**
 * Type guard to check if a node is an OpenSCAD CSG operation
 */
export function isOpenSCADCSG(node: unknown): node is OpenSCADCSG {
  return typeof node === 'object' && 
         node !== null && 
         'type' in node &&
         ['union', 'difference', 'intersection'].includes((node as any).type);
}

/**
 * Type guard to check if a node is an OpenSCAD module call
 */
export function isOpenSCADModuleCall(node: unknown): node is OpenSCADModuleCall {
  return typeof node === 'object' && 
         node !== null && 
         'type' in node &&
         (node as any).type === 'module_call';
}

/**
 * Result type for conversion operations following functional programming patterns
 */
export type ConversionResult<T, E = string> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Helper function to create successful conversion result
 */
export function createSuccess<T>(data: T): ConversionResult<T> {
  return Object.freeze({ success: true, data });
}

/**
 * Helper function to create failed conversion result
 */
export function createFailure<T>(error: string): ConversionResult<T> {
  return Object.freeze({ success: false, error });
}
