/**
 * 3D Renderer Type Definitions
 *
 * Comprehensive type definitions for Three.js + React Three Fiber integration
 * with OpenSCAD AST rendering, CSG operations, and performance monitoring.
 */

import type * as React from 'react';
import type * as THREE from 'three';
import type { CameraConfig, PerformanceMetrics } from '../../../shared/types/common.types.js';
import type { AsyncResult, Result } from '../../../shared/types/result.types.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';

/**
 * 3D Scene configuration
 */
export interface Scene3DConfig {
  readonly enableShadows: boolean;
  readonly enableAntialiasing: boolean;
  readonly enableWebGL2: boolean;
  readonly enableHardwareAcceleration: boolean;
  readonly backgroundColor: string;
  readonly ambientLightIntensity: number;
  readonly directionalLightIntensity: number;
  readonly maxMeshes: number;
  readonly maxTriangles: number;
}

/**
 * Mesh metadata for tracking and optimization
 */
export interface MeshMetadata {
  readonly id: string;
  readonly nodeType: string;
  readonly nodeIndex: number;
  readonly triangleCount: number;
  readonly vertexCount: number;
  readonly boundingBox: THREE.Box3;
  readonly material: string;
  readonly color: string;
  readonly opacity: number;
  readonly visible: boolean;
}

/**
 * 3D Mesh wrapper with metadata
 */
export interface Mesh3D {
  readonly mesh: THREE.Mesh;
  readonly metadata: MeshMetadata;
  readonly dispose: () => void;
}

/**
 * CSG operation types
 */
export type CSGOperation = 'union' | 'difference' | 'intersection';

/**
 * CSG operation configuration
 */
export interface CSGConfig {
  readonly operation: CSGOperation;
  readonly meshes: ReadonlyArray<THREE.Mesh>;
  readonly enableOptimization: boolean;
  readonly maxComplexity: number;
}

/**
 * OpenSCAD primitive types
 */
export type OpenSCADPrimitive =
  | 'cube'
  | 'sphere'
  | 'cylinder'
  | 'polyhedron'
  | 'polygon'
  | 'circle'
  | 'square'
  | 'text';

/**
 * OpenSCAD transformation types
 */
export type OpenSCADTransformation =
  | 'translate'
  | 'rotate'
  | 'scale'
  | 'resize'
  | 'mirror'
  | 'multmatrix'
  | 'color'
  | 'hull'
  | 'minkowski';

/**
 * Primitive rendering parameters
 */
export interface PrimitiveParams {
  readonly type: OpenSCADPrimitive;
  readonly parameters: Record<string, unknown>;
  readonly transformations: ReadonlyArray<{
    readonly type: OpenSCADTransformation;
    readonly parameters: Record<string, unknown>;
  }>;
  readonly material?: MaterialConfig;
}

/**
 * Material configuration
 */
export interface MaterialConfig {
  readonly color: string;
  readonly opacity: number;
  readonly metalness: number;
  readonly roughness: number;
  readonly wireframe: boolean;
  readonly transparent: boolean;
  readonly side: 'front' | 'back' | 'double';
}

/**
 * Rendering performance metrics
 */
export interface RenderingMetrics extends PerformanceMetrics {
  readonly meshCount: number;
  readonly triangleCount: number;
  readonly vertexCount: number;
  readonly drawCalls: number;
  readonly textureMemory: number;
  readonly bufferMemory: number;
}

/**
 * Scene state for store integration
 */
export interface SceneState {
  readonly meshes: ReadonlyArray<Mesh3D>;
  readonly camera: CameraConfig;
  readonly config: Scene3DConfig;
  readonly isRendering: boolean;
  readonly renderErrors: ReadonlyArray<string>;
  readonly lastRendered: Date | null;
  readonly metrics: RenderingMetrics;
}

/**
 * Renderer service interface
 */
export interface RendererService {
  readonly initialize: (config: Scene3DConfig) => AsyncResult<void, string>;
  readonly renderAST: (ast: ReadonlyArray<ASTNode>) => AsyncResult<ReadonlyArray<Mesh3D>, string>;
  readonly renderPrimitive: (params: PrimitiveParams) => Result<Mesh3D, string>;
  readonly performCSG: (config: CSGConfig) => AsyncResult<THREE.Mesh, string>;
  readonly updateCamera: (camera: CameraConfig) => Result<void, string>;
  readonly clearScene: () => Result<void, string>;
  readonly dispose: () => void;
  readonly getMetrics: () => RenderingMetrics;
}

/**
 * AST node renderer interface
 */
export interface ASTNodeRenderer {
  readonly canRender: (node: ASTNode) => boolean;
  readonly render: (node: ASTNode) => Result<Mesh3D, string>;
  readonly renderAsync: (node: ASTNode) => AsyncResult<Mesh3D, string>;
}

