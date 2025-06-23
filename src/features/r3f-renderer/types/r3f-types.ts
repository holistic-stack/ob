/**
 * @file React Three Fiber type definitions and interfaces
 * 
 * This module provides TypeScript type definitions for React Three Fiber
 * components, following functional programming principles with immutable
 * data structures and strict type safety.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import * as THREE from 'three';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import type { ReactNode } from 'react';

// ============================================================================
// Core Configuration Types
// ============================================================================

/**
 * Configuration for React Three Fiber canvas
 */
export interface R3FCanvasConfig {
  readonly antialias?: boolean;
  readonly alpha?: boolean;
  readonly preserveDrawingBuffer?: boolean;
  readonly powerPreference?: 'default' | 'high-performance' | 'low-power';
  readonly pixelRatio?: number;
  readonly shadows?: boolean | 'soft' | 'basic' | 'percentage' | 'pcf' | 'pcfsoft' | 'variance';
  readonly toneMapping?: THREE.ToneMapping;
  readonly outputColorSpace?: THREE.ColorSpace;
}

/**
 * Configuration for 3D scene setup
 */
export interface R3FSceneConfig {
  readonly enableCamera?: boolean;
  readonly enableLighting?: boolean;
  readonly backgroundColor?: string;
  readonly cameraPosition?: readonly [number, number, number];
  readonly cameraTarget?: readonly [number, number, number];
  readonly ambientLightIntensity?: number;
  readonly directionalLightIntensity?: number;
  readonly directionalLightPosition?: readonly [number, number, number];
  readonly enableGrid?: boolean;
  readonly gridSize?: number;
  readonly enableAxes?: boolean;
  readonly fog?: {
    readonly color: string;
    readonly near: number;
    readonly far: number;
  };
}

/**
 * Camera control configuration
 */
export interface R3FCameraConfig {
  readonly enableZoom?: boolean;
  readonly enablePan?: boolean;
  readonly enableRotate?: boolean;
  readonly autoRotate?: boolean;
  readonly autoRotateSpeed?: number;
  readonly minDistance?: number;
  readonly maxDistance?: number;
  readonly minPolarAngle?: number;
  readonly maxPolarAngle?: number;
  readonly dampingFactor?: number;
  readonly enableDamping?: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for R3FCanvas component (equivalent to BabylonCanvasProps)
 */
export interface R3FCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly className?: string;
  readonly canvasConfig?: R3FCanvasConfig;
  readonly sceneConfig?: R3FSceneConfig;
  readonly cameraConfig?: R3FCameraConfig;
  readonly onRendererReady?: (renderer: THREE.WebGLRenderer) => void;
  readonly onSceneReady?: (scene: THREE.Scene) => void;
  readonly onRenderFrame?: (scene: THREE.Scene) => void;
  readonly onCreated?: (state: any) => void;
  readonly onPointerMissed?: () => void;
  readonly children?: ReactNode;
  readonly 'aria-label'?: string;
}

/**
 * Props for R3FScene component
 */
export interface R3FSceneProps {
  readonly config?: R3FSceneConfig;
  readonly children?: ReactNode;
}

/**
 * Layout type for R3F renderer
 */
export type R3FRendererLayout = 'flex' | 'grid';

/**
 * Props for R3FRenderer component (main container)
 */
export interface R3FRendererProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onError'> {
  readonly canvasConfig?: R3FCanvasConfig;
  readonly sceneConfig?: R3FSceneConfig;
  readonly cameraConfig?: R3FCameraConfig;
  readonly layout?: R3FRendererLayout;
  readonly responsive?: boolean;
  readonly showSceneControls?: boolean;
  readonly showMeshDisplay?: boolean;
  readonly showDebugPanel?: boolean;
  readonly sceneControlsConfig?: Partial<R3FSceneControlsProps>;
  readonly meshDisplayConfig?: Partial<R3FMeshDisplayProps>;
  readonly debugPanelConfig?: Partial<R3FDebugPanelConfig>;
  readonly onSceneChange?: (scene: THREE.Scene) => void;
  readonly onSceneReady?: (scene: THREE.Scene) => void;
  readonly onMeshSelect?: (mesh: THREE.Mesh) => void;
  readonly onMeshDelete?: (mesh: THREE.Mesh) => void;
  readonly onDebugExport?: (report: R3FDebugReport) => void;
  readonly onError?: (error: string) => void;
  readonly astData?: ASTNode;
  readonly onASTProcessingStart?: () => void;
  readonly onASTProcessingComplete?: (meshes: THREE.Mesh[]) => void;
  readonly onASTProcessingError?: (error: string) => void;
  readonly className?: string;
  readonly 'aria-label'?: string;
}

