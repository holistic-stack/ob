/**
 * @file R3F Renderer Feature Index
 * 
 * Main entry point for the React Three Fiber renderer feature.
 * Exports all components, hooks, services, and types for external use.
 * 
 * This module provides a complete replacement for the Babylon.js renderer
 * with equivalent functionality using React Three Fiber.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

// ============================================================================
// Core Components
// ============================================================================

// Main renderer components
export { R3FRenderer } from './components/r3f-renderer/r3f-renderer';
export { R3FCanvas } from './components/r3f-canvas/r3f-canvas';
export { R3FScene } from './components/r3f-scene/r3f-scene';

// Re-export component props for convenience
export type { R3FRendererProps } from './components/r3f-renderer/r3f-renderer';
export type { R3FCanvasProps } from './types/r3f-types';
export type { R3FSceneProps } from './types/r3f-types';

// ============================================================================
// Hooks
// ============================================================================

// Core R3F hooks
export { useR3FEngine } from './hooks/use-r3f-engine/use-r3f-engine';
export { useR3FScene } from './hooks/use-r3f-scene/use-r3f-scene';

// Hook return types
export type { UseR3FEngineReturn } from './types/r3f-types';
export type { UseR3FSceneReturn } from './types/r3f-types';

// ============================================================================
// Services
// ============================================================================

// Engine service
export { 
  createR3FEngineService,
  createRenderer,
  disposeRenderer,
  handleResize,
  setupErrorHandlers,
  getRendererInfo,
  DEFAULT_ENGINE_CONFIG
} from './services/engine-service/r3f-engine-service';

// Scene service
export {
  createR3FSceneService,
  createScene,
  setupLighting,
  setupCamera,
  setupGrid,
  setupAxes,
  disposeScene,
  DEFAULT_SCENE_CONFIG,
  DEFAULT_CAMERA_CONFIG
} from './services/scene-service/r3f-scene-service';

// Service interfaces
export type { R3FEngineService } from './types/r3f-types';
export type { R3FSceneService } from './types/r3f-types';

// ============================================================================
// Configuration Types
// ============================================================================

// Core configuration interfaces
export type { R3FEngineConfig } from './types/r3f-types';
export type { R3FSceneConfig } from './types/r3f-types';
export type { R3FCameraConfig } from './types/r3f-types';
export type { R3FCanvasConfig } from './types/r3f-types';

// Component configuration types
export type { R3FSceneControlsProps } from './types/r3f-types';
export type { R3FMeshDisplayProps } from './types/r3f-types';

// ============================================================================
// Result and Utility Types
// ============================================================================

// Functional programming types
export type { Result } from './types/r3f-types';
export type { R3FRendererResult } from './types/r3f-types';
export type { R3FSceneResult } from './types/r3f-types';
export type { R3FMeshResult } from './types/r3f-types';
export type { R3FMaterialResult } from './types/r3f-types';
export type { R3FCSGResult } from './types/r3f-types';

// Renderer information
export type { RendererInfo } from './types/r3f-types';

// ============================================================================
// CSG and Geometry Types
// ============================================================================

// CSG operation types
export type { R3FCSGOperationType } from './types/r3f-types';
export type { R3FCSGOperation } from './types/r3f-types';

// Primitive and geometry types
export type { R3FPrimitiveType } from './types/r3f-types';
export type { R3FPrimitiveConfig } from './types/r3f-types';

// Material configuration
export type { R3FMaterialConfig } from './types/r3f-types';

// ============================================================================
// Layout and UI Types
// ============================================================================

// Layout types
export type { R3FRendererLayout } from './types/r3f-types';

// Debug and reporting types
export type { R3FDebugReport } from './types/r3f-types';
export type { R3FDebugPanelConfig } from './types/r3f-types';

// ============================================================================
// Default Exports for Convenience
// ============================================================================

/**
 * Default R3F Renderer component for easy importing
 * 
 * @example
 * ```tsx
 * import R3FRenderer from '@/features/r3f-renderer';
 * 
 * function App() {
 *   return (
 *     <R3FRenderer
 *       layout="grid"
 *       showSceneControls={true}
 *       showMeshDisplay={true}
 *       showDebugPanel={true}
 *     />
 *   );
 * }
 * ```
 */
