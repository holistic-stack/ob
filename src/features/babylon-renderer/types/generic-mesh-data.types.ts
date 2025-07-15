/**
 * @file Generic Mesh Data Types
 *
 * Complete GenericMeshData interface for all OpenSCAD constructs with
 * material configuration types and metadata preservation for debugging
 * and editor integration. This implements Task 1.3 from the architecture.
 */

import type { BoundingBox, Matrix, Vector3 } from '@babylonjs/core';
import type { SourceLocation } from '../../openscad-parser/ast/ast-types';

/**
 * Generic geometry data structure (renderer-agnostic)
 */
export interface GenericGeometry {
  readonly positions: Float32Array;
  readonly indices: Uint32Array;
  readonly normals?: Float32Array;
  readonly uvs?: Float32Array;
  readonly colors?: Float32Array;
  readonly tangents?: Float32Array;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly boundingBox: BoundingBox;
}

/**
 * Enhanced material configuration for all OpenSCAD constructs
 */
export interface GenericMaterialConfig {
  // Basic color properties
  readonly diffuseColor: readonly [number, number, number]; // RGB
  readonly alpha: number; // Transparency (0-1)
  readonly emissiveColor?: readonly [number, number, number]; // RGB
  readonly specularColor?: readonly [number, number, number]; // RGB

  // PBR properties
  readonly metallicFactor: number; // 0-1
  readonly roughnessFactor: number; // 0-1
  readonly normalScale: number; // Normal map intensity
  readonly occlusionStrength: number; // AO intensity

  // Rendering properties
  readonly transparent: boolean;
  readonly wireframe: boolean;
  readonly backFaceCulling: boolean;
  readonly side: 'front' | 'back' | 'double';

  // OpenSCAD-specific properties
  readonly isDebugMaterial: boolean; // For # modifier
  readonly isBackgroundMaterial: boolean; // For % modifier
  readonly isShowOnlyMaterial: boolean; // For ! modifier
  readonly isDisabled: boolean; // For * modifier

  // Texture references (optional)
  readonly textures?: {
    readonly diffuse?: string;
    readonly normal?: string;
    readonly metallic?: string;
    readonly roughness?: string;
    readonly emissive?: string;
    readonly occlusion?: string;
  };
}

/**
 * Enhanced metadata for debugging and editor integration
 */
export interface GenericMeshMetadata {
  // Basic mesh information
  readonly meshId: string;
  readonly name: string;
  readonly nodeType: string; // OpenSCAD node type (cube, sphere, etc.)

  // Geometry metrics
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly boundingBox: BoundingBox;
  readonly surfaceArea: number;
  readonly volume: number;

  // Performance metrics
  readonly generationTime: number; // Time to generate mesh (ms)
  readonly optimizationTime: number; // Time spent optimizing (ms)
  readonly memoryUsage: number; // Memory used (bytes)
  readonly complexity: number; // Complexity score

  // Source tracking for editor integration
  readonly sourceLocation?: SourceLocation;
  readonly originalOpenscadCode?: string;
  readonly astNodeId?: string;

  // Debugging information
  readonly isOptimized: boolean;
  readonly hasErrors: boolean;
  readonly warnings: readonly string[];
  readonly debugInfo: Record<string, unknown>;

  // Timestamps
  readonly createdAt: Date;
  readonly lastModified: Date;
  readonly lastAccessed: Date;

  // Hierarchy information
  readonly parentId?: string;
  readonly childIds: readonly string[];
  readonly depth: number; // Nesting depth in AST

  // OpenSCAD-specific metadata
  readonly openscadParameters: Record<string, unknown>;
  readonly modifiers: readonly string[]; // Applied modifiers (*, !, #, %)
  readonly transformations: readonly string[]; // Applied transformations
  readonly csgOperations: readonly string[]; // Applied CSG operations
}

/**
 * Complete GenericMeshData interface for all OpenSCAD constructs
 */
export interface GenericMeshData {
  readonly id: string;
  readonly geometry: GenericGeometry;
  readonly material: GenericMaterialConfig;
  readonly transform: Matrix;
  readonly metadata: GenericMeshMetadata;
}

/**
 * Collection of related meshes (for complex operations)
 */
export interface GenericMeshCollection {
  readonly id: string;
  readonly meshes: readonly GenericMeshData[];
  readonly metadata: {
    readonly collectionType:
      | 'csg_result'
      | 'transformation_group'
      | 'extrusion_result'
      | 'control_flow_result';
    readonly totalVertices: number;
    readonly totalTriangles: number;
    readonly boundingBox: BoundingBox;
    readonly generationTime: number;
    readonly sourceLocation?: SourceLocation;
  };
}