/**
 * Props for R3F Scene Controls component
 */
export interface R3FSceneControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly scene?: THREE.Scene | null;
  readonly title?: string;
  readonly wireframeEnabled?: boolean;
  readonly lightingEnabled?: boolean;
  readonly backgroundColor?: string;
  readonly defaultCollapsed?: boolean;
  readonly onWireframeToggle?: () => void;
  readonly onLightingToggle?: () => void;
  readonly onBackgroundColorChange?: (color: string) => void;
  readonly 'aria-label'?: string;
}

/**
 * Props for R3F Mesh Display component
 */
export interface R3FMeshDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly scene?: THREE.Scene | null;
  readonly title?: string;
  readonly searchable?: boolean;
  readonly showStatistics?: boolean;
  readonly showDeleteButton?: boolean;
  readonly showVisibilityButton?: boolean;
  readonly showMeshProperties?: boolean;
  readonly virtualizeList?: boolean;
  readonly maxVisibleItems?: number;
  readonly onMeshSelect?: (mesh: THREE.Mesh) => void;
  readonly onMeshDelete?: (mesh: THREE.Mesh) => void;
  readonly onMeshToggleVisibility?: (mesh: THREE.Mesh) => void;
  readonly 'aria-label'?: string;
}

// ============================================================================
// Mesh and Geometry Types
// ============================================================================

/**
 * Mesh geometry data for R3F
 */
export interface R3FMeshGeometryData {
  readonly name: string;
  readonly positions?: readonly number[];
  readonly normals?: readonly number[];
  readonly indices?: readonly number[];
  readonly uvs?: readonly number[];
  readonly materialData?: R3FMaterialData;
}

/**
 * Material configuration for R3F
 */
export interface R3FMaterialData {
  readonly color?: string;
  readonly opacity?: number;
  readonly transparent?: boolean;
  readonly wireframe?: boolean;
  readonly metalness?: number;
  readonly roughness?: number;
  readonly emissive?: string;
  readonly emissiveIntensity?: number;
}

/**
 * Material configuration
 */
export interface R3FMaterialConfig {
  readonly color?: string;
  readonly opacity?: number;
  readonly transparent?: boolean;
  readonly wireframe?: boolean;
  readonly metalness?: number;
  readonly roughness?: number;
  readonly side?: THREE.Side;
}

// ============================================================================
// CSG Operation Types
// ============================================================================

/**
 * R3F CSG operation types
 */
export type R3FCSGOperationType = 
  | 'union'
  | 'subtract' 
  | 'intersect';

/**
 * CSG operation configuration
 */
export interface R3FCSGOperation {
  readonly type: R3FCSGOperationType;
  readonly meshA: THREE.Mesh;
  readonly meshB: THREE.Mesh;
  readonly name?: string;
}

// ============================================================================
// Primitive and Geometry Types
// ============================================================================

/**
 * R3F primitive types
 */
export type R3FPrimitiveType =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'plane'
  | 'torus'
  | 'dodecahedron'
  | 'icosahedron'
  | 'octahedron'
  | 'tetrahedron';

/**
 * Configuration for R3F primitive creation
 */
export interface R3FPrimitiveConfig {
  readonly type: R3FPrimitiveType;
  readonly name: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly position?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: readonly [number, number, number];
  readonly material?: R3FMaterialConfig;
}

// ============================================================================
// Core Configuration Types
// ============================================================================

/**
 * Configuration for React Three Fiber renderer creation
 */