export { R3FRenderer as default } from './components/r3f-renderer/r3f-renderer';

// ============================================================================
// Utility Functions and Constants
// ============================================================================

/**
 * Check if the current environment supports WebGL
 * 
 * @returns True if WebGL is supported, false otherwise
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!context;
  } catch {
    return false;
  }
}

/**
 * Get WebGL capabilities information
 * 
 * @returns WebGL capabilities or null if not supported
 */
export function getWebGLCapabilities(): import('./types/r3f-types').RendererInfo | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return null;
    }
    
    // Cast to WebGLRenderingContext since we know it's webgl context
    const webgl = gl as WebGLRenderingContext;
    const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
    
    return {
      vendor: debugInfo ? webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
      renderer: debugInfo ? webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
      version: webgl.getParameter(webgl.VERSION),
      maxTextureSize: webgl.getParameter(webgl.MAX_TEXTURE_SIZE),
      maxCubeTextureSize: webgl.getParameter(webgl.MAX_CUBE_MAP_TEXTURE_SIZE),
      maxVertexTextures: webgl.getParameter(webgl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
      maxFragmentTextures: webgl.getParameter(webgl.MAX_TEXTURE_IMAGE_UNITS),
      maxVaryingVectors: webgl.getParameter(webgl.MAX_VARYING_VECTORS),
      maxVertexAttribs: webgl.getParameter(webgl.MAX_VERTEX_ATTRIBS),
      extensions: webgl.getSupportedExtensions() || []
    };
  } catch {
    return null;
  }
}

/**
 * Version information for the R3F renderer
 */
export const R3F_RENDERER_VERSION = '1.0.0';

/**
 * Feature flags for the R3F renderer
 */
export const R3F_FEATURES = {
  CSG_OPERATIONS: true,
  VISUAL_REGRESSION_TESTS: true,
  PERFORMANCE_MONITORING: true,
  ACCESSIBILITY_COMPLIANCE: true,
  GLASS_MORPHISM_UI: true
} as const;

// ============================================================================
// Migration Complete - R3F Implementation
// ============================================================================

/**
 * R3F implementation provides complete 3D rendering functionality
 * with React Three Fiber, Three.js, and modern React patterns
 */
export const R3F_IMPLEMENTATION_STATUS = {
  'Camera System': 'Complete - Enhanced camera controls with framing',
  'Scene Rendering': 'Complete - Professional 3D visualization',
  'CSG Operations': 'Complete - Three.js CSG integration',
  'Navigation': 'Complete - 3D navigation cube',
  'Performance': 'Optimized - Hardware-accelerated rendering',
  'TypeScript': 'Complete - Full type safety'
} as const;

/**
 * R3F implementation status and capabilities
 *
 * @returns Object describing current R3F implementation status
 */
export function getR3FImplementationStatus() {
  return R3F_IMPLEMENTATION_STATUS;
}

/**
 * Check if R3F feature is implemented
 *
 * @param feature - Name of the feature to check
 * @returns True if the feature is implemented
 */
export function isR3FFeatureImplemented(feature: string): boolean {
  return Object.keys(R3F_IMPLEMENTATION_STATUS).includes(feature);
}

// ============================================================================
// Re-export Three.js types for convenience
// ============================================================================

// Re-export commonly used Three.js types
export type {
  Scene,
  WebGLRenderer,
  Camera,
  PerspectiveCamera,
  OrthographicCamera,
  Mesh,
  Material,
  BufferGeometry,
  Vector3,
  Matrix4,
  Euler,
  Color
} from 'three';
