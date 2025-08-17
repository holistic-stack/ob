/**
 * @file openscad-rendering-pipeline.ts
 * @description OpenSCAD Rendering Pipeline Service that provides a unified interface for converting
 * OpenSCAD AST nodes directly to BabylonJS meshes. This service orchestrates the complete pipeline:
 * AST → Geometry Data → BabylonJS Meshes.
 *
 * @example
 * ```typescript
 * const pipeline = new OpenSCADRenderingPipelineService();
 *
 * // Convert AST nodes to meshes
 * const result = pipeline.convertASTToMeshes(astNodes, scene, globals);
 * if (result.success) {
 *   const meshes = result.data;
 *   console.log(`Created ${meshes.length} meshes`);
 * }
 *
 * // Extract global variables from AST
 * const globals = pipeline.extractGlobalVariables(ast);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-31
 */

import type { AbstractMesh, Scene as BabylonScene } from '@babylonjs/core';
import {
  ASTToGeometryConverterService,
  GeometryToMeshConverterService,
  type GlobalVariables,
} from '@/features/openscad-geometry-builder';
import type { ASTNode, AssignStatementNode } from '@/features/openscad-parser';
import type { Result } from '@/shared';
import { createLogger, error, success } from '@/shared';

const logger = createLogger('OpenSCADRenderingPipelineService');

/**
 * Pipeline error types
 */
export interface PipelineError {
  readonly type:
    | 'GLOBAL_EXTRACTION_ERROR'
    | 'AST_FILTERING_ERROR'
    | 'CONVERSION_ERROR'
    | 'MESH_CREATION_ERROR';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Pipeline result types
 */
export type PipelineResult = Result<AbstractMesh[], PipelineError>;

/**
 * Pipeline statistics for debugging and monitoring
 */
export interface PipelineStatistics {
  readonly totalASTNodes: number;
  readonly filteredASTNodes: number;
  readonly globalVariables: GlobalVariables;
  readonly geometryConversionTime: number;
  readonly meshConversionTime: number;
  readonly totalPipelineTime: number;
  readonly createdMeshes: number;
  readonly nodeTypeBreakdown: Record<string, number>;
}

/**
 * OpenSCAD Rendering Pipeline Service
 *
 * Provides a unified, high-level interface for converting OpenSCAD AST nodes
 * to BabylonJS meshes. Orchestrates the complete rendering pipeline while
 * maintaining separation of concerns between AST conversion and mesh creation.
 */
export class OpenSCADRenderingPipelineService {
  private readonly astConverter: ASTToGeometryConverterService;
  private readonly meshConverter: GeometryToMeshConverterService;

  constructor() {
    this.astConverter = new ASTToGeometryConverterService();
    this.meshConverter = new GeometryToMeshConverterService();
  }

