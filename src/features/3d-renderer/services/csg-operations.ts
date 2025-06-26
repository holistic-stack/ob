/**
 * CSG Operations Service
 * 
 * Service for performing Constructive Solid Geometry operations
 * using three-csg-ts for union, difference, and intersection operations.
 */

import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import type { 
  CSGOperation, 
  CSGConfig, 
  Mesh3D,
  RenderingError 
} from '../types/renderer.types';
import { success, error, tryCatch } from '../../../shared/utils/functional/result';
import type { Result, AsyncResult } from '../../../shared/types/result.types';
import { measureTime } from '../../../shared/utils/performance/metrics';

/**
 * Maximum complexity threshold for CSG operations
 */
const MAX_CSG_COMPLEXITY = 50000; // triangles

/**
 * CSG operation timeout in milliseconds
 */
const CSG_TIMEOUT_MS = 10000;

/**
 * Validate mesh for CSG operations
 */
const validateMeshForCSG = (mesh: THREE.Mesh): Result<void, string> => {
  return tryCatch(() => {
    if (!mesh.geometry) {
      throw new Error('Mesh has no geometry');
    }
    
    if (!mesh.geometry.attributes.position) {
      throw new Error('Mesh geometry has no position attribute');
    }
    
    const triangleCount = mesh.geometry.attributes.position.count / 3;
    if (triangleCount > MAX_CSG_COMPLEXITY) {
      throw new Error(`Mesh too complex for CSG: ${triangleCount} triangles (max: ${MAX_CSG_COMPLEXITY})`);
    }
    
    if (!mesh.geometry.index && mesh.geometry.attributes.position.count % 3 !== 0) {
      throw new Error('Non-indexed geometry must have vertex count divisible by 3');
    }
    
    // Ensure geometry has normals
    if (!mesh.geometry.attributes.normal) {
      mesh.geometry.computeVertexNormals();
    }
    
    // Ensure geometry is up to date
    mesh.updateMatrixWorld(true);
    
    return undefined;
  }, (err) => `Mesh validation failed: ${err instanceof Error ? err.message : String(err)}`);
};

/**
 * Optimize mesh for CSG operations
 */
const optimizeMeshForCSG = (mesh: THREE.Mesh): Result<THREE.Mesh, string> => {
  return tryCatch(() => {
    const optimizedMesh = mesh.clone();

    // Ensure geometry is merged and optimized
    if (optimizedMesh.geometry instanceof THREE.BufferGeometry) {
      // Clone geometry to avoid modifying original
      optimizedMesh.geometry = optimizedMesh.geometry.clone();

      // Try to merge vertices if method exists (newer Three.js versions)
      if (typeof (optimizedMesh.geometry as any).mergeVertices === 'function') {
        (optimizedMesh.geometry as any).mergeVertices();
      }

      // Compute normals if missing
      if (!optimizedMesh.geometry.attributes.normal) {
        optimizedMesh.geometry.computeVertexNormals();
      }

      // Compute bounding box and sphere
      optimizedMesh.geometry.computeBoundingBox();
      optimizedMesh.geometry.computeBoundingSphere();
    }

    return optimizedMesh;
  }, (err) => `Mesh optimization failed: ${err instanceof Error ? err.message : String(err)}`);
};

/**
 * Perform CSG union operation
 */
const performUnion = (meshes: ReadonlyArray<THREE.Mesh>): Result<THREE.Mesh, string> => {
  return tryCatch(() => {
    if (meshes.length === 0) {
      throw new Error('No meshes provided for union operation');
    }
    
    if (meshes.length === 1) {
      return meshes[0].clone();
    }
    
    let result = CSG.fromMesh(meshes[0]);
    
    for (let i = 1; i < meshes.length; i++) {
      const nextCSG = CSG.fromMesh(meshes[i]);
      result = result.union(nextCSG);
    }
    
    return result.toMesh();
  }, (err) => `Union operation failed: ${err instanceof Error ? err.message : String(err)}`);
};

/**
 * Perform CSG difference operation
 */
const performDifference = (meshes: ReadonlyArray<THREE.Mesh>): Result<THREE.Mesh, string> => {
  return tryCatch(() => {
    if (meshes.length < 2) {
      throw new Error('At least 2 meshes required for difference operation');
    }
    
    let result = CSG.fromMesh(meshes[0]);
    
    for (let i = 1; i < meshes.length; i++) {
      const nextCSG = CSG.fromMesh(meshes[i]);
      result = result.subtract(nextCSG);
    }
    
    return result.toMesh();
  }, (err) => `Difference operation failed: ${err instanceof Error ? err.message : String(err)}`);
};

/**
 * Perform CSG intersection operation
 */
const performIntersection = (meshes: ReadonlyArray<THREE.Mesh>): Result<THREE.Mesh, string> => {
  return tryCatch(() => {
    if (meshes.length < 2) {
      throw new Error('At least 2 meshes required for intersection operation');
    }
    
    let result = CSG.fromMesh(meshes[0]);
    
    for (let i = 1; i < meshes.length; i++) {
      const nextCSG = CSG.fromMesh(meshes[i]);
      result = result.intersect(nextCSG);
    }
    
    return result.toMesh();
  }, (err) => `Intersection operation failed: ${err instanceof Error ? err.message : String(err)}`);
};

/**
 * Perform CSG operation with timeout
 */
const performCSGWithTimeout = async (
  operation: () => Result<THREE.Mesh, string>,
  timeoutMs: number = CSG_TIMEOUT_MS
): Promise<Result<THREE.Mesh, string>> => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve(error('CSG operation timed out'));
    }, timeoutMs);
    
    try {
      const result = operation();
      clearTimeout(timeoutId);
      resolve(result);
    } catch (err) {
      clearTimeout(timeoutId);
      resolve(error(`CSG operation failed: ${err instanceof Error ? err.message : String(err)}`));
    }
  });
};

