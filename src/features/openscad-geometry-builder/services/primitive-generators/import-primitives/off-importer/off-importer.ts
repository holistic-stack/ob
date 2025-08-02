/**
 * @file off-importer.ts
 * @description OFF Importer Service for OpenSCAD import() primitive
 *
 * Parses OFF (Object File Format) files and converts them to 3D mesh geometry.
 * Implements OpenSCAD-compatible OFF import with proper scaling, centering, and validation.
 *
 * @example
 * ```typescript
 * const offImporter = new OFFImporterService();
 *
 * const result = await offImporter.importOFF(offContent, {
 *   file: "model.off",
 *   scale: 2.0,
 *   center: true
 * });
 *
 * if (result.success) {
 *   console.log(`Imported OFF with ${result.data.vertices.length} vertices`);
 * }
 * ```
 */

import { createLogger } from '@/shared/services/logger.service';
import type { Result } from '@/shared/types/result.types';
import { error, success } from '@/shared/utils/functional/result';
import type {
  GeometryGenerationError,
  PolyhedronGeometryData,
} from '../../../../types/geometry-data';
import type { ImportParameters } from '../../../../types/import-parameters';

const logger = createLogger('OFFImporterService');

/**
 * OFF mesh data structure
 */
export interface OFFMesh {
  readonly vertices: Array<{ x: number; y: number; z: number }>;
  readonly faces: Array<readonly number[]>;
  readonly metadata: {
    readonly vertexCount: number;
    readonly faceCount: number;
    readonly edgeCount: number;
  };
}

/**
 * Mesh validation result
 */
export interface MeshValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Mesh bounds information
 */
export interface MeshBounds {
  readonly min: { x: number; y: number; z: number };
  readonly max: { x: number; y: number; z: number };
}

/**
 * OFF import result type
 */
export type OFFImportResult = Result<PolyhedronGeometryData, GeometryGenerationError>;

/**
 * OFF Importer Service
 *
 * Handles parsing of OFF (Object File Format) files.
 * Provides mesh validation, transformation, and OpenSCAD-compatible import functionality.
 */
export class OFFImporterService {
  constructor() {
    logger.init('[INIT] OFFImporterService initialized');
  }

