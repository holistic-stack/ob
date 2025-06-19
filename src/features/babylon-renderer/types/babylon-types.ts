/**
 * @file Babylon Renderer Types
 * 
 * Comprehensive TypeScript types for the babylon-renderer feature
 * Following bulletproof-react patterns and functional programming principles
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';

// ============================================================================
// Core Configuration Types
// ============================================================================

/**
 * Configuration for Babylon.js engine creation
 */
export interface BabylonEngineConfig {
  readonly antialias?: boolean;
  readonly preserveDrawingBuffer?: boolean;
  readonly stencil?: boolean;
  readonly powerPreference?: 'default' | 'high-performance' | 'low-power';
  readonly forceRealEngine?: boolean; // Force real engine creation even in test environments
}

/**
 * Configuration for Babylon.js scene setup
 */
export interface BabylonSceneConfig {
  readonly enableCamera?: boolean;
  readonly enableLighting?: boolean;
  readonly backgroundColor?: string;
  readonly cameraPosition?: readonly [number, number, number];
}

/**
 * Configuration for material creation
 */
export interface MaterialConfig {
  readonly diffuseColor?: readonly [number, number, number];
  readonly specularColor?: readonly [number, number, number];
  readonly emissiveColor?: readonly [number, number, number];
  readonly backFaceCulling?: boolean;
  readonly wireframe?: boolean;
  readonly disableLighting?: boolean;
}

// ============================================================================
// State Types
// ============================================================================

/**
 * Engine state with error handling
 */
export interface EngineState {
  readonly engine: BABYLON.Engine | null;
  readonly isReady: boolean;
  readonly error: string | null;
}

/**
 * Scene state with render function
 */
export interface SceneState {
  readonly scene: BABYLON.Scene | null;
  readonly isReady: boolean;
  readonly render: () => void;
}

/**
 * Mesh manager state
 */
export interface MeshState {
  readonly currentMesh: BABYLON.Mesh | null;
  readonly isProcessing: boolean;
  readonly error: string | null;
}

// ============================================================================
// Geometry and Material Types
// ============================================================================

/**
 * Material data for mesh creation
 */
export interface MaterialData {
  readonly diffuseColor: readonly [number, number, number];
  readonly specularColor: readonly [number, number, number];
  readonly emissiveColor: readonly [number, number, number];
}

/**
 * Mesh geometry data for creation
 */
export interface MeshGeometryData {
  readonly name: string;
  readonly positions: readonly number[];
  readonly normals?: readonly number[];
  readonly uvs?: readonly number[];
  readonly indices?: readonly number[];
  readonly materialData?: MaterialData;
}

// ============================================================================
// Camera Types
// ============================================================================

/**
 * Camera positioning information
 */
export interface CameraPosition {
  readonly target: readonly [number, number, number];
  readonly radius: number;
  readonly alpha: number;
  readonly beta: number;
}

/**
 * Mesh bounds information for camera positioning
 */
