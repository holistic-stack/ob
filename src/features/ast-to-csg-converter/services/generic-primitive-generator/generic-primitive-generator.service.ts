/**
 * @file generic-primitive-generator.service.ts
 * @description This service is responsible for generating renderer-agnostic primitive geometry data
 * from OpenSCAD AST nodes. It acts as a Layer 2 service in the Enhanced 4-Layer Architecture,
 * providing a clean separation between AST parsing and renderer-specific mesh creation.
 * It outputs generic mesh data, not tied to any specific 3D rendering library.
 *
 * @architectural_decision
 * - **Renderer Agnostic**: The service generates `GenericGeometry` and `GenericVertex` data structures,
 *   which are independent of any particular 3D rendering engine (e.g., Babylon.js, Three.js).
 *   This allows the core geometry generation logic to be reused across different rendering contexts.
 * - **Single Responsibility Principle (SRP)**: This service focuses solely on primitive geometry generation.
 *   It does not handle AST parsing, CSG operations, or renderer-specific mesh instantiation.
 * - **Functional Error Handling**: Uses the `Result<T, E>` type for all operations that might fail,
 *   providing explicit success and error states and avoiding exceptions for control flow.
 * - **Simplified Geometry**: For demonstration and initial implementation, the geometry generation
 *   (especially for sphere and cylinder) is simplified. In a production-grade system, more robust
 *   algorithms would be used to create higher-fidelity meshes.
 *
 * @example
 * ```typescript
 * import { GenericPrimitiveGeneratorService } from './generic-primitive-generator.service';
 * import type { CubeNode } from '../../../openscad-parser/ast/ast-types';
 *
 * const generator = new GenericPrimitiveGeneratorService();
 * const cubeNode: CubeNode = {
 *   type: 'Cube',
 *   size: [10, 20, 30],
 *   center: true,
 *   location: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
 * };
 *
 * const result = generator.generateCube(cubeNode);
 * if (result.success) {
 *   console.log('Generated cube geometry:', result.data.geometry);
 *   console.log('Vertex count:', result.data.metadata.vertexCount);
 * } else {
 *   console.error('Failed to generate cube:', result.error.message);
 * }
 * ```
 *
 * @diagram
 * ```mermaid
 * graph TD
 *    A[OpenSCAD AST Node (e.g., CubeNode)] --> B{GenericPrimitiveGeneratorService.generateX()};
 *    B -- Extracts Parameters --> C[extractXParams()];
 *    C --> D[createXGeometry()];
 *    D -- Generates --> E[GenericGeometry (vertices, indices, boundingBox)];
 *    E --> F[PrimitiveGenerationResult (with metadata)];
 *    F -- Returns --> G[Result<PrimitiveGenerationResult, PrimitiveGenerationError>];
 * ```
 */

import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch } from '../../../../shared/utils/functional/result';
import type { CubeNode, CylinderNode, SphereNode } from '../../../openscad-parser/ast/ast-types';
import type { MaterialConfig, MeshMetadata } from '../../types/conversion.types';

/**
 * @constant logger
 * @description Logger instance for the `GenericPrimitiveGeneratorService`,
 * providing structured logging for debugging and tracing primitive generation processes.
 */
const logger = createLogger('GenericPrimitiveGenerator');

/**
 * @interface GenericVertex
 * @description Represents a single vertex in a 3D mesh in a renderer-agnostic format.
 * @property {readonly [number, number, number]} position - The 3D coordinates (x, y, z) of the vertex.
 * @property {readonly [number, number, number]} normal - The 3D normal vector (nx, ny, nz) of the vertex, indicating surface orientation.
 * @property {readonly [number, number]} uv - The 2D texture coordinates (u, v) of the vertex.
 * @example
 * ```typescript
 * const vertex: GenericVertex = {
 *   position: [0, 0, 0],
 *   normal: [0, 1, 0],
 *   uv: [0.5, 0.5],
 * };
 * ```
 */
export interface GenericVertex {
  readonly position: readonly [number, number, number];
  readonly normal: readonly [number, number, number];
  readonly uv: readonly [number, number];
}

