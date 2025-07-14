/**
 * @file BabylonJS CSG2 Service
 * 
 * Service for BabylonJS CSG2 operations using Manifold 3.1.1 library.
 * Provides high-performance boolean operations with comprehensive error handling.
 */

import { Mesh, Scene, Vector3, Material } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';
import {
  CSGOperationType,
  CSGOperationConfig,
  CSGOperationInput,
  CSGOperationResult,
  CSGOperationMetadata,
  CSGPerformanceMetrics,
  CSGError,
  CSGErrorCode,
  CSGUnionResult,
  CSGDifferenceResult,
  CSGIntersectionResult,
  DEFAULT_CSG_CONFIG,
} from '../../types/babylon-csg.types';

const logger = createLogger('BabylonCSG2Service');

/**
 * BabylonJS CSG2 Service
 * 
 * Manages CSG2 operations using BabylonJS built-in CSG2 class with Manifold backend.
 * Follows SRP by focusing solely on CSG operations.
 */
export class BabylonCSG2Service {
  private scene: Scene | null = null;
  private config: CSGOperationConfig;
  private operationCounter = 0;

  constructor(config: CSGOperationConfig = DEFAULT_CSG_CONFIG) {
    this.config = { ...config };
    logger.init('[INIT][BabylonCSG2Service] Service initialized with Manifold 3.1.1 backend');
  }

  /**
   * Initialize the CSG2 service with a scene
   */
  init(scene: Scene): Result<void, CSGError> {
    logger.debug('[DEBUG][BabylonCSG2Service] Initializing CSG2 service...');

    return tryCatch(() => {
      if (!scene) {
        throw this.createError('INVALID_MESH', 'Scene is required for CSG2 operations');
      }

      this.scene = scene;
      logger.debug('[DEBUG][BabylonCSG2Service] CSG2 service initialized successfully');
    }, (error) => this.createError('OPERATION_FAILED', `Failed to initialize CSG2 service: ${error}`));
  }

  /**
   * Perform union operation on two meshes
   */
  async union(meshA: Mesh, meshB: Mesh, config?: Partial<CSGOperationConfig>): Promise<CSGUnionResult> {
    logger.debug('[DEBUG][BabylonCSG2Service] Performing union operation...');

    return this.performOperation(CSGOperationType.UNION, meshA, meshB, config);
  }

  /**
   * Perform difference operation on two meshes
   */
  async difference(meshA: Mesh, meshB: Mesh, config?: Partial<CSGOperationConfig>): Promise<CSGDifferenceResult> {
    logger.debug('[DEBUG][BabylonCSG2Service] Performing difference operation...');

    return this.performOperation(CSGOperationType.DIFFERENCE, meshA, meshB, config);
  }

  /**
   * Perform intersection operation on two meshes
   */
  async intersection(meshA: Mesh, meshB: Mesh, config?: Partial<CSGOperationConfig>): Promise<CSGIntersectionResult> {
    logger.debug('[DEBUG][BabylonCSG2Service] Performing intersection operation...');

    return this.performOperation(CSGOperationType.INTERSECTION, meshA, meshB, config);
  }

  /**
   * Perform CSG operation with comprehensive error handling and performance monitoring
   */
  private async performOperation(
    operation: CSGOperationType,
    meshA: Mesh,
    meshB: Mesh,
    config?: Partial<CSGOperationConfig>
  ): Promise<CSGOperationResult> {
    const startTime = performance.now();
    const operationId = this.generateOperationId();
    
    return tryCatchAsync(async () => {
      // Validate inputs
      this.validateMeshes(meshA, meshB);

      // Merge configuration
      const effectiveConfig = config ? { ...this.config, ...config } : this.config;

      // Import CSG2 dynamically to ensure it's available
      const { CSG2 } = await import('@babylonjs/core');

      if (!CSG2) {
        throw this.createError('MANIFOLD_ERROR', 'CSG2 is not available in this BabylonJS build');
      }

      // Prepare meshes for CSG operation
      const preparationStartTime = performance.now();
      const csgA = CSG2.FromMesh(meshA);
      const csgB = CSG2.FromMesh(meshB);
      const preparationTime = performance.now() - preparationStartTime;

      // Perform the operation
      const operationStartTime = performance.now();
      let resultCSG: any;

      switch (operation) {
        case CSGOperationType.UNION:
          resultCSG = CSG2.Union(csgA, csgB);
          break;
        case CSGOperationType.DIFFERENCE:
          resultCSG = CSG2.Subtract(csgA, csgB);
          break;
        case CSGOperationType.INTERSECTION:
          resultCSG = CSG2.Intersect(csgA, csgB);
          break;
        default:
          throw this.createError('OPERATION_FAILED', `Unsupported operation: ${operation}`);
      }

      const operationTime = performance.now() - operationStartTime;

      // Convert back to mesh
      const conversionStartTime = performance.now();
      const resultMesh = resultCSG.toMesh(`${operation}_result_${operationId}`, meshA.material, this.scene!);
      const conversionTime = performance.now() - conversionStartTime;

      // Apply optimization if requested
      if (effectiveConfig.optimizeResult) {
        this.optimizeMesh(resultMesh);
      }

      // Preserve materials if requested
      if (effectiveConfig.preserveMaterials && meshA.material) {
        resultMesh.material = meshA.material;
      }

      const totalTime = performance.now() - startTime;

      // Create performance metrics
      const performanceMetrics: CSGPerformanceMetrics = {
        preparationTime,
        operationTime,
        conversionTime,
        totalTime,
        memoryUsage: this.estimateMemoryUsage(resultMesh),
      };

      // Create metadata
      const metadata: CSGOperationMetadata = {
        operationId,
        timestamp: new Date(),
        inputMeshIds: [meshA.id, meshB.id],
        babylonVersion: '8.16.1',
        performance: performanceMetrics,
      };

      // Create result
      const result: CSGOperationResult = {
        resultMesh,
        operationType: operation,
        operationTime: totalTime,
        triangleCount: this.getTriangleCount(resultMesh),
        vertexCount: this.getVertexCount(resultMesh),
        isOptimized: effectiveConfig.optimizeResult,
        metadata,
      };

      logger.debug(`[DEBUG][BabylonCSG2Service] ${operation} operation completed in ${totalTime.toFixed(2)}ms`);
      return result;
    }, (error) => {
      // If error is already a CSGError, preserve it
      if (error && typeof error === 'object' && 'code' in error) {
        return error as CSGError;
      }
      return this.createError('OPERATION_FAILED', `CSG ${operation} operation failed: ${error}`);
    });
  }

