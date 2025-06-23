/**
 * @file CSG Tree Types
 * 
 * Type definitions for Constructive Solid Geometry (CSG) tree structures.
 * These types represent the intermediate format between OpenSCAD AST and
 * React Three Fiber components.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';

// ============================================================================
// Core CSG Types
// ============================================================================

/**
 * Result type for functional programming patterns
 */
export type Result<T, E = string> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * 3D Vector type
 */
export type Vector3 = readonly [number, number, number];

/**
 * 2D Vector type
 */
export type Vector2 = readonly [number, number];

/**
 * Color representation
 */
export interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a?: number | undefined;
}

/**
 * Material properties for CSG objects
 */
export interface CSGMaterial {
  readonly color?: Color | undefined;
  readonly opacity?: number | undefined;
  readonly metalness?: number | undefined;
  readonly roughness?: number | undefined;
  readonly emissive?: Color | undefined;
  readonly wireframe?: boolean | undefined;
  readonly castShadow?: boolean | undefined;
  readonly receiveShadow?: boolean | undefined;
}

/**
 * Transform matrix for 3D transformations
 */
export interface Transform3D {
  readonly translation?: Vector3 | undefined;
  readonly rotation?: Vector3 | undefined;
  readonly scale?: Vector3 | undefined;
  readonly matrix?: readonly number[] | undefined; // 4x4 matrix in column-major order
}

// ============================================================================
// CSG Node Types
// ============================================================================

/**
 * Base interface for all CSG nodes
 */
export interface CSGNode {
  readonly id: string;
  readonly type: string;
  readonly transform?: Transform3D | undefined;
  readonly material?: CSGMaterial | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
  readonly sourceLocation?: { readonly line: number; readonly column: number } | undefined;
}

/**
 * Cube primitive
 */
export interface CSGCube extends CSGNode {
  readonly type: 'cube';
  readonly size: Vector3;
  readonly center?: boolean | undefined;
}

/**
 * Sphere primitive
 */
export interface CSGSphere extends CSGNode {
  readonly type: 'sphere';
  readonly radius: number;
  readonly segments?: number | undefined;
}

/**
 * Cylinder primitive
 */
export interface CSGCylinder extends CSGNode {
  readonly type: 'cylinder';
  readonly height: number;
  readonly radius1: number;
  readonly radius2?: number | undefined; // For cone-like cylinders
  readonly segments?: number | undefined;
  readonly center?: boolean | undefined;
}

/**
 * Cone primitive (special case of cylinder)
 */
export interface CSGCone extends CSGNode {
  readonly type: 'cone';
  readonly height: number;
  readonly radius1: number;
  readonly radius2: number;
  readonly segments?: number | undefined;
  readonly center?: boolean | undefined;
}

/**
 * Polyhedron primitive
 */
export interface CSGPolyhedron extends CSGNode {
  readonly type: 'polyhedron';
  readonly points: readonly Vector3[];
  readonly faces: readonly (readonly number[])[];
}

export type CSGPrimitiveNode =
  | CSGCube
  | CSGSphere
  | CSGCylinder
  | CSGCone
  | CSGPolyhedron;

/**
 * CSG operations
 */
export interface CSGOperation extends CSGNode {
  readonly type: 'union' | 'difference' | 'intersection';
  readonly children: readonly CSGTreeNode[];
}

/**
 * Union operation
 */
export interface CSGUnion extends CSGOperation {
  readonly type: 'union';
}

/**
 * Difference operation
 */
export interface CSGDifference extends CSGOperation {
  readonly type: 'difference';
}

/**
 * Intersection operation
 */
export interface CSGIntersection extends CSGOperation {
  readonly type: 'intersection';
}

/**
 * Transform node (wrapper for applying transformations)
 */
export interface CSGTransform extends CSGNode {
  readonly type: 'transform';
  readonly child: CSGTreeNode;
}

/**
 * Group node (for organizing nodes without CSG operations)
 */