/**
 * @interface GenericGeometry
 * @description Represents the geometric data of a 3D mesh in a renderer-agnostic format.
 * @property {readonly GenericVertex[]} vertices - An array of `GenericVertex` objects defining the mesh's vertices.
 * @property {readonly number[]} indices - An array of numbers representing the indices that form triangles from the `vertices` array.
 * @property {object} boundingBox - The axis-aligned bounding box of the geometry.
 * @property {readonly [number, number, number]} boundingBox.min - The minimum (x, y, z) coordinates of the bounding box.
 * @property {readonly [number, number, number]} boundingBox.max - The maximum (x, y, z) coordinates of the bounding box.
 * @example
 * ```typescript
 * const geometry: GenericGeometry = {
 *   vertices: [
 *     { position: [0, 0, 0], normal: [0, 0, 1], uv: [0, 0] },
 *     // ... other vertices
 *   ],
 *   indices: [0, 1, 2, /* ... other indices * /],
 *   boundingBox: { min: [-1, -1, -1], max: [1, 1, 1] },
 * };
 * ```
 */
export interface GenericGeometry {
  readonly vertices: readonly GenericVertex[];
  readonly indices: readonly number[];
  readonly boundingBox: {
    readonly min: readonly [number, number, number];
    readonly max: readonly [number, number, number];
  };
}

/**
 * @interface PrimitiveGenerationResult
 * @description Represents the successful result of a primitive geometry generation operation.
 * @property {GenericGeometry} geometry - The generated renderer-agnostic geometric data.
 * @property {MaterialConfig} material - The material configuration associated with the primitive.
 * @property {MeshMetadata} metadata - Metadata about the generated mesh, including counts and performance.
 * @property {number} generationTime - The time taken in milliseconds to generate the primitive.
 * @example
 * ```typescript
 * const result: PrimitiveGenerationResult = {
 *   geometry: { /* ... * / },
 *   material: { color: '#FF0000' },
 *   metadata: { vertexCount: 8, triangleCount: 12 },
 *   generationTime: 5.2,
 * };
 * ```
 */
export interface PrimitiveGenerationResult {
  readonly geometry: GenericGeometry;
  readonly material: MaterialConfig;
  readonly metadata: MeshMetadata;
  readonly generationTime: number;
}

/**
 * @interface PrimitiveGenerationError
 * @description Represents an error that occurred during primitive geometry generation.
 * @property {string} code - A unique error code (e.g., 'CUBE_GENERATION_FAILED').
 * @property {string} message - A human-readable error message.
 * @property {string} primitiveType - The type of primitive that failed to generate (e.g., 'cube', 'sphere').
 * @property {Date} timestamp - The timestamp when the error occurred.
 * @example
 * ```typescript
 * const error: PrimitiveGenerationError = {
 *   code: 'INVALID_RADIUS',
 *   message: 'Sphere radius cannot be negative',
 *   primitiveType: 'sphere',
 *   timestamp: new Date(),
 * };
 * ```
 */
export interface PrimitiveGenerationError {
  readonly code: string;
  readonly message: string;
  readonly primitiveType: string;
  readonly timestamp: Date;
}

/**
 * @constant DEFAULT_MATERIAL
 * @description Default material configuration applied to generated primitives if no specific material is provided.
 * @property {string} color - Default color for the primitive.
 * @property {number} metalness - Default metalness value.
 * @property {number} roughness - Default roughness value.
 * @property {number} opacity - Default opacity value.
 * @property {boolean} transparent - Default transparency setting.
 * @property {string} side - Default rendering side.
 * @property {boolean} wireframe - Default wireframe setting.
 */
const DEFAULT_MATERIAL: MaterialConfig = {
  color: '#00ff88',
  metalness: 0.1,
  roughness: 0.8,
  opacity: 1.0,
  transparent: false,
  side: 'front',
  wireframe: false,
};

/**
 * @class GenericPrimitiveGeneratorService
 * @description Service responsible for generating renderer-agnostic primitive geometry from OpenSCAD AST nodes.
 * This service operates at Layer 2 (AST-to-CSG Conversion) and outputs generic data structures
 * that can then be consumed by renderer-specific services.
 */
export class GenericPrimitiveGeneratorService {
  /**
   * @constructor
   * @description Initializes the `GenericPrimitiveGeneratorService`.
   * Logs an initialization message.
   */
  constructor() {
    logger.init('[INIT][GenericPrimitiveGenerator] Service initialized');
  }

