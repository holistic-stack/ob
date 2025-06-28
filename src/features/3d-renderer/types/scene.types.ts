/**
 * Three.js Scene Type Definitions
 *
 * Specific type definitions for Three.js scene management,
 * React Three Fiber integration, and WebGL optimization.
 */

import type * as THREE from "three";

/**
 * Basic Three.js object types for React Three Fiber compatibility
 */
export interface ThreeJSXElements {
  mesh: any;
  boxGeometry: any;
  sphereGeometry: any;
  cylinderGeometry: any;
  meshStandardMaterial: any;
  meshBasicMaterial: any;
  group: any;
  ambientLight: any;
  directionalLight: any;
  pointLight: any;
  perspectiveCamera: any;
  orthographicCamera: any;
}

/**
 * Scene lighting configuration
 */
export interface LightingConfig {
  readonly ambient: {
    readonly enabled: boolean;
    readonly color: string;
    readonly intensity: number;
  };
  readonly directional: {
    readonly enabled: boolean;
    readonly color: string;
    readonly intensity: number;
    readonly position: readonly [number, number, number];
    readonly castShadow: boolean;
  };
  readonly point: {
    readonly enabled: boolean;
    readonly color: string;
    readonly intensity: number;
    readonly position: readonly [number, number, number];
    readonly distance: number;
    readonly decay: number;
  };
}

/**
 * Scene environment configuration
 */
export interface EnvironmentConfig {
  readonly background: string | THREE.Texture | null;
  readonly environment: THREE.Texture | null;
  readonly fog: {
    readonly enabled: boolean;
    readonly color: string;
    readonly near: number;
    readonly far: number;
  };
  readonly grid: {
    readonly enabled: boolean;
    readonly size: number;
    readonly divisions: number;
    readonly color: string;
  };
  readonly axes: {
    readonly enabled: boolean;
    readonly size: number;
  };
}

/**
 * WebGL renderer configuration
 */
export interface WebGLConfig {
  readonly antialias: boolean;
  readonly alpha: boolean;
  readonly premultipliedAlpha: boolean;
  readonly preserveDrawingBuffer: boolean;
  readonly powerPreference: "default" | "high-performance" | "low-power";
  readonly failIfMajorPerformanceCaveat: boolean;
  readonly depth: boolean;
  readonly stencil: boolean;
  readonly logarithmicDepthBuffer: boolean;
  readonly precision: "highp" | "mediump" | "lowp";
}

/**
 * Shadow configuration
 */
export interface ShadowConfig {
  readonly enabled: boolean;
  readonly type: THREE.ShadowMapType;
  readonly mapSize: number;
  readonly camera: {
    readonly near: number;
    readonly far: number;
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
  };
  readonly bias: number;
  readonly normalBias: number;
  readonly radius: number;
}

/**
 * Post-processing configuration
 */
export interface PostProcessingConfig {
  readonly enabled: boolean;
  readonly effects: {
    readonly bloom: {
      readonly enabled: boolean;
      readonly strength: number;
      readonly radius: number;
      readonly threshold: number;
    };
    readonly ssao: {
      readonly enabled: boolean;
      readonly radius: number;
      readonly intensity: number;
      readonly bias: number;
    };
    readonly outline: {
      readonly enabled: boolean;
      readonly thickness: number;
      readonly color: string;
    };
  };
}

/**
 * Scene bounds and limits
 */
export interface SceneBounds {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
  readonly center: readonly [number, number, number];
  readonly size: readonly [number, number, number];
}

/**
 * Level of Detail (LOD) configuration
 */
export interface LODConfig {
  readonly enabled: boolean;
  readonly levels: ReadonlyArray<{
    readonly distance: number;
    readonly geometry: THREE.BufferGeometry;
  }>;
  readonly hysteresis: number;
}

/**
 * Instancing configuration for performance
 */
export interface InstanceConfig {
  readonly enabled: boolean;
  readonly maxInstances: number;
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.Material;
  readonly transforms: ReadonlyArray<THREE.Matrix4>;
}

/**
 * Scene statistics
 */
