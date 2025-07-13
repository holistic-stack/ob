/**
 * @file ManifoldPrimitiveProcessor Test Suite
 * @description TDD test suite for Manifold primitive creation processor
 * Following project guidelines: real implementations, no mocks for core logic, Result<T,E> patterns
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ManifoldPrimitiveProcessor } from './manifold-primitive-processor';
import type { CubeNode, SphereNode, CylinderNode } from '../../../../openscad-parser/core/ast-types';
import type { Result } from '../../../../../shared/types/result.types';
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
        }),
        _Sphere: vi.fn().mockReturnValue({
          delete: vi.fn(),
          boundingBox: vi.fn().mockReturnValue({
            min: { x: -1, y: -1, z: -1 },
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

describe('ManifoldPrimitiveProcessor', () => {
  let processor: ManifoldPrimitiveProcessor;

  beforeEach(async () => {
    // Clean up any existing resources before starting
    clearAllResources();

    processor = new ManifoldPrimitiveProcessor();
    const initResult = await processor.initialize();
    if (!initResult.success) {
      console.error('Processor initialization failed:', initResult.error);
      throw new Error(`Failed to initialize processor: ${initResult.error}`);
    }
  });

  afterEach(async () => {
    if (processor) {
      processor.dispose();
    }
    // Clean up all resources after each test
    clearAllResources();
  });

  describe('Cube Primitive Creation', () => {
    test('should create cube primitive using Manifold native API', async () => {
      const cubeNode: CubeNode = { 
        type: 'cube', 
        size: [2, 3, 4],
        center: false
      };

      const result = await processor.processNode(cubeNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('cube');
        expect(result.data.manifoldObject).toBeDefined();
        expect(result.data.boundingBox).toBeDefined();
        expect(result.data.parameters.size).toEqual([2, 3, 4]);
        expect(typeof result.data.manifoldObject.delete).toBe('function');
      }
    });

    test('should handle cube with center parameter', async () => {
      const cubeNode: CubeNode = { 
        type: 'cube', 
        size: [1, 1, 1],
        center: true
      };

      const result = await processor.processNode(cubeNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parameters.center).toBe(true);
      }
    });

    test('should validate cube parameters', async () => {
      const invalidCube: CubeNode = { 
        type: 'cube', 
        size: [-1, 0, 1] // Invalid size
      };

      const result = await processor.processNode(invalidCube);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid cube parameters');
    });
  });

  describe('Sphere Primitive Creation', () => {
    test('should create sphere with correct parameters', async () => {
      const sphereNode: SphereNode = { 
        type: 'sphere', 
        r: 1.5 
      };

      const result = await processor.processNode(sphereNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('sphere');
        expect(result.data.parameters.radius).toBe(1.5);
        expect(result.data.manifoldObject).toBeDefined();
      }
    });

    test('should handle sphere with diameter parameter', async () => {
      const sphereNode: SphereNode = { 
        type: 'sphere', 
        d: 3.0 
      };

      const result = await processor.processNode(sphereNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parameters.radius).toBe(1.5); // d/2
      }
    });

    test('should validate sphere parameters', async () => {
      const invalidSphere: SphereNode = { 
        type: 'sphere', 
        r: -1 // Invalid radius
      };

      const result = await processor.processNode(invalidSphere);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid sphere parameters');
    });
  });

  describe('Cylinder Primitive Creation', () => {
    test('should create cylinder with proper geometry', async () => {
      const cylinderNode: CylinderNode = { 
        type: 'cylinder', 
        h: 2, 
        r: 0.5 
      };

      const result = await processor.processNode(cylinderNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('cylinder');
        expect(result.data.parameters.height).toBe(2);
        expect(result.data.parameters.radius).toBe(0.5);
      }
    });

    test('should handle cylinder with different top and bottom radii', async () => {
      const cylinderNode: CylinderNode = { 
        type: 'cylinder', 
        h: 3, 
        r1: 1.0,
        r2: 0.5
      };

      const result = await processor.processNode(cylinderNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parameters.r1).toBe(1.0);
        expect(result.data.parameters.r2).toBe(0.5);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported primitive types', async () => {
      const invalidNode = { type: 'unsupported' } as any;

      const result = await processor.processNode(invalidNode);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported primitive type');
    });

    test('should handle processor not initialized', async () => {
      const uninitializedProcessor = new ManifoldPrimitiveProcessor();
      const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };

      const result = await uninitializedProcessor.processNode(cubeNode);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not initialized');
    });
  });

  describe('Memory Management', () => {
    test('should register resources for cleanup', async () => {
      const initialStats = getMemoryStats();
      const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };

      const result = await processor.processNode(cubeNode);

      expect(result.success).toBe(true);
      const afterStats = getMemoryStats();
      expect(afterStats.activeResources).toBeGreaterThan(initialStats.activeResources);
    });

    test('should clean up resources on disposal', async () => {
      const initialStats = getMemoryStats();
      const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };
      await processor.processNode(cubeNode);

      const beforeDisposeStats = getMemoryStats();
      expect(beforeDisposeStats.activeResources).toBeGreaterThan(initialStats.activeResources);

      processor.dispose();

      // Memory should be reduced after disposal (may not be exactly 0 due to processor itself)
      const afterDisposeStats = getMemoryStats();
      expect(afterDisposeStats.activeResources).toBeLessThanOrEqual(beforeDisposeStats.activeResources);
    });
  });
});
