/**
 * @file AST to Mesh Conversion Service
 *
 * Main conversion service that bridges OpenSCAD AST nodes to generic mesh data.
 * This service encapsulates all OpenSCAD-specific knowledge and provides a clean
 * interface for the rendering layer.
 *
 * Following architectural principles:
 * - Single Responsibility: Only handles AST to mesh conversion
 * - Dependency Inversion: Depends on abstractions, not concretions
 * - Open/Closed: Extensible for new AST node types
 */

// BabylonJS math types
import { BoundingBox, Matrix, Vector3 } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';

import type { ASTNode } from '../../../openscad-parser/ast/ast-types';
import type {
  ASTToMeshConverter,
  ConversionOptions,
  ConversionResult,
  GenericMeshData,
  MaterialConfig,
  MeshMetadata,
} from '../../types/conversion.types';

const logger = createLogger('ASTToMeshConverter');

/**
 * Default conversion options
 */
const DEFAULT_CONVERSION_OPTIONS: Required<ConversionOptions> = {
  preserveMaterials: false,
  optimizeResult: true,
  timeout: 10000,
  enableCaching: true,
  maxComplexity: 100000,
};

/**
 * Default material configuration
 */
const DEFAULT_MATERIAL: MaterialConfig = {
  color: '#00ff88',
  metalness: 0.1,
  roughness: 0.8,
  opacity: 1.0,
  transparent: false,
  side: 'double',
  wireframe: false,
};

/**
 * AST to Mesh Conversion Service Implementation
 *
 * This service is the bridge between OpenSCAD AST nodes and generic mesh data.
 * It encapsulates all OpenSCAD-specific logic and provides a clean interface
 * for the rendering layer.
 */
export class ASTToMeshConversionService implements ASTToMeshConverter {
  private isInitialized = false;
  private conversionCache = new Map<string, GenericMeshData>();
  private csgService: BabylonCSG2Service | null = null;