/**
 * Material preset configurations for common OpenSCAD use cases
 */
export const MATERIAL_PRESETS = {
  DEFAULT: {
    diffuseColor: [0.8, 0.8, 0.8] as const,
    alpha: 1.0,
    metallicFactor: 0.1,
    roughnessFactor: 0.8,
    normalScale: 1.0,
    occlusionStrength: 1.0,
    transparent: false,
    wireframe: false,
    backFaceCulling: true,
    side: 'front' as const,
    isDebugMaterial: false,
    isBackgroundMaterial: false,
    isShowOnlyMaterial: false,
    isDisabled: false,
  },

  DEBUG: {
    diffuseColor: [1.0, 0.0, 0.0] as const, // Bright red
    alpha: 1.0,
    emissiveColor: [0.2, 0.0, 0.0] as const,
    metallicFactor: 0.0,
    roughnessFactor: 0.5,
    normalScale: 1.0,
    occlusionStrength: 1.0,
    transparent: false,
    wireframe: false,
    backFaceCulling: true,
    side: 'front' as const,
    isDebugMaterial: true,
    isBackgroundMaterial: false,
    isShowOnlyMaterial: false,
    isDisabled: false,
  },

  BACKGROUND: {
    diffuseColor: [0.7, 0.7, 0.7] as const, // Light gray
    alpha: 0.3, // Transparent
    metallicFactor: 0.0,
    roughnessFactor: 1.0,
    normalScale: 1.0,
    occlusionStrength: 1.0,
    transparent: true,
    wireframe: false,
    backFaceCulling: true,
    side: 'front' as const,
    isDebugMaterial: false,
    isBackgroundMaterial: true,
    isShowOnlyMaterial: false,
    isDisabled: false,
  },

  SHOW_ONLY: {
    diffuseColor: [1.0, 1.0, 0.0] as const, // Bright yellow
    alpha: 1.0,
    emissiveColor: [0.3, 0.3, 0.0] as const,
    metallicFactor: 0.0,
    roughnessFactor: 0.3,
    normalScale: 1.0,
    occlusionStrength: 1.0,
    transparent: false,
    wireframe: false,
    backFaceCulling: true,
    side: 'front' as const,
    isDebugMaterial: false,
    isBackgroundMaterial: false,
    isShowOnlyMaterial: true,
    isDisabled: false,
  },

  DISABLED: {
    diffuseColor: [0.5, 0.5, 0.5] as const, // Gray
    alpha: 0.0, // Invisible
    metallicFactor: 0.0,
    roughnessFactor: 1.0,
    normalScale: 1.0,
    occlusionStrength: 1.0,
    transparent: true,
    wireframe: false,
    backFaceCulling: true,
    side: 'front' as const,
    isDebugMaterial: false,
    isBackgroundMaterial: false,
    isShowOnlyMaterial: false,
    isDisabled: true,
  },
} as const;

/**
 * Utility type for creating material configurations
 */
export type MaterialConfigBuilder = Partial<GenericMaterialConfig> & {
  readonly diffuseColor: readonly [number, number, number];
};

/**
 * Utility type for creating mesh metadata
 */
export type MeshMetadataBuilder = Partial<GenericMeshMetadata> & {
  readonly meshId: string;
  readonly name: string;
  readonly nodeType: string;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly boundingBox: BoundingBox;
};

/**
 * Type guard for GenericMeshData
 */
export const isGenericMeshData = (obj: unknown): obj is GenericMeshData => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'geometry' in obj &&
    'material' in obj &&
    'transform' in obj &&
    'metadata' in obj
  );
};

/**
 * Type guard for GenericMeshCollection
 */
export const isGenericMeshCollection = (obj: unknown): obj is GenericMeshCollection => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'meshes' in obj &&
    'metadata' in obj &&
    Array.isArray((obj as any).meshes)
  );
};

/**
 * Default values for creating mesh metadata
 */
export const DEFAULT_MESH_METADATA: Omit<
  GenericMeshMetadata,
  'meshId' | 'name' | 'nodeType' | 'vertexCount' | 'triangleCount' | 'boundingBox'
> = {
  surfaceArea: 0,
  volume: 0,
  generationTime: 0,
  optimizationTime: 0,
  memoryUsage: 0,
  complexity: 0,
  isOptimized: false,
  hasErrors: false,
  warnings: [],
  debugInfo: {},
  createdAt: new Date(),
  lastModified: new Date(),
  lastAccessed: new Date(),
  childIds: [],
  depth: 0,
  openscadParameters: {},
  modifiers: [],
  transformations: [],
  csgOperations: [],
} as const;
