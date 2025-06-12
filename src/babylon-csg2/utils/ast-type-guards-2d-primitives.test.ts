/**
 * Test suite for 2D primitive type guards and parameter extractors
 * 
 * Tests the type guards and parameter extraction utilities for CircleNode, 
 * SquareNode, and PolygonNode from the OpenSCAD parser.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import type { CircleNode, SquareNode, PolygonNode, ASTNode } from '@holistic-stack/openscad-parser';
import {
  isCircleNode,
  isSquareNode,
  isPolygonNode,
  is2DPrimitiveNode,
  extractCircleRadius,
  extractSquareSize,
  extractPolygonPoints,
  getNodeDescription
} from './ast-type-guards';

describe('[INIT] 2D Primitive Type Guards', () => {
  console.log('[INIT] Starting 2D primitive type guards tests');

  describe('CircleNode Type Guard', () => {
    it('should identify CircleNode correctly', () => {
      console.log('[DEBUG] Testing CircleNode type guard');
      
      const circleNode: CircleNode = {
        type: 'circle',
        r: 5,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      expect(isCircleNode(circleNode)).toBe(true);
      expect(is2DPrimitiveNode(circleNode)).toBe(true);
      
      console.log('[DEBUG] CircleNode type guard working correctly');
    });

    it('should reject non-circle nodes', () => {
      const cubeNode: ASTNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      expect(isCircleNode(cubeNode)).toBe(false);
    });

    it('should extract radius parameter correctly', () => {
      console.log('[DEBUG] Testing circle radius extraction');
      
      const circleWithRadius: CircleNode = {
        type: 'circle',
        r: 10,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      const result = extractCircleRadius(circleWithRadius);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(10);
      }
      
      console.log('[DEBUG] Circle radius extraction working correctly');
    });

    it('should extract diameter parameter and convert to radius', () => {
      const circleWithDiameter: CircleNode = {
        type: 'circle',
        d: 20,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      const result = extractCircleRadius(circleWithDiameter);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(10); // diameter 20 -> radius 10
      }
    });

    it('should handle missing radius/diameter parameters', () => {
      const circleWithoutParams: CircleNode = {
        type: 'circle',
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      const result = extractCircleRadius(circleWithoutParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('missing radius/diameter parameter');
      }
    });
  });

  describe('SquareNode Type Guard', () => {
    it('should identify SquareNode correctly', () => {
      console.log('[DEBUG] Testing SquareNode type guard');
      
      const squareNode: SquareNode = {
        type: 'square',
        size: [10, 20],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      expect(isSquareNode(squareNode)).toBe(true);
      expect(is2DPrimitiveNode(squareNode)).toBe(true);
      
      console.log('[DEBUG] SquareNode type guard working correctly');
    });

    it('should extract size parameter correctly', () => {
      console.log('[DEBUG] Testing square size extraction');
      
      const squareNode: SquareNode = {
        type: 'square',
        size: [15, 25],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      const result = extractSquareSize(squareNode);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([15, 25]);
      }
      
      console.log('[DEBUG] Square size extraction working correctly');
    });

    it('should handle uniform size parameter', () => {
      const squareNode: SquareNode = {
        type: 'square',
        size: 10, // Single number for uniform size
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      const result = extractSquareSize(squareNode);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([10, 10]);
      }
    });

    it('should handle missing size parameter', () => {
      // Create a square without size using type assertion to test error handling
      const squareWithoutSize = {
        type: 'square' as const,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      } as SquareNode;

      const result = extractSquareSize(squareWithoutSize);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('missing size parameter');
      }
    });
  });

  describe('PolygonNode Type Guard', () => {
    it('should identify PolygonNode correctly', () => {
      console.log('[DEBUG] Testing PolygonNode type guard');
      
      const polygonNode: PolygonNode = {
        type: 'polygon',
        points: [[0, 0], [10, 0], [5, 10]],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      expect(isPolygonNode(polygonNode)).toBe(true);
      expect(is2DPrimitiveNode(polygonNode)).toBe(true);
      
      console.log('[DEBUG] PolygonNode type guard working correctly');
    });

    it('should extract points parameter correctly', () => {
      console.log('[DEBUG] Testing polygon points extraction');
      
      const polygonNode: PolygonNode = {
        type: 'polygon',
        points: [[0, 0], [10, 0], [10, 10], [0, 10]],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      const result = extractPolygonPoints(polygonNode);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([[0, 0], [10, 0], [10, 10], [0, 10]]);
      }
      
      console.log('[DEBUG] Polygon points extraction working correctly');
    });

    it('should handle missing points parameter', () => {
      // Create a polygon without points using type assertion to test error handling
      const polygonWithoutPoints = {
        type: 'polygon' as const,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      } as PolygonNode;

      const result = extractPolygonPoints(polygonWithoutPoints);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('missing points parameter');
      }
    });

    it('should handle invalid points', () => {
      // Create a polygon with invalid points using any type to bypass TypeScript checking
      const polygonWithInvalidPoints = {
        type: 'polygon' as const,
        points: [[0, 0], ['invalid', 'point'], [10, 10]] as any,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      } as PolygonNode;

      const result = extractPolygonPoints(polygonWithInvalidPoints);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid point at index 1');
      }
    });
  });

  describe('Node Description', () => {
    it('should provide correct descriptions for 2D primitives', () => {
      console.log('[DEBUG] Testing node descriptions for 2D primitives');
      
      // Create minimal nodes for description testing using type assertions
      const circleNode = { type: 'circle' as const, location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } } } as CircleNode;
      const squareNode = { type: 'square' as const, location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } } } as SquareNode;
      const polygonNode = { type: 'polygon' as const, location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } } } as PolygonNode;

      expect(getNodeDescription(circleNode)).toBe('Circle 2D primitive');
      expect(getNodeDescription(squareNode)).toBe('Square 2D primitive');
      expect(getNodeDescription(polygonNode)).toBe('Polygon 2D primitive');
      
      console.log('[DEBUG] Node descriptions working correctly');
    });
  });

  console.log('[END] 2D primitive type guards tests completed successfully');
});
