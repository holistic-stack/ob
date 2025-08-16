/**
 * @file geometry-to-mesh-converter.test.ts
 * @description Tests for Geometry to Mesh Converter Service
 */

import { Engine, Scene } from '@babylonjs/core';
import { beforeEach, describe, expect, test } from 'vitest';
import { isError, isSuccess } from '@/shared';
import type { Circle2DGeometryData } from '../../types/2d-geometry-data';
import type { SphereGeometryData } from '../../types/geometry-data';
import { GeometryToMeshConverterService } from './geometry-to-mesh-converter';

// Mock BabylonJS for testing (provide required classes used by services)
vi.mock('@babylonjs/core', () => ({
  Engine: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
  })),
  Scene: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
    meshes: [],
  })),
  Mesh: vi.fn().mockImplementation((name?: string) => ({
    name: name ?? 'test-mesh',
    getTotalVertices: vi.fn().mockReturnValue(8),
    getTotalIndices: vi.fn().mockReturnValue(12),
    dispose: vi.fn(),
    createNormals: vi.fn(),
    refreshBoundingInfo: vi.fn(),
    isDisposed: vi.fn().mockReturnValue(false),
    getBoundingInfo: vi.fn().mockReturnValue({ minimum: {}, maximum: {} }),
  })),
  // Minimal VertexData stub with applyToMesh API used by service
  VertexData: vi.fn().mockImplementation(function () {
    return {
      positions: undefined as any,
      indices: undefined as any,
      normals: undefined as any,
      applyToMesh: vi.fn(),
    };
  }),
  // MeshBuilder with CreatePolygon used for 2D shapes
  MeshBuilder: {
    CreatePolygon: vi.fn().mockImplementation((name: string, _options: any, _scene: any) => ({
      name,
      refreshBoundingInfo: vi.fn(),
      getTotalVertices: vi.fn().mockReturnValue(4),
      getTotalIndices: vi.fn().mockReturnValue(6),
      material: {},
    })),
  },
  // Vector3 used to build polygon shapes
  Vector3: vi.fn().mockImplementation((x: number, y: number, z: number) => ({ x, y, z })),
}));

