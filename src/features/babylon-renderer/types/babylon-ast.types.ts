/**
 * @file BabylonJS-Extended AST Types
 *
 * Type definitions for BabylonJS-extended AST nodes that extend BABYLON.AbstractMesh.
 * This implements the Bridge Pattern to convert OpenSCAD AST to BabylonJS-compatible AST.
 * 
 * Following the architecture outlined in tasks/refactory-architecture.md:
 * - All AST nodes extend BABYLON.AbstractMesh
 * - Complete OpenSCAD syntax support
 * - Result<T,E> error handling patterns
 * - Immutable data structures
 */

import type { AbstractMesh, Matrix, Scene, Vector3 } from '@babylonjs/core';
import type { Result } from '../../../shared/types/result.types';
import type { SourceLocation } from '../../openscad-parser/ast/ast-types';

/**
 * BabylonJS-Extended AST Node Types
 */
export enum BabylonJSNodeType {
  // 3D Primitives
  Cube = 'babylon_cube',
  Sphere = 'babylon_sphere',
  Cylinder = 'babylon_cylinder',
  Polyhedron = 'babylon_polyhedron',
  
  // 2D Primitives
  Circle = 'babylon_circle',
  Square = 'babylon_square',
  Polygon = 'babylon_polygon',
  Text = 'babylon_text',
  
  // Transformations
  Translate = 'babylon_translate',
  Rotate = 'babylon_rotate',
  Scale = 'babylon_scale',
  Mirror = 'babylon_mirror',
  Color = 'babylon_color',
  
  // CSG Operations
  Union = 'babylon_union',
  Difference = 'babylon_difference',
  Intersection = 'babylon_intersection',
  
  // Extrusions
  LinearExtrude = 'babylon_linear_extrude',
  RotateExtrude = 'babylon_rotate_extrude',
  
  // Control Flow
  For = 'babylon_for',
  If = 'babylon_if',
  Let = 'babylon_let',
  
  // Modifiers
  Disable = 'babylon_disable',
  ShowOnly = 'babylon_show_only',
  Debug = 'babylon_debug',
  Background = 'babylon_background',
}

/**
 * BabylonJS Error for AST operations
 */
export interface BabylonJSError {
  readonly code: string;
  readonly message: string;
  readonly nodeType?: BabylonJSNodeType;
  readonly sourceLocation?: SourceLocation;
  readonly timestamp: Date;
}

/**
 * Base class for all BabylonJS-Extended AST nodes
 *
 * Uses composition with BABYLON.AbstractMesh to provide the abstract mesh layer
 * as specified in the architecture document. This avoids the complexity of
 * extending AbstractMesh directly while still providing mesh generation capabilities.
 */
export abstract class BabylonJSNode {
  public readonly name: string;
  public readonly scene: Scene | null;
  public readonly nodeType: BabylonJSNodeType;
  public readonly sourceLocation: SourceLocation | undefined;
  public readonly originalOpenscadNode: unknown; // Reference to original OpenSCAD AST node

  constructor(
    name: string,
    scene: Scene | null,
    nodeType: BabylonJSNodeType,
    originalOpenscadNode: unknown,
    sourceLocation?: SourceLocation
  ) {
    this.name = name;
    this.scene = scene;
    this.nodeType = nodeType;
    this.originalOpenscadNode = originalOpenscadNode;
    this.sourceLocation = sourceLocation;
  }

  /**
   * Abstract mesh layer interface - generates BabylonJS mesh
   */
  abstract generateMesh(): Promise<Result<AbstractMesh, BabylonJSError>>;

  /**
   * Validate the node structure and parameters
   */
  abstract validateNode(): Result<void, BabylonJSError>;

  /**
   * Clone the node with all its properties
   */
  abstract clone(): BabylonJSNode;

  /**
   * Get debug information about the node
   */
  getDebugInfo(): Record<string, unknown> {
    return {
      nodeType: this.nodeType,
      name: this.name,
      sourceLocation: this.sourceLocation,
      hasOriginalNode: !!this.originalOpenscadNode,
    };
  }
}

/**
 * 3D Primitive Parameters for BabylonJS
 */
