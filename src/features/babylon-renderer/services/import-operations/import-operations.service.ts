/**
 * @file Import Operations Service
 *
 * Service for importing external files (STL, 3MF, SVG) and processing
 * OpenSCAD include/use directives. Integrates with BabylonJS loaders
 * and converts imported data to GenericMeshData format.
 *
 * @example
 * ```typescript
 * const importService = new ImportOperationsService(scene);
 *
 * // Import STL file
 * const stlResult = await importService.importSTL('model.stl');
 *
 * // Import SVG for 2D profile
 * const svgResult = await importService.importSVG('profile.svg');
 * ```
 */

import { BoundingBox, ImportMeshAsync, Matrix, Mesh, type Scene, Vector3 } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';
import type {
  GenericGeometry,
  GenericMeshCollection,
  GenericMeshData,
} from '../../types/generic-mesh-data.types';
import { DEFAULT_MESH_METADATA, MATERIAL_PRESETS } from '../../types/generic-mesh-data.types';
import {
  createBoundingBoxFromGeometry,
  createMeshCollection,
} from '../../utils/generic-mesh-utils';
import type { Profile2DPoint } from '../extrusion-operations';

const logger = createLogger('ImportOperations');

/**
 * Import operation parameters
 */
export interface ImportOperationParams {
  readonly scale?: number | readonly [number, number, number];
  readonly center?: boolean;
  readonly convexity?: number;
}

/**
 * STL import parameters
 */
export interface STLImportParams extends ImportOperationParams {
  readonly mergeVertices?: boolean;
  readonly flipYZ?: boolean;
}

/**
 * 3MF import parameters
 */
export interface ThreeMFImportParams extends ImportOperationParams {
  readonly preserveMaterials?: boolean;
  readonly units?: 'mm' | 'cm' | 'm' | 'in';
}

/**
 * SVG import parameters
 */
export interface SVGImportParams {
  readonly scale?: number;
  readonly resolution?: number;
  readonly center?: boolean;
}

/**
 * Include/Use directive parameters
 */
export interface IncludeParams {
  readonly filePath: string;
  readonly useDirective?: boolean;
  readonly variables?: Record<string, unknown>;
}

/**
 * Import operation error
 */
export interface ImportError {
  readonly code:
    | 'FILE_NOT_FOUND'
    | 'LOADING_FAILED'
    | 'PARSING_FAILED'
    | 'UNSUPPORTED_FORMAT'
    | 'INVALID_PARAMETERS';
  readonly message: string;
  readonly filePath?: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * Import Operations Service
 *
 * Handles importing external files and converting them to GenericMeshData
 * with proper error handling and format support.
 */
export class ImportOperationsService {
  private readonly scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
    logger.init('[INIT] ImportOperations service initialized');
  }

