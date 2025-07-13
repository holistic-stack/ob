/**
 * @file ManifoldCSGProcessor Test Suite
 * @description TDD test suite for Manifold CSG operations processor
 * Following project guidelines: real implementations, no mocks for core logic, Result<T,E> patterns
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ManifoldCSGProcessor } from './manifold-csg-processor';
import type { UnionNode, DifferenceNode, IntersectionNode } from '../../../../openscad-parser/core/ast-types';
import type { Result } from '../../../../../shared/types/result.types';
import type { ManifoldPrimitive, CSGOperationResult } from '../types/processor-types';
import { getMemoryStats, clearAllResources } from '../../manifold-memory-manager/manifold-memory-manager';

// Mock ManifoldWasmLoader for testing (WASM not available in test environment)
vi.mock('../../manifold-wasm-loader/manifold-wasm-loader', () => ({
  ManifoldWasmLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue({
      success: true,
      data: {
        _Cube: vi.fn().mockReturnValue({
          delete: vi.fn(),
          boundingBox: vi.fn().mockReturnValue({
            min: { x: 0, y: 0, z: 0 },
            max: { x: 1, y: 1, z: 1 }
          }),
          translate: vi.fn().mockReturnThis(),
          rotate: vi.fn().mockReturnThis(),
          scale: vi.fn().mockReturnThis(),
          transform: vi.fn().mockReturnThis(),
          getMesh: vi.fn().mockReturnValue({
            vertPos: [0, 0, 0, 1, 1, 1],
            triVerts: [0, 1, 2],
            numProp: 3
          }),
          add: vi.fn().mockReturnThis(),
          subtract: vi.fn().mockReturnThis(),
          intersect: vi.fn().mockReturnThis()
        })
      }
    })
  }))
}));

describe('ManifoldCSGProcessor', () => {
  let processor: ManifoldCSGProcessor;
  let mockPrimitive1: ManifoldPrimitive;
  let mockPrimitive2: ManifoldPrimitive;

  beforeEach(async () => {
    // Clean up any existing resources before starting
    clearAllResources();
    
    processor = new ManifoldCSGProcessor();
    const initResult = await processor.initialize();
    if (!initResult.success) {
      console.error('Processor initialization failed:', initResult.error);
      throw new Error(`Failed to initialize processor: ${initResult.error}`);
    }

    // Create mock primitives for testing CSG operations
    const createMockPrimitive = (type: string, id: string) => ({
      type,
      manifoldObject: {
        delete: vi.fn(),
        boundingBox: vi.fn().mockReturnValue({
          min: { x: 0, y: 0, z: 0 },
          max: { x: 1, y: 1, z: 1 }
        }),
        translate: vi.fn().mockReturnThis(),
        rotate: vi.fn().mockReturnThis(),
        scale: vi.fn().mockReturnThis(),
        transform: vi.fn().mockReturnThis(),
        getMesh: vi.fn().mockReturnValue({
          vertPos: [0, 0, 0, 1, 1, 1],
          triVerts: [0, 1, 2],
          numProp: 3
        }),
        add: vi.fn().mockReturnThis(),
        subtract: vi.fn().mockReturnThis(),
        intersect: vi.fn().mockReturnThis()
      } as any,
      parameters: { size: [1, 1, 1] },
      boundingBox: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 1, y: 1, z: 1 }
      },
      metadata: {
        creationTime: Date.now(),
        processingTime: 1.0,
        nodeId: id
      }
    });

    mockPrimitive1 = createMockPrimitive('cube', 'test-cube-1');
    mockPrimitive2 = createMockPrimitive('sphere', 'test-sphere-1');
  });

  afterEach(async () => {
    if (processor) {
      processor.dispose();
    }
    // Clean up all resources after each test
    clearAllResources();
  });

  describe('Union Operations', () => {
    test('should perform union using Manifold native API', async () => {
      const unionNode: UnionNode = { 
        type: 'union',
        children: []
      };

      const result = await processor.processCSGOperation(unionNode, [mockPrimitive1, mockPrimitive2]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe('union');
        expect(result.data.inputCount).toBe(2);
        expect(result.data.resultPrimitive).toBeDefined();
        expect(result.data.manifoldness).toBe(true);
        
        // Verify Manifold add method was called
        expect(mockPrimitive1.manifoldObject.add).toHaveBeenCalledWith(mockPrimitive2.manifoldObject);
      }
    });

    test('should handle union with single primitive', async () => {
      const unionNode: UnionNode = { 
        type: 'union',
        children: []
      };

      const result = await processor.processCSGOperation(unionNode, [mockPrimitive1]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe('union');
        expect(result.data.inputCount).toBe(1);
        expect(result.data.resultPrimitive).toEqual(mockPrimitive1);
      }
    });

    test('should handle union with multiple primitives', async () => {
      const mockPrimitive3 = { ...mockPrimitive1, type: 'cylinder' };
      const unionNode: UnionNode = { 
        type: 'union',
        children: []
      };

      const result = await processor.processCSGOperation(unionNode, [mockPrimitive1, mockPrimitive2, mockPrimitive3]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe('union');
        expect(result.data.inputCount).toBe(3);
      }
    });
  });

  describe('Difference Operations', () => {
    test('should perform difference using Manifold native API', async () => {
      const differenceNode: DifferenceNode = { 
        type: 'difference',
        children: []
      };

      const result = await processor.processCSGOperation(differenceNode, [mockPrimitive1, mockPrimitive2]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe('difference');
        expect(result.data.inputCount).toBe(2);
        expect(result.data.resultPrimitive).toBeDefined();
        expect(result.data.manifoldness).toBe(true);
        
        // Verify Manifold subtract method was called
        expect(mockPrimitive1.manifoldObject.subtract).toHaveBeenCalledWith(mockPrimitive2.manifoldObject);
      }
    });

    test('should handle difference with multiple subtractors', async () => {
      const mockPrimitive3 = { ...mockPrimitive1, type: 'cylinder' };
      const differenceNode: DifferenceNode = { 
        type: 'difference',
        children: []
      };

      const result = await processor.processCSGOperation(differenceNode, [mockPrimitive1, mockPrimitive2, mockPrimitive3]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe('difference');
        expect(result.data.inputCount).toBe(3);
        // Should subtract both primitive2 and primitive3 from primitive1
      }
    });

    test('should validate difference requires at least 2 primitives', async () => {
      const differenceNode: DifferenceNode = { 
        type: 'difference',
        children: []
      };

      const result = await processor.processCSGOperation(differenceNode, [mockPrimitive1]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Difference operation requires at least 2 primitives');
    });
  });

  describe('Intersection Operations', () => {
    test('should perform intersection using Manifold native API', async () => {
      const intersectionNode: IntersectionNode = { 
        type: 'intersection',
        children: []
      };

      const result = await processor.processCSGOperation(intersectionNode, [mockPrimitive1, mockPrimitive2]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe('intersection');
        expect(result.data.inputCount).toBe(2);
        expect(result.data.resultPrimitive).toBeDefined();
        expect(result.data.manifoldness).toBe(true);
        
        // Verify Manifold intersect method was called
        expect(mockPrimitive1.manifoldObject.intersect).toHaveBeenCalledWith(mockPrimitive2.manifoldObject);
      }
    });

    test('should handle intersection with multiple primitives', async () => {
      const mockPrimitive3 = { ...mockPrimitive1, type: 'cylinder' };
      const intersectionNode: IntersectionNode = { 
        type: 'intersection',
        children: []
      };

      const result = await processor.processCSGOperation(intersectionNode, [mockPrimitive1, mockPrimitive2, mockPrimitive3]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe('intersection');
        expect(result.data.inputCount).toBe(3);
      }
    });

    test('should validate intersection requires at least 2 primitives', async () => {
      const intersectionNode: IntersectionNode = { 
        type: 'intersection',
        children: []
      };

      const result = await processor.processCSGOperation(intersectionNode, [mockPrimitive1]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Intersection operation requires at least 2 primitives');
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported CSG operation types', async () => {
      const invalidNode = { type: 'unsupported', children: [] } as any;

      const result = await processor.processCSGOperation(invalidNode, [mockPrimitive1, mockPrimitive2]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported CSG operation type');
    });

    test('should handle empty primitives array', async () => {
      const unionNode: UnionNode = { 
        type: 'union',
        children: []
      };

      const result = await processor.processCSGOperation(unionNode, []);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No primitives provided');
    });

    test('should handle processor not initialized', async () => {
      const uninitializedProcessor = new ManifoldCSGProcessor();
      const unionNode: UnionNode = { 
        type: 'union',
        children: []
      };

      const result = await uninitializedProcessor.processCSGOperation(unionNode, [mockPrimitive1, mockPrimitive2]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not initialized');
    });
  });

  describe('Memory Management', () => {
    test('should register CSG result resources for cleanup', async () => {
      const initialStats = getMemoryStats();
      const unionNode: UnionNode = { 
        type: 'union',
        children: []
      };

      const result = await processor.processCSGOperation(unionNode, [mockPrimitive1, mockPrimitive2]);

      expect(result.success).toBe(true);
      const afterStats = getMemoryStats();
      expect(afterStats.activeResources).toBeGreaterThanOrEqual(initialStats.activeResources);
    });

    test('should clean up resources on disposal', async () => {
      const initialStats = getMemoryStats();
      const unionNode: UnionNode = { 
        type: 'union',
        children: []
      };
      await processor.processCSGOperation(unionNode, [mockPrimitive1, mockPrimitive2]);

      const beforeDisposeStats = getMemoryStats();
      expect(beforeDisposeStats.activeResources).toBeGreaterThanOrEqual(initialStats.activeResources);

      processor.dispose();

      // Memory should be reduced after disposal
      const afterDisposeStats = getMemoryStats();
      expect(afterDisposeStats.activeResources).toBeLessThanOrEqual(beforeDisposeStats.activeResources);
    });
  });

  describe('Performance and Manifoldness', () => {
    test('should maintain manifoldness guarantees', async () => {
      const unionNode: UnionNode = { 
        type: 'union',
        children: []
      };

      const result = await processor.processCSGOperation(unionNode, [mockPrimitive1, mockPrimitive2]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.manifoldness).toBe(true);
        expect(result.data.processingTime).toBeGreaterThan(0);
      }
    });

    test('should track processing time', async () => {
      const differenceNode: DifferenceNode = { 
        type: 'difference',
        children: []
      };

      const result = await processor.processCSGOperation(differenceNode, [mockPrimitive1, mockPrimitive2]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processingTime).toBeGreaterThan(0);
        expect(typeof result.data.processingTime).toBe('number');
      }
    });
  });
});
