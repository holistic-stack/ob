/**
 * @file ast-to-geometry-converter.test.ts
 * @description Tests for AST to Geometry Converter Service
 */

import { beforeEach, describe, expect, test } from 'vitest';
import type {
  CircleNode,
  CubeNode,
  CylinderNode,
  PolygonNode,
  SphereNode,
  SquareNode,
} from '@/features/openscad-parser';
import { isError, isSuccess } from '@/shared';
import { ASTToGeometryConverterService, type GlobalVariables } from './ast-to-geometry-converter';

describe('ASTToGeometryConverterService', () => {
  let converter: ASTToGeometryConverterService;
  let defaultGlobals: GlobalVariables;

  beforeEach(() => {
    converter = new ASTToGeometryConverterService();
    defaultGlobals = {
      $fa: 12,
      $fs: 2,
      $t: 0,
    };
  });

  describe('convertASTNodeToGeometry', () => {
    test('should convert sphere node to geometry data', () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 5,
        $fn: 8,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = converter.convertASTNodeToGeometry(sphereNode, defaultGlobals);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.metadata.primitiveType).toBe('3d-sphere');
        expect(geometry.vertices.length).toBeGreaterThan(0);
        expect(geometry.faces.length).toBeGreaterThan(0);
      }
    });

    test('should convert cube node to geometry data', () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [2, 4, 6],
        center: true,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = converter.convertASTNodeToGeometry(cubeNode, defaultGlobals);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.metadata.primitiveType).toBe('3d-cube');
        expect(geometry.vertices.length).toBe(8); // Cube has 8 vertices
        expect(geometry.faces.length).toBe(6); // Cube has 6 faces
      }
    });

    test('should convert cylinder node to geometry data', () => {
      const cylinderNode: CylinderNode = {
        type: 'cylinder',
        h: 10,
        r: 3,
        center: false,
        $fn: 6,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = converter.convertASTNodeToGeometry(cylinderNode, defaultGlobals);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.metadata.primitiveType).toBe('3d-cylinder');
        expect(geometry.vertices.length).toBeGreaterThan(0);
        expect(geometry.faces.length).toBeGreaterThan(0);
      }
    });

    test('should convert circle node to geometry data', () => {
      const circleNode: CircleNode = {
        type: 'circle',
        r: 5,
        $fn: 8,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = converter.convertASTNodeToGeometry(circleNode, defaultGlobals);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.metadata.primitiveType).toBe('2d-circle');
        expect(geometry.vertices.length).toBe(8); // Circle with $fn=8 has 8 vertices
      }
    });

    test('should convert square node to geometry data', () => {
      const squareNode: SquareNode = {
        type: 'square',
        size: { x: 4, y: 6 },
        center: true,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = converter.convertASTNodeToGeometry(squareNode, defaultGlobals);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.metadata.primitiveType).toBe('2d-square');
        expect(geometry.vertices.length).toBe(4); // Square has 4 vertices
      }
    });

    test('should convert polygon node to geometry data', () => {
      const polygonNode: PolygonNode = {
        type: 'polygon',
        points: [
          [0, 0],
          [10, 0],
          [5, 8.66],
        ],
        convexity: 1,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = converter.convertASTNodeToGeometry(polygonNode, defaultGlobals);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.metadata.primitiveType).toBe('2d-polygon');
        expect(geometry.vertices.length).toBe(3); // Triangle has 3 vertices
      }
    });

    test('should handle unsupported node type', () => {
      const unsupportedNode = {
        type: 'unsupported',
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      } as any;

      const result = converter.convertASTNodeToGeometry(unsupportedNode, defaultGlobals);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('UNSUPPORTED_NODE_TYPE');
        expect(result.error.message).toContain('unsupported');
      }
    });

    test('should use global variables as fallbacks', () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 5,
        // No $fn specified, should use global
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const globalsWithFn: GlobalVariables = {
        $fn: 6,
        $fa: 12,
        $fs: 2,
        $t: 0,
      };

      const result = converter.convertASTNodeToGeometry(sphereNode, globalsWithFn);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.metadata.primitiveType).toBe('3d-sphere');
        // Should use global $fn=6 for fragment calculation
        expect(geometry.metadata.parameters.fragments).toBe(6);
      }
    });
  });

  describe('convertASTToGeometryBatch', () => {
    test('should convert multiple AST nodes to geometry data', () => {
      const nodes = [
        {
          type: 'sphere',
          radius: 3,
          $fn: 6,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 10, offset: 9 },
          },
        } as SphereNode,
        {
          type: 'cube',
          size: 2,
          center: false,
          location: {
            start: { line: 2, column: 1, offset: 0 },
            end: { line: 2, column: 10, offset: 9 },
          },
        } as CubeNode,
        {
          type: 'circle',
          r: 4,
          $fn: 8,
          location: { line: 3, column: 1 },
        } as CircleNode,
      ];

      const result = converter.convertASTToGeometryBatch(nodes, defaultGlobals);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const geometries = result.data;
        expect(geometries.length).toBe(3);
        expect(geometries[0].metadata.primitiveType).toBe('3d-sphere');
        expect(geometries[1].metadata.primitiveType).toBe('3d-cube');
        expect(geometries[2].metadata.primitiveType).toBe('2d-circle');
      }
    });

    test('should handle empty node array', () => {
      const result = converter.convertASTToGeometryBatch([], defaultGlobals);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.length).toBe(0);
      }
    });

    test('should fail on first invalid node in batch', () => {
      const nodes = [
        {
          type: 'sphere',
          radius: 3,
          $fn: 6,
          location: { line: 1, column: 1 },
        } as SphereNode,
        {
          type: 'unsupported',
          location: { line: 2, column: 1 },
        } as any,
        {
          type: 'cube',
          size: 2,
          center: false,
          location: { line: 3, column: 1 },
        } as CubeNode,
      ];

      const result = converter.convertASTToGeometryBatch(nodes, defaultGlobals);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('GEOMETRY_GENERATION_ERROR');
        expect(result.error.message).toContain('unsupported');
        expect(result.error.details?.processedCount).toBe(1); // Only first node processed
      }
    });
  });

  describe('parameter extraction', () => {
    test('should handle missing radius parameter with default', () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        // No radius specified, should use default
        location: { line: 1, column: 1 },
      };

      const result = converter.convertASTNodeToGeometry(sphereNode, defaultGlobals);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.metadata.parameters.radius).toBe(1); // Default radius
      }
    });

    test('should handle missing size parameter with default', () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        // No size specified, should use default
        center: true,
        location: { line: 1, column: 1 },
      };

      const result = converter.convertASTNodeToGeometry(cubeNode, defaultGlobals);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.metadata.parameters.size).toEqual({ x: 1, y: 1, z: 1 }); // Default size
      }
    });
  });
});