export interface MeshBounds {
  readonly center: readonly [number, number, number];
  readonly size: number;
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

// ============================================================================
// Debug Types
// ============================================================================

/**
 * Scene debug information
 */
export interface SceneDebugInfo {
  readonly meshes: {
    readonly total: number;
    readonly visible: number;
    readonly enabled: number;
    readonly ready: number;
  };
  readonly camera: {
    readonly type: string;
    readonly position: readonly [number, number, number];
    readonly target: readonly [number, number, number];
    readonly radius?: number;
  };
  readonly lights: {
    readonly total: number;
    readonly enabled: number;
  };
  readonly scene: {
    readonly ready: boolean;
    readonly activeMeshes: number;
  };
  readonly issues: readonly string[];
}

/**
 * Mesh debug information
 */
export interface MeshDebugInfo {
  readonly name: string;
  readonly vertices: number;
  readonly indices: number;
  readonly isVisible: boolean;
  readonly isEnabled: boolean;
  readonly isReady: boolean;
  readonly hasGeometry: boolean;
  readonly hasMaterial: boolean;
  readonly position: readonly [number, number, number];
  readonly boundingBox: MeshBounds;
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
 * Engine creation result
 */
export type EngineResult = Result<BABYLON.Engine, string>;

/**
 * Scene creation result
 */
export type SceneResult = Result<BABYLON.Scene, string>;

/**
 * Mesh creation result
 */
export type MeshResult = Result<BABYLON.Mesh, string>;

/**
 * Material creation result
 */
export type MaterialResult = Result<BABYLON.StandardMaterial, string>;

// ============================================================================
// Service Interface Types
// ============================================================================

/**
 * Engine service interface
 */
export interface EngineService {
  readonly createEngine: (canvas: HTMLCanvasElement, config?: BabylonEngineConfig) => EngineResult;
  readonly disposeEngine: (engine: BABYLON.Engine) => void;
  readonly handleResize: (engine: BABYLON.Engine) => void;
}

/**
 * Scene service interface
 */
export interface SceneService {
  readonly createScene: (engine: BABYLON.Engine, config?: BabylonSceneConfig) => SceneResult;
  readonly setupCamera: (scene: BABYLON.Scene, config: BabylonSceneConfig) => Result<BABYLON.ArcRotateCamera, string>;
  readonly setupLighting: (scene: BABYLON.Scene) => Result<void, string>;
  readonly disposeScene: (scene: BABYLON.Scene) => void;
}

/**
 * Mesh service interface
 */
export interface MeshService {
  readonly createMeshFromGeometry: (geometryData: MeshGeometryData, scene: BABYLON.Scene) => MeshResult;
  readonly cloneMesh: (sourceMesh: BABYLON.Mesh, targetScene: BABYLON.Scene) => MeshResult;
  readonly calculateBounds: (mesh: BABYLON.Mesh) => Result<MeshBounds, string>;
  readonly disposeMesh: (mesh: BABYLON.Mesh) => void;
}

/**
 * Material service interface
 */
export interface MaterialService {
  readonly createMaterial: (name: string, scene: BABYLON.Scene, config?: MaterialConfig) => MaterialResult;
  readonly applyMaterialData: (material: BABYLON.StandardMaterial, data: MaterialData) => void;
  readonly toggleWireframe: (material: BABYLON.StandardMaterial) => void;
}

/**
 * Camera service interface
 */
export interface CameraService {
  readonly positionCameraForMesh: (camera: BABYLON.ArcRotateCamera, mesh: BABYLON.Mesh) => Result<CameraPosition, string>;
  readonly resetCamera: (camera: BABYLON.ArcRotateCamera) => void;
  readonly calculateOptimalPosition: (bounds: MeshBounds) => CameraPosition;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Babylon engine hook return type
 */
export interface UseBabylonEngineReturn extends EngineState {
  readonly dispose: () => void;
}

/**
 * Babylon scene hook return type
 */
export interface UseBabylonSceneReturn extends SceneState {
  readonly dispose: () => void;
}

/**
 * Mesh manager hook return type
 */
export interface UseMeshManagerReturn extends MeshState {
  readonly updateMesh: (geometryData: MeshGeometryData) => void;
  readonly clearMesh: () => void;
  readonly toggleWireframe: () => void;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for BabylonCanvas component
 */
export interface BabylonCanvasProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  readonly sceneConfig?: BabylonSceneConfig;
  readonly engineConfig?: BabylonEngineConfig;
  readonly onEngineReady?: (engine: BABYLON.Engine) => void;
  readonly onSceneReady?: (scene: BABYLON.Scene) => void;
  readonly onRenderFrame?: (scene: BABYLON.Scene) => void;
}

/**
 * Props for SceneControls component
 */
export interface SceneControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly scene: BABYLON.Scene | null;
  readonly title?: string;
  readonly wireframeEnabled?: boolean;
  readonly lightingEnabled?: boolean;
  readonly backgroundColor?: string;
  readonly defaultCollapsed?: boolean;
  readonly onWireframeToggle?: () => void;
  readonly onCameraReset?: () => void;
  readonly onLightingToggle?: () => void;
  readonly onBackgroundColorChange?: (color: string) => void;
}

/**
 * Props for MeshDisplay component
 */
export interface MeshDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly scene: BABYLON.Scene | null;
  readonly title?: string;
  readonly searchable?: boolean;
  readonly showStatistics?: boolean;
  readonly showDeleteButton?: boolean;
  readonly showVisibilityButton?: boolean;
  readonly showMeshProperties?: boolean;
  readonly virtualizeList?: boolean;
  readonly maxVisibleItems?: number;
  readonly onMeshSelect?: (mesh: BABYLON.AbstractMesh) => void;
  readonly onMeshDelete?: (mesh: BABYLON.AbstractMesh) => void;
  readonly onMeshToggleVisibility?: (mesh: BABYLON.AbstractMesh) => void;
}

/**
 * Debug report data structure
 */
export interface DebugReport {
  readonly timestamp: string;
  readonly scene: {
    readonly ready: boolean;
    readonly meshCount: number;
    readonly lightCount: number;
    readonly cameraCount: number;
    readonly materialCount: number;
    readonly textureCount: number;
  } | null;
  readonly meshes: readonly {
    readonly name: string;
    readonly id: number;
    readonly visible: boolean;
    readonly enabled: boolean;
    readonly ready: boolean;
    readonly vertices: number;
    readonly indices: number;
    readonly triangles: number;
    readonly position: string;
    readonly hasMaterial: boolean;
  }[];
  readonly camera: {
    readonly name: string;
    readonly type: string;
    readonly position: string;
    readonly alpha?: string;
    readonly beta?: string;
    readonly radius?: string;
    readonly target?: string;
  } | null;
  readonly lighting: readonly {
    readonly name: string;
    readonly type: string;
    readonly enabled: boolean;
    readonly intensity: number;
    readonly position: string;
  }[];
  readonly performance: {
    readonly fps: number;
    readonly frameTime: number;
    readonly drawCalls: number;
    readonly activeMeshes: number;
    readonly memoryUsage: number;
  };
}

/**
 * Props for DebugPanel component
 */
export interface DebugPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly scene: BABYLON.Scene | null;
  readonly title?: string;
  readonly showSceneInfo?: boolean;
  readonly showPerformanceMetrics?: boolean;
  readonly showMeshDetails?: boolean;
  readonly showCameraInfo?: boolean;
  readonly showLightingInfo?: boolean;
  readonly showMemoryUsage?: boolean;
  readonly showRenderStats?: boolean;
  readonly showDebugControls?: boolean;
  readonly collapsibleSections?: boolean;
  readonly defaultCollapsed?: boolean;
  readonly searchable?: boolean;
  readonly updateInterval?: number;
  readonly onRefresh?: () => void;
  readonly onExportReport?: (report: DebugReport) => void;
}