  /**
   * Import OFF content with OpenSCAD parameters
   *
   * @param content - OFF file content
   * @param params - OpenSCAD import parameters
   * @returns Result containing 3D geometry or error
   */
  async importOFF(content: string, params: ImportParameters): Promise<OFFImportResult> {
    try {
      logger.debug(`[IMPORT] Importing OFF file: ${params.file}`);

      // Parse OFF content
      const parseResult = await this.parseOFFContent(content);

      if (!parseResult.success) {
        return parseResult as OFFImportResult;
      }

      const mesh = parseResult.data;

      // Apply transformations
      const transformedMesh = this.applyTransformations(mesh, params);

      // Convert to Polyhedron3DGeometryData
      const geometry = this.meshToGeometry(transformedMesh, params);

      logger.debug(`[SUCCESS] Imported OFF with ${geometry.vertices.length} vertices`);

      return success(geometry);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[ERROR] OFF import failed: ${errorMessage}`);

      return error({
        type: 'COMPUTATION_ERROR',
        message: `OFF import failed: ${errorMessage}`,
        details: { file: params.file },
      });
    }
  }

  /**
   * Parse OFF file content
   *
   * @param content - OFF file content
   * @returns Result containing OFF mesh or error
   */
  async parseOFFContent(content: string): Promise<Result<OFFMesh, GeometryGenerationError>> {
    try {
      if (!content || content.trim().length === 0) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: 'OFF content is empty',
          details: {},
        });
      }

      const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#')); // Remove comments and empty lines

      if (lines.length === 0) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: 'OFF content contains no valid data',
          details: {},
        });
      }

      // Check OFF header
      const headerLine = lines[0];
      if (!headerLine || headerLine !== 'OFF') {
        return error({
          type: 'COMPUTATION_ERROR',
          message: 'invalid OFF header: expected "OFF"',
          details: { header: headerLine },
        });
      }

      // Parse counts line
      const countsLine = lines[1];
      if (!countsLine) {
        return error({
          type: 'COMPUTATION_ERROR',
          message: 'missing OFF counts line',
          details: { lineCount: lines.length },
        });
      }
      const counts = countsLine.split(/\s+/).map(Number);

      if (counts.length < 3 || counts.some(Number.isNaN)) {
        return error({
          type: 'COMPUTATION_ERROR',
          message: 'invalid OFF counts line: expected "vertexCount faceCount edgeCount"',
          details: { countsLine },
        });
      }

      const [vertexCount, faceCount, edgeCount] = counts;

      // Parse vertices
      const vertices: Array<{ x: number; y: number; z: number }> = [];
      for (let i = 0; i < vertexCount; i++) {
        const lineIndex = 2 + i;
        if (lineIndex >= lines.length) {
          return error({
            type: 'COMPUTATION_ERROR',
            message: `insufficient vertex data: expected ${vertexCount} vertices, got ${i}`,
            details: { expected: vertexCount, actual: i },
          });
        }

        const vertexLine = lines[lineIndex];
        if (!vertexLine) {
          return error({
            type: 'COMPUTATION_ERROR',
            message: `missing vertex line at index ${lineIndex}`,
            details: { lineIndex, vertexIndex: i },
          });
        }
        const coords = vertexLine.split(/\s+/).map(Number);

        // Check if this looks like a face line (starts with vertex count)
        if (coords.length >= 4 && Number.isInteger(coords[0]) && coords[0] >= 3) {
          return error({
            type: 'COMPUTATION_ERROR',
            message: `insufficient vertex data: expected ${vertexCount} vertices, got ${i}`,
            details: { expected: vertexCount, actual: i },
          });
        }

        if (coords.length < 3 || coords.some(Number.isNaN)) {
          return error({
            type: 'COMPUTATION_ERROR',
            message: `invalid vertex at line ${lineIndex + 1}: expected 3 coordinates`,
            details: { line: lineIndex + 1, vertexLine },
          });
        }

        vertices.push({
          x: coords[0],
          y: coords[1],
          z: coords[2],
        });
      }

      // Parse faces
      const faces: Array<readonly number[]> = [];
      for (let i = 0; i < faceCount; i++) {
        const lineIndex = 2 + vertexCount + i;
        if (lineIndex >= lines.length) {
          return error({
            type: 'COMPUTATION_ERROR',
            message: `insufficient face data: expected ${faceCount} faces, got ${i}`,
            details: { expected: faceCount, actual: i },
          });
        }

        const faceLine = lines[lineIndex];
        if (!faceLine) {
          return error({
            type: 'COMPUTATION_ERROR',
            message: `missing face line at index ${lineIndex}`,
            details: { lineIndex, faceIndex: i },
          });
        }
        const faceData = faceLine.split(/\s+/).map(Number);

        if (faceData.length < 1 || Number.isNaN(faceData[0])) {
          return error({
            type: 'COMPUTATION_ERROR',
            message: `invalid face at line ${lineIndex + 1}: missing vertex count`,
            details: { line: lineIndex + 1, faceLine },
          });
        }

        const faceVertexCount = faceData[0];
        if (faceData.length < faceVertexCount + 1) {
          return error({
            type: 'COMPUTATION_ERROR',
            message: `invalid face at line ${lineIndex + 1}: insufficient vertex indices`,
            details: {
              line: lineIndex + 1,
              expected: faceVertexCount,
              actual: faceData.length - 1,
            },
          });
        }

        const faceIndices = faceData.slice(1, faceVertexCount + 1);

        // Validate face indices
        for (const index of faceIndices) {
          if (index < 0 || index >= vertexCount) {
            return error({
              type: 'COMPUTATION_ERROR',
              message: `invalid face index ${index}: must be between 0 and ${vertexCount - 1}`,
              details: { index, vertexCount },
            });
          }
        }

        // Triangulate face if necessary
        const triangulatedFaces = this.triangulateFace(faceIndices);
        faces.push(...triangulatedFaces);
      }

      const mesh: OFFMesh = {
        vertices,
        faces,
        metadata: {
          vertexCount,
          faceCount: faces.length, // Use triangulated face count
          edgeCount,
        },
      };

      return success(mesh);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Failed to parse OFF: ${errorMessage}`,
        details: {},
      });
    }
  }

  /**
   * Triangulate a polygon face into triangles
   *
   * @param faceIndices - Vertex indices of the polygon
   * @returns Array of triangulated faces
   */
  private triangulateFace(faceIndices: readonly number[]): Array<readonly number[]> {
    if (faceIndices.length < 3) {
      return []; // Invalid face
    }

    if (faceIndices.length === 3) {
      return [faceIndices]; // Already a triangle
    }

    // Simple fan triangulation from first vertex
    const triangles: Array<readonly number[]> = [];
    for (let i = 1; i < faceIndices.length - 1; i++) {
      triangles.push([faceIndices[0], faceIndices[i], faceIndices[i + 1]] as const);
    }

    return triangles;
  }

  /**
   * Apply transformations to mesh based on import parameters
   */
  private applyTransformations(mesh: OFFMesh, params: ImportParameters): OFFMesh {
    let transformedVertices = [...mesh.vertices];

    // Apply scaling
    if (params.scale && params.scale !== 1.0) {
      const scale = params.scale;
      transformedVertices = transformedVertices.map((vertex) => ({
        x: vertex.x * scale,
        y: vertex.y * scale,
        z: vertex.z * scale,
      }));
    }

    // Apply centering
    if (params.center) {
      const bounds = this.calculateBoundsFromVertices(transformedVertices);
      const centerX = (bounds.min.x + bounds.max.x) / 2;
      const centerY = (bounds.min.y + bounds.max.y) / 2;
      const centerZ = (bounds.min.z + bounds.max.z) / 2;

      transformedVertices = transformedVertices.map((vertex) => ({
        x: vertex.x - centerX,
        y: vertex.y - centerY,
        z: vertex.z - centerZ,
      }));
    }

    // Apply origin offset
    if (params.origin) {
      const [offsetX, offsetY] = params.origin;
      transformedVertices = transformedVertices.map((vertex) => ({
        x: vertex.x + offsetX,
        y: vertex.y + offsetY,
        z: vertex.z,
      }));
    }

    return {
      ...mesh,
      vertices: transformedVertices,
    };
  }

  /**
   * Calculate mesh bounds
   */
  calculateBounds(mesh: OFFMesh): MeshBounds {
    return this.calculateBoundsFromVertices(mesh.vertices);
  }

  /**
   * Calculate bounds from vertices array
   */
  private calculateBoundsFromVertices(
    vertices: Array<{ x: number; y: number; z: number }>
  ): MeshBounds {
    if (vertices.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      };
    }

    const firstVertex = vertices[0];
    if (!firstVertex) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      };
    }

    let minX = firstVertex.x,
      maxX = firstVertex.x;
    let minY = firstVertex.y,
      maxY = firstVertex.y;
    let minZ = firstVertex.z,
      maxZ = firstVertex.z;

    for (const vertex of vertices) {
      minX = Math.min(minX, vertex.x);
      maxX = Math.max(maxX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxY = Math.max(maxY, vertex.y);
      minZ = Math.min(minZ, vertex.z);
      maxZ = Math.max(maxZ, vertex.z);
    }

    return {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
    };
  }

  /**
   * Validate mesh topology and geometry
   */
  validateMesh(mesh: OFFMesh): MeshValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for valid face indices
    for (let i = 0; i < mesh.faces.length; i++) {
      const face = mesh.faces[i];
      for (const index of face) {
        if (index < 0 || index >= mesh.vertices.length) {
          errors.push(
            `invalid face index ${index} at face ${i}: must be between 0 and ${mesh.vertices.length - 1}`
          );
        }
      }
    }

    // Check for NaN or infinite values
    for (let i = 0; i < mesh.vertices.length; i++) {
      const vertex = mesh.vertices[i];
      if (!Number.isFinite(vertex.x) || !Number.isFinite(vertex.y) || !Number.isFinite(vertex.z)) {
        errors.push(`invalid vertex at index ${i}: contains NaN or infinite values`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Convert OFF mesh to Polyhedron3DGeometryData
   */
  private meshToGeometry(mesh: OFFMesh, params: ImportParameters): PolyhedronGeometryData {
    return {
      vertices: mesh.vertices,
      faces: mesh.faces.map((face) => Array.from(face)),
      normals: mesh.normals,
      metadata: {
        primitiveType: '3d-polyhedron',
        parameters: {
          pointCount: mesh.vertices.length,
          faceCount: mesh.faces.length,
          convexity: 1,
        },
        fragmentCount: mesh.vertices.length,
        generatedAt: Date.now(),
        isConvex: false, // OFF meshes are generally not convex
        volume: 0, // TODO: Calculate volume
        surfaceArea: 0, // TODO: Calculate surface area
      },
    };
  }
}