  /**
   * Convert OpenSCAD AST nodes directly to BabylonJS meshes
   *
   * @param ast - Array of AST nodes to convert
   * @param scene - BabylonJS scene to add meshes to
   * @param globals - Optional global variables (extracted if not provided)
   * @param namePrefix - Optional prefix for mesh names
   * @returns Result containing array of created meshes or pipeline error
   */
  convertASTToMeshes(
    ast: ASTNode[],
    scene: BabylonScene,
    globals?: GlobalVariables,
    namePrefix?: string
  ): PipelineResult {
    const startTime = performance.now();

    try {
      logger.debug(`[PIPELINE] Starting AST to mesh conversion for ${ast.length} nodes`);

      // Step 1: Extract global variables if not provided
      const extractedGlobals = globals || this.extractGlobalVariables(ast);
      logger.debug('[PIPELINE] Global variables extracted:', extractedGlobals);

      // Step 2: Filter out assignment statements (keep only geometry nodes)
      const geometryNodes = this.filterGeometryNodes(ast);
      logger.debug(
        `[PIPELINE] Filtered ${geometryNodes.length} geometry nodes from ${ast.length} total nodes`
      );

      if (geometryNodes.length === 0) {
        logger.warn('[PIPELINE] No geometry nodes found in AST');
        return success([]);
      }

      // Step 3: Convert AST nodes to geometry data
      const geometryStartTime = performance.now();
      const geometryResult = this.astConverter.convertASTToGeometryBatch(
        geometryNodes,
        extractedGlobals
      );
      const geometryEndTime = performance.now();

      if (!geometryResult.success) {
        logger.error(
          `[PIPELINE] AST->Geometry conversion failed: ${geometryResult.error.message}`,
          geometryResult.error
        );
        return error({
          type: 'CONVERSION_ERROR',
          message: `AST to geometry conversion failed: ${geometryResult.error.message}`,
          details: {
            originalError: geometryResult.error,
            nodeCount: geometryNodes.length,
            geometryConversionTime: geometryEndTime - geometryStartTime,
          },
        });
      }

      logger.debug(`[PIPELINE] Converted ${geometryResult.data.length} AST nodes to geometry data`);

      // Step 4: Convert geometry data to BabylonJS meshes
      const meshStartTime = performance.now();
      const meshResult = this.meshConverter.convertGeometryBatchToMeshes(
        geometryResult.data,
        scene,
        namePrefix
      );
      const meshEndTime = performance.now();

      if (!meshResult.success) {
        return error({
          type: 'MESH_CREATION_ERROR',
          message: `Geometry to mesh conversion failed: ${meshResult.error.message}`,
          details: {
            originalError: meshResult.error,
            geometryCount: geometryResult.data.length,
            meshConversionTime: meshEndTime - meshStartTime,
          },
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      logger.debug(
        `[PIPELINE] Successfully created ${meshResult.data.length} meshes in ${totalTime.toFixed(2)}ms`
      );

      return success(meshResult.data);
    } catch (err) {
      const endTime = performance.now();
      return error({
        type: 'CONVERSION_ERROR',
        message: `Pipeline execution failed: ${err instanceof Error ? err.message : String(err)}`,
        details: {
          totalPipelineTime: endTime - startTime,
          nodeCount: ast.length,
        },
      });
    }
  }

  /**
   * Extract global variable assignments from OpenSCAD AST
   *
   * @param ast - Array of AST nodes to process
   * @returns Global variables object with extracted values
   */
  extractGlobalVariables(ast: ASTNode[]): GlobalVariables {
    const globals: GlobalVariables = {
      $fa: 12, // Default fragment angle
      $fs: 2, // Default fragment size
      $t: 0, // Default time parameter
    };

    try {
      for (const node of ast) {
        if (node.type === 'assign_statement') {
          const assignNode = node as AssignStatementNode;

          // Extract special variables
          // Values may be raw numbers or Expression Literal nodes depending on the extractor
          const resolveNumeric = (v: unknown): number | undefined => {
            if (typeof v === 'number') return v;
            if (
              v &&
              typeof v === 'object' &&
              'type' in (v as Record<string, unknown>) &&
              (v as Record<string, unknown>).type === 'expression' &&
              'expressionType' in (v as Record<string, unknown>) &&
              (v as Record<string, unknown>).expressionType === 'literal' &&
              'value' in (v as Record<string, unknown>) &&
              typeof (v as { value?: unknown }).value === 'number'
            ) {
              return (v as { value: number }).value;
            }
            return undefined;
          };

          const numericValue = resolveNumeric((assignNode as { value?: unknown }).value);

          if (assignNode.variable === '$fn' && typeof numericValue === 'number') {
            globals.$fn = numericValue;
          } else if (assignNode.variable === '$fa' && typeof numericValue === 'number') {
            globals.$fa = numericValue;
          } else if (assignNode.variable === '$fs' && typeof numericValue === 'number') {
            globals.$fs = numericValue;
          } else if (assignNode.variable === '$t' && typeof numericValue === 'number') {
            globals.$t = numericValue;
          }
        }
      }

      logger.debug('[EXTRACT_GLOBALS] Extracted global variables:', globals);
      return globals;
    } catch (err) {
      logger.warn(
        `[EXTRACT_GLOBALS] Error extracting globals, using defaults: ${err instanceof Error ? err.message : String(err)}`
      );
      return globals;
    }
  }

  /**
   * Filter AST nodes to keep only geometry-generating nodes
   *
   * @param ast - Array of AST nodes to filter
   * @returns Array of geometry nodes (excludes assignment statements)
   */
  filterGeometryNodes(ast: ASTNode[]): ASTNode[] {
    try {
      const geometryNodes = ast.filter((node) => node.type !== 'assign_statement');
      logger.debug(
        `[FILTER_NODES] Filtered ${geometryNodes.length} geometry nodes from ${ast.length} total nodes`
      );
      return geometryNodes;
    } catch (err) {
      logger.error(
        `[FILTER_NODES] Error filtering nodes: ${err instanceof Error ? err.message : String(err)}`
      );
      return [];
    }
  }

  /**
   * Get detailed pipeline statistics for the last conversion
   *
   * @param ast - Original AST nodes
   * @param meshes - Created meshes
   * @param globals - Global variables used
   * @returns Detailed pipeline statistics
   */
  getPipelineStatistics(
    ast: ASTNode[],
    meshes: AbstractMesh[],
    globals: GlobalVariables
  ): PipelineStatistics {
    const geometryNodes = this.filterGeometryNodes(ast);

    // Calculate node type breakdown
    const nodeTypeBreakdown: Record<string, number> = {};
    for (const node of geometryNodes) {
      nodeTypeBreakdown[node.type] = (nodeTypeBreakdown[node.type] || 0) + 1;
    }

    return {
      totalASTNodes: ast.length,
      filteredASTNodes: geometryNodes.length,
      globalVariables: globals,
      geometryConversionTime: 0, // Would need to be tracked during conversion
      meshConversionTime: 0, // Would need to be tracked during conversion
      totalPipelineTime: 0, // Would need to be tracked during conversion
      createdMeshes: meshes.length,
      nodeTypeBreakdown,
    };
  }

  /**
   * Validate AST nodes before processing
   *
   * @param ast - Array of AST nodes to validate
   * @returns Result indicating validation success or error details
   */
  validateAST(ast: ASTNode[]): Result<void, PipelineError> {
    try {
      if (!Array.isArray(ast)) {
        return error({
          type: 'AST_FILTERING_ERROR',
          message: 'AST must be an array',
          details: { receivedType: typeof ast },
        });
      }

      if (ast.length === 0) {
        return error({
          type: 'AST_FILTERING_ERROR',
          message: 'AST array is empty',
          details: { nodeCount: 0 },
        });
      }

      // Validate each node has required properties
      for (let i = 0; i < ast.length; i++) {
        const node = ast[i];
        if (!node || typeof node.type !== 'string') {
          return error({
            type: 'AST_FILTERING_ERROR',
            message: `Invalid AST node at index ${i}: missing or invalid type property`,
            details: { nodeIndex: i, node },
          });
        }
      }

      return success(undefined);
    } catch (err) {
      return error({
        type: 'AST_FILTERING_ERROR',
        message: `AST validation failed: ${err instanceof Error ? err.message : String(err)}`,
        details: { nodeCount: ast?.length || 0 },
      });
    }
  }
}
