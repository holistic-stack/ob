/**
 * @file Geometry to Manifold Converter
 * @description Main orchestrator for converting Three.js geometries to Manifold objects
 *
 * This module follows the Single Responsibility Principle by focusing solely on
 * orchestrating the conversion process. It combines shape detection, manifold-compliant
 * geometry creation, and mesh data conversion to provide a complete solution.
 *
 * @example
 * ```typescript
 * import { convertGeometryToManifold } from './geometry-to-manifold-converter';
 * import { BoxGeometry } from 'three';
 *
 * const geometry = new BoxGeometry(1, 1, 1);
 * const result = await convertGeometryToManifold(geometry, manifoldModule);
 *
 * if (result.success) {
 *   // Use result.data as Manifold object
 *   console.log('Vertices:', result.data.numVert());
 * }
 * ```
 */

import type { BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Result } from '../../../../../shared/types/result.types';
import { createManifoldCube } from '../manifold-cube-creator/manifold-cube-creator';
import { createManifoldMeshFromGeometry } from '../manifold-mesh-creator/manifold-mesh-creator';
import { detectBasicShape } from '../shape-detector/shape-detector';

/**
 * Conversion strategy for geometry processing
 */
export type ConversionStrategy = 'detect-and-replace' | 'repair-and-convert' | 'direct-convert';

/**
 * Conversion options for fine-tuning the process
 */
export interface ConversionOptions {
  readonly strategy: ConversionStrategy;
  readonly enableShapeDetection: boolean;
  readonly enableMeshRepair: boolean;
  readonly logProgress: boolean;
}

/**
 * Default conversion options
 */
const DEFAULT_OPTIONS: ConversionOptions = {
  strategy: 'detect-and-replace',
  enableShapeDetection: true,
  enableMeshRepair: true,
  logProgress: false,
} as const;

/**
 * Repairs a Three.js BufferGeometry to improve manifold compliance
 *
 * @param geometry - Three.js BufferGeometry to repair
 * @returns Result containing repaired geometry or error
 */