export interface SceneStats {
  readonly objects: number;
  readonly meshes: number;
  readonly lights: number;
  readonly cameras: number;
  readonly materials: number;
  readonly textures: number;
  readonly geometries: number;
  readonly triangles: number;
  readonly vertices: number;
  readonly drawCalls: number;
  readonly memoryUsage: {
    readonly geometries: number;
    readonly textures: number;
    readonly total: number;
  };
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  readonly enabled: boolean;
  readonly autoRotate: boolean;
  readonly rotationSpeed: number;
  readonly cameraAnimation: {
    readonly enabled: boolean;
    readonly duration: number;
    readonly easing: string;
  };
  readonly morphTargets: boolean;
  readonly skinning: boolean;
}

/**
 * Interaction configuration
 */
export interface InteractionConfig {
  readonly enabled: boolean;
  readonly controls: {
    readonly orbit: boolean;
    readonly pan: boolean;
    readonly zoom: boolean;
    readonly rotate: boolean;
  };
  readonly selection: {
    readonly enabled: boolean;
    readonly highlightColor: string;
    readonly outlineWidth: number;
  };
  readonly raycasting: {
    readonly enabled: boolean;
    readonly recursive: boolean;
    readonly threshold: number;
  };
}

/**
 * Scene optimization settings
 */
export interface SceneOptimization {
  readonly frustumCulling: boolean;
  readonly occlusionCulling: boolean;
  readonly backfaceCulling: boolean;
  readonly depthTest: boolean;
  readonly depthWrite: boolean;
  readonly colorWrite: boolean;
  readonly stencilTest: boolean;
  readonly scissorTest: boolean;
  readonly polygonOffset: boolean;
  readonly dithering: boolean;
  readonly premultipliedAlpha: boolean;
  readonly vertexColors: boolean;
  readonly fog: boolean;
  readonly lights: boolean;
  readonly clippingPlanes: boolean;
  readonly shadowMap: boolean;
  readonly physicallyCorrectLights: boolean;
  readonly toneMapping: THREE.ToneMapping;
  readonly toneMappingExposure: number;
  readonly outputColorSpace: THREE.ColorSpace;
}

/**
 * Scene export configuration
 */
export interface ExportConfig {
  readonly format: "gltf" | "obj" | "stl" | "ply" | "dae";
  readonly binary: boolean;
  readonly embedImages: boolean;
  readonly includeCustomExtensions: boolean;
  readonly animations: boolean;
  readonly morphTargets: boolean;
  readonly skins: boolean;
  readonly onlyVisible: boolean;
  readonly truncateDrawRange: boolean;
  readonly forcePowerOfTwoTextures: boolean;
  readonly maxTextureSize: number;
}

/**
 * Scene import configuration
 */
export interface ImportConfig {
  readonly format: "gltf" | "obj" | "fbx" | "dae" | "3ds" | "ply" | "stl";
  readonly scale: number;
  readonly center: boolean;
  readonly flipY: boolean;
  readonly generateMipmaps: boolean;
  readonly wrapS: THREE.Wrapping;
  readonly wrapT: THREE.Wrapping;
  readonly magFilter: THREE.TextureFilter;
  readonly minFilter: THREE.TextureFilter;
  readonly anisotropy: number;
}

/**
 * Debug visualization configuration
 */
export interface DebugConfig {
  readonly enabled: boolean;
  readonly wireframe: boolean;
  readonly boundingBoxes: boolean;
  readonly normals: boolean;
  readonly tangents: boolean;
  readonly uvs: boolean;
  readonly vertexColors: boolean;
  readonly skeleton: boolean;
  readonly cameras: boolean;
  readonly lights: boolean;
  readonly lightHelpers: boolean;
  readonly cameraHelpers: boolean;
  readonly axesHelper: boolean;
  readonly gridHelper: boolean;
  readonly stats: boolean;
  readonly gui: boolean;
}

/**
 * Scene serialization format
 */
export interface SceneData {
  readonly version: string;
  readonly metadata: {
    readonly generator: string;
    readonly type: string;
    readonly version: string;
  };
  readonly scene: {
    readonly background: string | null;
    readonly environment: string | null;
    readonly fog: any | null;
  };
  readonly cameras: ReadonlyArray<any>;
  readonly lights: ReadonlyArray<any>;
  readonly objects: ReadonlyArray<any>;
  readonly materials: ReadonlyArray<any>;
  readonly geometries: ReadonlyArray<any>;
  readonly textures: ReadonlyArray<any>;
  readonly animations: ReadonlyArray<any>;
}
