/**
 * @file stl-importer.ts
 * @description STL Importer Service for OpenSCAD import() primitive
 *
 * Parses STL files (both ASCII and binary formats) and converts them to 3D mesh geometry.
 * Implements OpenSCAD-compatible STL import with proper scaling, centering, and validation.
 *
 * @example
 * ```typescript
 * const stlImporter = new STLImporterService();
 *
 * const result = await stlImporter.importSTL(stlContent, {
 *   file: "model.stl",
 *   scale: 2.0,
 *   center: true
 * });
 *
 * if (result.success) {
 *   console.log(`Imported STL with ${result.data.vertices.length} vertices`);
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

const logger = createLogger('STLImporterService');

/**
 * STL mesh data structure
 */
export interface STLMesh {
  readonly vertices: Array<{ x: number; y: number; z: number }>;
  readonly faces: Array<readonly [number, number, number]>;
  readonly normals?: Array<{ x: number; y: number; z: number }>;
  readonly metadata: {
    readonly format: 'ascii' | 'binary';
    readonly triangleCount: number;
    readonly header?: string;
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
 * STL import result type
 */
export type STLImportResult = Result<PolyhedronGeometryData, GeometryGenerationError>;

/**
 * STL Importer Service
 *
 * Handles parsing of STL files in both ASCII and binary formats.
 * Provides mesh validation, transformation, and OpenSCAD-compatible import functionality.
 */
export class STLImporterService {
  constructor() {
    logger.init('[INIT] STLImporterService initialized');
  }

  /**
   * Import STL content with OpenSCAD parameters
   *
   * @param content - STL file content (string for ASCII, Uint8Array for binary)
   * @param params - OpenSCAD import parameters
   * @returns Result containing 3D geometry or error
   */
  async importSTL(
    content: string | Uint8Array,
    params: ImportParameters
  ): Promise<STLImportResult> {
    try {
      logger.debug(`[IMPORT] Importing STL file: ${params.file}`);

      // Parse STL content
      const parseResult =
        typeof content === 'string'
          ? await this.parseSTLContent(content)
          : await this.parseSTLBinary(content);

      if (!parseResult.success) {
        return parseResult as STLImportResult;
      }

      const mesh = parseResult.data;

      // Apply transformations
      const transformedMesh = this.applyTransformations(mesh, params);

      // Convert to Polyhedron3DGeometryData
      const geometry = this.meshToGeometry(transformedMesh, params);

      logger.debug(`[SUCCESS] Imported STL with ${geometry.vertices.length} vertices`);

      return success(geometry);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[ERROR] STL import failed: ${errorMessage}`);

      return error({
        type: 'COMPUTATION_ERROR',
        message: `STL import failed: ${errorMessage}`,
        details: { file: params.file },
      });
    }
  }

  /**
   * Parse ASCII STL content
   *
   * @param content - ASCII STL content
   * @returns Result containing STL mesh or error
   */
  async parseSTLContent(content: string): Promise<Result<STLMesh, GeometryGenerationError>> {
    try {
      if (!content || content.trim().length === 0) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: 'STL content is empty',
          details: {},
        });
      }

      const lines = content.split('\n').map((line) => line.trim());

      // Validate that this is actually STL content
      const hasValidSTLStart = lines.some((line) => line.startsWith('solid'));
      if (!hasValidSTLStart) {
        return error({
          type: 'COMPUTATION_ERROR',
          message: 'invalid STL content: missing "solid" header',
          details: {},
        });
      }

      const vertices: Array<{ x: number; y: number; z: number }> = [];
      const faces: Array<readonly [number, number, number]> = [];
      const normals: Array<{ x: number; y: number; z: number }> = [];

      let header: string | undefined;
      let triangleCount = 0;
      let currentVertices: Array<{ x: number; y: number; z: number }> = [];
      let currentNormal: { x: number; y: number; z: number } | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue; // Skip undefined lines

        if (line.startsWith('solid ')) {
          header = line.substring(6).trim() || undefined;
        } else if (line.startsWith('facet normal ')) {
          const parts = line.split(/\s+/);
          if (parts.length >= 4) {
            currentNormal = {
              x: parseFloat(parts[2] ?? '0'),
              y: parseFloat(parts[3] ?? '0'),
              z: parseFloat(parts[4] ?? '0'),
            };
          }
        } else if (line.startsWith('vertex ')) {
          const parts = line.split(/\s+/);
          if (parts.length >= 4) {
            currentVertices.push({
              x: parseFloat(parts[1] ?? '0'),
              y: parseFloat(parts[2] ?? '0'),
              z: parseFloat(parts[3] ?? '0'),
            });
          }
        } else if (line === 'endfacet') {
          if (currentVertices.length === 3) {
            const startIndex = vertices.length;
            vertices.push(...currentVertices);
            faces.push([startIndex, startIndex + 1, startIndex + 2] as const);

            if (currentNormal) {
              normals.push(currentNormal, currentNormal, currentNormal);
            }

            triangleCount++;
          } else {
            return error({
              type: 'COMPUTATION_ERROR',
              message: `malformed triangle at line ${i + 1}: expected 3 vertices, got ${currentVertices.length}`,
              details: { line: i + 1 },
            });
          }

          currentVertices = [];
          currentNormal = null;
        }
      }

      const metadata: STLMesh['metadata'] = {
        format: 'ascii',
        triangleCount,
        ...(header !== undefined && { header }),
      };

      const mesh: STLMesh = {
        vertices,
        faces,
        metadata,
        ...(normals.length > 0 && { normals }),
      };

      return success(mesh);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Failed to parse ASCII STL: ${errorMessage}`,
        details: {},
      });
    }
  }

