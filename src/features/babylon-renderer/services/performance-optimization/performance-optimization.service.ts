/**
 * @file Performance Optimization Service
 *
 * Service for implementing Level-of-Detail (LOD) and other performance optimizations
 * for complex OpenSCAD scenes. Provides automatic mesh optimization, distance-based
 * LOD switching, and performance monitoring.
 *
 * @example
 * ```typescript
 * const perfService = new PerformanceOptimizationService(scene);
 *
 * // Setup LOD for a mesh
 * const result = await perfService.setupLOD(mesh, {
 *   distances: [10, 50, 100],
 *   reductionFactors: [1.0, 0.5, 0.25],
 *   enableCulling: true
 * });
 * ```
 */

import {
  type Camera,
  Frustum,
  type InstancedMesh,
  Mesh,
  QuadraticErrorSimplification,
  Ray,
  type Scene,
  type SimplificationSettings,
  Vector3,
} from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';

const logger = createLogger('PerformanceOptimization');

/**
 * LOD Level interface (since not exported from BabylonJS)
 */
interface LODLevel {
  distance: number;
  mesh: Mesh | null;
}

/**
 * Default instancing configuration
 */
const DEFAULT_INSTANCING_CONFIG: InstancingConfig = {
  enabled: true,
  minInstanceCount: 3,
  maxInstanceCount: 1000,
  geometryTolerance: 0.001,
  enableAutoDetection: true,
  preserveMaterials: true,
};

/**
 * Default culling configuration
 */
const DEFAULT_CULLING_CONFIG: CullingConfig = {
  enabled: true,
  method: 'both',
  frustumCullingEnabled: true,
  occlusionCullingEnabled: true,
  occlusionQueryThreshold: 0.01,
  frustumMargin: 0.1,
  updateFrequency: 100, // Update every 100ms
};

/**
 * LOD quality levels
 */
export type LODQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Performance optimization error codes
 */
export enum PerformanceOptimizationErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  LOD_SETUP_FAILED = 'LOD_SETUP_FAILED',
  MESH_SIMPLIFICATION_FAILED = 'MESH_SIMPLIFICATION_FAILED',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  SCENE_NOT_READY = 'SCENE_NOT_READY',
  CAMERA_NOT_FOUND = 'CAMERA_NOT_FOUND',
  MESH_NOT_VALID = 'MESH_NOT_VALID',
  INSTANCING_SETUP_FAILED = 'INSTANCING_SETUP_FAILED',
  GEOMETRY_COMPARISON_FAILED = 'GEOMETRY_COMPARISON_FAILED',
  INSTANCE_CREATION_FAILED = 'INSTANCE_CREATION_FAILED',
  CULLING_SETUP_FAILED = 'CULLING_SETUP_FAILED',
  FRUSTUM_CULLING_FAILED = 'FRUSTUM_CULLING_FAILED',
  OCCLUSION_CULLING_FAILED = 'OCCLUSION_CULLING_FAILED',
}

/**
 * Performance optimization error
 */
export class PerformanceOptimizationError extends Error {
  constructor(
    public readonly code: PerformanceOptimizationErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PerformanceOptimizationError';
  }
}

/**
 * LOD configuration
 */
export interface LODConfig {
  readonly distances: readonly number[];
  readonly reductionFactors: readonly number[];
  readonly enableCulling?: boolean;
  readonly quality?: LODQuality;
  readonly preserveUVs?: boolean;
  readonly preserveNormals?: boolean;
  readonly aggressiveness?: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  readonly frameRate: number;
  readonly renderTime: number;
  readonly triangleCount: number;
  readonly meshCount: number;
  readonly lodSwitches: number;
  readonly instanceCount: number;
  readonly instanceGroups: number;
  readonly visibleMeshes: number;
  readonly culledMeshes: number;
  readonly frustumCulled: number;
  readonly occlusionCulled: number;
  readonly memoryUsage: number;
  readonly lastUpdated: Date;
}

/**
 * LOD setup result
 */
export interface LODSetupResult {
  readonly originalMesh: Mesh;
  readonly lodLevels: readonly LODLevel[];
  readonly triangleReduction: number;
  readonly memoryReduction: number;
}

/**
 * Instancing configuration
 */
export interface InstancingConfig {
  readonly enabled: boolean;
  readonly minInstanceCount: number;
  readonly maxInstanceCount: number;
  readonly geometryTolerance: number;
  readonly enableAutoDetection: boolean;
  readonly preserveMaterials: boolean;
}

/**
 * Geometry signature for comparison
 */
export interface GeometrySignature {
  readonly vertexCount: number;
  readonly indexCount: number;
  readonly boundingBoxHash: string;
  readonly geometryHash: string;
}