  /**
   * @method generateCube
   * @description Generates `GenericGeometry` for a cube based on the provided `CubeNode`.
   * It extracts size and centering information from the AST node and constructs the cube's vertices, indices, and bounding box.
   * @param {CubeNode} node - The AST node representing a cube.
   * @returns {Result<PrimitiveGenerationResult, PrimitiveGenerationError>} A `Result` object indicating success with the generated primitive data or an error.
   *
   * @limitations
   * - The cube geometry generation is a basic implementation. More complex cube definitions (e.g., rounded corners) are not supported.
   *
   * @edge_cases
   * - **Missing Size/Center**: Defaults to `[1, 1, 1]` for size and `false` for center if not explicitly defined in the `CubeNode`.
   *
   * @example
   * ```typescript
   * const cubeNode: CubeNode = { type: 'Cube', size: [5, 5, 5], center: true, location: { /* ... * / } };
   * const result = generator.generateCube(cubeNode);
   * if (result.success) {
   *   console.log('Cube vertices:', result.data.geometry.vertices.length);
   * }
   * ```
   */
  generateCube(node: CubeNode): Result<PrimitiveGenerationResult, PrimitiveGenerationError> {
    const startTime = performance.now();
    logger.debug('[DEBUG][GenericPrimitiveGenerator] Generating cube geometry...');

    return tryCatch(
      () => {
        const size = this.extractCubeSize(node);
        const center = this.extractCubeCenter(node);

        const geometry = this.createCubeGeometry(size, center);
        const generationTime = performance.now() - startTime;

        const metadata: MeshMetadata = {
          meshId: `cube_${Date.now()}`,
          triangleCount: geometry.indices.length / 3,
          vertexCount: geometry.vertices.length,
          boundingBox: geometry.boundingBox,
          complexity: geometry.vertices.length,
          operationTime: generationTime,
          isOptimized: true,
          lastAccessed: new Date(),
        };

        logger.debug(
          `[DEBUG][GenericPrimitiveGenerator] Cube generated in ${generationTime.toFixed(2)}ms`
        );

        return {
          geometry,
          material: DEFAULT_MATERIAL,
          metadata,
          generationTime,
        };
      },
      (error) => ({
        code: 'CUBE_GENERATION_FAILED',
        message: `Failed to generate cube: ${error}`,
        primitiveType: 'cube',
        timestamp: new Date(),
      })
    );
  }

  /**
   * @method generateSphere
   * @description Generates `GenericGeometry` for a sphere based on the provided `SphereNode`.
   * It extracts the radius from the AST node and constructs a simplified sphere's vertices, indices, and bounding box.
   * @param {SphereNode} node - The AST node representing a sphere.
   * @returns {Result<PrimitiveGenerationResult, PrimitiveGenerationError>} A `Result` object indicating success with the generated primitive data or an error.
   *
   * @limitations
   * - The current implementation generates a very simplified sphere (octahedron). For higher quality, a more complex algorithm (e.g., UV sphere, geodesic sphere) would be required.
   *
   * @edge_cases
   * - **Missing Radius/Diameter**: Defaults to `1` for radius if neither `radius` nor `diameter` is defined in the `SphereNode`.
   *
   * @example
   * ```typescript
   * const sphereNode: SphereNode = { type: 'Sphere', radius: 10, location: { /* ... * / } };
   * const result = generator.generateSphere(sphereNode);
   * if (result.success) {
   *   console.log('Sphere vertices:', result.data.geometry.vertices.length);
   * }
   * ```
   */
  generateSphere(node: SphereNode): Result<PrimitiveGenerationResult, PrimitiveGenerationError> {
    const startTime = performance.now();
    logger.debug('[DEBUG][GenericPrimitiveGenerator] Generating sphere geometry...');

    return tryCatch(
      () => {
        const radius = this.extractSphereRadius(node);

        const geometry = this.createSphereGeometry(radius);
        const generationTime = performance.now() - startTime;

        const metadata: MeshMetadata = {
          meshId: `sphere_${Date.now()}`,
          triangleCount: geometry.indices.length / 3,
          vertexCount: geometry.vertices.length,
          boundingBox: geometry.boundingBox,
          complexity: geometry.vertices.length,
          operationTime: generationTime,
          isOptimized: true,
          lastAccessed: new Date(),
        };

        logger.debug(
          `[DEBUG][GenericPrimitiveGenerator] Sphere generated in ${generationTime.toFixed(2)}ms`
        );

        return {
          geometry,
          material: DEFAULT_MATERIAL,
          metadata,
          generationTime,
        };
      },
      (error) => ({
        code: 'SPHERE_GENERATION_FAILED',
        message: `Failed to generate sphere: ${error}`,
        primitiveType: 'sphere',
        timestamp: new Date(),
      })
    );
  }

