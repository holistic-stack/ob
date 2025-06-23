/**
 * @file R3F CSG Feature Index
 * 
 * Main entry point for the React Three Fiber CSG feature.
 * Exports all components, services, hooks, and types for the complete
 * OpenSCAD → AST → CSG → R3F pipeline.
 * 
 * This module provides a complete CSG processing pipeline using React Three Fiber
 * and three-csg-ts for boolean operations on 3D geometries.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

// ============================================================================
// Core Pipeline Components
// ============================================================================

// Pipeline Processor - Main orchestrator
export { 
  R3FPipelineProcessor,
  createR3FPipelineProcessor 
} from './pipeline/processor/r3f-pipeline-processor';

// AST Visitor - OpenSCAD AST to Three.js conversion
export { 
  R3FASTVisitor,
  createR3FASTVisitor 
} from './openscad/ast-visitor/r3f-ast-visitor';

// CSG Service - Boolean operations
export { 
  R3FCSGService,
  createR3FCSGService 
} from './services/csg-service/r3f-csg-service';

// Scene Factory - Scene generation
export {
  R3FSceneFactory,
  createR3FSceneFactory
} from './services/scene-factory/r3f-scene-factory';

// CSG Converter - High-level conversion API
export {
  R3FCSGConverter,
  createR3FCSGConverter
} from './converter/r3f-csg-converter';

// React Hooks - React integration
export {
  useR3FCSGConverter,
  useOpenSCADToR3F,
  useOpenSCADToJSX
} from './hooks/use-r3f-csg-converter';

// ============================================================================
// Type Definitions
// ============================================================================

// Core types
export type {
  Result,
  ASTProcessingResult,
  GeometryResult,
  MeshResult,
  CSGOperationResult
} from './types/r3f-csg-types';

// Configuration types
export type {
  R3FASTVisitorConfig,
  R3FMaterialConfig,
  CSGServiceConfig,
  SceneFactoryConfig,
  R3FPipelineConfig,
  R3FCSGConverterConfig,
  CanvasConfig,
  SceneConfig,
  ControlsConfig
} from './types/r3f-csg-types';

// Converter types
export type {
  ConversionResult,
  ConverterState,
  UseR3FCSGConverterConfig,
  UseR3FCSGConverterReturn
} from './converter/r3f-csg-converter';

// Operation types
export type {
  CSGOperationType,
  CSGOperation,
  CSGOperationContext,
  ProcessingMetrics,
  ProcessingProgress
} from './types/r3f-csg-types';

// Geometry and primitive types
export type {
  CubeParams,
  SphereParams,
  CylinderParams,
  CircleParams,
  SquareParams,
  Transform3D,
  TranslationParams,
  RotationParams,
  ScaleParams
} from './types/r3f-csg-types';

// Service interfaces
export type {
  R3FASTVisitor as R3FASTVisitorInterface,
  CSGService,
  GeometryFactory,
  MaterialFactory
} from './types/r3f-csg-types';

// Error and validation types
export type {
  ASTProcessingError,
  NodeValidationResult,
  VisitorContext,
  ResourceUsage,
  GeometryCacheEntry
} from './types/r3f-csg-types';

// Re-export Three.js types for convenience
export type {
  BufferGeometry,
  Mesh,
  Material,
  Scene,
  Vector3,
  Euler,
  Matrix4
} from './types/r3f-csg-types';

// ============================================================================
// Pipeline Configuration Presets
// ============================================================================

/**
 * High-quality pipeline configuration for production use
 */
export const HIGH_QUALITY_CONFIG: R3FPipelineConfig = {
  astVisitorConfig: {
    enableCSG: true,
    enableCaching: true,
    enableOptimization: true,
    geometryPrecision: 64,
    enableLogging: false
  },
  sceneFactoryConfig: {
    enableLighting: true,
    enableShadows: true,
    enableGrid: true,
    enableAxes: true,
    enableOptimization: true,
    enableLogging: false
  },
  enableCaching: true,
  enableOptimization: true,
  enableLogging: false,
  processingTimeout: 120000, // 2 minutes
  maxRetries: 3,
  enableProgressTracking: true
} as const;

/**
 * Fast pipeline configuration for development and testing
 */
export const FAST_CONFIG: R3FPipelineConfig = {
  astVisitorConfig: {
    enableCSG: true,
    enableCaching: false,
    enableOptimization: false,
    geometryPrecision: 16,
    enableLogging: true
  },
  sceneFactoryConfig: {
    enableLighting: true,
    enableShadows: false,
    enableGrid: false,
    enableAxes: true,
    enableOptimization: false,
    enableLogging: true
  },
  enableCaching: false,
  enableOptimization: false,
  enableLogging: true,
  processingTimeout: 30000, // 30 seconds
  maxRetries: 1,
  enableProgressTracking: true
} as const;

/**
 * Debug pipeline configuration with extensive logging
 */