/**
 * Main CSG operation function
 */
export const performCSGOperation = async (config: CSGConfig): AsyncResult<THREE.Mesh, string> => {
  const { result, duration } = await measureTime(async () => {
    // Validate configuration
    if (config.meshes.length === 0) {
      return error('No meshes provided for CSG operation');
    }
    
    if (config.operation === 'union' && config.meshes.length === 1) {
      return success(config.meshes[0].clone());
    }
    
    if ((config.operation === 'difference' || config.operation === 'intersection') && config.meshes.length < 2) {
      return error(`${config.operation} operation requires at least 2 meshes`);
    }
    
    // Validate and optimize meshes
    const optimizedMeshes: THREE.Mesh[] = [];
    
    for (const mesh of config.meshes) {
      const validationResult = validateMeshForCSG(mesh);
      if (!validationResult.success) {
        return error(`Mesh validation failed: ${validationResult.error}`);
      }
      
      if (config.enableOptimization) {
        const optimizationResult = optimizeMeshForCSG(mesh);
        if (!optimizationResult.success) {
          return error(`Mesh optimization failed: ${optimizationResult.error}`);
        }
        optimizedMeshes.push(optimizationResult.data);
      } else {
        optimizedMeshes.push(mesh);
      }
    }
    
    // Check total complexity
    const totalTriangles = optimizedMeshes.reduce((sum, mesh) => {
      return sum + (mesh.geometry.attributes.position.count / 3);
    }, 0);
    
    if (totalTriangles > config.maxComplexity) {
      return error(`Total mesh complexity too high: ${totalTriangles} triangles (max: ${config.maxComplexity})`);
    }
    
    // Perform CSG operation
    let operationResult: Result<THREE.Mesh, string>;
    
    switch (config.operation) {
      case 'union':
        operationResult = await performCSGWithTimeout(() => performUnion(optimizedMeshes));
        break;
      case 'difference':
        operationResult = await performCSGWithTimeout(() => performDifference(optimizedMeshes));
        break;
      case 'intersection':
        operationResult = await performCSGWithTimeout(() => performIntersection(optimizedMeshes));
        break;
      default:
        return error(`Unsupported CSG operation: ${config.operation}`);
    }
    
    if (!operationResult.success) {
      return operationResult;
    }
    
    // Post-process result
    const resultMesh = operationResult.data;
    
    // Ensure the result has proper normals
    if (resultMesh.geometry instanceof THREE.BufferGeometry) {
      resultMesh.geometry.computeVertexNormals();
      resultMesh.geometry.computeBoundingBox();
      resultMesh.geometry.computeBoundingSphere();
    }
    
    console.log(`[DEBUG][CSGOperations] ${config.operation} completed in ${duration}ms`);
    
    return success(resultMesh);
  });
  
  return result;
};

/**
 * Create CSG configuration with defaults
 */
export const createCSGConfig = (
  operation: CSGOperation,
  meshes: ReadonlyArray<THREE.Mesh>,
  options: Partial<Omit<CSGConfig, 'operation' | 'meshes'>> = {}
): CSGConfig => ({
  operation,
  meshes,
  enableOptimization: options.enableOptimization ?? true,
  maxComplexity: options.maxComplexity ?? MAX_CSG_COMPLEXITY
});

/**
 * Batch CSG operations for multiple operations
 */
export const performBatchCSGOperations = async (
  configs: ReadonlyArray<CSGConfig>
): Promise<ReadonlyArray<Result<THREE.Mesh, string>>> => {
  const results: Array<Result<THREE.Mesh, string>> = [];
  
  for (const config of configs) {
    const result = await performCSGOperation(config);
    results.push(result);
    
    // If any operation fails, we might want to continue or stop
    // For now, we continue with all operations
  }
  
  return results;
};

/**
 * Check if meshes are suitable for CSG operations
 */
export const validateMeshesForCSG = (meshes: ReadonlyArray<THREE.Mesh>): Result<void, string> => {
  return tryCatch(() => {
    if (meshes.length === 0) {
      throw new Error('No meshes provided');
    }
    
    for (let i = 0; i < meshes.length; i++) {
      const validationResult = validateMeshForCSG(meshes[i]);
      if (!validationResult.success) {
        throw new Error(`Mesh ${i} validation failed: ${validationResult.error}`);
      }
    }
    
    return undefined;
  }, (err) => `Mesh validation failed: ${err instanceof Error ? err.message : String(err)}`);
};

/**
 * Estimate CSG operation complexity
 */
export const estimateCSGComplexity = (meshes: ReadonlyArray<THREE.Mesh>): number => {
  return meshes.reduce((sum, mesh) => {
    if (mesh.geometry && mesh.geometry.attributes.position) {
      return sum + (mesh.geometry.attributes.position.count / 3);
    }
    return sum;
  }, 0);
};

/**
 * Check if CSG operation is feasible
 */
export const isCSGOperationFeasible = (
  operation: CSGOperation,
  meshes: ReadonlyArray<THREE.Mesh>,
  maxComplexity: number = MAX_CSG_COMPLEXITY
): Result<boolean, string> => {
  return tryCatch(() => {
    const complexity = estimateCSGComplexity(meshes);
    
    if (complexity > maxComplexity) {
      return false;
    }
    
    const validationResult = validateMeshesForCSG(meshes);
    if (!validationResult.success) {
      return false;
    }
    
    return true;
  }, (err) => `Feasibility check failed: ${err instanceof Error ? err.message : String(err)}`);
};