  /**
   * @method generateCylinder
   * @description Generates `GenericGeometry` for a cylinder based on the provided `CylinderNode`.
   * It extracts height, radii, and centering information, then constructs a simplified cylinder's vertices, indices, and bounding box.
   * @param {CylinderNode} node - The AST node representing a cylinder.
   * @returns {Result<PrimitiveGenerationResult, PrimitiveGenerationError>} A `Result` object indicating success with the generated primitive data or an error.
   *
   * @limitations
   * - The current implementation generates a very simplified cylinder (a prism with 6 segments). For higher quality and smoother appearance, more segments or a different algorithm would be needed.
   * - Does not support `_fn` parameter for controlling the number of facets.
   *
   * @edge_cases
   * - **Missing Height/Radii**: Defaults to `1` for height and radii if not explicitly defined.
   * - **Cones**: Handles cases where `r1` and `r2` (or `d1` and `d2`) are different, effectively generating a cone.
   *
   * @example
   * ```typescript
   * const cylinderNode: CylinderNode = { type: 'Cylinder', h: 20, r1: 5, r2: 10, center: false, location: { /* ... * / } };
   * const result = generator.generateCylinder(cylinderNode);
   * if (result.success) {
   *   console.log('Cylinder vertices:', result.data.geometry.vertices.length);
   * }
   * ```
   */
  generateCylinder(
    node: CylinderNode
  ): Result<PrimitiveGenerationResult, PrimitiveGenerationError> {
    const startTime = performance.now();
    logger.debug('[DEBUG][GenericPrimitiveGenerator] Generating cylinder geometry...');

    return tryCatch(
      () => {
        const { height, radius1, radius2, center } = this.extractCylinderParams(node);

        const geometry = this.createCylinderGeometry(height, radius1, radius2, center);
        const generationTime = performance.now() - startTime;

        const metadata: MeshMetadata = {
          meshId: `cylinder_${Date.now()}`,
          triangleCount: geometry.indices.length / 3,
          vertexCount: geometry.vertices.length,
          boundingBox: geometry.boundingBox,
          complexity: geometry.vertices.length,
          operationTime: generationTime,
          isOptimized: true,
          lastAccessed: new Date(),
        };

        logger.debug(
          `[DEBUG][GenericPrimitiveGenerator] Cylinder generated in ${generationTime.toFixed(2)}ms`
        );

        return {
          geometry,
          material: DEFAULT_MATERIAL,
          metadata,
          generationTime,
        };
      },
      (error) => ({
        code: 'CYLINDER_GENERATION_FAILED',
        message: `Failed to generate cylinder: ${error}`,
        primitiveType: 'cylinder',
        timestamp: new Date(),
      })
    );
  }

  /**
   * @method extractCubeSize
   * @private
   * @description Extracts the size dimensions from a `CubeNode`.
   * Handles various formats of the `size` property (number, array of numbers) and provides default values.
   * @param {CubeNode} node - The AST node representing a cube.
   * @returns {[number, number, number]} An array `[width, height, depth]` representing the cube's dimensions.
   *
   * @edge_cases
   * - If `node.size` is `undefined`, returns `[1, 1, 1]`.
   * - If `node.size` is a single number, returns `[size, size, size]`.
   * - If `node.size` is an array with fewer than 3 elements, defaults missing elements to `1`.
   *
   * @example
   * ```typescript
   * // Example CubeNode definitions and their extracted sizes:
   * extractCubeSize({ type: 'Cube', size: 10 }); // Returns [10, 10, 10]
   * extractCubeSize({ type: 'Cube', size: [1, 2, 3] }); // Returns [1, 2, 3]
   * extractCubeSize({ type: 'Cube', size: [5] }); // Returns [5, 1, 1]
   * extractCubeSize({ type: 'Cube' }); // Returns [1, 1, 1]
   * ```
   */
  private extractCubeSize(node: CubeNode): [number, number, number] {
    if (!node.size) {
      return [1, 1, 1];
    }
    if (Array.isArray(node.size) && node.size.length >= 3) {
      return [
        typeof node.size[0] === 'number' ? node.size[0] : 1,
        typeof node.size[1] === 'number' ? node.size[1] : 1,
        typeof node.size[2] === 'number' ? node.size[2] : 1,
      ];
    }
    if (typeof node.size === 'number') {
      return [node.size, node.size, node.size];
    }
    return [1, 1, 1];
  }