export interface R3FEngineConfig {
  readonly antialias?: boolean;
  readonly alpha?: boolean;
  readonly preserveDrawingBuffer?: boolean;
  readonly powerPreference?: 'default' | 'high-performance' | 'low-power';
  readonly stencil?: boolean;
  readonly depth?: boolean;
  readonly logarithmicDepthBuffer?: boolean;
  readonly shadowMapEnabled?: boolean;
  readonly shadowMapType?: THREE.ShadowMapType;
  readonly toneMapping?: THREE.ToneMapping;
  readonly toneMappingExposure?: number;
  readonly outputColorSpace?: THREE.ColorSpace;
  readonly forceRealRenderer?: boolean; // Force real renderer creation even in test environments
}

/**
 * Configuration for 3D scene setup
 */
export interface R3FSceneConfig {
  readonly enableCamera?: boolean;
  readonly enableLighting?: boolean;
  readonly backgroundColor?: string;
  readonly cameraPosition?: readonly [number, number, number];
  readonly cameraTarget?: readonly [number, number, number];
  readonly ambientLightIntensity?: number;
  readonly directionalLightIntensity?: number;
  readonly directionalLightPosition?: readonly [number, number, number];
  readonly enableGrid?: boolean;
  readonly gridSize?: number;
  readonly enableAxes?: boolean;
  readonly fog?: {
    readonly color: string;
    readonly near: number;
    readonly far: number;
  };
}

/**
 * Configuration for camera setup
 */
export interface R3FCameraConfig {
  readonly type?: 'perspective' | 'orthographic';
  readonly fov?: number;
  readonly aspect?: number;
  readonly near?: number;
  readonly far?: number;
  readonly position?: readonly [number, number, number];
  readonly target?: readonly [number, number, number];
  readonly enableControls?: boolean;
  readonly enableZoom?: boolean;
  readonly enableRotate?: boolean;
  readonly enablePan?: boolean;
  readonly autoRotate?: boolean;
  readonly autoRotateSpeed?: number;
  readonly minDistance?: number;
  readonly maxDistance?: number;
  readonly minPolarAngle?: number;
  readonly maxPolarAngle?: number;
  readonly dampingFactor?: number;
  readonly enableDamping?: boolean;
  readonly controlsConfig?: {
    readonly enableDamping?: boolean;
    readonly dampingFactor?: number;
    readonly enableZoom?: boolean;
    readonly enableRotate?: boolean;
    readonly enablePan?: boolean;
    readonly autoRotate?: boolean;
    readonly autoRotateSpeed?: number;
  };
}

/**
 * Configuration for R3F Canvas component
 */
export interface R3FCanvasConfig {
  readonly antialias?: boolean;
  readonly alpha?: boolean;
  readonly preserveDrawingBuffer?: boolean;
  readonly powerPreference?: 'default' | 'high-performance' | 'low-power';
  readonly toneMapping?: THREE.ToneMapping;
  readonly outputColorSpace?: THREE.ColorSpace;
  readonly pixelRatio?: number;
}

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
 * Renderer creation result
 */
export type R3FRendererResult = Result<THREE.WebGLRenderer, string>;

/**
 * Scene creation result
 */
export type R3FSceneResult = Result<THREE.Scene, string>;

/**
 * Mesh creation result
 */
export type R3FMeshResult = Result<THREE.Mesh, string>;

/**
 * Material creation result
 */
export type R3FMaterialResult = Result<THREE.Material, string>;

/**
 * CSG operation result
 */
export type R3FCSGResult = Result<THREE.Mesh, string>;

// ============================================================================
// Service Interface Types
// ============================================================================

/**
 * R3F Engine service interface
 */
export interface R3FEngineService {
  readonly createRenderer: (canvas: HTMLCanvasElement | null, config?: R3FEngineConfig) => R3FRendererResult;
  readonly disposeRenderer: (renderer: THREE.WebGLRenderer | null) => void;
  readonly handleResize: (renderer: THREE.WebGLRenderer | null) => void;
  readonly setupErrorHandlers: (renderer: THREE.WebGLRenderer, onContextLost?: () => void, onContextRestored?: () => void) => void;
  readonly getRendererInfo: (renderer: THREE.WebGLRenderer) => RendererInfo;
}