/**
 * Instance group information
 */
export interface InstanceGroup {
  readonly masterMesh: Mesh;
  readonly instances: readonly InstancedMesh[];
  readonly signature: GeometrySignature;
  readonly memoryReduction: number;
  readonly renderingImprovement: number;
}

/**
 * Instancing setup result
 */
export interface InstancingSetupResult {
  readonly instanceGroups: readonly InstanceGroup[];
  readonly totalMemoryReduction: number;
  readonly totalRenderingImprovement: number;
  readonly instanceCount: number;
}

/**
 * Culling method types
 */
export type CullingMethod = 'frustum' | 'occlusion' | 'both';

/**
 * Culling configuration
 */
export interface CullingConfig {
  readonly enabled: boolean;
  readonly method: CullingMethod;
  readonly frustumCullingEnabled: boolean;
  readonly occlusionCullingEnabled: boolean;
  readonly occlusionQueryThreshold: number;
  readonly frustumMargin: number;
  readonly updateFrequency: number;
}

/**
 * Culling statistics
 */
export interface CullingStats {
  readonly totalMeshes: number;
  readonly visibleMeshes: number;
  readonly frustumCulled: number;
  readonly occlusionCulled: number;
  readonly renderingImprovement: number;
  readonly lastUpdate: Date;
}

/**
 * Culling setup result
 */
export interface CullingSetupResult {
  readonly stats: CullingStats;
  readonly renderingImprovement: number;
  readonly culledMeshCount: number;
}

/**
 * Performance optimization state
 */
export interface PerformanceOptimizationState {
  readonly isInitialized: boolean;
  readonly activeLODs: Map<string, LODSetupResult>;
  readonly activeInstances: Map<string, InstanceGroup>;
  readonly geometrySignatures: Map<string, GeometrySignature>;
  readonly cullingStats: CullingStats;
  readonly culledMeshes: Set<string>;
  readonly metrics: PerformanceMetrics;
  readonly lastOptimization: Date;
}

/**
 * Performance Optimization Service
 *
 * Provides comprehensive performance optimization for BabylonJS scenes including:
 * - Level-of-Detail (LOD) implementation
 * - Automatic mesh simplification
 * - Distance-based culling
 * - Performance monitoring and metrics
 * - Memory optimization
 */
export class PerformanceOptimizationService {
  private readonly scene: Scene;
  private state: PerformanceOptimizationState;
  private simplifier: QuadraticErrorSimplification | null = null;
  private performanceMonitor: NodeJS.Timeout | null = null;
  private cullingMonitor: NodeJS.Timeout | null = null;
  private instancingConfig: InstancingConfig;
  private cullingConfig: CullingConfig;

  constructor(
    scene: Scene,
    instancingConfig: Partial<InstancingConfig> = {},
    cullingConfig: Partial<CullingConfig> = {}
  ) {
    this.scene = scene;
    this.instancingConfig = { ...DEFAULT_INSTANCING_CONFIG, ...instancingConfig };
    this.cullingConfig = { ...DEFAULT_CULLING_CONFIG, ...cullingConfig };
    this.state = {
      isInitialized: false,
      activeLODs: new Map(),
      activeInstances: new Map(),
      geometrySignatures: new Map(),
      cullingStats: {
        totalMeshes: 0,
        visibleMeshes: 0,
        frustumCulled: 0,
        occlusionCulled: 0,
        renderingImprovement: 0,
        lastUpdate: new Date(),
      },
      culledMeshes: new Set(),
      metrics: {
        frameRate: 0,
        renderTime: 0,
        triangleCount: 0,
        meshCount: 0,
        lodSwitches: 0,
        instanceCount: 0,
        instanceGroups: 0,
        visibleMeshes: 0,
        culledMeshes: 0,
        frustumCulled: 0,
        occlusionCulled: 0,
        memoryUsage: 0,
        lastUpdated: new Date(),
      },
      lastOptimization: new Date(),
    };
    logger.init('[INIT] Performance optimization service initialized');
  }

  /**
   * Initialize the performance optimization service
   */
  async initialize(): Promise<Result<void, PerformanceOptimizationError>> {
    return tryCatchAsync(
      async () => {
        // Initialize mesh simplifier (will be set per mesh during LOD setup)
        this.simplifier = null;

        // Start performance monitoring
        this.startPerformanceMonitoring();

        // Start culling monitoring if enabled
        if (this.cullingConfig.enabled) {
          this.startCullingMonitoring();
        }

        this.state = {
          ...this.state,
          isInitialized: true,
          lastOptimization: new Date(),
        };

        logger.debug('[INIT] Performance optimization service initialized successfully');
      },
      (error) =>
        this.createError(
          PerformanceOptimizationErrorCode.INITIALIZATION_FAILED,
          `Failed to initialize performance optimization service: ${error instanceof Error ? error.message : String(error)}`,
          { error }
        )
    );
  }