  /**
   * @method extractCubeCenter
   * @private
   * @description Extracts the `center` flag from a `CubeNode`.
   * @param {CubeNode} node - The AST node representing a cube.
   * @returns {boolean} `true` if the cube should be centered, `false` otherwise.
   * @example
   * ```typescript
   * extractCubeCenter({ type: 'Cube', center: true }); // Returns true
   * extractCubeCenter({ type: 'Cube', center: false }); // Returns false
   * extractCubeCenter({ type: 'Cube' }); // Returns false (default)
   * ```
   */
  private extractCubeCenter(node: CubeNode): boolean {
    return node.center === true;
  }

  /**
   * @method extractSphereRadius
   * @private
   * @description Extracts the radius from a `SphereNode`.
   * Prioritizes `radius` over `diameter`, and provides a default if neither is present.
   * @param {SphereNode} node - The AST node representing a sphere.
   * @returns {number} The radius of the sphere.
   * @example
   * ```typescript
   * extractSphereRadius({ type: 'Sphere', radius: 5 }); // Returns 5
   * extractSphereRadius({ type: 'Sphere', diameter: 10 }); // Returns 5
   * extractSphereRadius({ type: 'Sphere' }); // Returns 1 (default)
   * ```
   */
  private extractSphereRadius(node: SphereNode): number {
    if (node.radius) return node.radius;
    if (node.diameter) return node.diameter / 2;
    return 1;
  }

  /**
   * @method extractCylinderParams
   * @private
   * @description Extracts height, radii (r1, r2), and center flag from a `CylinderNode`.
   * Handles various OpenSCAD parameter conventions (r, d, r1, d1, r2, d2) and provides defaults.
   * @param {CylinderNode} node - The AST node representing a cylinder.
   * @returns {{ height: number; radius1: number; radius2: number; center: boolean; }} An object containing the extracted parameters.
   *
   * @edge_cases
   * - **Cones**: If `r1` and `r2` are different, it correctly extracts them for a cone shape.
   * - **Default Values**: Provides defaults if `h`, `r`, `d`, `r1`, `d1`, `r2`, `d2` are missing.
   *
   * @example
   * ```typescript
   * // Example 1: Simple cylinder
   * extractCylinderParams({ type: 'Cylinder', h: 10, r: 5 }); // { height: 10, radius1: 5, radius2: 5, center: false }
   * // Example 2: Cone
   * extractCylinderParams({ type: 'Cylinder', h: 10, r1: 5, r2: 0 }); // { height: 10, radius1: 5, radius2: 0, center: false }
   * // Example 3: Centered cylinder with diameter
   * extractCylinderParams({ type: 'Cylinder', h: 10, d: 8, center: true }); // { height: 10, radius1: 4, radius2: 4, center: true }
   * ```
   */
  private extractCylinderParams(node: CylinderNode): {
    height: number;
    radius1: number;
    radius2: number;
    center: boolean;
  } {
    const height = node.h || 1;

    let radius1 = 1;
    if (node.r1 !== undefined) radius1 = node.r1;
    else if (node.r !== undefined) radius1 = node.r;
    else if (node.d1 !== undefined) radius1 = node.d1 / 2;
    else if (node.d !== undefined) radius1 = node.d / 2;

    let radius2 = radius1;
    if (node.r2 !== undefined) radius2 = node.r2;
    else if (node.d2 !== undefined) radius2 = node.d2 / 2;

    const center = node.center === true;

    return { height, radius1, radius2, center };
  }

