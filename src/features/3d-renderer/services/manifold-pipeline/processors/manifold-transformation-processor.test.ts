/**
 * @file ManifoldTransformationProcessor Test Suite
 * @description TDD test suite for Manifold transformation processor
 * Following project guidelines: real implementations, no mocks for core logic, Result<T,E> patterns
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ManifoldTransformationProcessor } from './manifold-transformation-processor';
import type { TranslateNode, RotateNode, ScaleNode } from '../../../../openscad-parser/core/ast-types';
import type { Result } from '../../../../../shared/types/result.types';
import type { ManifoldPrimitive, TransformationResult } from '../types/processor-types';
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

describe('ManifoldTransformationProcessor', () => {
  let processor: ManifoldTransformationProcessor;
  let mockPrimitive: ManifoldPrimitive;

  beforeEach(async () => {
    // Clean up any existing resources before starting
    clearAllResources();
    
    processor = new ManifoldTransformationProcessor();
    const initResult = await processor.initialize();
    if (!initResult.success) {
      console.error('Processor initialization failed:', initResult.error);
      throw new Error(`Failed to initialize processor: ${initResult.error}`);
    }

    // Create a mock primitive for testing transformations
    mockPrimitive = {
      type: 'cube',
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
        nodeId: 'test-cube'
      }
    };
  });

  afterEach(async () => {
    if (processor) {
      processor.dispose();
    }
    // Clean up all resources after each test
    clearAllResources();
  });

  describe('Translation Transformations', () => {
    test('should apply translation using Manifold native API', async () => {
      const translateNode: TranslateNode = { 
        type: 'translate', 
        v: [2, 3, 4],
        children: []
      };

      const result = await processor.processTransformation(translateNode, [mockPrimitive]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transformedPrimitives).toHaveLength(1);
        expect(result.data.metadata.transformationType).toBe('translate');
        expect(result.data.metadata.usedManifoldNative).toBe(true);
        expect(result.data.metadata.transformationParams.v).toEqual([2, 3, 4]);
        
        // Verify Manifold translate method was called
        expect(mockPrimitive.manifoldObject.translate).toHaveBeenCalledWith([2, 3, 4]);
      }
    });

    test('should handle translation with single value', async () => {
      const translateNode: TranslateNode = { 
        type: 'translate', 
        v: [5, 0, 0],
        children: []
      };

      const result = await processor.processTransformation(translateNode, [mockPrimitive]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata.transformationParams.v).toEqual([5, 0, 0]);
      }
    });

    test('should validate translation parameters', async () => {
      const invalidTranslate: TranslateNode = { 
        type: 'translate', 
        v: [] as any, // Invalid empty array
        children: []
      };

      const result = await processor.processTransformation(invalidTranslate, [mockPrimitive]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid translation parameters');
    });
  });

  describe('Rotation Transformations', () => {
    test('should apply rotation using Manifold native API', async () => {
      const rotateNode: RotateNode = { 
        type: 'rotate', 
        a: [0, 0, 45],
        children: []
      };

      const result = await processor.processTransformation(rotateNode, [mockPrimitive]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transformedPrimitives).toHaveLength(1);
        expect(result.data.metadata.transformationType).toBe('rotate');
        expect(result.data.metadata.usedManifoldNative).toBe(true);
        expect(result.data.metadata.transformationParams.a).toEqual([0, 0, 45]);
      }
    });

    test('should handle rotation with axis and angle', async () => {
      const rotateNode: RotateNode = { 
        type: 'rotate', 
        a: 90,
        v: [1, 0, 0],
        children: []
      };

      const result = await processor.processTransformation(rotateNode, [mockPrimitive]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata.transformationParams.a).toBe(90);
        expect(result.data.metadata.transformationParams.v).toEqual([1, 0, 0]);
      }
    });

    test('should validate rotation parameters', async () => {
      const invalidRotate: RotateNode = { 
        type: 'rotate', 
        a: 'invalid' as any, // Invalid angle
        children: []
      };

      const result = await processor.processTransformation(invalidRotate, [mockPrimitive]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid rotation parameters');
    });
  });

  describe('Scale Transformations', () => {
    test('should apply scaling using Manifold native API', async () => {
      const scaleNode: ScaleNode = { 
        type: 'scale', 
        v: [2, 1.5, 0.5],
        children: []
      };

      const result = await processor.processTransformation(scaleNode, [mockPrimitive]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transformedPrimitives).toHaveLength(1);
        expect(result.data.metadata.transformationType).toBe('scale');
        expect(result.data.metadata.usedManifoldNative).toBe(true);
        expect(result.data.metadata.transformationParams.v).toEqual([2, 1.5, 0.5]);
        
        // Verify Manifold scale method was called
        expect(mockPrimitive.manifoldObject.scale).toHaveBeenCalledWith([2, 1.5, 0.5]);
      }
    });

    test('should handle uniform scaling', async () => {
      const scaleNode: ScaleNode = { 
        type: 'scale', 
        v: 2, // Uniform scale
        children: []
      };

      const result = await processor.processTransformation(scaleNode, [mockPrimitive]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata.transformationParams.v).toBe(2);
      }
    });

    test('should validate scale parameters', async () => {
      const invalidScale: ScaleNode = { 
        type: 'scale', 
        v: [0, 1, 1], // Invalid zero scale
        children: []
      };

      const result = await processor.processTransformation(invalidScale, [mockPrimitive]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid scale parameters');
    });
  });

  describe('Multiple Primitives', () => {
    test('should transform multiple primitives', async () => {
      const secondPrimitive = { ...mockPrimitive, type: 'sphere' };
      const translateNode: TranslateNode = { 
        type: 'translate', 
        v: [1, 1, 1],
        children: []
      };

      const result = await processor.processTransformation(translateNode, [mockPrimitive, secondPrimitive]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.transformedPrimitives).toHaveLength(2);
        expect(result.data.metadata.transformationType).toBe('translate');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported transformation types', async () => {
      const invalidNode = { type: 'unsupported', children: [] } as any;

      const result = await processor.processTransformation(invalidNode, [mockPrimitive]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported transformation type');
    });

    test('should handle empty primitives array', async () => {
      const translateNode: TranslateNode = { 
        type: 'translate', 
        v: [1, 1, 1],
        children: []
      };

      const result = await processor.processTransformation(translateNode, []);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No primitives provided');
    });

    test('should handle processor not initialized', async () => {
      const uninitializedProcessor = new ManifoldTransformationProcessor();
      const translateNode: TranslateNode = { 
        type: 'translate', 
        v: [1, 1, 1],
        children: []
      };

      const result = await uninitializedProcessor.processTransformation(translateNode, [mockPrimitive]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not initialized');
    });
  });

  describe('Memory Management', () => {
    test('should register transformed resources for cleanup', async () => {
      const initialStats = getMemoryStats();
      const translateNode: TranslateNode = { 
        type: 'translate', 
        v: [1, 1, 1],
        children: []
      };

      const result = await processor.processTransformation(translateNode, [mockPrimitive]);

      expect(result.success).toBe(true);
      const afterStats = getMemoryStats();
      expect(afterStats.activeResources).toBeGreaterThanOrEqual(initialStats.activeResources);
    });

    test('should clean up resources on disposal', async () => {
      const initialStats = getMemoryStats();
      const translateNode: TranslateNode = { 
        type: 'translate', 
        v: [1, 1, 1],
        children: []
      };
      await processor.processTransformation(translateNode, [mockPrimitive]);

      const beforeDisposeStats = getMemoryStats();
      expect(beforeDisposeStats.activeResources).toBeGreaterThanOrEqual(initialStats.activeResources);

      processor.dispose();

      // Memory should be reduced after disposal
      const afterDisposeStats = getMemoryStats();
      expect(afterDisposeStats.activeResources).toBeLessThanOrEqual(beforeDisposeStats.activeResources);
    });
  });
});