describe('GeometryToMeshConverterService', () => {
  let converter: GeometryToMeshConverterService;
  let scene: Scene;

  beforeEach(() => {
    converter = new GeometryToMeshConverterService();
    scene = new Scene(new Engine(null, false));
  });

  describe('convertGeometryToMesh', () => {
    test('should convert 3D sphere geometry to mesh', () => {
      const sphereGeometry: SphereGeometryData = {
        vertices: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: 1 },
        ],
        faces: [[0, 1, 2]],
        normals: [
          { x: 0.577, y: 0.577, z: 0.577 },
          { x: 0.577, y: 0.577, z: 0.577 },
          { x: 0.577, y: 0.577, z: 0.577 },
        ],
        metadata: {
          primitiveType: '3d-sphere',
          parameters: { radius: 1, fragments: 3 },
          fragmentCount: 3,
          generatedAt: Date.now(),
          isConvex: true,
        },
      };

      const result = converter.convertGeometryToMesh(sphereGeometry, scene, 'test-sphere');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test-sphere');
      }
    });

    test('should convert 2D circle geometry to mesh', () => {
      const circleGeometry: Circle2DGeometryData = {
        vertices: [
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 0, y: -1 },
        ],
        outline: [0, 1, 2, 3], // Main outline connecting all vertices
        holes: [], // No holes for a simple circle
        metadata: {
          primitiveType: '2d-circle',
          parameters: { radius: 1, fragments: 4 },
          fragmentCount: 4,
          generatedAt: Date.now(),
          isConvex: true,
          area: Math.PI, // Area of circle with radius 1
        },
      };

      const result = converter.convertGeometryToMesh(circleGeometry, scene, 'test-circle');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test-circle');
      }
    });

    test('should auto-generate mesh name when not provided', () => {
      const sphereGeometry: SphereGeometryData = {
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0.5, y: 1, z: 0 },
        ],
        faces: [[0, 1, 2]],
        normals: [
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
        ],
        metadata: {
          primitiveType: '3d-sphere',
          parameters: { radius: 1, fragments: 3 },
          fragmentCount: 3,
          generatedAt: Date.now(),
          isConvex: true,
        },
      };

      const result = converter.convertGeometryToMesh(sphereGeometry, scene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.name).toMatch(/^openscad-3d-sphere-\d+-\d+$/);
      }
    });
  });

  describe('convertGeometryBatchToMeshes', () => {
    test('should convert multiple geometries to meshes', () => {
      const geometries = [
        {
          vertices: [
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: 0, z: 1 },
          ],
          faces: [[0, 1, 2]],
          normals: [
            { x: 0.577, y: 0.577, z: 0.577 },
            { x: 0.577, y: 0.577, z: 0.577 },
            { x: 0.577, y: 0.577, z: 0.577 },
          ],
          metadata: {
            primitiveType: '3d-sphere',
            parameters: { radius: 1, fragments: 3 },
            fragmentCount: 3,
            generatedAt: Date.now(),
            isConvex: true,
          },
        } as SphereGeometryData,
        {
          vertices: [
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 0, y: -1 },
          ],
          outline: [0, 1, 2, 3], // Main outline connecting all vertices
          holes: [], // No holes for a simple circle
          metadata: {
            primitiveType: '2d-circle',
            parameters: { radius: 1, fragments: 4 },
            fragmentCount: 4,
            generatedAt: Date.now(),
            isConvex: true,
            area: Math.PI, // Area of circle with radius 1
          },
        } as Circle2DGeometryData,
      ];

      const result = converter.convertGeometryBatchToMeshes(geometries, scene, 'batch');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const meshes = result.data;
        expect(meshes.length).toBe(2);

        // Safe array access with validation
        expect(meshes[0]).toBeDefined();
        expect(meshes[1]).toBeDefined();
        expect(meshes[0]?.name).toBe('batch-0');
        expect(meshes[1]?.name).toBe('batch-1');
      }
    });

    test('should handle empty geometry array', () => {
      const result = converter.convertGeometryBatchToMeshes([], scene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.length).toBe(0);
      }
    });

    test('should fail on first invalid geometry in batch', () => {
      const geometries = [
        {
          vertices: [
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: 0, z: 1 },
          ],
          faces: [[0, 1, 2]],
          normals: [
            { x: 0.577, y: 0.577, z: 0.577 },
            { x: 0.577, y: 0.577, z: 0.577 },
            { x: 0.577, y: 0.577, z: 0.577 },
          ],
          metadata: {
            primitiveType: '3d-sphere',
            parameters: { radius: 1, fragments: 3 },
            fragmentCount: 3,
            generatedAt: Date.now(),
            isConvex: true,
          },
        } as SphereGeometryData,
        // Invalid geometry with empty vertices
        {
          vertices: [],
          faces: [],
          normals: [],
          metadata: {
            primitiveType: '3d-sphere',
            parameters: { radius: 0, fragments: 0 },
            fragmentCount: 0,
            generatedAt: Date.now(),
            isConvex: true,
          },
        } as SphereGeometryData,
      ];

      const result = converter.convertGeometryBatchToMeshes(geometries, scene);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('BATCH_CONVERSION_ERROR');
        expect(result.error.details?.processedCount).toBe(1); // Only first geometry processed
      }
    });
  });

  describe('getMeshConversionStatistics', () => {
    test('should calculate mesh statistics correctly', () => {
      const mockMeshes = [
        {
          name: 'openscad-3d-sphere-123456-1',
          getTotalVertices: () => 8,
          getTotalIndices: () => 12,
        },
        {
          name: 'openscad-2d-circle-123456-2',
          getTotalVertices: () => 4,
          getTotalIndices: () => 6,
        },
      ] as any[];

      const stats = converter.getMeshConversionStatistics(mockMeshes);

      expect(stats.totalMeshes).toBe(2);
      expect(stats.totalVertices).toBe(12);
      expect(stats.totalIndices).toBe(18);
      expect(stats.averageVerticesPerMesh).toBe(6);
      expect(stats.averageIndicesPerMesh).toBe(9);
      expect(stats.meshTypes['3d-sphere']).toBe(1);
      expect(stats.meshTypes['2d-circle']).toBe(1);
    });

    test('should handle empty mesh array', () => {
      const stats = converter.getMeshConversionStatistics([]);

      expect(stats.totalMeshes).toBe(0);
      expect(stats.totalVertices).toBe(0);
      expect(stats.totalIndices).toBe(0);
      expect(stats.averageVerticesPerMesh).toBe(0);
      expect(stats.averageIndicesPerMesh).toBe(0);
    });
  });
});