/**
 * Primitive renderer factory
 */
export interface PrimitiveRendererFactory {
  readonly createCube: (
    size: number | readonly [number, number, number]
  ) => Result<THREE.BufferGeometry, string>;
  readonly createSphere: (
    radius: number,
    segments?: number
  ) => Result<THREE.BufferGeometry, string>;
  readonly createCylinder: (
    radius: number,
    height: number,
    segments?: number
  ) => Result<THREE.BufferGeometry, string>;
  readonly createPolyhedron: (
    vertices: ReadonlyArray<readonly [number, number, number]>,
    faces: ReadonlyArray<ReadonlyArray<number>>
  ) => Result<THREE.BufferGeometry, string>;
}

/**
 * Material factory
 */
export interface MaterialFactory {
  readonly createStandard: (config: MaterialConfig) => Result<THREE.Material, string>;
  readonly createWireframe: (color: string) => Result<THREE.Material, string>;
  readonly createTransparent: (color: string, opacity: number) => Result<THREE.Material, string>;
}

/**
 * Scene manager interface
 */
export interface SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly addMesh: (mesh: Mesh3D) => Result<void, string>;
  readonly removeMesh: (id: string) => Result<void, string>;
  readonly updateMesh: (id: string, mesh: Mesh3D) => Result<void, string>;
  readonly getMesh: (id: string) => Result<Mesh3D, string>;
  readonly getAllMeshes: () => ReadonlyArray<Mesh3D>;
  readonly clear: () => Result<void, string>;
  readonly render: () => Result<void, string>;
  readonly resize: (width: number, height: number) => Result<void, string>;
  readonly dispose: () => void;
}

/**
 * Camera controller interface
 */
export interface CameraController {
  readonly setPosition: (position: readonly [number, number, number]) => void;
  readonly setTarget: (target: readonly [number, number, number]) => void;
  readonly setZoom: (zoom: number) => void;
  readonly reset: () => void;
  readonly enableControls: () => void;
  readonly disableControls: () => void;
  readonly getState: () => CameraConfig;
  readonly setState: (config: CameraConfig) => void;
}

/**
 * Performance monitor for 3D rendering
 */
export interface RenderingPerformanceMonitor {
  readonly startFrame: () => void;
  readonly endFrame: () => void;
  readonly getMetrics: () => RenderingMetrics;
  readonly reset: () => void;
  readonly isMonitoring: boolean;
}

/**
 * Error types for 3D rendering
 */
export type RenderingError =
  | { readonly type: 'initialization'; readonly message: string }
  | { readonly type: 'geometry'; readonly message: string; readonly nodeType?: string }
  | { readonly type: 'material'; readonly message: string }
  | { readonly type: 'csg'; readonly message: string; readonly operation?: CSGOperation }
  | { readonly type: 'performance'; readonly message: string; readonly metric?: string }
  | { readonly type: 'webgl'; readonly message: string; readonly context?: string };

/**
 * Renderer component props
 */
export interface RendererProps {
  readonly ast: ReadonlyArray<ASTNode>;
  readonly camera: CameraConfig;
  readonly config: Scene3DConfig;
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly onRenderComplete?: (meshes: ReadonlyArray<Mesh3D>) => void;
  readonly onRenderError?: (error: RenderingError) => void;
  readonly onCameraChange?: (camera: CameraConfig) => void;
  readonly onPerformanceUpdate?: (metrics: RenderingMetrics) => void;
}

/**
 * Hook return type for 3D renderer
 */
export interface UseRendererReturn {
  readonly sceneRef: React.RefObject<THREE.Scene | null>;
  readonly cameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  readonly rendererRef: React.RefObject<THREE.WebGLRenderer | null>;
  readonly isInitialized: boolean;
  readonly isRendering: boolean;
  readonly error: string | null;
  readonly metrics: RenderingMetrics;
  readonly meshes: ReadonlyArray<Mesh3D>;
  readonly actions: {
    readonly renderAST: (ast: ReadonlyArray<ASTNode>) => Promise<void>;
    readonly clearScene: () => void;
    readonly updateCamera: (camera: CameraConfig) => void;
    readonly resetCamera: () => void;
    readonly takeScreenshot: () => Promise<string>;
  };
}

/**
 * CSG worker interface for offloading heavy operations
 */
export interface CSGWorker {
  readonly performOperation: (config: CSGConfig) => Promise<THREE.BufferGeometry>;
  readonly isAvailable: boolean;
  readonly terminate: () => void;
}

/**
 * Optimization settings
 */
export interface OptimizationConfig {
  readonly enableFrustumCulling: boolean;
  readonly enableOcclusionCulling: boolean;
  readonly enableLOD: boolean;
  readonly enableInstancing: boolean;
  readonly maxDrawCalls: number;
  readonly targetFrameRate: number;
}