export interface BabylonJSCubeParameters {
  readonly size: Vector3;
  readonly center: boolean;
}

export interface BabylonJSSphereParameters {
  readonly radius: number;
  readonly segments: number;
}

export interface BabylonJSCylinderParameters {
  readonly height: number;
  readonly radius: number;
  readonly segments: number;
  readonly center: boolean;
}

export interface BabylonJSPolyhedronParameters {
  readonly points: Vector3[];
  readonly faces: number[][];
  readonly convexity: number;
}

/**
 * 2D Primitive Parameters for BabylonJS
 */
export interface BabylonJSCircleParameters {
  readonly radius: number;
  readonly segments: number;
}

export interface BabylonJSSquareParameters {
  readonly size: Vector3; // Converted to 3D with minimal thickness
  readonly center: boolean;
}

export interface BabylonJSPolygonParameters {
  readonly points: Vector3[]; // Converted to 3D
  readonly paths?: number[][];
  readonly convexity: number;
}

export interface BabylonJSTextParameters {
  readonly text: string;
  readonly size: number;
  readonly font: string;
  readonly depth: number; // For 3D text extrusion
}

/**
 * Transformation Parameters for BabylonJS
 */
export interface BabylonJSTranslateParameters {
  readonly translation: Vector3;
}

export interface BabylonJSRotateParameters {
  readonly rotation: Vector3;
  readonly axis?: Vector3;
}

export interface BabylonJSScaleParameters {
  readonly scale: Vector3;
}

export interface BabylonJSMirrorParameters {
  readonly normal: Vector3;
}

export interface BabylonJSColorParameters {
  readonly color: Vector3;
  readonly alpha: number;
}

/**
 * Extrusion Parameters for BabylonJS
 */
export interface BabylonJSLinearExtrudeParameters {
  readonly height: number;
  readonly center: boolean;
  readonly twist: number;
  readonly scale: Vector3;
}

export interface BabylonJSRotateExtrudeParameters {
  readonly angle: number;
  readonly segments: number;
}

/**
 * Control Flow Parameters for BabylonJS
 */
export interface BabylonJSForParameters {
  readonly variable: string;
  readonly range: [number, number, number?]; // [start, end, step?]
  readonly iterations: number;
}

export interface BabylonJSIfParameters {
  readonly condition: boolean;
}

export interface BabylonJSLetParameters {
  readonly assignments: Record<string, unknown>;
}

/**
 * CSG Operation Types for BabylonJS
 */
export enum BabylonJSCSGType {
  Union = 'union',
  Difference = 'difference',
  Intersection = 'intersection',
}

export enum BabylonJSTransformType {
  Translate = 'translate',
  Rotate = 'rotate',
  Scale = 'scale',
  Mirror = 'mirror',
  Color = 'color',
}

export enum BabylonJSPrimitiveType {
  Cube = 'cube',
  Sphere = 'sphere',
  Cylinder = 'cylinder',
  Polyhedron = 'polyhedron',
  Circle = 'circle',
  Square = 'square',
  Polygon = 'polygon',
  Text = 'text',
}

/**
 * Union type for all BabylonJS parameter types
 */
export type BabylonJSParameters = 
  | BabylonJSCubeParameters
  | BabylonJSSphereParameters
  | BabylonJSCylinderParameters
  | BabylonJSPolyhedronParameters
  | BabylonJSCircleParameters
  | BabylonJSSquareParameters
  | BabylonJSPolygonParameters
  | BabylonJSTextParameters
  | BabylonJSTranslateParameters
  | BabylonJSRotateParameters
  | BabylonJSScaleParameters
  | BabylonJSMirrorParameters
  | BabylonJSColorParameters
  | BabylonJSLinearExtrudeParameters
  | BabylonJSRotateExtrudeParameters
  | BabylonJSForParameters
  | BabylonJSIfParameters
  | BabylonJSLetParameters;

/**
 * Bridge conversion result types
 */
export type BridgeConversionResult = Result<BabylonJSNode[], BabylonJSError>;
export type NodeGenerationResult = Result<AbstractMesh, BabylonJSError>;
export type NodeValidationResult = Result<void, BabylonJSError>;
