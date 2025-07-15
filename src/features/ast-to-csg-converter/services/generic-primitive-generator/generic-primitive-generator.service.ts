/**
 * @file Generic Primitive Generator Service
 *
 * Layer 2 service for generating renderer-agnostic primitive geometry data from OpenSCAD AST nodes.
 * Follows Enhanced 4-Layer Architecture by outputting generic mesh data, not renderer-specific objects.
 */

import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch } from '../../../../shared/utils/functional/result';
import type {
  CubeNode,
  CylinderNode,
  SphereNode,
} from '../../../openscad-parser/ast/ast-types';
import type { GenericMeshData, MaterialConfig, MeshMetadata } from '../../types/conversion.types';

const logger = createLogger('GenericPrimitiveGenerator');

/**
 * Generic vertex data (renderer-agnostic)
 */
export interface GenericVertex {
  readonly position: readonly [number, number, number];
  readonly normal: readonly [number, number, number];
  readonly uv: readonly [number, number];
}

/**
 * Generic geometry data (renderer-agnostic)
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
 * Primitive generation result
 */
export interface PrimitiveGenerationResult {
  readonly geometry: GenericGeometry;
  readonly material: MaterialConfig;
  readonly metadata: MeshMetadata;
  readonly generationTime: number;
}

/**
 * Primitive generation error
 */
export interface PrimitiveGenerationError {
  readonly code: string;
  readonly message: string;
  readonly primitiveType: string;
  readonly timestamp: Date;
}

/**
 * Default material configuration
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
 * Generic Primitive Generator Service
 *
 * Generates renderer-agnostic primitive geometry from OpenSCAD AST nodes.
 * This service belongs to Layer 2 (AST-to-CSG Conversion) and outputs generic data.
 */
export class GenericPrimitiveGeneratorService {
  constructor() {
    logger.init('[INIT][GenericPrimitiveGenerator] Service initialized');
  }

