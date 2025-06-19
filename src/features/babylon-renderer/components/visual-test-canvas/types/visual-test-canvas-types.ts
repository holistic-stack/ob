/**
 * @file Visual Test Canvas Types
 * 
 * TypeScript interfaces for the refactored visual test canvas component
 * Following SRP principles with clear separation of concerns
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';
import type { BabylonCanvasProps } from '../../../types/babylon-types';

// ============================================================================
// Mesh Data Types
// ============================================================================

/**
 * Material configuration for mesh rendering
 */
export interface MeshMaterialConfig {
  readonly diffuseColor: readonly [number, number, number];
  readonly specularColor: readonly [number, number, number];
  readonly alpha?: number;
  readonly transparencyMode?: number;
  readonly name?: string;
}

/**
 * Individual mesh data for rendering
 */
export interface MeshData {
  readonly mesh: BABYLON.Mesh;
  readonly materialConfig?: MeshMaterialConfig;
  readonly isReference?: boolean;
  readonly name?: string;
}

/**
 * Collection of meshes to render
 */
export interface MeshCollection {
  readonly mainMeshes: readonly MeshData[];
  readonly referenceMeshes: readonly MeshData[];
}

// ============================================================================
// Scene Configuration Types
// ============================================================================

/**
 * Camera configuration for visual testing
 */
export interface VisualTestCameraConfig {
  readonly type?: 'arcRotate' | 'free';
  readonly position?: readonly [number, number, number];
  readonly target?: readonly [number, number, number];
  readonly radius?: number;
  readonly alpha?: number;
  readonly beta?: number;
  readonly autoPosition?: boolean;
  readonly autoPositionPadding?: number;
}

/**
 * Lighting configuration for visual testing
 */
export interface VisualTestLightingConfig {
  readonly enableDefaultLighting?: boolean;
  readonly ambientIntensity?: number;
  readonly directionalIntensity?: number;
  readonly directionalDirection?: readonly [number, number, number];
}

/**
 * Visual test scene configuration
 */
export interface VisualTestSceneConfig {
  readonly backgroundColor?: string;
  readonly camera?: VisualTestCameraConfig;
  readonly lighting?: VisualTestLightingConfig;
  readonly enableFog?: boolean;
  readonly fogColor?: string;
  readonly fogDensity?: number;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for the refactored VisualTestCanvas component
 * Following SRP - only handles rendering, not mesh creation
 */
export interface VisualTestCanvasProps extends Omit<BabylonCanvasProps, 'className'> {
  /** Collection of meshes to render */
  meshes?: MeshCollection;
  
  /** Scene configuration for visual testing */
  visualSceneConfig?: VisualTestSceneConfig;
  
  /** Test scenario name for logging and identification */
  testName?: string;
  
  /** Whether to enable debug logging */
  enableDebugLogging?: boolean;
  
  /** Custom canvas dimensions for testing */
  width?: number;
  height?: number;
  
  /** Callback when rendering is completely finished and ready for screenshots */
  onRenderingComplete?: () => void;
  
  /** Callback when meshes are successfully added to scene */
  onMeshesReady?: (meshes: MeshCollection) => void;
  
  /** Callback for camera positioning completion */
  onCameraReady?: (camera: BABYLON.Camera) => void;
}

// ============================================================================
// Mesh Provider Types
// ============================================================================

/**
 * Configuration for OpenSCAD to mesh conversion
 */
export interface OpenSCADMeshConfig {
  readonly enableLogging?: boolean;
  readonly rebuildNormals?: boolean;
  readonly centerMesh?: boolean;
  readonly materialConfig?: MeshMaterialConfig;
}

/**
 * Configuration for reference mesh creation
 */
export interface ReferenceMeshConfig extends OpenSCADMeshConfig {
  readonly ghostOffset?: readonly [number, number, number];
  readonly separationDistance?: number;
  readonly autoPosition?: boolean;
}

/**
 * Props for OpenSCAD mesh provider hook
 */
export interface UseOpenSCADMeshesProps {
  readonly scene: BABYLON.Scene | null;
  readonly openscadCode?: string;
  readonly referenceOpenscadCode?: string;
  readonly mainMeshConfig?: OpenSCADMeshConfig;
  readonly referenceMeshConfig?: ReferenceMeshConfig;
  readonly enableDebugLogging?: boolean;
}

/**
 * Return type for OpenSCAD mesh provider hook
 */
export interface UseOpenSCADMeshesReturn {
  readonly meshes: MeshCollection | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly regenerate: () => void;
}

// ============================================================================
// Material Manager Types
// ============================================================================

/**
 * Predefined material themes for visual testing
 */
export type MaterialTheme = 'default' | 'high-contrast' | 'colorful' | 'monochrome';

/**
 * Material manager configuration
 */
export interface MaterialManagerConfig {
  readonly theme?: MaterialTheme;
  readonly mainMeshMaterial?: MeshMaterialConfig;
  readonly referenceMeshMaterial?: MeshMaterialConfig;
  readonly customMaterials?: Record<string, MeshMaterialConfig>;
}

// ============================================================================
// Camera Manager Types
// ============================================================================

/**
 * Camera bounds calculation result
 */
export interface CameraBounds {
  readonly center: readonly [number, number, number];
  readonly size: readonly [number, number, number];
  readonly maxDimension: number;
  readonly recommendedDistance: number;
}

/**
 * Camera positioning result
 */
export interface CameraPositioning {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly radius?: number;
  readonly bounds: CameraBounds;
}

/**
 * Camera manager configuration
 */
export interface CameraManagerConfig {
  readonly autoPosition?: boolean;
  readonly paddingFactor?: number;
  readonly minDistance?: number;
  readonly maxDistance?: number;
  readonly preferredAngle?: readonly [number, number]; // [alpha, beta] for arc rotate
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Result type for async operations
 */
export type AsyncResult<T, E = string> = Promise<
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E }
>;

/**
 * Logging configuration
 */
export interface LoggingConfig {
  readonly enabled: boolean;
  readonly prefix?: string;
  readonly logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Visual test canvas state
 */
export interface VisualTestCanvasState {
  readonly isInitialized: boolean;
  readonly isRenderingComplete: boolean;
  readonly meshesLoaded: boolean;
  readonly cameraPositioned: boolean;
  readonly error: string | null;
}