  /**
   * Validate input meshes
   */
  private validateMeshes(meshA: Mesh, meshB: Mesh): void {
    if (!meshA || !meshB) {
      throw this.createError('INVALID_MESH', 'Both meshes are required for CSG operations');
    }

    if (!meshA.geometry || !meshB.geometry) {
      throw this.createError('INVALID_MESH', 'Meshes must have valid geometry');
    }

    // Check for manifold geometry (simplified check)
    if (!this.isManifoldGeometry(meshA) || !this.isManifoldGeometry(meshB)) {
      throw this.createError('NON_MANIFOLD_GEOMETRY', 'Meshes must have manifold geometry for CSG operations');
    }
  }

  /**
   * Check if mesh has manifold geometry (simplified check)
   */
  private isManifoldGeometry(mesh: Mesh): boolean {
    // This is a simplified check - in practice, you'd want more thorough validation
    const positions = mesh.getVerticesData('position');
    const indices = mesh.getIndices();
    
    return !!(positions && indices && positions.length > 0 && indices.length > 0);
  }

  /**
   * Optimize mesh after CSG operation
   */
  private optimizeMesh(mesh: Mesh): void {
    // Apply mesh optimization techniques
    // This could include vertex welding, normal recalculation, etc.
    mesh.createNormals(true);
    mesh.optimizeIndices();
  }

  /**
   * Get triangle count from mesh
   */
  private getTriangleCount(mesh: Mesh): number {
    const indices = mesh.getIndices();
    return indices ? indices.length / 3 : 0;
  }

  /**
   * Get vertex count from mesh
   */
  private getVertexCount(mesh: Mesh): number {
    const positions = mesh.getVerticesData('position');
    return positions ? positions.length / 3 : 0;
  }

  /**
   * Estimate memory usage of mesh
   */
  private estimateMemoryUsage(mesh: Mesh): number {
    const positions = mesh.getVerticesData('position');
    const indices = mesh.getIndices();
    const normals = mesh.getVerticesData('normal');
    const uvs = mesh.getVerticesData('uv');

    let memoryUsage = 0;
    if (positions) memoryUsage += positions.length * 4; // 4 bytes per float
    if (indices) memoryUsage += indices.length * 4; // 4 bytes per index
    if (normals) memoryUsage += normals.length * 4;
    if (uvs) memoryUsage += uvs.length * 4;

    return memoryUsage;
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `csg_op_${++this.operationCounter}_${Date.now()}`;
  }

  /**
   * Create CSG error
   */
  private createError(code: CSGErrorCode, message: string, details?: unknown): CSGError {
    return {
      code,
      message,
      operation: this.config.operation,
      details,
      timestamp: new Date(),
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): CSGOperationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CSGOperationConfig>): void {
    this.config = { ...this.config, ...config };
    logger.debug('[DEBUG][BabylonCSG2Service] Configuration updated');
  }

  /**
   * Dispose the service and clean up resources
   */
  dispose(): void {
    logger.debug('[DEBUG][BabylonCSG2Service] Disposing CSG2 service...');
    
    this.scene = null;
    this.operationCounter = 0;
    
    logger.end('[END][BabylonCSG2Service] CSG2 service disposed');
  }
}