  /**
   * Parse binary STL content
   *
   * @param content - Binary STL content
   * @returns Result containing STL mesh or error
   */
  async parseSTLBinary(content: Uint8Array): Promise<Result<STLMesh, GeometryGenerationError>> {
    try {
      if (content.length < 84) {
        // 80-byte header + 4-byte triangle count
        return error({
          type: 'INVALID_PARAMETERS',
          message: 'invalid binary STL: file too short',
          details: { size: content.length },
        });
      }

      // Read triangle count
      const triangleCountView = new DataView(content.buffer, content.byteOffset + 80, 4);
      const triangleCount = triangleCountView.getUint32(0, true); // Little endian

      const expectedSize = 84 + triangleCount * 50; // Header + count + triangles
      if (content.length < expectedSize) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: 'invalid binary STL: incomplete triangle data',
          details: { expected: expectedSize, actual: content.length },
        });
      }

      const vertices: Array<{ x: number; y: number; z: number }> = [];
      const faces: Array<readonly [number, number, number]> = [];
      const normals: Array<{ x: number; y: number; z: number }> = [];

      let offset = 84; // Skip header and triangle count

      for (let i = 0; i < triangleCount; i++) {
        const triangleView = new DataView(content.buffer, content.byteOffset + offset, 50);

        // Read normal vector
        const normal = {
          x: triangleView.getFloat32(0, true),
          y: triangleView.getFloat32(4, true),
          z: triangleView.getFloat32(8, true),
        };

        // Read vertices
        const triangleVertices = [];
        for (let j = 0; j < 3; j++) {
          const vertexOffset = 12 + j * 12;
          triangleVertices.push({
            x: triangleView.getFloat32(vertexOffset, true),
            y: triangleView.getFloat32(vertexOffset + 4, true),
            z: triangleView.getFloat32(vertexOffset + 8, true),
          });
        }

        const startIndex = vertices.length;
        vertices.push(...triangleVertices);
        faces.push([startIndex, startIndex + 1, startIndex + 2] as const);
        normals.push(normal, normal, normal);

        offset += 50; // Move to next triangle
      }

      const mesh: STLMesh = {
        vertices,
        faces,
        normals,
        metadata: {
          format: 'binary',
          triangleCount,
        },
      };

      return success(mesh);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return error({
        type: 'COMPUTATION_ERROR',
        message: `Failed to parse binary STL: ${errorMessage}`,
        details: {},
      });
    }
  }

  /**
   * Detect if content is ASCII STL
   *
   * @param content - STL content to check
   * @returns True if ASCII STL format
   */
  isASCIISTL(content: string | Uint8Array): boolean {
    if (typeof content === 'string') {
      if (content.length === 0) return false;

      const trimmed = content.trim();
      // Check if it starts with 'solid' and contains STL keywords
      return (
        trimmed.startsWith('solid') && (content.includes('facet') || content.includes('vertex'))
      );
    } else {
      // Check if binary content contains ASCII STL patterns
      if (content.length === 0) return false;

      // Sample first 200 bytes to check for ASCII patterns
      const sample = content.slice(0, Math.min(200, content.length));
      const text = new TextDecoder('utf-8', { fatal: false });

      try {
        const decoded = text.decode(sample);
        // Check for STL keywords and that it's mostly ASCII
        const hasSTLKeywords =
          decoded.includes('solid') && (decoded.includes('facet') || decoded.includes('vertex'));
        // Check if content is mostly printable ASCII (allowing common whitespace)
        const nonAsciiCount = decoded.split('').filter((char) => {
          const code = char.charCodeAt(0);
          return !(code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126));
        }).length;
        const isAsciiLike = nonAsciiCount < decoded.length * 0.1; // Allow up to 10% non-ASCII

        return hasSTLKeywords && isAsciiLike;
      } catch {
        return false; // Not valid UTF-8, likely binary
      }
    }
  }

  /**
   * Apply transformations to mesh based on import parameters
   */
  private applyTransformations(mesh: STLMesh, params: ImportParameters): STLMesh {
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
  calculateBounds(mesh: STLMesh): MeshBounds {
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
  validateMesh(mesh: STLMesh): MeshValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for degenerate triangles
    for (let i = 0; i < mesh.faces.length; i++) {
      const face = mesh.faces[i];
      if (!face) {
        errors.push(`face at index ${i} is undefined`);
        continue;
      }

      const v1 = mesh.vertices[face[0]];
      const v2 = mesh.vertices[face[1]];
      const v3 = mesh.vertices[face[2]];

      if (!v1 || !v2 || !v3) {
        errors.push(`invalid vertex indices in face ${i}`);
        continue;
      }

      // Check if any two vertices are the same (degenerate triangle)
      if (this.verticesEqual(v1, v2) || this.verticesEqual(v2, v3) || this.verticesEqual(v1, v3)) {
        errors.push(`degenerate triangle at face ${i}: vertices are too close or identical`);
      }
    }

    // Check for NaN or infinite values
    for (let i = 0; i < mesh.vertices.length; i++) {
      const vertex = mesh.vertices[i];
      if (!vertex) {
        errors.push(`Missing vertex at index ${i}`);
        continue;
      }
      if (!Number.isFinite(vertex.x) || !Number.isFinite(vertex.y) || !Number.isFinite(vertex.z)) {
        errors.push(`Invalid vertex at index ${i}: contains NaN or infinite values`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Convert STL mesh to Polyhedron3DGeometryData
   */
  private meshToGeometry(mesh: STLMesh, _params: ImportParameters): PolyhedronGeometryData {
    return {
      vertices: mesh.vertices || [],
      faces: mesh.faces.map((face) => Array.from(face)),
      normals: mesh.normals || [],
      metadata: {
        primitiveType: '3d-polyhedron',
        parameters: {
          pointCount: mesh.vertices.length,
          faceCount: mesh.faces.length,
          convexity: 1,
        },
        fragmentCount: mesh.vertices.length,
        generatedAt: Date.now(),
        isConvex: false, // STL meshes are generally not convex
        volume: 0, // TODO: Calculate volume
        surfaceArea: 0, // TODO: Calculate surface area
      },
    };
  }

  /**
   * Check if two vertices are equal within tolerance
   */
  private verticesEqual(
    v1: { x: number; y: number; z: number },
    v2: { x: number; y: number; z: number }
  ): boolean {
    const tolerance = 1e-6; // More reasonable tolerance for degenerate detection
    return (
      Math.abs(v1.x - v2.x) < tolerance &&
      Math.abs(v1.y - v2.y) < tolerance &&
      Math.abs(v1.z - v2.z) < tolerance
    );
  }
}