/**
 * R3F Scene service interface
 */
export interface R3FSceneService {
  readonly createScene: (config?: R3FSceneConfig) => R3FSceneResult;
  readonly disposeScene: (scene: THREE.Scene | null) => void;
  readonly setupLighting: (scene: THREE.Scene, config: R3FSceneConfig) => void;
  readonly setupCamera: (scene: THREE.Scene, config: R3FCameraConfig) => Result<THREE.Camera, string>;
}

/**
 * Hook return types
 */
export interface UseR3FEngineReturn {
  readonly renderer: THREE.WebGLRenderer | null;
  readonly isReady: boolean;
  readonly error: string | null;
  readonly dispose: () => void;
}

export interface UseR3FSceneReturn {
  readonly scene: THREE.Scene | null;
  readonly isReady: boolean;
  readonly render: () => void;
  readonly dispose: () => void;
}

/**
 * Renderer information for debugging
 */
export interface RendererInfo {
  readonly vendor: string;
  readonly renderer: string;
  readonly version: string;
  readonly maxTextureSize: number;
  readonly maxCubeTextureSize: number;
  readonly maxVertexTextures: number;
  readonly maxFragmentTextures: number;
  readonly maxVaryingVectors: number;
  readonly maxVertexAttribs: number;
  readonly extensions: readonly string[];
}

/**
 * Return type for useR3FMesh hook
 */
export interface UseR3FMeshReturn {
  readonly meshes: readonly THREE.Mesh[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly addMesh: (mesh: THREE.Mesh) => void;
  readonly removeMesh: (mesh: THREE.Mesh) => void;
  readonly clearMeshes: () => void;
}

/**
 * Return type for useR3FRenderer hook
 */
export interface UseR3FRendererReturn {
  readonly renderer: THREE.WebGLRenderer | null;
  readonly scene: THREE.Scene | null;
  readonly isReady: boolean;
  readonly error: string | null;
  readonly dispose: () => void;
}

// ============================================================================
// Service Interfaces
// ============================================================================

/**
 * Mesh service interface for R3F
 */
export interface R3FMeshService {
  readonly createMeshFromGeometry: (geometryData: R3FMeshGeometryData) => R3FMeshResult;
  readonly cloneMesh: (sourceMesh: THREE.Mesh) => R3FMeshResult;
  readonly disposeMesh: (mesh: THREE.Mesh) => void;
}

/**
 * Material service interface for R3F
 */
export interface R3FMaterialService {
  readonly createMaterial: (name: string, config?: R3FMaterialConfig) => R3FMaterialResult;
  readonly applyMaterialData: (material: THREE.Material, data: R3FMaterialData) => void;
  readonly toggleWireframe: (material: THREE.Material) => void;
}

/**
 * CSG service interface for R3F
 */
export interface R3FCSGService {
  readonly performOperation: (operation: R3FCSGOperation) => R3FCSGResult;
  readonly union: (meshA: THREE.Mesh, meshB: THREE.Mesh, name?: string) => R3FCSGResult;
  readonly subtract: (meshA: THREE.Mesh, meshB: THREE.Mesh, name?: string) => R3FCSGResult;
  readonly intersect: (meshA: THREE.Mesh, meshB: THREE.Mesh, name?: string) => R3FCSGResult;
}

// ============================================================================
// Debug and Development Types
// ============================================================================

/**
 * Debug information for R3F renderer
 */
export interface R3FDebugReport {
  readonly sceneInfo: {
    readonly meshCount: number;
    readonly triangleCount: number;
    readonly materialCount: number;
  };
  readonly performanceInfo: {
    readonly fps: number;
    readonly renderTime: number;
    readonly memoryUsage: number;
  };
  readonly cameraInfo: {
    readonly position: readonly [number, number, number];
    readonly target: readonly [number, number, number];
    readonly zoom: number;
  };
}

/**
 * Configuration for debug panel
 */
export interface R3FDebugPanelConfig {
  readonly showPerformance?: boolean;
  readonly showSceneInfo?: boolean;
  readonly showCameraInfo?: boolean;
  readonly enableWireframe?: boolean;
  readonly enableStats?: boolean;
}