  /**
   * @method createCubeGeometry
   * @private
   * @description Creates the `GenericGeometry` data for a cube.
   * This method calculates the positions, normals, and UVs for all 8 vertices and 12 triangles (6 faces) of a cube.
   * It also computes the bounding box based on the cube's size and centering.
   * @param {[number, number, number]} size - An array `[width, height, depth]` defining the cube's dimensions.
   * @param {boolean} center - If `true`, the cube is centered at the origin; otherwise, it's positioned with its minimum corner at the origin.
   * @returns {GenericGeometry} The geometric data for the cube.
   *
   * @limitations
   * - This is a basic cube implementation. It does not support rounded corners or other advanced OpenSCAD cube features.
   * - Normals are simple face normals; smooth shading is not applied.
   *
   * @example
   * ```typescript
   * const geometry = this.createCubeGeometry([10, 10, 10], true);
   * console.log('Cube vertices count:', geometry.vertices.length); // Expected: 8
   * console.log('Cube indices count:', geometry.indices.length); // Expected: 36 (12 triangles * 3 indices)
   * ```
   */
  private createCubeGeometry(size: [number, number, number], center: boolean): GenericGeometry {
    const [width, height, depth] = size;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    const offsetX = center ? 0 : halfWidth;
    const offsetY = center ? 0 : halfHeight;
    const offsetZ = center ? 0 : halfDepth;

    const vertices: GenericVertex[] = [
      // Front face
      {
        position: [-halfWidth + offsetX, -halfHeight + offsetY, halfDepth + offsetZ],
        normal: [0, 0, 1],
        uv: [0, 0],
      },
      {
        position: [halfWidth + offsetX, -halfHeight + offsetY, halfDepth + offsetZ],
        normal: [0, 0, 1],
        uv: [1, 0],
      },
      {
        position: [halfWidth + offsetX, halfHeight + offsetY, halfDepth + offsetZ],
        normal: [0, 0, 1],
        uv: [1, 1],
      },
      {
        position: [-halfWidth + offsetX, halfHeight + offsetY, halfDepth + offsetZ],
        normal: [0, 0, 1],
        uv: [0, 1],
      },
      // Back face
      {
        position: [-halfWidth + offsetX, -halfHeight + offsetY, -halfDepth + offsetZ],
        normal: [0, 0, -1],
        uv: [1, 0],
      },
      {
        position: [-halfWidth + offsetX, halfHeight + offsetY, -halfDepth + offsetZ],
        normal: [0, 0, -1],
        uv: [1, 1],
      },
      {
        position: [halfWidth + offsetX, halfHeight + offsetY, -halfDepth + offsetZ],
        normal: [0, 0, -1],
        uv: [0, 1],
      },
      {
        position: [halfWidth + offsetX, -halfHeight + offsetY, -halfDepth + offsetZ],
        normal: [0, 0, -1],
        uv: [0, 0],
      },
    ];

    const indices = [
      0,
      1,
      2,
      0,
      2,
      3, // Front face
      4,
      5,
      6,
      4,
      6,
      7, // Back face
      8,
      9,
      10,
      8,
      10,
      11, // Top face
      12,
      13,
      14,
      12,
      14,
      15, // Bottom face
      16,
      17,
      18,
      16,
      18,
      19, // Right face
      20,
      21,
      22,
      20,
      22,
      23, // Left face
    ];

    const min: [number, number, number] = [
      -halfWidth + offsetX,
      -halfHeight + offsetY,
      -halfDepth + offsetZ,
    ];
    const max: [number, number, number] = [
      halfWidth + offsetX,
      halfHeight + offsetY,
      halfDepth + offsetZ,
    ];

    return {
      vertices,
      indices,
      boundingBox: { min, max },
    };
  }

  /**
   * @method createSphereGeometry
   * @private
   * @description Creates the `GenericGeometry` data for a sphere.
   * This is a simplified implementation that generates an octahedron as a placeholder for a sphere.
   * It calculates vertices, indices, and a bounding box for this simplified shape.
   * @param {number} radius - The radius of the sphere.
   * @returns {GenericGeometry} The geometric data for the sphere.
   *
   * @limitations
   * - **Simplified Geometry**: This method generates an octahedron, not a true sphere. This is a significant simplification.
   *   For accurate sphere rendering, a more advanced algorithm (e.g., UV sphere generation with configurable segments)
   *   would be necessary.
   * - **Normals**: Normals are basic and not smoothed, which would be required for a visually appealing sphere.
   *
   * @example
   * ```typescript
   * const geometry = this.createSphereGeometry(5);
   * console.log('Sphere vertices count:', geometry.vertices.length); // Expected: 6 (for octahedron)
   * console.log('Sphere indices count:', geometry.indices.length); // Expected: 24 (8 triangles * 3 indices)
   * ```
   */
  private createSphereGeometry(radius: number): GenericGeometry {
    const vertices: GenericVertex[] = [];
    const indices: number[] = [];

    // Create a simple octahedron as a placeholder for sphere
    vertices.push({ position: [0, radius, 0], normal: [0, 1, 0], uv: [0.5, 1] });
    vertices.push({ position: [0, -radius, 0], normal: [0, -1, 0], uv: [0.5, 0] });
    vertices.push({ position: [radius, 0, 0], normal: [1, 0, 0], uv: [1, 0.5] });
    vertices.push({ position: [-radius, 0, 0], normal: [-1, 0, 0], uv: [0, 0.5] });
    vertices.push({ position: [0, 0, radius], normal: [0, 0, 1], uv: [0.5, 0.5] });
    vertices.push({ position: [0, 0, -radius], normal: [0, 0, -1], uv: [0.5, 0.5] });

    indices.push(0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 4, 2, 1, 3, 4, 1, 5, 3, 1, 2, 5);

    return {
      vertices,
      indices,
      boundingBox: {
        min: [-radius, -radius, -radius],
        max: [radius, radius, radius],
      },
    };
  }