export interface CSGGroup extends CSGNode {
  readonly type: 'group';
  readonly children: readonly CSGTreeNode[];
}

/**
 * Union type for all CSG nodes
 */
export type CSGTreeNode =
  | CSGPrimitiveNode
  | CSGUnion
  | CSGDifference
  | CSGIntersection
  | CSGTransform
  | CSGGroup;

// ============================================================================
// CSG Tree Structure
// ============================================================================

/**
 * Complete CSG tree representation
 */
export interface CSGTree {
  readonly root: readonly CSGTreeNode[];
  readonly metadata: {
    readonly nodeCount: number;
    readonly primitiveCount: number;
    readonly operationCount: number;
    readonly maxDepth: number;
    readonly boundingBox?: { readonly min: Vector3; readonly max: Vector3 } | undefined;
  };
  readonly processingTime: number;
  readonly sourceAST?: readonly ASTNode[] | undefined;
}

/**
 * CSG processing error
 */
export interface CSGError {
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly sourceLocation?: { readonly line: number; readonly column: number } | undefined;
  readonly nodeId?: string | undefined;
}

/**
 * CSG processing result
 */
export interface CSGProcessingResult {
  readonly success: boolean;
  readonly tree?: CSGTree | undefined;
  readonly errors: readonly CSGError[];
  readonly warnings: readonly CSGError[];
  readonly processingTime: number;
}

/**
 * CSG processor configuration
 */
export interface CSGProcessorConfig {
  readonly enableLogging?: boolean | undefined;
  readonly enableOptimization?: boolean | undefined;
  readonly enableValidation?: boolean | undefined;
  readonly maxDepth?: number | undefined;
  readonly maxNodes?: number | undefined;
  readonly defaultMaterial?: CSGMaterial | undefined;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for CSG primitives
 */
export function isCSGPrimitive(node: CSGTreeNode): node is CSGPrimitiveNode {
  return ['cube', 'sphere', 'cylinder', 'cone', 'polyhedron'].includes(node.type);
}

/**
 * Type guard for CSG operations
 */
export function isCSGOperation(node: CSGTreeNode): node is CSGOperation {
  return ['union', 'difference', 'intersection'].includes(node.type);
}

/**
 * Type guard for CSG cube
 */
export function isCSGCube(node: CSGTreeNode): node is CSGCube {
  return node.type === 'cube';
}

/**
 * Type guard for CSG sphere
 */
export function isCSGSphere(node: CSGTreeNode): node is CSGSphere {
  return node.type === 'sphere';
}

/**
 * Type guard for CSG cylinder
 */
export function isCSGCylinder(node: CSGTreeNode): node is CSGCylinder {
  return node.type === 'cylinder';
}

/**
 * Type guard for CSG union
 */
export function isCSGUnion(node: CSGTreeNode): node is CSGUnion {
  return node.type === 'union';
}

/**
 * Type guard for CSG difference
 */
export function isCSGDifference(node: CSGTreeNode): node is CSGDifference {
  return node.type === 'difference';
}

/**
 * Type guard for CSG intersection
 */
export function isCSGIntersection(node: CSGTreeNode): node is CSGIntersection {
  return node.type === 'intersection';
}

/**
 * Type guard for CSG transform
 */
export function isCSGTransform(node: CSGTreeNode): node is CSGTransform {
  return node.type === 'transform';
}

/**
 * Type guard for CSG group
 */
export function isCSGGroup(node: CSGTreeNode): node is CSGGroup {
  return node.type === 'group';
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * CSG tree visitor function type
 */
export type CSGTreeVisitor<T = void> = (
  node: CSGTreeNode,
  depth: number,
  path: readonly number[],
) => T;

/**
 * CSG tree transformer function type
 */
export type CSGTreeTransformer = (node: CSGTreeNode) => CSGTreeNode;

/**
 * CSG tree filter function type
 */
export type CSGTreeFilter = (node: CSGTreeNode) => boolean;
