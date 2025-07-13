/**
 * @file CSG Difference Integration Tests
 * @description TDD tests for real Manifold difference operations in ManifoldASTConverter
 * Following project guidelines: no mocks, real implementations, Result<T,E> patterns
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { ManifoldASTConverter } from './manifold-ast-converter';
import type { DifferenceNode, CubeNode, SphereNode } from '../../../openscad-parser/ast/ast-types';
import type { Result } from '../../../../shared/types/result.types';

describe('CSG Difference Integration', () => {
  let converter: ManifoldASTConverter;

  beforeEach(async () => {
    converter = new ManifoldASTConverter();
    await converter.initialize();
  });

  afterEach(() => {
    converter.dispose();
  });

  describe('Step C.2: Difference Operations - Red Phase', () => {
    test('should perform real Manifold difference of cube minus sphere', async () => {
      // Create difference node: cube - sphere
      const differenceNode: DifferenceNode = {
        type: 'difference',
        children: [
          {
            type: 'cube',
            size: [2, 2, 2],
            center: true,
            children: [],
          },
          {
            type: 'sphere',
            r: 1,
            children: [],
          },
        ],
      };

      // This should use real Manifold difference operation
      const result = await converter.convertNode(differenceNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
        expect(result.data.triangleCount).toBeGreaterThan(0);
        expect(result.data.operationTime).toBeGreaterThan(0);
      }
    });

    test('should handle difference with multiple subtractions', async () => {
      // Create difference node: cube - sphere1 - sphere2
      const differenceNode: DifferenceNode = {
        type: 'difference',
        children: [
          {
            type: 'cube',
            size: [3, 3, 3],
            center: true,
            children: [],
          },
          {
            type: 'sphere',
            r: 0.8,
            children: [],
          },
          {
            type: 'sphere',
            r: 0.6,
            children: [],
          },
        ],
      };

      const result = await converter.convertNode(differenceNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
      }
    });

    test('should handle difference with transformations', async () => {
      // Difference with translated sphere
      const differenceNode: DifferenceNode = {
        type: 'difference',
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
            children: [{
              type: 'sphere',
              r: 0.8,
              children: [],
            }],
          },
        ],
      };

      const result = await converter.convertNode(differenceNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
      }
    });

    test('should handle single child difference gracefully', async () => {
      const differenceNode: DifferenceNode = {
        type: 'difference',
        children: [{
          type: 'cube',
          size: [1, 1, 1],
          center: false,
          children: [],
        }],
      };

      const result = await converter.convertNode(differenceNode);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.geometry).toBeDefined();
        expect(result.data.vertexCount).toBeGreaterThan(0);
      }
    });

    test('should handle empty difference with proper error', async () => {
      const differenceNode: DifferenceNode = {
        type: 'difference',
        children: [],
      };

      const result = await converter.convertNode(differenceNode);
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 children');
    });

    test('should validate difference operation performance', async () => {
      const differenceNode: DifferenceNode = {
        type: 'difference',
        children: [
          {
            type: 'cube',
            size: [2, 2, 2],
            center: true,
            children: [],
          },
          {
            type: 'sphere',
            r: 1,
            children: [],
          },
        ],
      };

      const startTime = performance.now();
      const result = await converter.convertNode(differenceNode);
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