  /**
   * @method createCylinderGeometry
   * @private
   * @description Creates the `GenericGeometry` data for a cylinder or cone.
   * This is a simplified implementation that generates a prism with 6 segments.
   * It calculates vertices, indices, and a bounding box based on height, radii, and centering.
   * @param {number} height - The height of the cylinder/cone.
   * @param {number} radius1 - The radius of the bottom circle.
   * @param {number} radius2 - The radius of the top circle (if different from `radius1`, it forms a cone).
   * @param {boolean} center - If `true`, the cylinder/cone is centered along its height; otherwise, its base is at y=0.
   * @returns {GenericGeometry} The geometric data for the cylinder/cone.
   *
   * @limitations
   * - **Simplified Geometry**: This method generates a prism with a fixed number of segments (6), not a true smooth cylinder.
   *   For higher quality, a configurable number of segments and more precise normal calculations would be needed.
   * - **Normals**: Normals are basic and not smoothed.
   *
   * @edge_cases
   * - **Cone Generation**: When `radius1` and `radius2` are different, the method correctly generates a cone shape.
   *
   * @example
   * ```typescript
   * // Example 1: Simple cylinder
   * const cylinderGeometry = this.createCylinderGeometry(10, 5, 5, false);
   * console.log('Cylinder vertices count:', cylinderGeometry.vertices.length); // Expected: 12 (6 top + 6 bottom)
   * // Example 2: Cone
   * const coneGeometry = this.createCylinderGeometry(10, 5, 0, true);
   * console.log('Cone vertices count:', coneGeometry.vertices.length);
   * ```
   */
  private createCylinderGeometry(
    height: number,
    radius1: number,
    radius2: number,
    center: boolean
  ): GenericGeometry {
    const vertices: GenericVertex[] = [];
    const indices: number[] = [];

    const offsetY = center ? 0 : height / 2;

    const segments = 6;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      vertices.push({
        position: [cos * radius1, height / 2 + offsetY, sin * radius1],
        normal: [0, 1, 0],
        uv: [cos * 0.5 + 0.5, sin * 0.5 + 0.5],
      });

      vertices.push({
        position: [cos * radius2, -height / 2 + offsetY, sin * radius2],
        normal: [0, -1, 0],
        uv: [cos * 0.5 + 0.5, sin * 0.5 + 0.5],
      });
    }

    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const topCurrent = i * 2;
      const bottomCurrent = i * 2 + 1;
      const topNext = next * 2;
      const bottomNext = next * 2 + 1;

      indices.push(topCurrent, bottomCurrent, topNext);
      indices.push(topNext, bottomCurrent, bottomNext);
    }

    return {
      vertices,
      indices,
      boundingBox: {
        min: [-Math.max(radius1, radius2), -height / 2 + offsetY, -Math.max(radius1, radius2)],
        max: [Math.max(radius1, radius2), height / 2 + offsetY, Math.max(radius1, radius2)],
      },
    };
  }

  /**
   * @method dispose
   * @description Disposes of any resources held by the `GenericPrimitiveGeneratorService`.
   * Currently, this service does not hold complex resources, so this method primarily logs its disposal.
   * It's included for consistency with other services that might require cleanup.
   * @returns {void}
   * @example
   * ```typescript
   * const generator = new GenericPrimitiveGeneratorService();
   * // ... use generator ...
   * generator.dispose(); // Clean up resources
   * ```
   */
  dispose(): void {
    logger.debug('[DEBUG][GenericPrimitiveGenerator] Service disposed');
  }
}