export const DEBUG_CONFIG: R3FPipelineConfig = {
  astVisitorConfig: {
    enableCSG: true,
    enableCaching: true,
    enableOptimization: true,
    geometryPrecision: 32,
    enableLogging: true
  },
  sceneFactoryConfig: {
    enableLighting: true,
    enableShadows: true,
    enableGrid: true,
    enableAxes: true,
    enableOptimization: true,
    enableLogging: true
  },
  enableCaching: true,
  enableOptimization: true,
  enableLogging: true,
  processingTimeout: 60000,
  maxRetries: 2,
  enableProgressTracking: true
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a complete R3F CSG pipeline with default configuration
 *
 * @param config - Optional pipeline configuration
 * @returns Configured pipeline processor
 *
 * @example
 * ```typescript
 * import { createR3FCSGPipeline, HIGH_QUALITY_CONFIG } from '@/features/r3f-csg';
 *
 * const pipeline = createR3FCSGPipeline(HIGH_QUALITY_CONFIG);
 *
 * const result = await pipeline.processOpenSCAD('cube([10, 10, 10]);');
 * if (result.success) {
 *   console.log('Generated scene:', result.data.scene);
 * }
 * ```
 */
export function createR3FCSGPipeline(config?: R3FPipelineConfig): R3FPipelineProcessor {
  return createR3FPipelineProcessor(config);
}

/**
 * Create a complete R3F CSG converter with default configuration
 *
 * @param config - Optional converter configuration
 * @returns Configured converter instance
 *
 * @example
 * ```typescript
 * import { createR3FCSGConverterInstance } from '@/features/r3f-csg';
 *
 * const converter = createR3FCSGConverterInstance({
 *   enableCaching: true,
 *   canvasConfig: { shadows: true }
 * });
 *
 * const result = await converter.convertToR3F('sphere(5);');
 * if (result.success) {
 *   const { CanvasComponent } = result.data;
 *   // Use CanvasComponent in React
 * }
 * ```
 */
export function createR3FCSGConverterInstance(config?: R3FCSGConverterConfig): R3FCSGConverter {
  return createR3FCSGConverter(config);
}

/**
 * Check if CSG operations are supported in the current environment
 * 
 * @returns True if CSG operations are supported
 */
export function isCSGSupported(): boolean {
  try {
    const csgService = createR3FCSGService();
    const supported = csgService.isSupported();
    (csgService as any).dispose?.();
    return supported;
  } catch {
    return false;
  }
}

/**
 * Get R3F CSG feature information
 * 
 * @returns Feature information object
 */
export function getR3FCSGInfo() {
  return {
    version: '1.0.0',
    features: {
      astProcessing: true,
      csgOperations: isCSGSupported(),
      sceneGeneration: true,
      caching: true,
      optimization: true,
      progressTracking: true,
      errorRecovery: true
    },
    supportedOperations: ['union', 'difference', 'intersection'] as const,
    supportedPrimitives: ['cube', 'sphere', 'cylinder', 'circle', 'square'] as const,
    supportedTransforms: ['translate', 'rotate', 'scale'] as const
  } as const;
}

/**
 * Validate OpenSCAD code syntax (basic validation)
 * 
 * @param code - OpenSCAD code to validate
 * @returns Validation result
 */
export function validateOpenSCADCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!code || code.trim().length === 0) {
    errors.push('Code cannot be empty');
  }
  
  // Basic syntax checks
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push('Mismatched braces');
  }
  
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Mismatched parentheses');
  }
  
  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push('Mismatched brackets');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Default Export
// ============================================================================

/**
 * Default R3F CSG pipeline processor for easy importing
 * 
 * @example
 * ```typescript
 * import R3FCSGPipeline from '@/features/r3f-csg';
 * 
 * const pipeline = new R3FCSGPipeline();
 * const result = await pipeline.processOpenSCAD('sphere(5);');
 * ```
 */
export { R3FPipelineProcessor as default } from './pipeline/processor/r3f-pipeline-processor';

// ============================================================================
// Version and Metadata
// ============================================================================

/**
 * R3F CSG feature version
 */
export const R3F_CSG_VERSION = '1.0.0';

/**
 * R3F CSG feature metadata
 */
export const R3F_CSG_METADATA = {
  name: 'R3F CSG Pipeline',
  version: R3F_CSG_VERSION,
  description: 'Complete OpenSCAD to React Three Fiber pipeline with CSG operations',
  author: 'OpenSCAD-R3F Pipeline',
  license: 'MIT',
  dependencies: {
    'three': '^0.177.0',
    'three-csg-ts': '^3.2.0',
    '@react-three/fiber': '^9.1.2',
    '@holistic-stack/openscad-parser': '^0.1.2'
  },
  capabilities: {
    parsing: 'OpenSCAD AST parsing',
    csg: 'Boolean operations (union, difference, intersection)',
    rendering: 'React Three Fiber scene generation',
    optimization: 'Geometry and scene optimization',
    caching: 'Result caching for performance',
    monitoring: 'Performance and progress tracking'
  }
} as const;