  /**
   * Setup Level-of-Detail (LOD) for a mesh
   */
  async setupLOD(
    mesh: Mesh,
    config: LODConfig
  ): Promise<Result<LODSetupResult, PerformanceOptimizationError>> {
    try {
      if (!this.state.isInitialized) {
        return {
          success: false,
          error: this.createError(
            PerformanceOptimizationErrorCode.SCENE_NOT_READY,
            'Performance optimization service not initialized'
          ),
        };
      }

      if (!mesh || !mesh.geometry) {
        return {
          success: false,
          error: this.createError(
            PerformanceOptimizationErrorCode.MESH_NOT_VALID,
            'Invalid mesh provided for LOD setup'
          ),
        };
      }

      // Validate configuration
      try {
        this.validateLODConfig(config);
      } catch (error) {
        if (error instanceof PerformanceOptimizationError) {
          return { success: false, error };
        }
        return {
          success: false,
          error: this.createError(
            PerformanceOptimizationErrorCode.INVALID_CONFIGURATION,
            `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`
          ),
        };
      }

      const originalTriangleCount = this.getTriangleCount(mesh);
      const lodLevels: LODLevel[] = [];

      logger.debug(
        `[LOD_SETUP] Setting up LOD for mesh: ${mesh.name} with ${originalTriangleCount} triangles`
      );

      // Create LOD levels based on distances and reduction factors
      for (let i = 0; i < config.distances.length; i++) {
        const distance = config.distances[i]!;
        const reductionFactor = config.reductionFactors[i] || 1.0;

        if (reductionFactor >= 1.0) {
          // Use original mesh for highest quality
          mesh.addLODLevel(distance, mesh);
          lodLevels.push({ distance, mesh });
        } else {
          // Create simplified mesh
          const simplifiedMesh = await this.createSimplifiedMesh(mesh, reductionFactor, config);
          if (simplifiedMesh) {
            mesh.addLODLevel(distance, simplifiedMesh);
            lodLevels.push({ distance, mesh: simplifiedMesh });
          } else {
            // Fallback to original mesh if simplification fails (e.g., in headless environment)
            mesh.addLODLevel(distance, mesh);
            lodLevels.push({ distance, mesh });
            logger.warn(
              `[LOD_SETUP] Simplification failed for distance ${distance}, using original mesh`
            );
          }
        }
      }

      // Add culling level if enabled
      if (config.enableCulling && config.distances.length > 0) {
        const maxDistance = Math.max(...config.distances);
        const cullingDistance = maxDistance * 2;
        mesh.addLODLevel(cullingDistance, null);
        lodLevels.push({ distance: cullingDistance, mesh: null });
      }

      const finalTriangleCount = lodLevels.reduce((sum, level) => {
        return sum + (level.mesh ? this.getTriangleCount(level.mesh) : 0);
      }, 0);

      const triangleReduction =
        originalTriangleCount > 0
          ? Math.max(0, (originalTriangleCount - finalTriangleCount) / originalTriangleCount)
          : 0;

      const result: LODSetupResult = {
        originalMesh: mesh,
        lodLevels,
        triangleReduction,
        memoryReduction: Math.max(
          0,
          this.estimateMemoryReduction(originalTriangleCount, finalTriangleCount)
        ),
      };

      // Store LOD setup
      this.state.activeLODs.set(mesh.uniqueId.toString(), result);

      logger.debug(
        `[LOD_SETUP] LOD setup completed for ${mesh.name}. ` +
          `Triangle reduction: ${(result.triangleReduction * 100).toFixed(1)}%`
      );

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: this.createError(
          PerformanceOptimizationErrorCode.LOD_SETUP_FAILED,
          `Failed to setup LOD for mesh: ${error instanceof Error ? error.message : String(error)}`,
          { meshName: mesh?.name, error }
        ),
      };
    }
  }

  /**
   * Create a simplified version of a mesh
   */
  private async createSimplifiedMesh(
    originalMesh: Mesh,
    reductionFactor: number,
    config: LODConfig
  ): Promise<Mesh | null> {
    try {
      const _targetTriangleCount = Math.floor(
        this.getTriangleCount(originalMesh) * reductionFactor
      );

      const simplificationSettings: SimplificationSettings = {
        quality: this.getSimplificationQuality(config.quality || 'medium'),
        distance: 0,
        optimizeMesh: true,
      };

      // Create mesh-specific simplifier
      const meshSimplifier = new QuadraticErrorSimplification(originalMesh);

      // Create simplified mesh using BabylonJS simplification
      return new Promise<Mesh | null>((resolve) => {
        try {
          meshSimplifier.simplify(simplificationSettings, (simplifiedMesh: Mesh) => {
            if (simplifiedMesh) {
              simplifiedMesh.name = `${originalMesh.name}_LOD_${reductionFactor}`;
              simplifiedMesh.setParent(originalMesh.parent);

              // Copy material
              simplifiedMesh.material = originalMesh.material;

              logger.debug(
                `[MESH_SIMPLIFICATION] Created simplified mesh: ${simplifiedMesh.name} ` +
                  `(${this.getTriangleCount(simplifiedMesh)} triangles)`
              );

              resolve(simplifiedMesh);
            } else {
              logger.warn('[MESH_SIMPLIFICATION] Simplification returned null mesh');
              resolve(null);
            }
          });
        } catch (simplifyError) {
          logger.warn(`[MESH_SIMPLIFICATION] Simplify call failed: ${simplifyError}`);
          resolve(null);
        }

        // Add timeout to prevent hanging in headless environments
        setTimeout(() => {
          logger.warn('[MESH_SIMPLIFICATION] Simplification timeout, resolving with null');
          resolve(null);
        }, 1000);
      });
    } catch (error) {
      logger.warn(`[MESH_SIMPLIFICATION] Failed to simplify mesh ${originalMesh.name}: ${error}`);
      return null;
    }
  }

  /**
   * Get triangle count for a mesh
   */
  private getTriangleCount(mesh: Mesh): number {
    if (!mesh || !mesh.geometry) return 0;
    try {
      const indices = mesh.getIndices();
      return indices ? indices.length / 3 : 0;
    } catch (error) {
      logger.warn(`[TRIANGLE_COUNT] Failed to get triangle count for mesh ${mesh.name}: ${error}`);
      return 0;
    }
  }

  /**
   * Validate LOD configuration
   */
  private validateLODConfig(config: LODConfig): void {
    if (!config.distances || config.distances.length === 0) {
      throw this.createError(
        PerformanceOptimizationErrorCode.INVALID_CONFIGURATION,
        'LOD distances array cannot be empty'
      );
    }

    if (!config.reductionFactors || config.reductionFactors.length !== config.distances.length) {
      throw this.createError(
        PerformanceOptimizationErrorCode.INVALID_CONFIGURATION,
        'Reduction factors array must match distances array length'
      );
    }

    // Validate distances are in ascending order
    for (let i = 1; i < config.distances.length; i++) {
      if (config.distances[i]! <= config.distances[i - 1]!) {
        throw this.createError(
          PerformanceOptimizationErrorCode.INVALID_CONFIGURATION,
          'LOD distances must be in ascending order'
        );
      }
    }

    // Validate reduction factors are between 0 and 1
    for (const factor of config.reductionFactors) {
      if (factor < 0 || factor > 1) {
        throw this.createError(
          PerformanceOptimizationErrorCode.INVALID_CONFIGURATION,
          'Reduction factors must be between 0 and 1'
        );
      }
    }
  }

  /**
   * Get simplification quality setting
   */
  private getSimplificationQuality(quality: LODQuality): number {
    switch (quality) {
      case 'low':
        return 0.1;
      case 'medium':
        return 0.5;
      case 'high':
        return 0.8;
      case 'ultra':
        return 0.95;
      default:
        return 0.5;
    }
  }

  /**
   * Estimate memory reduction
   */
  private estimateMemoryReduction(originalTriangles: number, finalTriangles: number): number {
    if (originalTriangles <= 0) return 0;

    // Rough estimation: each triangle uses ~36 bytes (3 vertices * 12 bytes per vertex)
    const originalMemory = originalTriangles * 36;
    const finalMemory = finalTriangles * 36;
    return Math.max(0, (originalMemory - finalMemory) / originalMemory);
  }

  /**
   * Setup instancing for a group of meshes with similar geometry
   */
  async setupInstancing(
    meshes: readonly Mesh[]
  ): Promise<Result<InstancingSetupResult, PerformanceOptimizationError>> {
    if (!this.state.isInitialized) {
      return {
        success: false,
        error: this.createError(
          PerformanceOptimizationErrorCode.SCENE_NOT_READY,
          'Performance optimization service not initialized'
        ),
      };
    }

    if (!this.instancingConfig.enabled) {
      return {
        success: false,
        error: this.createError(
          PerformanceOptimizationErrorCode.INVALID_CONFIGURATION,
          'Instancing is disabled in configuration'
        ),
      };
    }

    try {
      logger.debug(`[INSTANCING] Setting up instancing for ${meshes.length} meshes`);

      // Group meshes by geometry signature
      const geometryGroups = await this.groupMeshesByGeometry(meshes);
      const instanceGroups: InstanceGroup[] = [];

      for (const [signature, groupMeshes] of geometryGroups) {
        if (groupMeshes.length >= this.instancingConfig.minInstanceCount) {
          const instanceGroup = await this.createInstanceGroup(groupMeshes, signature);
          if (instanceGroup) {
            instanceGroups.push(instanceGroup);
            this.state.activeInstances.set(signature.geometryHash, instanceGroup);
          }
        }
      }

      const result: InstancingSetupResult = {
        instanceGroups,
        totalMemoryReduction: instanceGroups.reduce((sum, group) => sum + group.memoryReduction, 0),
        totalRenderingImprovement: instanceGroups.reduce(
          (sum, group) => sum + group.renderingImprovement,
          0
        ),
        instanceCount: instanceGroups.reduce((sum, group) => sum + group.instances.length, 0),
      };

      logger.debug(
        `[INSTANCING] Created ${instanceGroups.length} instance groups with ` +
          `${result.instanceCount} total instances. ` +
          `Memory reduction: ${(result.totalMemoryReduction * 100).toFixed(1)}%`
      );

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: this.createError(
          PerformanceOptimizationErrorCode.INSTANCING_SETUP_FAILED,
          `Failed to setup instancing: ${error instanceof Error ? error.message : String(error)}`,
          { meshCount: meshes.length, error }
        ),
      };
    }
  }

  /**
   * Group meshes by geometry signature
   */
  private async groupMeshesByGeometry(
    meshes: readonly Mesh[]
  ): Promise<Map<GeometrySignature, Mesh[]>> {
    const groups = new Map<string, { signature: GeometrySignature; meshes: Mesh[] }>();

    for (const mesh of meshes) {
      try {
        const signature = await this.calculateGeometrySignature(mesh);
        const key = signature.geometryHash;

        if (groups.has(key)) {
          groups.get(key)?.meshes.push(mesh);
        } else {
          groups.set(key, { signature, meshes: [mesh] });
        }

        // Store signature for future reference
        this.state.geometrySignatures.set(mesh.uniqueId.toString(), signature);
      } catch (error) {
        logger.warn(`[GEOMETRY_GROUPING] Failed to process mesh ${mesh.name}: ${error}`);
      }
    }

    // Convert to Map<GeometrySignature, Mesh[]>
    const result = new Map<GeometrySignature, Mesh[]>();
    for (const { signature, meshes: groupMeshes } of groups.values()) {
      result.set(signature, groupMeshes);
    }

    return result;
  }

  /**
   * Calculate geometry signature for a mesh
   */
  private async calculateGeometrySignature(mesh: Mesh): Promise<GeometrySignature> {
    if (!mesh.geometry) {
      throw this.createError(
        PerformanceOptimizationErrorCode.GEOMETRY_COMPARISON_FAILED,
        'Mesh has no geometry'
      );
    }

    try {
      const vertices = mesh.getVerticesData('position') || [];
      const indices = mesh.getIndices() || [];
      const boundingInfo = mesh.getBoundingInfo();

      // Create a simple hash of the geometry
      const vertexHash = this.hashArray(vertices);
      const indexHash = this.hashArray(indices);
      const boundingBoxHash = this.hashBoundingBox(boundingInfo);

      const geometryHash = `${vertexHash}_${indexHash}_${boundingBoxHash}`;

      return {
        vertexCount: vertices.length / 3, // Assuming 3 components per vertex
        indexCount: indices.length,
        boundingBoxHash,
        geometryHash,
      };
    } catch (error) {
      throw this.createError(
        PerformanceOptimizationErrorCode.GEOMETRY_COMPARISON_FAILED,
        `Failed to calculate geometry signature: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create instance group from similar meshes
   */
  private async createInstanceGroup(
    meshes: readonly Mesh[],
    signature: GeometrySignature
  ): Promise<InstanceGroup | null> {
    if (meshes.length === 0) return null;

    try {
      const masterMesh = meshes[0];
      if (!masterMesh) return null;

      const instances: InstancedMesh[] = [];

      // Create instances for all meshes except the first (master)
      for (let i = 1; i < meshes.length; i++) {
        const sourceMesh = meshes[i];
        if (!sourceMesh) continue;

        const instance = masterMesh.createInstance(`${masterMesh.name}_instance_${i}`);

        // Copy transformation from source mesh
        instance.position = sourceMesh.position.clone();
        instance.rotation = sourceMesh.rotation.clone();
        instance.scaling = sourceMesh.scaling.clone();

        // Copy material if preserveMaterials is enabled
        if (this.instancingConfig.preserveMaterials && sourceMesh.material) {
          instance.material = sourceMesh.material;
        }

        instances.push(instance);

        // Hide or dispose the original mesh
        sourceMesh.setEnabled(false);
      }

      // Calculate performance improvements
      const originalMemory = meshes.length * this.estimateMeshMemory(masterMesh);
      const instancedMemory = this.estimateMeshMemory(masterMesh) + instances.length * 64; // 64 bytes per instance
      const memoryReduction = (originalMemory - instancedMemory) / originalMemory;

      // Rendering improvement is roughly proportional to the number of instances
      const renderingImprovement = Math.min(0.8, (instances.length - 1) / instances.length);

      return {
        masterMesh,
        instances,
        signature,
        memoryReduction,
        renderingImprovement,
      };
    } catch (error) {
      logger.warn(`[INSTANCE_CREATION] Failed to create instance group: ${error}`);
      return null;
    }
  }

  /**
   * Hash an array of numbers for geometry comparison
   */
  private hashArray(array: ArrayLike<number> | null): string {
    if (!array || array.length === 0) return '0';

    // Simple hash function for geometry comparison
    let hash = 0;
    for (let i = 0; i < Math.min(array.length, 1000); i += 10) {
      // Sample every 10th element for performance
      hash = ((hash << 5) - hash + array[i]!) & 0xffffffff;
    }
    return hash.toString(16);
  }

  /**
   * Hash bounding box for geometry comparison
   */
  private hashBoundingBox(boundingInfo: any): string {
    if (!boundingInfo || !boundingInfo.boundingBox) {
      return '0';
    }

    const min = boundingInfo.boundingBox.minimumWorld;
    const max = boundingInfo.boundingBox.maximumWorld;

    const values = [
      Math.round(min.x * 1000) / 1000,
      Math.round(min.y * 1000) / 1000,
      Math.round(min.z * 1000) / 1000,
      Math.round(max.x * 1000) / 1000,
      Math.round(max.y * 1000) / 1000,
      Math.round(max.z * 1000) / 1000,
    ];

    return values.join('_');
  }

  /**
   * Estimate memory usage of a single mesh
   */
  private estimateMeshMemory(mesh: Mesh): number {
    if (!mesh.geometry) return 0;

    const vertices = mesh.getVerticesData('position') || [];
    const indices = mesh.getIndices() || [];

    // Rough estimation:
    // - 12 bytes per vertex (3 floats for position)
    // - 4 bytes per index
    // - Additional overhead for normals, UVs, etc.
    const vertexMemory = vertices.length * 4; // 4 bytes per float
    const indexMemory = indices.length * 4; // 4 bytes per index
    const overhead = 1024; // Rough overhead for mesh structure

    return vertexMemory + indexMemory + overhead;
  }

  /**
   * Update instancing configuration
   */
  updateInstancingConfig(config: Partial<InstancingConfig>): void {
    this.instancingConfig = { ...this.instancingConfig, ...config };
    logger.debug('[CONFIG] Instancing configuration updated');
  }

  /**
   * Get current instancing configuration
   */
  getInstancingConfig(): InstancingConfig {
    return { ...this.instancingConfig };
  }

  /**
   * Clear all active instances
   */
  clearInstances(): void {
    for (const instanceGroup of this.state.activeInstances.values()) {
      // Re-enable original meshes
      for (const instance of instanceGroup.instances) {
        instance.dispose();
      }
    }

    this.state.activeInstances.clear();
    this.state.geometrySignatures.clear();

    logger.debug('[INSTANCING] All instances cleared');
  }

  /**
   * Setup culling for the scene
   */
  async setupCulling(): Promise<Result<CullingSetupResult, PerformanceOptimizationError>> {
    if (!this.state.isInitialized) {
      return {
        success: false,
        error: this.createError(
          PerformanceOptimizationErrorCode.SCENE_NOT_READY,
          'Performance optimization service not initialized'
        ),
      };
    }

    if (!this.cullingConfig.enabled) {
      return {
        success: false,
        error: this.createError(
          PerformanceOptimizationErrorCode.INVALID_CONFIGURATION,
          'Culling is disabled in configuration'
        ),
      };
    }

    try {
      logger.debug('[CULLING] Setting up culling for scene');

      const stats = await this.performCullingPass();

      const result: CullingSetupResult = {
        stats,
        renderingImprovement: stats.renderingImprovement,
        culledMeshCount: stats.frustumCulled + stats.occlusionCulled,
      };

      logger.debug(
        `[CULLING] Culling setup complete. ` +
          `Culled ${result.culledMeshCount} meshes (${stats.frustumCulled} frustum, ${stats.occlusionCulled} occlusion). ` +
          `Rendering improvement: ${(result.renderingImprovement * 100).toFixed(1)}%`
      );

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: this.createError(
          PerformanceOptimizationErrorCode.CULLING_SETUP_FAILED,
          `Failed to setup culling: ${error instanceof Error ? error.message : String(error)}`,
          { error }
        ),
      };
    }
  }

  /**
   * Perform a culling pass on all meshes in the scene
   */
  private async performCullingPass(): Promise<CullingStats> {
    const camera = this.scene.activeCamera;
    if (!camera) {
      throw this.createError(
        PerformanceOptimizationErrorCode.CAMERA_NOT_FOUND,
        'No active camera found for culling'
      );
    }

    const meshes = this.scene.meshes.filter((mesh) => mesh instanceof Mesh) as Mesh[];
    const totalMeshes = meshes.length;
    let frustumCulled = 0;
    let occlusionCulled = 0;
    let visibleMeshes = 0;

    // Clear previous culling state
    this.state.culledMeshes.clear();

    for (const mesh of meshes) {
      let isCulled = false;

      // Frustum culling
      if (this.cullingConfig.frustumCullingEnabled && !isCulled) {
        if (this.isFrustumCulled(mesh, camera)) {
          frustumCulled++;
          isCulled = true;
          this.state.culledMeshes.add(mesh.uniqueId.toString());
          mesh.setEnabled(false);
        }
      }

      // Occlusion culling (only if not already frustum culled)
      if (this.cullingConfig.occlusionCullingEnabled && !isCulled) {
        if (await this.isOcclusionCulled(mesh)) {
          occlusionCulled++;
          isCulled = true;
          this.state.culledMeshes.add(mesh.uniqueId.toString());
          mesh.setEnabled(false);
        }
      }

      // If not culled, ensure mesh is visible
      if (!isCulled) {
        visibleMeshes++;
        mesh.setEnabled(true);
      }
    }

    const renderingImprovement =
      totalMeshes > 0 ? (frustumCulled + occlusionCulled) / totalMeshes : 0;

    const stats: CullingStats = {
      totalMeshes,
      visibleMeshes,
      frustumCulled,
      occlusionCulled,
      renderingImprovement,
      lastUpdate: new Date(),
    };

    // Update state
    this.state = {
      ...this.state,
      cullingStats: stats,
    };

    return stats;
  }

  /**
   * Check if a mesh is outside the camera frustum
   */
  private isFrustumCulled(mesh: Mesh, camera: Camera): boolean {
    try {
      const boundingInfo = mesh.getBoundingInfo();
      if (!boundingInfo) return false;

      // Get camera frustum
      const frustum = Frustum.GetPlanes(camera.getTransformationMatrix());

      // Check if bounding sphere is outside frustum
      const boundingSphere = boundingInfo.boundingSphere;

      // Add margin for better culling accuracy
      const radius = boundingSphere.radius + this.cullingConfig.frustumMargin;

      for (const plane of frustum) {
        const distance = Vector3.Dot(plane.normal, boundingSphere.center) + plane.d;
        if (distance < -radius) {
          return true; // Outside this frustum plane
        }
      }

      return false; // Inside frustum
    } catch (error) {
      logger.warn(`[FRUSTUM_CULLING] Error checking mesh ${mesh.name}: ${error}`);
      return false; // Don't cull if there's an error
    }
  }

  /**
   * Check if a mesh is occluded by other objects
   */
  private async isOcclusionCulled(mesh: Mesh): Promise<boolean> {
    try {
      // Simple occlusion test - check if mesh center is visible
      const camera = this.scene.activeCamera;
      if (!camera) return false;

      const meshCenter = mesh.getBoundingInfo()?.boundingSphere.center;
      if (!meshCenter) return false;

      // Cast ray from camera to mesh center
      const ray = camera.position.subtract(meshCenter).normalize();
      const distance = Vector3.Distance(camera.position, meshCenter);

      const hit = this.scene.pickWithRay(
        new Ray(camera.position, ray),
        (pickedMesh) => pickedMesh !== mesh && pickedMesh.isEnabled()
      );

      // If we hit something closer than the mesh, it's occluded
      if (hit?.hit && hit.distance < distance - this.cullingConfig.occlusionQueryThreshold) {
        return true;
      }

      return false;
    } catch (error) {
      logger.warn(`[OCCLUSION_CULLING] Error checking mesh ${mesh.name}: ${error}`);
      return false; // Don't cull if there's an error
    }
  }

  /**
   * Start culling monitoring
   */
  private startCullingMonitoring(): void {
    if (this.cullingConfig.enabled && this.cullingConfig.updateFrequency > 0) {
      this.cullingMonitor = setInterval(async () => {
        try {
          await this.performCullingPass();
        } catch (error) {
          logger.warn(`[CULLING_MONITOR] Error during culling pass: ${error}`);
        }
      }, this.cullingConfig.updateFrequency);

      logger.debug('[CULLING] Culling monitoring started');
    }
  }

  /**
   * Update culling configuration
   */
  updateCullingConfig(config: Partial<CullingConfig>): void {
    const oldEnabled = this.cullingConfig.enabled;
    this.cullingConfig = { ...this.cullingConfig, ...config };

    // Restart monitoring if enabled state changed
    if (oldEnabled !== this.cullingConfig.enabled) {
      if (this.cullingMonitor) {
        clearInterval(this.cullingMonitor);
        this.cullingMonitor = null;
      }

      if (this.cullingConfig.enabled && this.state.isInitialized) {
        this.startCullingMonitoring();
      }
    }

    logger.debug('[CONFIG] Culling configuration updated');
  }

  /**
   * Get current culling configuration
   */
  getCullingConfig(): CullingConfig {
    return { ...this.cullingConfig };
  }

  /**
   * Get current culling statistics
   */
  getCullingStats(): CullingStats {
    return { ...this.state.cullingStats };
  }

  /**
   * Clear culling state and re-enable all meshes
   */
  clearCulling(): void {
    // Re-enable all culled meshes
    for (const meshId of this.state.culledMeshes) {
      const mesh = this.scene.getMeshByUniqueId(parseInt(meshId));
      if (mesh) {
        mesh.setEnabled(true);
      }
    }

    this.state.culledMeshes.clear();

    // Reset culling stats
    this.state = {
      ...this.state,
      cullingStats: {
        totalMeshes: 0,
        visibleMeshes: 0,
        frustumCulled: 0,
        occlusionCulled: 0,
        renderingImprovement: 0,
        lastUpdate: new Date(),
      },
    };

    logger.debug('[CULLING] All culling cleared');
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Only start monitoring if we have a valid scene and engine
    if (this.scene?.getEngine()) {
      this.performanceMonitor = setInterval(() => {
        try {
          this.updatePerformanceMetrics();
        } catch (error) {
          logger.warn(`[PERFORMANCE_MONITOR] Error updating metrics: ${error}`);
        }
      }, 1000); // Update every second
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    if (!this.scene) return;

    const engine = this.scene.getEngine();
    if (!engine) return;

    // Calculate instancing metrics
    const instanceCount = Array.from(this.state.activeInstances.values()).reduce(
      (sum, group) => sum + group.instances.length,
      0
    );
    const instanceGroups = this.state.activeInstances.size;

    // Calculate culling metrics
    const cullingStats = this.state.cullingStats;

    this.state = {
      ...this.state,
      metrics: {
        frameRate: engine.getFps() || 0,
        renderTime: engine.getDeltaTime() || 0,
        triangleCount: this.getTotalTriangleCount(),
        meshCount: this.scene.meshes?.length || 0,
        lodSwitches: this.state.metrics.lodSwitches, // Updated elsewhere
        instanceCount,
        instanceGroups,
        visibleMeshes: cullingStats.visibleMeshes,
        culledMeshes: cullingStats.frustumCulled + cullingStats.occlusionCulled,
        frustumCulled: cullingStats.frustumCulled,
        occlusionCulled: cullingStats.occlusionCulled,
        memoryUsage: this.estimateMemoryUsage(),
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Get total triangle count in scene
   */
  private getTotalTriangleCount(): number {
    if (!this.scene || !this.scene.meshes) return 0;

    return this.scene.meshes.reduce((total, mesh) => {
      if (mesh instanceof Mesh) {
        return total + this.getTriangleCount(mesh);
      }
      return total;
    }, 0);
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    if (!this.scene) return 0;

    // Rough estimation based on triangle count and texture memory
    const triangleMemory = this.getTotalTriangleCount() * 36; // bytes per triangle
    const textureMemory = (this.scene.textures?.length || 0) * 1024 * 1024; // 1MB per texture estimate
    return triangleMemory + textureMemory;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.state.metrics };
  }

  /**
   * Get current state
   */
  getState(): PerformanceOptimizationState {
    return { ...this.state };
  }

  /**
   * Dispose the service
   */
  dispose(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
      this.performanceMonitor = null;
    }

    if (this.cullingMonitor) {
      clearInterval(this.cullingMonitor);
      this.cullingMonitor = null;
    }

    // Clear LOD setups
    this.state.activeLODs.clear();

    // Clear instancing setups
    this.clearInstances();

    // Clear culling setups
    this.clearCulling();

    this.simplifier = null;

    logger.debug('[DISPOSE] Performance optimization service disposed');
  }

  /**
   * Create a performance optimization error
   */
  private createError(
    code: PerformanceOptimizationErrorCode,
    message: string,
    details?: Record<string, unknown>
  ): PerformanceOptimizationError {
    return new PerformanceOptimizationError(code, message, details);
  }
}
