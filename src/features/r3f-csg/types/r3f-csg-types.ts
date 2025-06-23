/**
 * @file R3F CSG Types
 * 
 * Type definitions for React Three Fiber CSG operations and OpenSCAD AST processing.
 * Provides comprehensive type safety for the R3F-CSG integration pipeline.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import * as THREE from 'three';
import type { ASTNode } from '@holistic-stack/openscad-parser';

// ============================================================================
// Result Types (Functional Programming)
// ============================================================================

/**
 * Generic Result type for error handling
 */
export type Result<T, E = string> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * AST processing result
 */
export type ASTProcessingResult = Result<THREE.Mesh[], string>;

/**
 * Geometry creation result
 */
export type GeometryResult = Result<THREE.BufferGeometry, string>;

/**
 * Mesh creation result
 */
export type MeshResult = Result<THREE.Mesh, string>;

/**
 * CSG operation result
 */
export type CSGOperationResult = Result<THREE.BufferGeometry, string>;

// ============================================================================
// AST Visitor Configuration
// ============================================================================

/**
 * Configuration for the R3F AST visitor
 */
export interface R3FASTVisitorConfig {
  readonly enableCSG?: boolean;
  readonly enableCaching?: boolean;
  readonly enableOptimization?: boolean;
  readonly maxRecursionDepth?: number;
  readonly defaultMaterial?: R3FMaterialConfig;
  readonly geometryPrecision?: number;
  readonly enableLogging?: boolean;
}

/**
 * Material configuration for generated meshes
 */
export interface R3FMaterialConfig {
  readonly type?: 'standard' | 'basic' | 'physical' | 'lambert' | 'phong';
  readonly color?: THREE.ColorRepresentation;
  readonly metalness?: number;
  readonly roughness?: number;
  readonly transparent?: boolean;
  readonly opacity?: number;
  readonly wireframe?: boolean;
  readonly side?: THREE.Side;
}

/**
 * Geometry creation parameters
 */
export interface GeometryParams {
  readonly segments?: number;
  readonly detail?: number;
  readonly precision?: number;
  readonly optimize?: boolean;
}

// ============================================================================
// CSG Operation Types
// ============================================================================

/**
 * Supported CSG operation types
 */
export type CSGOperationType = 'union' | 'difference' | 'intersection';

/**
 * CSG operation configuration
 */
export interface CSGOperation {
  readonly type: CSGOperationType;
  readonly geometries: readonly THREE.BufferGeometry[];
  readonly name?: string;
}

/**
 * CSG operation context for tracking operations
 */
export interface CSGOperationContext {
  readonly operation: CSGOperation;
  readonly depth: number;
  readonly parentNode?: ASTNode;
  readonly timestamp: number;
}

// ============================================================================
// Primitive Creation Types
// ============================================================================

/**
 * Cube/Box creation parameters
 */
export interface CubeParams extends GeometryParams {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly center?: boolean;
}

/**
 * Sphere creation parameters
 */
export interface SphereParams extends GeometryParams {
  readonly radius: number;
  readonly widthSegments?: number;
  readonly heightSegments?: number;
  readonly phiStart?: number;
  readonly phiLength?: number;
  readonly thetaStart?: number;
  readonly thetaLength?: number;
}

/**
 * Cylinder creation parameters
 */
export interface CylinderParams extends GeometryParams {
  readonly radiusTop: number;
  readonly radiusBottom: number;
  readonly height: number;
  readonly radialSegments?: number;
  readonly heightSegments?: number;
  readonly openEnded?: boolean;
  readonly thetaStart?: number;
  readonly thetaLength?: number;
  readonly center?: boolean;
}

/**
 * Circle creation parameters (for 2D shapes)
 */
export interface CircleParams extends GeometryParams {
  readonly radius: number;
  readonly segments?: number;
  readonly thetaStart?: number;
  readonly thetaLength?: number;
}

/**
 * Square/Rectangle creation parameters (for 2D shapes)
 */
export interface SquareParams extends GeometryParams {
  readonly width: number;
  readonly height: number;
  readonly center?: boolean;
}

// ============================================================================
// Transform Types
// ============================================================================

/**
 * 3D transformation parameters
 */