/**
 * Layout options for BabylonRenderer component
 */
export type BabylonRendererLayout = 'flex' | 'grid' | 'sidebar' | 'tabs';

/**
 * Configuration for sub-components in BabylonRenderer
 */
export interface BabylonRendererSubComponentConfigs {
  readonly sceneControls?: Partial<SceneControlsProps>;
  readonly meshDisplay?: Partial<MeshDisplayProps>;
  readonly debugPanel?: Partial<DebugPanelProps>;
}

/**
 * Props for main BabylonRenderer component
 */
export interface BabylonRendererProps extends React.HTMLAttributes<HTMLElement> {
  readonly engineConfig?: EngineConfig;
  readonly sceneConfig?: SceneConfig;
  readonly layout?: BabylonRendererLayout;
  readonly responsive?: boolean;
  readonly showSceneControls?: boolean;
  readonly showMeshDisplay?: boolean;
  readonly showDebugPanel?: boolean;
  readonly sceneControlsConfig?: Partial<SceneControlsProps>;
  readonly meshDisplayConfig?: Partial<MeshDisplayProps>;
  readonly debugPanelConfig?: Partial<DebugPanelProps>;
  readonly onSceneChange?: (scene: BABYLON.Scene) => void;
  readonly onMeshSelect?: (mesh: BABYLON.AbstractMesh) => void;
  readonly onDebugExport?: (report: DebugReport) => void;
  readonly onEngineReady?: (engine: BABYLON.Engine) => void;
  readonly onSceneReady?: (scene: BABYLON.Scene) => void;
  readonly onError?: (error: Error) => void;
}