  /**
   * Import STL file
   */
  async importSTL(
    filePath: string,
    params: STLImportParams = {}
  ): Promise<Result<GenericMeshData | GenericMeshCollection, ImportError>> {
    logger.debug(`[STL] Importing STL file: ${filePath}`);
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Use BabylonJS ImportMeshAsync to load STL
        const importResult = await ImportMeshAsync(filePath, this.scene);

        if (!importResult.meshes || importResult.meshes.length === 0) {
          throw this.createError(
            'PARSING_FAILED',
            `No meshes found in STL file: ${filePath}`,
            filePath
          );
        }

        // Convert BabylonJS meshes to GenericMeshData
        const genericMeshes: GenericMeshData[] = [];

        for (const babylonMesh of importResult.meshes) {
          if (babylonMesh instanceof Mesh) {
            const genericMesh = await this.convertBabylonMeshToGeneric(
              babylonMesh,
              'stl_import',
              params as unknown as Record<string, unknown>,
              performance.now() - startTime
            );

            // Apply transformations if specified
            if (params.scale || params.center || params.flipYZ) {
              const transformedMesh = this.applyImportTransformations(genericMesh, params);
              genericMeshes.push(transformedMesh);
            } else {
              genericMeshes.push(genericMesh);
            }
          }
        }

        // Clean up BabylonJS meshes
        importResult.meshes.forEach((mesh) => mesh.dispose());

        // Return single mesh or collection
        if (genericMeshes.length === 1) {
          logger.debug(
            `[STL] STL import completed in ${(performance.now() - startTime).toFixed(2)}ms`
          );
          return genericMeshes[0]!;
        } else {
          const collection = createMeshCollection(
            `stl_import_${Date.now()}`,
            genericMeshes,
            'control_flow_result'
          );

          if (!collection.success) {
            throw new Error(`Failed to create mesh collection: ${collection.error.message}`);
          }

          logger.debug(
            `[STL] STL import completed in ${(performance.now() - startTime).toFixed(2)}ms`
          );
          return collection.data;
        }
      },
      (error) => this.createError('LOADING_FAILED', `STL import failed: ${error}`, filePath)
    );
  }

  /**
   * Import 3MF file
   */
  async import3MF(
    filePath: string,
    params: ThreeMFImportParams = {}
  ): Promise<Result<GenericMeshData | GenericMeshCollection, ImportError>> {
    logger.debug(`[3MF] Importing 3MF file: ${filePath}`);
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Use BabylonJS ImportMeshAsync to load 3MF
        const importResult = await ImportMeshAsync(filePath, this.scene);

        if (!importResult.meshes || importResult.meshes.length === 0) {
          throw this.createError(
            'PARSING_FAILED',
            `No meshes found in 3MF file: ${filePath}`,
            filePath
          );
        }

        // Convert BabylonJS meshes to GenericMeshData
        const genericMeshes: GenericMeshData[] = [];

        for (const babylonMesh of importResult.meshes) {
          if (babylonMesh instanceof Mesh) {
            const genericMesh = await this.convertBabylonMeshToGeneric(
              babylonMesh,
              '3mf_import',
              params as unknown as Record<string, unknown>,
              performance.now() - startTime
            );

            // Apply transformations if specified
            const transformedMesh = this.applyImportTransformations(genericMesh, params);
            genericMeshes.push(transformedMesh);
          }
        }

        // Clean up BabylonJS meshes
        importResult.meshes.forEach((mesh) => mesh.dispose());

        // Return single mesh or collection
        if (genericMeshes.length === 1) {
          logger.debug(
            `[3MF] 3MF import completed in ${(performance.now() - startTime).toFixed(2)}ms`
          );
          return genericMeshes[0]!;
        } else {
          const collection = createMeshCollection(
            `3mf_import_${Date.now()}`,
            genericMeshes,
            'control_flow_result'
          );

          if (!collection.success) {
            throw new Error(`Failed to create mesh collection: ${collection.error.message}`);
          }

          logger.debug(
            `[3MF] 3MF import completed in ${(performance.now() - startTime).toFixed(2)}ms`
          );
          return collection.data;
        }
      },
      (error) => this.createError('LOADING_FAILED', `3MF import failed: ${error}`, filePath)
    );
  }

  /**
   * Import SVG file and extract 2D profile
   */
  async importSVG(
    filePath: string,
    params: SVGImportParams = {}
  ): Promise<Result<readonly Profile2DPoint[], ImportError>> {
    logger.debug(`[SVG] Importing SVG file: ${filePath}`);
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Load SVG file as text
        const svgContent = await this.loadTextFile(filePath);

        // Parse SVG and extract path data
        const profile = this.parseSVGToProfile(svgContent, params);

        if (profile.length < 3) {
          throw this.createError(
            'PARSING_FAILED',
            `SVG file contains insufficient path data: ${filePath}`,
            filePath
          );
        }

        logger.debug(
          `[SVG] SVG import completed in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return profile;
      },
      (error) => this.createError('LOADING_FAILED', `SVG import failed: ${error}`, filePath)
    );
  }

  /**
   * Process include/use directive
   */
  async processInclude(params: IncludeParams): Promise<Result<string, ImportError>> {
    logger.debug(`[INCLUDE] Processing include: ${params.filePath}`);
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Load OpenSCAD file content
        const fileContent = await this.loadTextFile(params.filePath);

        // For now, return the raw content
        // In a full implementation, this would parse the OpenSCAD content
        // and handle variable scoping for use directives

        logger.debug(
          `[INCLUDE] Include processed in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return fileContent;
      },
      (error) => this.createError('LOADING_FAILED', `Include failed: ${error}`, params.filePath)
    );
  }

  /**
   * Load text file content
   */
  private async loadTextFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.scene._loadFile(
        filePath,
        (data) => {
          if (typeof data === 'string') {
            resolve(data);
          } else {
            // Convert ArrayBuffer to string
            const decoder = new TextDecoder('utf-8');
            resolve(decoder.decode(data));
          }
        },
        undefined, // onProgress
        false, // useOfflineSupport
        false, // useArrayBuffer
        (request, exception) => {
          reject(
            new Error(`Failed to load file ${filePath}: ${exception?.message || 'Unknown error'}`)
          );
        }
      );
    });
  }

  /**
   * Parse SVG content to 2D profile points
   */
  private parseSVGToProfile(svgContent: string, params: SVGImportParams): Profile2DPoint[] {
    // Basic SVG path parsing (simplified implementation)
    // In a full implementation, this would use a proper SVG parser
    const profile: Profile2DPoint[] = [];
    const scale = params.scale || 1;

    // Extract path data from SVG
    const pathMatch = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/);
    if (!pathMatch) {
      throw new Error('No path element found in SVG');
    }

    const pathData = pathMatch[1]!;

    // Simple path parsing for basic shapes (M, L, Z commands)
    const commands = pathData.match(/[MLZ][^MLZ]*/g) || [];

    for (const command of commands) {
      const type = command[0];
      const coords = command
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .map(Number);

      if (type === 'M' || type === 'L') {
        for (let i = 0; i < coords.length; i += 2) {
          if (coords[i] !== undefined && coords[i + 1] !== undefined) {
            profile.push({
              x: coords[i]! * scale,
              y: coords[i + 1]! * scale,
            });
          }
        }
      }
    }

    return profile;
  }

  /**
   * Apply import transformations to mesh
   */
  private applyImportTransformations(
    mesh: GenericMeshData,
    params: ImportOperationParams
  ): GenericMeshData {
    // For now, return the mesh as-is
    // In a full implementation, this would apply scaling, centering, etc.
    return mesh;
  }

  /**
   * Convert BabylonJS mesh to GenericMeshData
   */
  private async convertBabylonMeshToGeneric(
    babylonMesh: Mesh,
    operationType: string,
    params: Record<string, unknown>,
    operationTime: number
  ): Promise<GenericMeshData> {
    // Extract geometry data
    const positionsArray = babylonMesh.getVerticesData('position');
    const indicesArray = babylonMesh.getIndices();
    const normalsArray = babylonMesh.getVerticesData('normal');
    const uvsArray = babylonMesh.getVerticesData('uv');

    // Convert to typed arrays
    const positions = new Float32Array(positionsArray || []);
    const indices = new Uint32Array(indicesArray || []);
    const normals = normalsArray ? new Float32Array(normalsArray) : undefined;
    const uvs = uvsArray ? new Float32Array(uvsArray) : undefined;

    const geometry: GenericGeometry = {
      positions,
      indices,
      vertexCount: positions.length / 3,
      triangleCount: indices.length / 3,
      boundingBox: createBoundingBoxFromGeometry({
        positions,
        indices,
        vertexCount: positions.length / 3,
        triangleCount: indices.length / 3,
        boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
      }),
      ...(normals && { normals }),
      ...(uvs && { uvs }),
    };

    const metadata = {
      ...DEFAULT_MESH_METADATA,
      meshId: babylonMesh.id,
      name: `${operationType}_result`,
      nodeType: operationType,
      vertexCount: geometry.vertexCount,
      triangleCount: geometry.triangleCount,
      boundingBox: geometry.boundingBox,
      generationTime: operationTime,
      openscadParameters: {
        operationType,
        ...params,
      },
    };

    return {
      id: babylonMesh.id,
      geometry,
      material: MATERIAL_PRESETS.DEFAULT,
      transform: Matrix.Identity(),
      metadata,
    };
  }

  /**
   * Create an import error
   */
  private createError(
    code: ImportError['code'],
    message: string,
    filePath?: string,
    details?: Record<string, unknown>
  ): ImportError {
    const error: ImportError = {
      code,
      message,
      timestamp: new Date(),
      ...(filePath && { filePath }),
      ...(details && { details }),
    };

    return error;
  }
}
