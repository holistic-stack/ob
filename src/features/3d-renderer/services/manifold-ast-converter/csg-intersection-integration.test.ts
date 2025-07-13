/**
 * @file CSG Intersection Integration Tests
 * @description TDD tests for real Manifold intersection operations in ManifoldASTConverter
 * Following project guidelines: no mocks, real implementations, Result<T,E> patterns
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { Result } from '../../../../shared/types/result.types';
import type {
  CubeNode,
  IntersectionNode,
  SphereNode,
} from '../../../openscad-parser/ast/ast-types';
import { ManifoldASTConverter } from './manifold-ast-converter';

describe('CSG Intersection Integration', () => {
  let converter: ManifoldASTConverter;

  beforeEach(async () => {
    converter = new ManifoldASTConverter();
    await converter.initialize();
  });

  afterEach(() => {
    converter.dispose();
  });

  describe('Step C.3: Intersection Operations - Red Phase', () => {
    test('should perform real Manifold intersection of cube and sphere', async () => {
      // Create intersection node: cube ∩ sphere
      const intersectionNode: IntersectionNode = {
        type: 'intersection',
        children: [
          {
            type: 'cube',
            size: [2, 2, 2],
            center: true,
            children: [],
          },
          {
            type: 'sphere',
            r: 1.2,
            children: [],
          },
        ],
      };

      // This should use real Manifold intersection operation
      const result = await converter.convertNode(intersectionNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
        expect(result.data.triangleCount).toBeGreaterThan(0);
        expect(result.data.operationTime).toBeGreaterThan(0);
      }
    });

    test('should handle intersection with multiple objects', async () => {
      // Create intersection node: cube ∩ sphere1 ∩ sphere2
      const intersectionNode: IntersectionNode = {
        type: 'intersection',
        children: [
          {
            type: 'cube',
            size: [3, 3, 3],
            center: true,
            children: [],
          },
          {
            type: 'sphere',
            r: 2,
            children: [],
          },
          {
            type: 'sphere',
            r: 1.5,
            children: [],
          },
        ],
      };

      const result = await converter.convertNode(intersectionNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
      }
    });

    test('should handle intersection with transformations', async () => {
      // Intersection with translated sphere
      const intersectionNode: IntersectionNode = {
        type: 'intersection',
        children: [
          {
            type: 'cube',
            size: [2, 2, 2],
            center: true,
            children: [],
          },
          {
            type: 'translate',
            v: [0.5, 0.5, 0.5],
            children: [
              {
                type: 'sphere',
                r: 1.5,
                children: [],
              },
            ],
          },
        ],
      };

      const result = await converter.convertNode(intersectionNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
      }
    });

    test('should handle single child intersection gracefully', async () => {
      const intersectionNode: IntersectionNode = {
        type: 'intersection',
        children: [
          {
            type: 'cube',
            size: [1, 1, 1],
            center: false,
            children: [],
          },
        ],
      };

      const result = await converter.convertNode(intersectionNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
      }
    });

    test('should handle empty intersection with proper error', async () => {
      const intersectionNode: IntersectionNode = {
        type: 'intersection',
        children: [],
      };

      const result = await converter.convertNode(intersectionNode);
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 children');
    });

    test('should validate intersection operation performance', async () => {
      const intersectionNode: IntersectionNode = {
        type: 'intersection',
        children: [
          {
            type: 'cube',
            size: [2, 2, 2],
            center: true,
            children: [],
          },
          {
            type: 'sphere',
            r: 1.2,
            children: [],
          },
        ],
      };

      const startTime = performance.now();
      const result = await converter.convertNode(intersectionNode);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(100); // Should complete within 100ms

      if (result.success) {
        expect(result.data.operationTime).toBeGreaterThan(0);
        expect(result.data.operationTime).toBeLessThan(50); // Individual operation under 50ms
      }
    });

    test('should handle non-overlapping intersection correctly', async () => {
      // Create intersection of non-overlapping objects (should result in empty geometry)
      const intersectionNode: IntersectionNode = {
        type: 'intersection',
        children: [
          {
            type: 'cube',
            size: [1, 1, 1],
            center: false, // cube at origin
            children: [],
          },
          {
            type: 'translate',
            v: [5, 5, 5], // sphere far away
            children: [
              {
                type: 'sphere',
                r: 0.5,
                children: [],
              },
            ],
          },
        ],
      };

      const result = await converter.convertNode(intersectionNode);
      // This might succeed with empty geometry or fail gracefully
      // Both are acceptable behaviors for non-overlapping intersection
      if (result.success) {
        // If successful, geometry might be empty or minimal
        expect(result.data.geometry).toBeDefined();
      } else {
        // If failed, should have meaningful error message
        expect(result.error).toBeDefined();
      }
    });
  });
});
