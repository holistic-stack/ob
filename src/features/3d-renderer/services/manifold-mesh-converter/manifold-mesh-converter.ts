/**
 * @file Manifold Mesh Converter
 * Task 2.1: Create Three.js to Manifold Converter (Green Phase)
 *
 * Converts Three.js BufferGeometry to BabylonJS-inspired IManifoldMesh format
 * Following project guidelines:
 * - BabylonJS-inspired mesh conversion with triangle winding reversal
 * - Result<T,E> error handling patterns
 * - Structured vertex properties with numProp count
 * - Material run support for Three.js materials
 * - World matrix transformation during conversion
 */

import { BufferGeometry, Float32BufferAttribute, Matrix4, Uint32BufferAttribute } from 'three';
import { logger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { ManifoldWasmLoader } from '../manifold-wasm-loader/manifold-wasm-loader';

/**
 * BabylonJS-inspired IManifoldMesh interface
 * Based on BabylonJS CSG2 implementation analysis
 */
export interface IManifoldMesh {
  numProp: number; // Vertex property count (positions + normals + UVs + colors)
  vertProperties: Float32Array; // Interleaved vertex data
  triVerts: Uint32Array; // Triangle indices (REVERSED winding order!)
  runIndex: Uint32Array; // Material run starts
  runOriginalID: Uint32Array; // Material IDs
  numRun: number; // Number of material runs
}

/**
 * Conversion options for Three.js to Manifold conversion
 */
export interface ConversionOptions {
  worldMatrix?: number[] | Matrix4; // World transformation matrix
  materialId?: number; // Material ID for this mesh
  reverseWinding?: boolean; // Whether to reverse triangle winding (default: false - official Manifold pattern)
  optimizeVertices?: boolean; // Whether to optimize vertex data (default: false)
  validateInput?: boolean; // Whether to perform extensive input validation (default: true)
  useOfficialMesh?: boolean; // Whether to return official Module.Mesh (default: false for compatibility)
}

/**
 * Conversion statistics for performance monitoring
 */
export interface ConversionStats {
  vertexCount: number;
  triangleCount: number;
  numProp: number;
  materialId: number;
  processingTimeMs: number;
  memoryUsageBytes: number;
}

/**
 * Convert Three.js BufferGeometry to BabylonJS-inspired IManifoldMesh
 *
 * This function implements the core conversion logic following BabylonJS patterns:
 * 1. Triangle winding reversal (critical for Manifold integration)
 * 2. Structured vertex properties with numProp system
 * 3. Material run handling for multi-material support
 * 4. World matrix transformation during conversion
 *
 * @param geometry - Three.js BufferGeometry to convert
 * @param options - Conversion options including world matrix and material ID
 * @returns Result<IManifoldMesh, string> with success/error pattern
 */
export function convertThreeToManifold(
  geometry: BufferGeometry,
  options: ConversionOptions = {}
): Result<IManifoldMesh, string> {
  const startTime = performance.now();

  try {
    logger.debug('[DEBUG][ManifoldMeshConverter] Starting Three.js to Manifold conversion');

    // Set default options (aligned with official Manifold patterns)
    const {
      worldMatrix,
      materialId = 0,
      reverseWinding = false, // Official Manifold pattern: no winding reversal needed
      optimizeVertices = false,
      validateInput = true,
      useOfficialMesh = false,
    } = options;

    // Validate input geometry (optional for performance)
    if (validateInput) {
      const validationResult = validateGeometry(geometry);
      if (!validationResult.success) {
        return validationResult;
      }
    } else if (!geometry || !(geometry instanceof BufferGeometry)) {
      return {
        success: false,
        error: 'Invalid geometry: Expected Three.js BufferGeometry instance',
      };
    }

    // Get position attribute (required)
    const positionAttribute = geometry.getAttribute('position');
    if (!positionAttribute) {
      return {
        success: false,
        error: 'Invalid geometry: Missing position attribute',
      };
    }

    // Validate position data
    if (positionAttribute.count === 0) {
      return {
        success: false,
        error: 'Invalid geometry: Empty position data',
      };
    }

    if (positionAttribute.itemSize !== 3) {
      return {
        success: false,
        error: `Invalid geometry: Position attribute must have itemSize 3, got ${positionAttribute.itemSize}`,
      };
    }

    // Get optional attributes
    const normalAttribute = geometry.getAttribute('normal');
    const uvAttribute = geometry.getAttribute('uv');
    const colorAttribute = geometry.getAttribute('color');

    // Calculate numProp (vertex property count)
    let numProp = 3; // Always have positions (x, y, z)
    if (normalAttribute) numProp += 3; // Add normals (nx, ny, nz)
    if (uvAttribute) numProp += 2; // Add UVs (u, v)
    if (colorAttribute) numProp += 3; // Add colors (r, g, b)

    const vertexCount = positionAttribute.count;

    // Create interleaved vertex properties array
    const vertProperties = new Float32Array(vertexCount * numProp);

    // Fill interleaved vertex data (optimized for performance)
    if (optimizeVertices) {
      fillVertexPropertiesOptimized(
        vertProperties,
        numProp,
        vertexCount,
        positionAttribute,
        normalAttribute,
        uvAttribute,
        colorAttribute
      );
    } else {
      fillVertexPropertiesStandard(
        vertProperties,
        numProp,
        vertexCount,
        positionAttribute,
        normalAttribute,
        uvAttribute,
        colorAttribute
      );
    }

    // Apply world matrix transformation if provided
    if (options.worldMatrix) {
      const result = applyWorldMatrixTransformation(vertProperties, numProp, options.worldMatrix);
      if (!result.success) {
        return result;
      }
    }

    // Handle triangle indices (official Manifold pattern: preserve Three.js CCW winding)
    const indexResult = processTriangleIndices(geometry, reverseWinding);
    if (!indexResult.success) {
      return indexResult;
    }

    const triVerts = indexResult.data;

    // Create material runs (single material for now)
    const runIndex = new Uint32Array([0]);
    const runOriginalID = new Uint32Array([materialId]);
    const numRun = 1;

    const manifoldMesh: IManifoldMesh = {
      numProp,
      vertProperties,
      triVerts,
      runIndex,
      runOriginalID,
      numRun,
    };

    // Calculate performance statistics
    const endTime = performance.now();
    const processingTimeMs = endTime - startTime;
    const memoryUsageBytes =
      vertProperties.byteLength +
      triVerts.byteLength +
      runIndex.byteLength +
      runOriginalID.byteLength;

    const stats: ConversionStats = {
      vertexCount,
      triangleCount: triVerts.length / 3,
      numProp,
      materialId,
      processingTimeMs,
      memoryUsageBytes,
    };

    logger.debug('[DEBUG][ManifoldMeshConverter] Conversion completed successfully', stats);

    return { success: true, data: manifoldMesh };
  } catch (error) {
    const errorMessage = `Three.js to Manifold conversion failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldMeshConverter] Conversion error', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Process triangle indices with optional winding reversal
 * Official Manifold pattern: preserve Three.js CCW winding (no reversal needed)
 * Winding reversal only needed for special cases or compatibility with other systems
 */
function processTriangleIndices(
  geometry: BufferGeometry,
  reverseWinding: boolean
): Result<Uint32Array, string> {
  try {
    const indexAttribute = geometry.getIndex();
    let indices: Uint32Array;

    if (indexAttribute) {
      // Indexed geometry - use existing indices
      indices = new Uint32Array(indexAttribute.array);
    } else {
      // Non-indexed geometry - generate indices
      const vertexCount = geometry.getAttribute('position').count;
      if (vertexCount % 3 !== 0) {
        return {
          success: false,
          error: `Non-indexed geometry must have vertex count divisible by 3, got ${vertexCount}`,
        };
      }

      indices = new Uint32Array(vertexCount);
      for (let i = 0; i < vertexCount; i++) {
        indices[i] = i;
      }
    }

    // Apply triangle winding reversal (only when explicitly requested)
    // Official Manifold pattern: preserve Three.js CCW winding (reverseWinding = false)
    if (reverseWinding) {
      for (let i = 0; i < indices.length; i += 3) {
        // Reverse winding: [a, b, c] -> [a, c, b]
        const temp = indices[i + 1];
        indices[i + 1] = indices[i + 2];
        indices[i + 2] = temp;
      }
    }

    return { success: true, data: indices };
  } catch (error) {
    const errorMessage = `Triangle index processing failed: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Apply world matrix transformation to vertex properties
 * Transforms positions and normals according to world matrix
 */
function applyWorldMatrixTransformation(
  vertProperties: Float32Array,
  numProp: number,
  worldMatrix: number[] | Matrix4
): Result<void, string> {
  try {
    // Convert to Matrix4 if needed
    let matrix: Matrix4;
    if (Array.isArray(worldMatrix)) {
      matrix = new Matrix4().fromArray(worldMatrix);
    } else {
      matrix = worldMatrix;
    }

    const vertexCount = vertProperties.length / numProp;

    // Transform each vertex
    for (let i = 0; i < vertexCount; i++) {
      const offset = i * numProp;

      // Transform position (first 3 components)
      const x = vertProperties[offset];
      const y = vertProperties[offset + 1];
      const z = vertProperties[offset + 2];

      // Apply matrix transformation
      const transformed = matrix.multiplyVector3({ x, y, z } as any);

      vertProperties[offset] = transformed.x;
      vertProperties[offset + 1] = transformed.y;
      vertProperties[offset + 2] = transformed.z;

      // Transform normals if present (assuming normals start at offset 3)
      if (numProp >= 6) {
        // positions + normals
        const nx = vertProperties[offset + 3];
        const ny = vertProperties[offset + 4];
        const nz = vertProperties[offset + 5];

        // Transform normal (use normal matrix - upper 3x3 of inverse transpose)
        const normalMatrix = matrix.clone().invert().transpose();
        const transformedNormal = normalMatrix.multiplyVector3({ x: nx, y: ny, z: nz } as any);

        vertProperties[offset + 3] = transformedNormal.x;
        vertProperties[offset + 4] = transformedNormal.y;
        vertProperties[offset + 5] = transformedNormal.z;
      }
    }

    return { success: true, data: undefined };
  } catch (error) {
    const errorMessage = `World matrix transformation failed: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Validate BufferGeometry for conversion
 * Comprehensive validation for input geometry
 */
function validateGeometry(geometry: BufferGeometry): Result<void, string> {
  if (!geometry || !(geometry instanceof BufferGeometry)) {
    return {
      success: false,
      error: 'Invalid geometry: Expected Three.js BufferGeometry instance',
    };
  }

  const positionAttribute = geometry.getAttribute('position');
  if (!positionAttribute) {
    return {
      success: false,
      error: 'Invalid geometry: Missing position attribute',
    };
  }

  if (positionAttribute.count === 0) {
    return {
      success: false,
      error: 'Invalid geometry: Empty position data',
    };
  }

  if (positionAttribute.itemSize !== 3) {
    return {
      success: false,
      error: `Invalid geometry: Position attribute must have itemSize 3, got ${positionAttribute.itemSize}`,
    };
  }

  return { success: true, data: undefined };
}

/**
 * Fill vertex properties using standard approach
 * Readable and maintainable implementation
 */
function fillVertexPropertiesStandard(
  vertProperties: Float32Array,
  numProp: number,
  vertexCount: number,
  positionAttribute: any,
  normalAttribute: any,
  uvAttribute: any,
  colorAttribute: any
): void {
  for (let i = 0; i < vertexCount; i++) {
    let offset = i * numProp;

    // Add positions (always present)
    vertProperties[offset++] = positionAttribute.getX(i);
    vertProperties[offset++] = positionAttribute.getY(i);
    vertProperties[offset++] = positionAttribute.getZ(i);

    // Add normals if present
    if (normalAttribute) {
      vertProperties[offset++] = normalAttribute.getX(i);
      vertProperties[offset++] = normalAttribute.getY(i);
      vertProperties[offset++] = normalAttribute.getZ(i);
    }

    // Add UVs if present
    if (uvAttribute) {
      vertProperties[offset++] = uvAttribute.getX(i);
      vertProperties[offset++] = uvAttribute.getY(i);
    }

    // Add colors if present
    if (colorAttribute) {
      vertProperties[offset++] = colorAttribute.getX(i);
      vertProperties[offset++] = colorAttribute.getY(i);
      vertProperties[offset++] = colorAttribute.getZ(i);
    }
  }
}

/**
 * Fill vertex properties using optimized approach
 * Performance-optimized implementation for large meshes
 */
function fillVertexPropertiesOptimized(
  vertProperties: Float32Array,
  numProp: number,
  vertexCount: number,
  positionAttribute: any,
  normalAttribute: any,
  uvAttribute: any,
  colorAttribute: any
): void {
  // Use direct array access for better performance
  const positions = positionAttribute.array;
  const normals = normalAttribute?.array;
  const uvs = uvAttribute?.array;
  const colors = colorAttribute?.array;

  for (let i = 0; i < vertexCount; i++) {
    let offset = i * numProp;
    const i3 = i * 3;
    const i2 = i * 2;

    // Add positions (direct array access)
    vertProperties[offset++] = positions[i3];
    vertProperties[offset++] = positions[i3 + 1];
    vertProperties[offset++] = positions[i3 + 2];

    // Add normals if present
    if (normals) {
      vertProperties[offset++] = normals[i3];
      vertProperties[offset++] = normals[i3 + 1];
      vertProperties[offset++] = normals[i3 + 2];
    }

    // Add UVs if present
    if (uvs) {
      vertProperties[offset++] = uvs[i2];
      vertProperties[offset++] = uvs[i2 + 1];
    }

    // Add colors if present
    if (colors) {
      vertProperties[offset++] = colors[i3];
      vertProperties[offset++] = colors[i3 + 1];
      vertProperties[offset++] = colors[i3 + 2];
    }
  }
}

/**
 * Create official Manifold Mesh from IManifoldMesh data
 * This function bridges our interface with the official Manifold API
 *
 * @param meshData - IManifoldMesh data from convertThreeToManifold
 * @param manifoldModule - Loaded Manifold WASM module
 * @returns Result<any, string> with official Manifold Mesh instance
 */
export async function createOfficialManifoldMesh(
  meshData: IManifoldMesh,
  manifoldModule?: any
): Promise<Result<any, string>> {
  try {
    // Load Manifold module if not provided
    if (!manifoldModule) {
      const loader = new ManifoldWasmLoader();
      const loadResult = await loader.load();
      if (!loadResult) {
        return { success: false, error: 'Failed to load Manifold WASM module' };
      }
      manifoldModule = loadResult;
    }

    // Create official Manifold Mesh using the same pattern as the official Three.js example
    const mesh = new manifoldModule.Mesh({
      numProp: meshData.numProp,
      vertProperties: meshData.vertProperties,
      triVerts: meshData.triVerts,
      runIndex: meshData.runIndex,
      runOriginalID: meshData.runOriginalID,
      numRun: meshData.numRun,
    });

    // Call merge() as shown in official example for manifold reconstruction
    mesh.merge();

    logger.debug('[DEBUG][ManifoldMeshConverter] Created official Manifold mesh', {
      numProp: meshData.numProp,
      vertexCount: meshData.vertProperties.length / meshData.numProp,
      triangleCount: meshData.triVerts.length / 3,
      materialRuns: meshData.numRun,
    });

    return { success: true, data: mesh };
  } catch (error) {
    const errorMessage = `Failed to create official Manifold mesh: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldMeshConverter] Official mesh creation failed', {
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Convert Three.js BufferGeometry directly to official Manifold Mesh
 * Convenience function that combines convertThreeToManifold + createOfficialManifoldMesh
 *
 * @param geometry - Three.js BufferGeometry to convert
 * @param options - Conversion options
 * @param manifoldModule - Optional pre-loaded Manifold WASM module
 * @returns Result<any, string> with official Manifold Mesh instance
 */
export async function convertThreeToOfficialManifold(
  geometry: BufferGeometry,
  options: ConversionOptions = {},
  manifoldModule?: any
): Promise<Result<any, string>> {
  try {
    // Convert to IManifoldMesh first
    const meshDataResult = convertThreeToManifold(geometry, options);
    if (!meshDataResult.success) {
      return meshDataResult;
    }

    // Create official Manifold mesh
    const officialMeshResult = await createOfficialManifoldMesh(
      meshDataResult.data,
      manifoldModule
    );
    if (!officialMeshResult.success) {
      return officialMeshResult;
    }

    return { success: true, data: officialMeshResult.data };
  } catch (error) {
    const errorMessage = `Failed to convert Three.js to official Manifold: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldMeshConverter] Direct conversion failed', {
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Conversion options for Manifold to Three.js conversion
 */
export interface ManifoldToThreeOptions {
  preserveGroups?: boolean; // Whether to create geometry groups from material runs (default: true)
  computeNormals?: boolean; // Whether to compute normals if missing (default: false)
  optimizeGeometry?: boolean; // Whether to optimize the resulting geometry (default: false)
  validateOutput?: boolean; // Whether to validate the output geometry (default: true)
}

/**
 * Convert IManifoldMesh back to Three.js BufferGeometry
 *
 * This function implements the reverse conversion from Manifold mesh data
 * back to Three.js BufferGeometry, following official Manifold patterns:
 * 1. Extract vertex properties from interleaved data
 * 2. Preserve triangle winding (no reversal needed - official Manifold pattern)
 * 3. Reconstruct material runs as geometry groups for multi-material support
 * 4. Handle normals, UVs, and colors if present in the mesh data
 * 5. Optional geometry optimization and validation
 *
 * @param meshData - IManifoldMesh data to convert
 * @param options - Conversion options for customizing the output
 * @returns Result<BufferGeometry, string> with success/error pattern
 */
export function convertManifoldToThree(
  meshData: IManifoldMesh,
  options: ManifoldToThreeOptions = {}
): Result<BufferGeometry, string> {
  const startTime = performance.now();

  try {
    logger.debug('[DEBUG][ManifoldMeshConverter] Starting Manifold to Three.js conversion');

    // Set default options
    const {
      preserveGroups = true,
      computeNormals = false,
      optimizeGeometry = false,
      validateOutput = true,
    } = options;

    // Validate input mesh data
    if (!meshData || typeof meshData !== 'object') {
      return {
        success: false,
        error: 'Invalid mesh data: Expected IManifoldMesh object',
      };
    }

    if (!meshData.vertProperties || meshData.vertProperties.length === 0) {
      return {
        success: false,
        error: 'Invalid mesh data: Empty or missing vertex properties',
      };
    }

    if (!meshData.triVerts || meshData.triVerts.length === 0) {
      return {
        success: false,
        error: 'Invalid mesh data: Empty or missing triangle vertices',
      };
    }

    if (meshData.numProp <= 0) {
      return {
        success: false,
        error: 'Invalid mesh data: numProp must be greater than 0',
      };
    }

    const vertexCount = meshData.vertProperties.length / meshData.numProp;
    if (vertexCount !== Math.floor(vertexCount)) {
      return {
        success: false,
        error: `Invalid mesh data: Vertex properties length (${meshData.vertProperties.length}) not divisible by numProp (${meshData.numProp})`,
      };
    }

    // Create new BufferGeometry
    const geometry = new BufferGeometry();

    // Extract vertex attributes from interleaved data
    const attributeResult = extractVertexAttributes(meshData, vertexCount);
    if (!attributeResult.success) {
      return attributeResult;
    }

    const { positions, normals, uvs, colors } = attributeResult.data;

    // Set vertex attributes
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

    if (normals) {
      geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    }

    if (uvs) {
      geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    }

    if (colors) {
      geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    }

    // Set triangle indices (preserve winding - no reversal needed per official Manifold pattern)
    geometry.setIndex(new Uint32BufferAttribute(meshData.triVerts, 1));

    // Compute normals if missing and requested
    if (computeNormals && !normals) {
      geometry.computeVertexNormals();
      logger.debug('[DEBUG][ManifoldMeshConverter] Computed vertex normals');
    }

    // Handle material runs as geometry groups
    if (preserveGroups && meshData.numRun > 1) {
      const groupResult = createGeometryGroups(geometry, meshData);
      if (!groupResult.success) {
        logger.warn('[WARN][ManifoldMeshConverter] Failed to create geometry groups', {
          error: groupResult.error,
        });
        // Continue without groups rather than failing
      }
    }

    // Optimize geometry if requested
    if (optimizeGeometry) {
      // Merge vertices and optimize indices
      geometry.mergeVertices();
      logger.debug('[DEBUG][ManifoldMeshConverter] Optimized geometry');
    }

    // Validate output geometry if requested
    if (validateOutput) {
      const validationResult = validateGeometryOutput(geometry);
      if (!validationResult.success) {
        logger.warn('[WARN][ManifoldMeshConverter] Geometry validation failed', {
          error: validationResult.error,
        });
        // Continue with warning rather than failing
      }
    }

    // Calculate performance statistics
    const endTime = performance.now();
    const processingTimeMs = endTime - startTime;

    logger.debug('[DEBUG][ManifoldMeshConverter] Manifold to Three.js conversion completed', {
      vertexCount,
      triangleCount: meshData.triVerts.length / 3,
      numProp: meshData.numProp,
      materialRuns: meshData.numRun,
      processingTimeMs,
      hasNormals: !!normals,
      hasUVs: !!uvs,
      hasColors: !!colors,
    });

    return { success: true, data: geometry };
  } catch (error) {
    const errorMessage = `Manifold to Three.js conversion failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldMeshConverter] Conversion error', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Extract vertex attributes from interleaved Manifold mesh data
 * Handles positions, normals, UVs, and colors based on numProp
 */
function extractVertexAttributes(
  meshData: IManifoldMesh,
  vertexCount: number
): Result<
  {
    positions: Float32Array;
    normals?: Float32Array;
    uvs?: Float32Array;
    colors?: Float32Array;
  },
  string
> {
  try {
    const { vertProperties, numProp } = meshData;

    // Allocate arrays for each attribute type
    const positions = new Float32Array(vertexCount * 3);
    let normals: Float32Array | undefined;
    let uvs: Float32Array | undefined;
    let colors: Float32Array | undefined;

    // Determine attribute layout based on numProp
    // Common layouts: 3 (pos), 6 (pos+normal), 5 (pos+uv), 8 (pos+normal+uv), 9 (pos+normal+color), 11 (pos+normal+uv+color)
    let hasNormals = false;
    let hasUVs = false;
    let hasColors = false;

    if (numProp >= 6) {
      hasNormals = true;
      normals = new Float32Array(vertexCount * 3);
    }

    if (numProp >= 8 && hasNormals) {
      hasUVs = true;
      uvs = new Float32Array(vertexCount * 2);
    } else if (numProp >= 5 && !hasNormals) {
      hasUVs = true;
      uvs = new Float32Array(vertexCount * 2);
    }

    if (numProp >= 11 && hasNormals && hasUVs) {
      hasColors = true;
      colors = new Float32Array(vertexCount * 3);
    } else if (numProp >= 9 && hasNormals && !hasUVs) {
      hasColors = true;
      colors = new Float32Array(vertexCount * 3);
    } else if (numProp >= 8 && !hasNormals && hasUVs) {
      hasColors = true;
      colors = new Float32Array(vertexCount * 3);
    } else if (numProp >= 6 && !hasNormals && !hasUVs) {
      hasColors = true;
      colors = new Float32Array(vertexCount * 3);
    }

    // Extract interleaved vertex data
    for (let i = 0; i < vertexCount; i++) {
      const offset = i * numProp;
      let propIndex = 0;

      // Extract positions (always present)
      positions[i * 3] = vertProperties[offset + propIndex++];
      positions[i * 3 + 1] = vertProperties[offset + propIndex++];
      positions[i * 3 + 2] = vertProperties[offset + propIndex++];

      // Extract normals if present
      if (hasNormals && normals) {
        normals[i * 3] = vertProperties[offset + propIndex++];
        normals[i * 3 + 1] = vertProperties[offset + propIndex++];
        normals[i * 3 + 2] = vertProperties[offset + propIndex++];
      }

      // Extract UVs if present
      if (hasUVs && uvs) {
        uvs[i * 2] = vertProperties[offset + propIndex++];
        uvs[i * 2 + 1] = vertProperties[offset + propIndex++];
      }

      // Extract colors if present
      if (hasColors && colors) {
        colors[i * 3] = vertProperties[offset + propIndex++];
        colors[i * 3 + 1] = vertProperties[offset + propIndex++];
        colors[i * 3 + 2] = vertProperties[offset + propIndex++];
      }
    }

    return {
      success: true,
      data: {
        positions,
        normals,
        uvs,
        colors,
      },
    };
  } catch (error) {
    const errorMessage = `Failed to extract vertex attributes: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Create geometry groups from Manifold material runs
 * Maps material runs to Three.js geometry groups for multi-material support
 */
function createGeometryGroups(
  geometry: BufferGeometry,
  meshData: IManifoldMesh
): Result<void, string> {
  try {
    const { runIndex, runOriginalID, numRun, triVerts } = meshData;

    // Clear existing groups
    geometry.clearGroups();

    // Create groups for each material run
    for (let i = 0; i < numRun; i++) {
      const start = runIndex[i];
      const end = i < numRun - 1 ? runIndex[i + 1] : triVerts.length;
      const count = end - start;
      const materialIndex = runOriginalID[i];

      if (count > 0) {
        geometry.addGroup(start, count, materialIndex);
      }
    }

    return { success: true, data: undefined };
  } catch (error) {
    const errorMessage = `Failed to create geometry groups: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Validate Three.js BufferGeometry output
 * Ensures the geometry is valid and ready for rendering
 */
function validateGeometryOutput(geometry: BufferGeometry): Result<void, string> {
  try {
    // Check for required position attribute
    const positionAttribute = geometry.getAttribute('position');
    if (!positionAttribute || positionAttribute.count === 0) {
      return { success: false, error: 'Geometry missing or empty position attribute' };
    }

    // Check for valid indices
    const indexAttribute = geometry.getIndex();
    if (!indexAttribute || indexAttribute.count === 0) {
      return { success: false, error: 'Geometry missing or empty index attribute' };
    }

    // Verify triangle count is valid
    if (indexAttribute.count % 3 !== 0) {
      return {
        success: false,
        error: `Invalid triangle count: ${indexAttribute.count} indices not divisible by 3`,
      };
    }

    // Check for valid bounding box
    geometry.computeBoundingBox();
    if (!geometry.boundingBox) {
      return { success: false, error: 'Failed to compute bounding box' };
    }

    return { success: true, data: undefined };
  } catch (error) {
    const errorMessage = `Geometry validation failed: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Perform round-trip conversion: Three.js → Manifold → Three.js
 * Useful for testing conversion fidelity and mesh processing
 *
 * @param originalGeometry - Original Three.js BufferGeometry
 * @param threeToManifoldOptions - Options for Three.js to Manifold conversion
 * @param manifoldToThreeOptions - Options for Manifold to Three.js conversion
 * @returns Result<BufferGeometry, string> with the round-trip result
 */
export function roundTripConversion(
  originalGeometry: BufferGeometry,
  threeToManifoldOptions: ConversionOptions = {},
  manifoldToThreeOptions: ManifoldToThreeOptions = {}
): Result<BufferGeometry, string> {
  try {
    // Convert to Manifold
    const manifoldResult = convertThreeToManifold(originalGeometry, threeToManifoldOptions);
    if (!manifoldResult.success) {
      return {
        success: false,
        error: `Three.js to Manifold conversion failed: ${manifoldResult.error}`,
      };
    }

    // Convert back to Three.js
    const threeResult = convertManifoldToThree(manifoldResult.data, manifoldToThreeOptions);
    if (!threeResult.success) {
      return {
        success: false,
        error: `Manifold to Three.js conversion failed: ${threeResult.error}`,
      };
    }

    logger.debug('[DEBUG][ManifoldMeshConverter] Round-trip conversion completed successfully');

    return { success: true, data: threeResult.data };
  } catch (error) {
    const errorMessage = `Round-trip conversion failed: ${error instanceof Error ? error.message : String(error)}`;
    logger.error('[ERROR][ManifoldMeshConverter] Round-trip conversion error', {
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}
