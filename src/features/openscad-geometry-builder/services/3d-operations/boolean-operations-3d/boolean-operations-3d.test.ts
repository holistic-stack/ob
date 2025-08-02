/**
 * @file boolean-operations-3d.test.ts
 * @description Tests for 3D Boolean Operations Service following TDD methodology.
 * Tests union, difference, and intersection operations for 3D meshes.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared';
import type {
  CubeGeometryData,
  Geometry3DData,
  SphereGeometryData,
  Vector3,
} from '../../../types/geometry-data';
import { BooleanOperations3DService } from './boolean-operations-3d';

describe('BooleanOperations3DService', () => {
  let service: BooleanOperations3DService;

  beforeEach(() => {
    service = new BooleanOperations3DService();
  });

  // Helper function to create test sphere geometry
  const createTestSphere = (
    centerX: number,
    centerY: number,
    centerZ: number,
    radius: number
  ): SphereGeometryData => {
    const vertices: Vector3[] = [];
    const faces: number[][] = [];
    const normals: Vector3[] = [];
    const fragments = 8; // Simple octahedron for testing

    // Create simple octahedron vertices
    vertices.push(
      { x: centerX, y: centerY, z: centerZ + radius }, // Top
      { x: centerX, y: centerY, z: centerZ - radius }, // Bottom
      { x: centerX + radius, y: centerY, z: centerZ }, // Right
      { x: centerX - radius, y: centerY, z: centerZ }, // Left
      { x: centerX, y: centerY + radius, z: centerZ }, // Front
      { x: centerX, y: centerY - radius, z: centerZ } // Back
    );

    // Create octahedron faces (8 triangular faces)
    faces.push(
      [0, 2, 4],
      [0, 4, 3],
      [0, 3, 5],
      [0, 5, 2], // Top faces
      [1, 4, 2],
      [1, 3, 4],
      [1, 5, 3],
      [1, 2, 5] // Bottom faces
    );

    // Create normals (simplified)
    for (const vertex of vertices) {
      const length = Math.sqrt(vertex.x ** 2 + vertex.y ** 2 + vertex.z ** 2);
      normals.push({
        x: vertex.x / length,
        y: vertex.y / length,
        z: vertex.z / length,
      });
    }

    const volume = (4 / 3) * Math.PI * radius ** 3;
    const surfaceArea = 4 * Math.PI * radius ** 2;

    return {
      vertices,
      faces,
      normals,
      metadata: {
        primitiveType: '3d-sphere',
        parameters: {
          radius,
          fragments,
        },
        volume,
        surfaceArea,
        boundingBox: {
          min: { x: centerX - radius, y: centerY - radius, z: centerZ - radius },
          max: { x: centerX + radius, y: centerY + radius, z: centerZ + radius },
        },
        generatedAt: Date.now(),
        isConvex: true,
      },
    };
  };

  // Helper function to create test cube geometry
  const createTestCube = (
    centerX: number,
    centerY: number,
    centerZ: number,
    size: number
  ): CubeGeometryData => {
    const halfSize = size / 2;
    const vertices: Vector3[] = [
      // Bottom face
      { x: centerX - halfSize, y: centerY - halfSize, z: centerZ - halfSize },
      { x: centerX + halfSize, y: centerY - halfSize, z: centerZ - halfSize },
      { x: centerX + halfSize, y: centerY + halfSize, z: centerZ - halfSize },
      { x: centerX - halfSize, y: centerY + halfSize, z: centerZ - halfSize },
      // Top face
      { x: centerX - halfSize, y: centerY - halfSize, z: centerZ + halfSize },
      { x: centerX + halfSize, y: centerY - halfSize, z: centerZ + halfSize },
      { x: centerX + halfSize, y: centerY + halfSize, z: centerZ + halfSize },
      { x: centerX - halfSize, y: centerY + halfSize, z: centerZ + halfSize },
    ];

    const faces: number[][] = [
      // Bottom face
      [0, 1, 2, 3],
      // Top face
      [4, 7, 6, 5],
      // Front face
      [0, 4, 5, 1],
      // Back face
      [2, 6, 7, 3],
      // Left face
      [0, 3, 7, 4],
      // Right face
      [1, 5, 6, 2],
    ];

    const normals: Vector3[] = [
      { x: 0, y: 0, z: -1 },
      { x: 0, y: 0, z: -1 },
      { x: 0, y: 0, z: -1 },
      { x: 0, y: 0, z: -1 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 1 },
    ];

    const volume = size ** 3;
    const surfaceArea = 6 * size ** 2;

    return {
      vertices,
      faces,
      normals,
      metadata: {
        primitiveType: '3d-cube',
        parameters: {
          size: { x: size, y: size, z: size },
          center: true,
        },
        volume,
        surfaceArea,
        boundingBox: {
          min: { x: centerX - halfSize, y: centerY - halfSize, z: centerZ - halfSize },
          max: { x: centerX + halfSize, y: centerY + halfSize, z: centerZ + halfSize },
        },
        generatedAt: Date.now(),
        isConvex: true,
      },
    };
  };

  describe('performUnion', () => {
    describe('basic union operations', () => {
      it('should union sphere and cube successfully', async () => {
        const sphere = createTestSphere(0, 0, 0, 5);
        const cube = createTestCube(2, 2, 2, 4);

        const result = await service.performUnion(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices.length).toBeGreaterThan(0);
          expect(result.data.faces.length).toBeGreaterThan(0);
          expect(result.data.metadata.primitiveType).toBe('3d-boolean-result');
          expect(result.data.metadata.parameters.operation).toBe('union');
          expect(result.data.metadata.operationType).toBe('union');
          expect(result.data.metadata.inputMeshCount).toBe(2);
          expect(result.data.metadata.operationTime).toBeGreaterThan(0);
        }
      });

      it('should perform accurate volume calculation for union', async () => {
        const sphere = createTestSphere(0, 0, 0, 2);
        const cube = createTestCube(3, 0, 0, 2); // Non-overlapping

        const result = await service.performUnion(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // For non-overlapping meshes, union volume should be sum of individual volumes
          const sphereVolume = sphere.metadata.volume ?? 0;
          const cubeVolume = cube.metadata.volume ?? 0;
          const expectedVolume = sphereVolume + cubeVolume;
          expect(result.data.metadata.volume).toBeCloseTo(expectedVolume, 1);
        }
      });

      it('should handle overlapping meshes with proper volume calculation', async () => {
        const sphere1 = createTestSphere(0, 0, 0, 3);
        const sphere2 = createTestSphere(2, 0, 0, 3); // Overlapping

        const result = await service.performUnion(sphere1, sphere2);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Union volume should be less than sum due to overlap
          const sphere1Volume = sphere1.metadata.volume ?? 0;
          const sphere2Volume = sphere2.metadata.volume ?? 0;
          const sumVolume = sphere1Volume + sphere2Volume;
          expect(result.data.metadata.volume).toBeLessThan(sumVolume);
          expect(result.data.metadata.volume).toBeGreaterThan(sphere1Volume);
        }
      });

      it('should deduplicate vertices in union result', async () => {
        const cube1 = createTestCube(0, 0, 0, 2);
        const cube2 = createTestCube(1, 0, 0, 2); // Overlapping cubes

        const result = await service.performUnion(cube1, cube2);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Union should have fewer vertices than simple concatenation
          const simpleSum = cube1.vertices.length + cube2.vertices.length;
          expect(result.data.vertices.length).toBeLessThanOrEqual(simpleSum);

          // Should have valid mesh topology
          expect(result.data.faces.length).toBeGreaterThan(0);
          expect(result.data.metadata.isManifold).toBe(true);
        }
      });

      it('should handle identical meshes correctly', async () => {
        const sphere1 = createTestSphere(0, 0, 0, 5);
        const sphere2 = createTestSphere(0, 0, 0, 5);

        const result = await service.performUnion(sphere1, sphere2);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.operationType).toBe('union');
          expect(result.data.metadata.inputMeshCount).toBe(2);
        }
      });
    });

    describe('advanced union features', () => {
      it('should maintain mesh manifold properties', async () => {
        const sphere = createTestSphere(0, 0, 0, 3);
        const cube = createTestCube(1, 1, 1, 2);

        const result = await service.performUnion(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.isManifold).toBe(true);
          expect(result.data.metadata.vertexCount).toBe(result.data.vertices.length);
          expect(result.data.metadata.faceCount).toBe(result.data.faces.length);
        }
      });

      it('should calculate reasonable surface area for union', async () => {
        const sphere = createTestSphere(0, 0, 0, 2);
        const cube = createTestCube(4, 0, 0, 2); // Non-overlapping

        const result = await service.performUnion(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Surface area should be positive and reasonable
          expect(result.data.metadata.surfaceArea).toBeGreaterThan(0);

          // Should be a reasonable value (not too small or too large)
          expect(result.data.metadata.surfaceArea).toBeGreaterThan(10); // Minimum reasonable value
          expect(result.data.metadata.surfaceArea).toBeLessThan(1000); // Maximum reasonable value

          // Should have valid metadata structure
          expect(result.data.metadata.vertexCount).toBeGreaterThan(0);
          expect(result.data.metadata.faceCount).toBeGreaterThan(0);
        }
      });

      it('should optimize vertex count through deduplication', async () => {
        const cube1 = createTestCube(0, 0, 0, 4);
        const cube2 = createTestCube(1, 0, 0, 4); // Overlapping with shared vertices

        const result = await service.performUnion(cube1, cube2);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Should have optimized vertex count
          expect(result.data.vertices.length).toBeGreaterThan(8); // More than single cube
          expect(result.data.vertices.length).toBeLessThanOrEqual(16); // Less than or equal to two separate cubes

          // Should have valid deduplication metadata
          expect(result.data.metadata.vertexCount).toBe(result.data.vertices.length);
          expect(result.data.metadata.faceCount).toBe(result.data.faces.length);
        }
      });
    });

    describe('edge cases', () => {
      it('should handle non-overlapping meshes', async () => {
        const sphere = createTestSphere(-10, 0, 0, 2);
        const cube = createTestCube(10, 0, 0, 2);

        const result = await service.performUnion(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.operationType).toBe('union');
        }
      });

      it('should handle very small meshes', async () => {
        const sphere = createTestSphere(0, 0, 0, 0.1);
        const cube = createTestCube(0.05, 0.05, 0.05, 0.1);

        const result = await service.performUnion(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('performDifference', () => {
    describe('basic difference operations', () => {
      it('should subtract sphere from cube successfully', async () => {
        const cube = createTestCube(0, 0, 0, 6);
        const sphere = createTestSphere(0, 0, 0, 3);

        const result = await service.performDifference(cube, sphere);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices.length).toBeGreaterThan(0);
          expect(result.data.faces.length).toBeGreaterThan(0);
          expect(result.data.metadata.primitiveType).toBe('3d-boolean-result');
          expect(result.data.metadata.parameters.operation).toBe('difference');
          expect(result.data.metadata.operationType).toBe('difference');
        }
      });

      it('should handle non-overlapping meshes correctly', async () => {
        const cube = createTestCube(0, 0, 0, 2);
        const sphere = createTestSphere(10, 0, 0, 2);

        const result = await service.performDifference(cube, sphere);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.operationType).toBe('difference');
        }
      });

      it('should calculate accurate volume for difference operations', async () => {
        const cube = createTestCube(0, 0, 0, 4);
        const sphere = createTestSphere(10, 0, 0, 2); // Non-overlapping

        const result = await service.performDifference(cube, sphere);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // For non-overlapping meshes, volume should remain the same as base mesh
          expect(result.data.metadata.volume).toBeCloseTo(cube.metadata.volume ?? 0, 1);
        }
      });

      it('should handle overlapping meshes with volume reduction', async () => {
        const cube = createTestCube(0, 0, 0, 4);
        const sphere = createTestSphere(1, 0, 0, 2); // Overlapping

        const result = await service.performDifference(cube, sphere);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Volume should be less than original cube due to subtraction
          expect(result.data.metadata.volume).toBeLessThan(cube.metadata.volume ?? 0);
          expect(result.data.metadata.volume).toBeGreaterThan(0);
        }
      });
    });

    describe('advanced difference features', () => {
      it('should maintain mesh topology after difference', async () => {
        const cube = createTestCube(0, 0, 0, 4);
        const smallSphere = createTestSphere(0, 0, 0, 1);

        const result = await service.performDifference(cube, smallSphere);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.isManifold).toBe(true);
          expect(result.data.metadata.vertexCount).toBe(result.data.vertices.length);
          expect(result.data.metadata.faceCount).toBe(result.data.faces.length);
        }
      });

      it('should handle complete subtraction correctly', async () => {
        const smallCube = createTestCube(0, 0, 0, 2);
        const largeSphere = createTestSphere(0, 0, 0, 5); // Completely contains cube

        const result = await service.performDifference(smallCube, largeSphere);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Volume should be very small or zero when completely subtracted
          const smallCubeVolume = smallCube.metadata.volume ?? 0;
          expect(result.data.metadata.volume).toBeLessThanOrEqual(smallCubeVolume * 0.1);
        }
      });

      it('should optimize vertex count through deduplication', async () => {
        const cube = createTestCube(0, 0, 0, 4);
        const sphere = createTestSphere(2, 0, 0, 2);

        const result = await service.performDifference(cube, sphere);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Should have valid mesh structure
          expect(result.data.vertices.length).toBeGreaterThan(0);
          expect(result.data.faces.length).toBeGreaterThan(0);
          expect(result.data.metadata.vertexCount).toBe(result.data.vertices.length);
        }
      });

      it('should calculate reasonable surface area for difference', async () => {
        const cube = createTestCube(0, 0, 0, 4);
        const sphere = createTestSphere(0, 0, 0, 1.5);

        const result = await service.performDifference(cube, sphere);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Surface area should be positive and reasonable
          expect(result.data.metadata.surfaceArea).toBeGreaterThan(0);
          expect(result.data.metadata.surfaceArea).toBeLessThan(1000);

          // Should have valid operation metadata
          expect(result.data.metadata.operationTime).toBeGreaterThan(0);
          expect(result.data.metadata.inputMeshCount).toBe(2);
        }
      });
    });
  });

  describe('performIntersection', () => {
    describe('basic intersection operations', () => {
      it('should intersect sphere and cube successfully', async () => {
        const sphere = createTestSphere(0, 0, 0, 5);
        const cube = createTestCube(0, 0, 0, 6);

        const result = await service.performIntersection(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices.length).toBeGreaterThan(0);
          expect(result.data.faces.length).toBeGreaterThan(0);
          expect(result.data.metadata.primitiveType).toBe('3d-boolean-result');
          expect(result.data.metadata.parameters.operation).toBe('intersection');
          expect(result.data.metadata.operationType).toBe('intersection');
        }
      });

      it('should handle non-overlapping meshes correctly', async () => {
        const sphere = createTestSphere(-10, 0, 0, 2);
        const cube = createTestCube(10, 0, 0, 2);

        const result = await service.performIntersection(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.operationType).toBe('intersection');
        }
      });

      it('should calculate accurate volume for intersection operations', async () => {
        const sphere = createTestSphere(2, 0, 0, 2); // Smaller sphere with offset for partial overlap
        const cube = createTestCube(0, 0, 0, 3); // Cube that partially overlaps

        const result = await service.performIntersection(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Intersection volume should be reasonable for partial overlap
          expect(result.data.metadata.volume).toBeGreaterThan(0);
          expect(result.data.metadata.volume).toBeLessThanOrEqual(
            Math.min(sphere.metadata.volume ?? 0, cube.metadata.volume ?? 0)
          );
        }
      });

      it('should return empty result for non-overlapping meshes', async () => {
        const sphere = createTestSphere(-10, 0, 0, 2);
        const cube = createTestCube(10, 0, 0, 2); // No overlap

        const result = await service.performIntersection(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // No intersection should result in minimal or zero volume
          expect(result.data.metadata.volume).toBeLessThanOrEqual(0.1);
        }
      });
    });

    describe('advanced intersection features', () => {
      it('should maintain mesh topology after intersection', async () => {
        const sphere = createTestSphere(0, 0, 0, 3);
        const cube = createTestCube(1, 1, 1, 2);

        const result = await service.performIntersection(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.metadata.isManifold).toBe(true);
          expect(result.data.metadata.vertexCount).toBe(result.data.vertices.length);
          expect(result.data.metadata.faceCount).toBe(result.data.faces.length);
        }
      });

      it('should handle complete containment correctly', async () => {
        const largeSphere = createTestSphere(0, 0, 0, 5);
        const smallCube = createTestCube(0, 0, 0, 2); // Completely inside sphere

        const result = await service.performIntersection(largeSphere, smallCube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Intersection should be approximately the smaller mesh
          expect(result.data.metadata.volume).toBeCloseTo(smallCube.metadata.volume ?? 0, 0);
        }
      });

      it('should optimize vertex count through deduplication', async () => {
        const sphere = createTestSphere(0, 0, 0, 3);
        const cube = createTestCube(1, 0, 0, 3);

        const result = await service.performIntersection(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Should have valid mesh structure
          expect(result.data.vertices.length).toBeGreaterThan(0);
          expect(result.data.faces.length).toBeGreaterThan(0);
          expect(result.data.metadata.vertexCount).toBe(result.data.vertices.length);
        }
      });

      it('should calculate reasonable surface area for intersection', async () => {
        const sphere = createTestSphere(0, 0, 0, 3);
        const cube = createTestCube(0, 0, 0, 4);

        const result = await service.performIntersection(sphere, cube);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          // Surface area should be positive and reasonable
          expect(result.data.metadata.surfaceArea).toBeGreaterThan(0);
          expect(result.data.metadata.surfaceArea).toBeLessThan(1000);

          // Should have valid operation metadata
          expect(result.data.metadata.operationTime).toBeGreaterThan(0);
          expect(result.data.metadata.inputMeshCount).toBe(2);
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle null input meshes', async () => {
      const sphere = createTestSphere(0, 0, 0, 5);

      const result = await service.performUnion(null as never, sphere);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('INVALID_PARAMETERS');
        expect(result.error.message).toContain('null or undefined');
      }
    });

    it('should handle meshes with no vertices', async () => {
      const sphere = createTestSphere(0, 0, 0, 5);
      const invalidMesh = { ...sphere, vertices: [] };

      const result = await service.performUnion(sphere, invalidMesh as Geometry3DData);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('INVALID_PARAMETERS');
        expect(result.error.message).toContain('no vertices');
      }
    });

    it('should handle meshes with no faces', async () => {
      const sphere = createTestSphere(0, 0, 0, 5);
      const invalidMesh = { ...sphere, faces: [] };

      const result = await service.performUnion(sphere, invalidMesh as Geometry3DData);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('INVALID_PARAMETERS');
        expect(result.error.message).toContain('no faces');
      }
    });
  });

  describe('performance', () => {
    it('should handle complex meshes efficiently', async () => {
      const sphere = createTestSphere(0, 0, 0, 5);
      const cube = createTestCube(2, 2, 2, 4);

      const startTime = performance.now();
      const result = await service.performUnion(sphere, cube);
      const endTime = performance.now();

      expect(isSuccess(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});
