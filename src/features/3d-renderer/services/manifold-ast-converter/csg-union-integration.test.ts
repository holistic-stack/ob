/**
 * @file CSG Union Integration Tests
 * @description TDD tests for real Manifold union operations in ManifoldASTConverter
 * Following project guidelines: no mocks, real implementations, Result<T,E> patterns
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { Result } from '../../../../shared/types/result.types';
import type { CubeNode, SphereNode, UnionNode } from '../../../openscad-parser/ast/ast-types';
import { ManifoldASTConverter } from './manifold-ast-converter';

describe('CSG Union Integration', () => {
  let converter: ManifoldASTConverter;

  beforeEach(async () => {
    converter = new ManifoldASTConverter();
    await converter.initialize();
  });

  afterEach(() => {
    converter.dispose();
  });

  describe('Step C.1: Union Operations - Red Phase', () => {
    test('should perform real Manifold union of two cubes', async () => {
      // Create union node with two cube children
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'cube',
            size: [1, 1, 1],
            center: false,
            children: [],
          },
          {
            type: 'cube',
            size: [1, 1, 1],
            center: false,
            children: [],
          },
        ],
      };

      // This should use real Manifold union operation, not placeholder
      const result = await converter.convertNode(unionNode);

      if (!result.success) {
        console.log('Union operation failed:', result.error);
      }

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
        expect(result.data.triangleCount).toBeGreaterThan(0);
        // Real union should have different vertex count than simple placeholder
        expect(result.data.operationTime).toBeGreaterThan(0);
      }
    });

    test('should handle union of cube and sphere', async () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'cube',
            size: [2, 2, 2],
            center: true,
            children: [],
          },
          {
            type: 'sphere',
            r: 1.5,
            children: [],
          },
        ],
      };

      const result = await converter.convertNode(unionNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
        expect(result.data.triangleCount).toBeGreaterThan(0);
      }
    });

    test('should handle union with multiple children', async () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'cube',
            size: [1, 1, 1],
            center: false,
            children: [],
          },
          {
            type: 'sphere',
            r: 0.8,
            children: [],
          },
          {
            type: 'cube',
            size: [0.5, 0.5, 2],
            center: true,
            children: [],
          },
        ],
      };

      const result = await converter.convertNode(unionNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
        expect(result.data.triangleCount).toBeGreaterThan(0);
      }
    });

    test('should handle union with transformations', async () => {
      // Union of translated cubes
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'translate',
            v: [1, 0, 0],
            children: [
              {
                type: 'cube',
                size: [1, 1, 1],
                center: false,
                children: [],
              },
            ],
          },
          {
            type: 'translate',
            v: [-1, 0, 0],
            children: [
              {
                type: 'cube',
                size: [1, 1, 1],
                center: false,
                children: [],
              },
            ],
          },
        ],
      };

      const result = await converter.convertNode(unionNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
      }
    });

    test('should handle single child union gracefully', async () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'sphere',
            r: 1,
            children: [],
          },
        ],
      };

      const result = await converter.convertNode(unionNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
      }
    });

    test('should handle empty union with proper error', async () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [],
      };

      const result = await converter.convertNode(unionNode);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No child geometries to union');
    });

    test('should validate union operation performance', async () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'cube',
            size: [1, 1, 1],
            center: false,
            children: [],
          },
          {
            type: 'cube',
            size: [1, 1, 1],
            center: false,
            children: [],
          },
        ],
      };

      const startTime = performance.now();
      const result = await converter.convertNode(unionNode);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(100); // Should complete within 100ms

      if (result.success) {
        expect(result.data.operationTime).toBeGreaterThan(0);
        expect(result.data.operationTime).toBeLessThan(50); // Individual operation under 50ms
      }
    });
  });
});