function repairGeometryForManifold(geometry: BufferGeometry): Result<BufferGeometry, string> {
  try {
    // Clone geometry to avoid modifying original
    const repairedGeometry = geometry.clone();

    // Ensure geometry is indexed
    if (!repairedGeometry.index) {
      const vertexCount = repairedGeometry.getAttribute('position').count;
      const indices = Array.from({ length: vertexCount }, (_, i) => i);
      repairedGeometry.setIndex(indices);
    }

    // Merge duplicate vertices using BufferGeometryUtils
    const mergedGeometry = BufferGeometryUtils.mergeVertices(repairedGeometry);
    repairedGeometry.dispose();

    // Compute vertex normals for consistent winding
    mergedGeometry.computeVertexNormals();

    return { success: true, data: mergedGeometry };
  } catch (error) {
    return {
      success: false,
      error: `Geometry repair failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Converts geometry using detect-and-replace strategy
 *
 * @param geometry - Original Three.js BufferGeometry
 * @param options - Conversion options
 * @returns Result containing working geometry or error
 */
function convertWithDetectAndReplace(
  geometry: BufferGeometry,
  options: ConversionOptions
): Result<BufferGeometry, string> {
  if (!options.enableShapeDetection) {
    return { success: true, data: geometry };
  }

  const detection = detectBasicShape(geometry);

  if (detection?.type === 'cube') {
    if (options.logProgress) {
      console.log('Detected cube shape, creating manifold-compliant version');
    }

    try {
      // Type guard to ensure we have cube parameters
      if (detection.type === 'cube') {
        const manifoldCube = createManifoldCube(detection.params.size);
        return { success: true, data: manifoldCube };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create manifold cube: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  // For other shapes or undetected geometries, use repair strategy
  if (options.enableMeshRepair) {
    return repairGeometryForManifold(geometry);
  }

  return { success: true, data: geometry };
}

/**
 * Converts geometry using repair-and-convert strategy
 *
 * @param geometry - Original Three.js BufferGeometry
 * @param options - Conversion options
 * @returns Result containing working geometry or error
 */
function convertWithRepairAndConvert(
  geometry: BufferGeometry,
  options: ConversionOptions
): Result<BufferGeometry, string> {
  if (options.enableMeshRepair) {
    return repairGeometryForManifold(geometry);
  }

  return { success: true, data: geometry };
}

/**
 * Converts geometry using direct-convert strategy
 *
 * @param geometry - Original Three.js BufferGeometry
 * @param options - Conversion options
 * @returns Result containing working geometry or error
 */
function convertWithDirectConvert(
  geometry: BufferGeometry,
  options: ConversionOptions
): Result<BufferGeometry, string> {
  // Use geometry as-is
  return { success: true, data: geometry };
}

/**
 * Converts a Three.js BufferGeometry to a Manifold object
 *
 * This is the main entry point for geometry conversion. It orchestrates the entire
 * process from shape detection through mesh creation to final Manifold object creation.
 *
 * @param geometry - Three.js BufferGeometry to convert
 * @param manifoldModule - Loaded Manifold WASM module
 * @param options - Conversion options (optional)
 * @returns Result containing Manifold object or error
 *
 * @example
 * ```typescript
 * import { BoxGeometry } from 'three';
 *
 * const geometry = new BoxGeometry(2, 1, 0.5);
 * const result = await convertGeometryToManifold(geometry, manifoldModule, {
 *   strategy: 'detect-and-replace',
 *   logProgress: true
 * });
 *
 * if (result.success) {
 *   console.log('Created Manifold with', result.data.numVert(), 'vertices');
 * }
 * ```
 */
export async function convertGeometryToManifold(
  geometry: BufferGeometry,
  manifoldModule: any,
  options: Partial<ConversionOptions> = {}
): Promise<Result<any, string>> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    if (finalOptions.logProgress) {
      console.log('Starting geometry to Manifold conversion');
    }

    // Step 1: Apply conversion strategy to get working geometry
    let workingGeometryResult: Result<BufferGeometry, string>;

    switch (finalOptions.strategy) {
      case 'detect-and-replace':
        workingGeometryResult = convertWithDetectAndReplace(geometry, finalOptions);
        break;
      case 'repair-and-convert':
        workingGeometryResult = convertWithRepairAndConvert(geometry, finalOptions);
        break;
      case 'direct-convert':
        workingGeometryResult = convertWithDirectConvert(geometry, finalOptions);
        break;
      default:
        return { success: false, error: `Unknown conversion strategy: ${finalOptions.strategy}` };
    }

    if (!workingGeometryResult.success) {
      return workingGeometryResult;
    }

    const workingGeometry = workingGeometryResult.data;

    // Step 2: Create Manifold mesh data using official pattern
    const meshDataResult = createManifoldMeshFromGeometry(workingGeometry);
    if (!meshDataResult.success) {
      return meshDataResult;
    }

    if (finalOptions.logProgress) {
      console.log('Created mesh data:', {
        vertices: meshDataResult.data.vertProperties.length / 3,
        triangles: meshDataResult.data.triVerts.length / 3,
      });
    }

    // Step 3: Create Manifold object using the official pattern
    let manifoldObject: any;
    try {
      manifoldObject = new manifoldModule.Manifold(meshDataResult.data);
    } catch (error) {
      return {
        success: false,
        error: `Failed to create Manifold object: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Step 4: Validate the created Manifold object
    if (!manifoldObject || manifoldObject.isEmpty()) {
      if (manifoldObject) {
        manifoldObject.delete();
      }
      return {
        success: false,
        error: 'Created Manifold object is empty or invalid',
      };
    }

    // Step 5: Clean up working geometry if it was created (not the original)
    if (workingGeometry !== geometry) {
      workingGeometry.dispose();
    }

    if (finalOptions.logProgress) {
      console.log('Successfully created Manifold object:', {
        vertices: manifoldObject.numVert(),
        triangles: manifoldObject.numTri(),
      });
    }

    return { success: true, data: manifoldObject };
  } catch (error) {
    return {
      success: false,
      error: `Geometry conversion failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Converts geometry with automatic strategy selection
 *
 * @param geometry - Three.js BufferGeometry to convert
 * @param manifoldModule - Loaded Manifold WASM module
 * @returns Result containing Manifold object or error
 */
export async function convertGeometryToManifoldAuto(
  geometry: BufferGeometry,
  manifoldModule: any
): Promise<Result<any, string>> {
  // Try detect-and-replace first (most reliable)
  const detectResult = await convertGeometryToManifold(geometry, manifoldModule, {
    strategy: 'detect-and-replace',
  });

  if (detectResult.success) {
    return detectResult;
  }

  // Fall back to repair-and-convert
  const repairResult = await convertGeometryToManifold(geometry, manifoldModule, {
    strategy: 'repair-and-convert',
  });

  if (repairResult.success) {
    return repairResult;
  }

  // Last resort: direct convert
  return convertGeometryToManifold(geometry, manifoldModule, {
    strategy: 'direct-convert',
  });
}