  /**
   * Initialize the conversion service
   */
  async initialize(): Promise<Result<void, string>> {
    return tryCatchAsync(
      async () => {
        if (this.isInitialized) {
          return;
        }

        logger.init('[INIT] Initializing AST to Mesh conversion service');

        this.csgService = new BabylonCSG2Service();
        await this.csgService.initialize();

        this.isInitialized = true;
        logger.debug('[INIT] AST to Mesh conversion service initialized successfully');
      },
      (error) =>
        `Failed to initialize AST to Mesh converter: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  /**
   * Convert array of AST nodes to generic mesh data
   */
  async convert(
    ast: ReadonlyArray<unknown>,
    options: ConversionOptions = {}
  ): Promise<Result<ConversionResult, string>> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'ASTToMeshConverter not initialized. Call initialize() first.',
      };
    }

    const startTime = performance.now();
    const mergedOptions = { ...DEFAULT_CONVERSION_OPTIONS, ...options };

    logger.debug(`[CONVERT] Converting ${ast.length} AST nodes to meshes`);

    return tryCatchAsync(
      async () => {
        const meshes: GenericMeshData[] = [];
        const errors: string[] = [];
        let totalVertices = 0;
        let totalTriangles = 0;

        // Convert each AST node
        for (let i = 0; i < ast.length; i++) {
          const node = ast[i] as ASTNode;
          if (!node) {
            errors.push(`Node at index ${i} is null or undefined`);
            continue;
          }

          const meshResult = await this.convertSingle(node, mergedOptions);
          if (meshResult.success) {
            meshes.push(meshResult.data);
            totalVertices += meshResult.data.metadata.vertexCount;
            totalTriangles += meshResult.data.metadata.triangleCount;
          } else {
            errors.push(`Failed to convert node ${i} (${node.type}): ${meshResult.error}`);
          }
        }

        const operationTime = performance.now() - startTime;

        const result: ConversionResult = {
          meshes,
          operationTime,
          totalVertices,
          totalTriangles,
          errors,
        };

        logger.debug(
          `[CONVERT] Conversion completed: ${meshes.length} meshes, ${errors.length} errors, ${operationTime.toFixed(2)}ms`
        );
        return result;
      },
      (error) =>
        `AST to mesh conversion failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  /**
   * Convert single AST node to generic mesh data
   */
  async convertSingle(
    node: unknown,
    options: ConversionOptions = {}
  ): Promise<Result<GenericMeshData, string>> {
    if (!this.isInitialized || !this.csgService) {
      return { success: false, error: 'ASTToMeshConverter not initialized' };
    }

    const astNode = node as ASTNode;
    const mergedOptions = { ...DEFAULT_CONVERSION_OPTIONS, ...options };

    // Check cache first
    if (mergedOptions.enableCaching) {
      const cacheKey = this.generateCacheKey(astNode, mergedOptions);
      const cached = this.conversionCache.get(cacheKey);
      if (cached) {
        logger.debug(`[CACHE] Using cached mesh for ${astNode.type}`);
        return { success: true, data: cached };
      }
    }

    return tryCatchAsync(
      async () => {
        logger.debug(`[CONVERT] Converting ${astNode.type} node to mesh`);

        // Use the BabylonCSG2Service for CSG operations
        if (!this.csgService) {
          throw new Error('CSG service not initialized');
        }

        const csgResult = await this.csgService.convertNode(astNode, {
          preserveMaterials: mergedOptions.preserveMaterials,
          optimizeResult: mergedOptions.optimizeResult,
          timeout: mergedOptions.timeout,
        });

        if (!csgResult.success) {
          throw new Error(`CSG conversion failed: ${csgResult.error}`);
        }

        // Convert to generic mesh data
        const csgData = {
          boundingBox: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } },
          triangleCount: 0,
          vertexCount: 0,
          operationTime: 0,
          geometry: csgResult.data.mesh,
        };
        const genericMesh = this.convertToGenericMesh(astNode, csgData, mergedOptions);

        // Cache the result
        if (mergedOptions.enableCaching) {
          const cacheKey = this.generateCacheKey(astNode, mergedOptions);
          this.conversionCache.set(cacheKey, genericMesh);
        }

        logger.debug(`[CONVERT] Successfully converted ${astNode.type} to generic mesh`);
        return genericMesh;
      },
      (error) =>
        `Failed to convert ${astNode.type} node: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  /**
   * Convert CSG result to generic mesh data
   */
  private convertToGenericMesh(
    _astNode: ASTNode,
    csgResult: {
      boundingBox?: {
        min: { x: number; y: number; z: number };
        max: { x: number; y: number; z: number };
      };
      triangleCount?: number;
      vertexCount?: number;
      operationTime?: number;
      geometry?: unknown;
    },
    options: Required<ConversionOptions>
  ): GenericMeshData {
    const meshId = `mesh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate bounding box (using BabylonJS BoundingBox)
    const boundingBox = new BoundingBox(
      new Vector3(
        csgResult.boundingBox?.min?.x || 0,
        csgResult.boundingBox?.min?.y || 0,
        csgResult.boundingBox?.min?.z || 0
      ),
      new Vector3(
        csgResult.boundingBox?.max?.x || 1,
        csgResult.boundingBox?.max?.y || 1,
        csgResult.boundingBox?.max?.z || 1
      )
    );

    const metadata: MeshMetadata = {
      meshId,
      triangleCount: csgResult.triangleCount || 0,
      vertexCount: csgResult.vertexCount || 0,
      boundingBox,
      complexity: csgResult.vertexCount || 0,
      operationTime: csgResult.operationTime || 0,
      isOptimized: options.optimizeResult,
      lastAccessed: new Date(),
    };

    return {
      id: meshId,
      geometry: csgResult.geometry,
      material: DEFAULT_MATERIAL,
      transform: Matrix.Identity(), // Identity matrix by default
      metadata,
    };
  }

  /**
   * Generate cache key for AST node and options
   */
  private generateCacheKey(node: ASTNode, options: Required<ConversionOptions>): string {
    const nodeKey = `${node.type}_${JSON.stringify(node)}`;
    const optionsKey = `${options.preserveMaterials}_${options.optimizeResult}`;
    return `${nodeKey}_${optionsKey}`;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    logger.debug('[DISPOSE] Disposing AST to Mesh conversion service');
    this.conversionCache.clear();
    this.csgService?.dispose?.();
    this.isInitialized = false;
  }
}
