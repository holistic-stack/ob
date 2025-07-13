/**
 * @file Three.js to Manifold Converter
 * @description Pure function for converting Three.js BufferGeometry to Manifold objects
 * Follows SRP: Single responsibility for Three.js → Manifold conversion
 */

import type * as THREE from 'three';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import {
  convertThreeToManifold as convertToIManifoldMesh,
  type IManifoldMesh,
} from '../manifold-mesh-converter/manifold-mesh-converter';
import { ManifoldWasmLoader } from '../manifold-wasm-loader/manifold-wasm-loader';

const logger = createLogger('ThreeManifoldConverter');

/**
 * Manifold WASM object type (no `any`)
 * Based on actual Manifold API discovered through testing
 */
export interface ManifoldWasmObject {
  readonly delete?: () => void; // May be inherited
  readonly transform: (matrix: readonly number[]) => ManifoldWasmObject;
  readonly _GetMeshJS: () => ManifoldMesh;
  readonly _boundingBox: () => ManifoldBounds;
  readonly add: (other: ManifoldWasmObject) => ManifoldWasmObject;
  readonly subtract: (other: ManifoldWasmObject) => ManifoldWasmObject;
  readonly intersect: (other: ManifoldWasmObject) => ManifoldWasmObject;
}

/**
 * Manifold mesh data structure
 */
export interface ManifoldMesh {
  readonly vertPos: readonly number[];
  readonly triVerts: readonly number[];
  readonly numProp: number;
}

/**
 * Manifold bounding box
 */
export interface ManifoldBounds {
  readonly min: { readonly x: number; readonly y: number; readonly z: number };
  readonly max: { readonly x: number; readonly y: number; readonly z: number };
}

/**
 * Convert Three.js BufferGeometry to Manifold WASM object
 * Pure function following functional programming principles
 *
 * @param geometry - Three.js BufferGeometry to convert
 * @returns Result with Manifold object or error
 *
 * @example
 * ```typescript
 * const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
 * const result = await convertThreeToManifold(cubeGeometry);
 * if (result.success) {
 *   const manifoldObject = result.data;
 *   // Use manifold object...
 *   manifoldObject.delete(); // Clean up
 * }
 * ```
 */
export async function convertThreeToManifold(
  geometry: THREE.BufferGeometry
): Promise<Result<ManifoldWasmObject, string>> {
  // Input validation
  const validationResult = validateThreeGeometry(geometry);
  if (!validationResult.success) {
    return validationResult;
  }

  try {
    // Use existing converter to create IManifoldMesh
    const meshResult = convertToIManifoldMesh(geometry);
    if (!meshResult.success) {
      return { success: false, error: `Failed to convert to IManifoldMesh: ${meshResult.error}` };
    }

    // Load Manifold WASM module
    const wasmLoader = new ManifoldWasmLoader();
    const manifoldModule = await wasmLoader.load();
    if (!manifoldModule) {
      return { success: false, error: 'Failed to load Manifold WASM: module is null' };
    }

    // Create Manifold object directly from IManifoldMesh data
    // This follows the working pattern from manifold-csg-operations.ts
    const manifoldObject = new manifoldModule.Manifold(
      meshResult.data as any
    ) as ManifoldWasmObject;

    logger.debug('Successfully converted Three.js geometry to Manifold object', {
      vertexCount: meshResult.data.vertProperties.length / meshResult.data.numProp,
      triangleCount: meshResult.data.triVerts.length / 3,
      materialRuns: meshResult.data.numRun,
    });

    return { success: true, data: manifoldObject };
  } catch (error) {
    const errorMessage = `Three.js to Manifold conversion failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Validate Three.js geometry for conversion
 * Pure function with no side effects
 */
function validateThreeGeometry(geometry: THREE.BufferGeometry): Result<void, string> {
  if (!geometry) {
    return { success: false, error: 'Geometry is null or undefined' };
  }

  const positionAttribute = geometry.getAttribute('position');
  if (!positionAttribute) {
    return { success: false, error: 'Geometry missing position attribute' };
  }

  if (positionAttribute.count === 0) {
    return { success: false, error: 'Geometry has no vertices' };
  }

  return { success: true, data: undefined };
}