export interface Transform3D {
  readonly position?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: readonly [number, number, number];
}

/**
 * Translation parameters
 */
export interface TranslationParams {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Rotation parameters (in radians)
 */
export interface RotationParams {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Scale parameters
 */
export interface ScaleParams {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

// ============================================================================
// Visitor Interface Types
// ============================================================================

/**
 * AST visitor interface for R3F
 */
export interface R3FASTVisitor {
  readonly visit: (node: ASTNode) => MeshResult;
  readonly visitCube: (node: any) => MeshResult;
  readonly visitSphere: (node: any) => MeshResult;
  readonly visitCylinder: (node: any) => MeshResult;
  readonly visitUnion: (node: any) => MeshResult;
  readonly visitDifference: (node: any) => MeshResult;
  readonly visitIntersection: (node: any) => MeshResult;
  readonly visitTranslate: (node: any) => MeshResult;
  readonly visitRotate: (node: any) => MeshResult;
  readonly visitScale: (node: any) => MeshResult;
  readonly dispose: () => void;
}

/**
 * Visitor context for tracking state during traversal
 */
export interface VisitorContext {
  readonly depth: number;
  readonly parentNode?: ASTNode;
  readonly transforms: readonly Transform3D[];
  readonly materials: readonly R3FMaterialConfig[];
  readonly scope: Record<string, unknown>;
}

// ============================================================================
// Performance and Caching Types
// ============================================================================

/**
 * Geometry cache entry
 */
export interface GeometryCacheEntry {
  readonly geometry: THREE.BufferGeometry;
  readonly hash: string;
  readonly timestamp: number;
  readonly accessCount: number;
}

/**
 * Performance metrics for AST processing
 */
export interface ProcessingMetrics {
  readonly totalNodes: number;
  readonly processedNodes: number;
  readonly failedNodes: number;
  readonly processingTime: number;
  readonly memoryUsage: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
}

/**
 * Resource usage tracking
 */
export interface ResourceUsage {
  readonly geometryCount: number;
  readonly meshCount: number;
  readonly materialCount: number;
  readonly memoryEstimate: number;
  readonly renderTime: number;
}

// ============================================================================
// Error and Validation Types
// ============================================================================

/**
 * AST processing error details
 */
export interface ASTProcessingError {
  readonly nodeType: string;
  readonly nodeLocation?: {
    readonly line: number;
    readonly column: number;
  };
  readonly message: string;
  readonly stack?: string;
  readonly context?: VisitorContext;
}

/**
 * Validation result for AST nodes
 */
export interface NodeValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];
}

// ============================================================================
// Factory and Service Types
// ============================================================================

/**
 * Geometry factory interface
 */
export interface GeometryFactory {
  readonly createCube: (params: CubeParams) => GeometryResult;
  readonly createSphere: (params: SphereParams) => GeometryResult;
  readonly createCylinder: (params: CylinderParams) => GeometryResult;
  readonly createCircle: (params: CircleParams) => GeometryResult;
  readonly createSquare: (params: SquareParams) => GeometryResult;
}

/**
 * CSG service interface
 */
export interface CSGService {
  readonly union: (geometries: readonly THREE.BufferGeometry[]) => CSGOperationResult;
  readonly difference: (geometries: readonly THREE.BufferGeometry[]) => CSGOperationResult;
  readonly intersection: (geometries: readonly THREE.BufferGeometry[]) => CSGOperationResult;
  readonly isSupported: () => boolean;
}

/**
 * Material factory interface
 */
export interface MaterialFactory {
  readonly createMaterial: (config: R3FMaterialConfig) => THREE.Material;
  readonly getDefaultMaterial: () => THREE.Material;
  readonly disposeMaterial: (material: THREE.Material) => void;
}

// ============================================================================
// Export all types for convenience
// ============================================================================

// Re-export Three.js types for convenience
export type BufferGeometry = THREE.BufferGeometry;
export type Mesh = THREE.Mesh;
export type Material = THREE.Material;
export type Scene = THREE.Scene;
export type Vector3 = THREE.Vector3;
export type Euler = THREE.Euler;
export type Matrix4 = THREE.Matrix4;