  /**
   * Generate cube geometry from CubeNode
   */
  generateCube(node: CubeNode): Result<PrimitiveGenerationResult, PrimitiveGenerationError> {
    const startTime = performance.now();
    logger.debug('[DEBUG][GenericPrimitiveGenerator] Generating cube geometry...');

    return tryCatch(
      () => {
        // Extract cube parameters
        const size = this.extractCubeSize(node);
        const center = this.extractCubeCenter(node);

        // Generate cube vertices and indices
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
   * Generate sphere geometry from SphereNode
   */
  generateSphere(node: SphereNode): Result<PrimitiveGenerationResult, PrimitiveGenerationError> {
    const startTime = performance.now();
    logger.debug('[DEBUG][GenericPrimitiveGenerator] Generating sphere geometry...');

    return tryCatch(
      () => {
        // Extract sphere parameters
        const radius = this.extractSphereRadius(node);

        // Generate sphere vertices and indices
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
   * Generate cylinder geometry from CylinderNode
   */
  generateCylinder(node: CylinderNode): Result<PrimitiveGenerationResult, PrimitiveGenerationError> {
    const startTime = performance.now();
    logger.debug('[DEBUG][GenericPrimitiveGenerator] Generating cylinder geometry...');

    return tryCatch(
      () => {
        // Extract cylinder parameters
        const { height, radius1, radius2, center } = this.extractCylinderParams(node);

        // Generate cylinder vertices and indices
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
   * Extract cube size from CubeNode
   */
  private extractCubeSize(node: CubeNode): [number, number, number] {
    if (!node.size) {
      return [1, 1, 1]; // Default size when undefined
    }
    if (Array.isArray(node.size) && node.size.length >= 3) {
      return [
        typeof node.size[0] === 'number' ? node.size[0] : 1,
        typeof node.size[1] === 'number' ? node.size[1] : 1,
        typeof node.size[2] === 'number' ? node.size[2] : 1
      ];
    }
    if (typeof node.size === 'number') {
      return [node.size, node.size, node.size];
    }
    return [1, 1, 1]; // Default size
  }

  /**
   * Extract cube center flag from CubeNode
   */
  private extractCubeCenter(node: CubeNode): boolean {
    return node.center === true;
  }

  /**
   * Extract sphere radius from SphereNode
   */
  private extractSphereRadius(node: SphereNode): number {
    if (node.radius) return node.radius;
    if (node.diameter) return node.diameter / 2;
    return 1; // Default radius
  }

  /**
   * Extract cylinder parameters from CylinderNode
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
   * Create cube geometry (renderer-agnostic)
   */
  private createCubeGeometry(size: [number, number, number], center: boolean): GenericGeometry {
    const [width, height, depth] = size;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    // Adjust position based on center flag
    const offsetX = center ? 0 : halfWidth;
    const offsetY = center ? 0 : halfHeight;
    const offsetZ = center ? 0 : halfDepth;

    // Create 8 vertices for a cube
    const vertices: GenericVertex[] = [
      // Front face
      { position: [-halfWidth + offsetX, -halfHeight + offsetY, halfDepth + offsetZ], normal: [0, 0, 1], uv: [0, 0] },
      { position: [halfWidth + offsetX, -halfHeight + offsetY, halfDepth + offsetZ], normal: [0, 0, 1], uv: [1, 0] },
      { position: [halfWidth + offsetX, halfHeight + offsetY, halfDepth + offsetZ], normal: [0, 0, 1], uv: [1, 1] },
      { position: [-halfWidth + offsetX, halfHeight + offsetY, halfDepth + offsetZ], normal: [0, 0, 1], uv: [0, 1] },
      // Back face
      { position: [-halfWidth + offsetX, -halfHeight + offsetY, -halfDepth + offsetZ], normal: [0, 0, -1], uv: [1, 0] },
      { position: [-halfWidth + offsetX, halfHeight + offsetY, -halfDepth + offsetZ], normal: [0, 0, -1], uv: [1, 1] },
      { position: [halfWidth + offsetX, halfHeight + offsetY, -halfDepth + offsetZ], normal: [0, 0, -1], uv: [0, 1] },
      { position: [halfWidth + offsetX, -halfHeight + offsetY, -halfDepth + offsetZ], normal: [0, 0, -1], uv: [0, 0] },
    ];

    // Create indices for 12 triangles (6 faces * 2 triangles each)
    const indices = [
      0, 1, 2, 0, 2, 3, // Front face
      4, 5, 6, 4, 6, 7, // Back face
      8, 9, 10, 8, 10, 11, // Top face
      12, 13, 14, 12, 14, 15, // Bottom face
      16, 17, 18, 16, 18, 19, // Right face
      20, 21, 22, 20, 22, 23, // Left face
    ];

    // Calculate bounding box
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
   * Create sphere geometry (simplified - renderer-agnostic)
   */
  private createSphereGeometry(radius: number): GenericGeometry {
    // Simplified sphere generation - in a real implementation, this would be more sophisticated
    const vertices: GenericVertex[] = [];
    const indices: number[] = [];

    // Create a simple octahedron as a placeholder for sphere
    // Top vertex
    vertices.push({ position: [0, radius, 0], normal: [0, 1, 0], uv: [0.5, 1] });
    // Bottom vertex
    vertices.push({ position: [0, -radius, 0], normal: [0, -1, 0], uv: [0.5, 0] });
    // Middle vertices
    vertices.push({ position: [radius, 0, 0], normal: [1, 0, 0], uv: [1, 0.5] });
    vertices.push({ position: [-radius, 0, 0], normal: [-1, 0, 0], uv: [0, 0.5] });
    vertices.push({ position: [0, 0, radius], normal: [0, 0, 1], uv: [0.5, 0.5] });
    vertices.push({ position: [0, 0, -radius], normal: [0, 0, -1], uv: [0.5, 0.5] });

    // Create triangular faces
    indices.push(
      0, 2, 4, // Top-right-front
      0, 4, 3, // Top-front-left
      0, 3, 5, // Top-left-back
      0, 5, 2, // Top-back-right
      1, 4, 2, // Bottom-front-right
      1, 3, 4, // Bottom-left-front
      1, 5, 3, // Bottom-back-left
      1, 2, 5  // Bottom-right-back
    );

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
   * Create cylinder geometry (simplified - renderer-agnostic)
   */
  private createCylinderGeometry(
    height: number,
    radius1: number,
    radius2: number,
    center: boolean
  ): GenericGeometry {
    // Simplified cylinder generation
    const vertices: GenericVertex[] = [];
    const indices: number[] = [];

    const offsetY = center ? 0 : height / 2;

    // Create top and bottom circles (simplified with 6 vertices each)
    const segments = 6;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Top circle
      vertices.push({
        position: [cos * radius1, height / 2 + offsetY, sin * radius1],
        normal: [0, 1, 0],
        uv: [cos * 0.5 + 0.5, sin * 0.5 + 0.5],
      });

      // Bottom circle
      vertices.push({
        position: [cos * radius2, -height / 2 + offsetY, sin * radius2],
        normal: [0, -1, 0],
        uv: [cos * 0.5 + 0.5, sin * 0.5 + 0.5],
      });
    }

    // Create indices for cylinder faces (simplified)
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const topCurrent = i * 2;
      const bottomCurrent = i * 2 + 1;
      const topNext = next * 2;
      const bottomNext = next * 2 + 1;

      // Side faces
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
   * Dispose service and cleanup
   */
  dispose(): void {
    logger.debug('[DEBUG][GenericPrimitiveGenerator] Service disposed');
  }
}
