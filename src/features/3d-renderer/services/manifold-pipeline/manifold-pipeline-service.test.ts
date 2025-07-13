/**
 * @file ManifoldPipelineService Test Suite
 * @description TDD test suite for the main pipeline orchestration service
 * Following project guidelines: real implementations, no mocks for core logic, Result<T,E> patterns
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ManifoldPipelineService } from './manifold-pipeline-service';
import { ManifoldPrimitiveProcessor } from './processors/manifold-primitive-processor';
import { ManifoldTransformationProcessor } from './processors/manifold-transformation-processor';
import { ManifoldCSGProcessor } from './processors/manifold-csg-processor';
import type { ASTNode, CubeNode, TranslateNode, UnionNode } from '../../../openscad-parser/core/ast-types';
import type { Result } from '../../../../shared/types/result.types';
import type { ManifoldPipelineResult } from './types/processor-types';
import { getMemoryStats, clearAllResources } from '../manifold-memory-manager/manifold-memory-manager';

// Mock ManifoldWasmLoader for testing (WASM not available in test environment)
vi.mock('../manifold-wasm-loader/manifold-wasm-loader', () => ({
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

describe('ManifoldPipelineService', () => {
  let pipelineService: ManifoldPipelineService;
  let primitiveProcessor: ManifoldPrimitiveProcessor;
  let transformationProcessor: ManifoldTransformationProcessor;
  let csgProcessor: ManifoldCSGProcessor;

  beforeEach(async () => {
    // Clean up any existing resources before starting
    clearAllResources();
    
    // Create individual processors
    primitiveProcessor = new ManifoldPrimitiveProcessor();
    transformationProcessor = new ManifoldTransformationProcessor();
    csgProcessor = new ManifoldCSGProcessor();

    // Create pipeline service with dependencies
    pipelineService = new ManifoldPipelineService({
      primitiveProcessor,
      transformationProcessor,
      csgProcessor
    });

    // Initialize the pipeline
    const initResult = await pipelineService.initialize();
    if (!initResult.success) {
      console.error('Pipeline initialization failed:', initResult.error);
      throw new Error(`Failed to initialize pipeline: ${initResult.error}`);
    }
  });

  afterEach(async () => {
    if (pipelineService) {
      pipelineService.dispose();
    }
    // Clean up all resources after each test
    clearAllResources();
  });

  describe('Pipeline Initialization', () => {
    test('should initialize all processors successfully', async () => {
      // Pipeline is already initialized in beforeEach
      expect(pipelineService.isInitialized).toBe(true);
    });

    test('should handle processor initialization failures', async () => {
      const uninitializedPipeline = new ManifoldPipelineService({
        primitiveProcessor: new ManifoldPrimitiveProcessor(),
        transformationProcessor: new ManifoldTransformationProcessor(),
        csgProcessor: new ManifoldCSGProcessor()
      });

      // Mock one processor to fail initialization
      vi.spyOn(uninitializedPipeline['dependencies'].primitiveProcessor, 'initialize')
        .mockResolvedValueOnce({ success: false, error: 'Mock initialization failure' });

      const result = await uninitializedPipeline.initialize();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mock initialization failure');
    });
  });

  describe('Simple Primitive Processing', () => {
    test('should process single cube node through complete pipeline', async () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [2, 2, 2],
        center: false
      };

      const result = await pipelineService.processNodes([cubeNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.geometries).toHaveLength(1);
        expect(result.data.manifoldness).toBe(true);
        expect(result.data.operationsPerformed).toContain('primitive_creation');
        expect(result.data.metadata.nodeCount).toBe(1);
        expect(result.data.processingTime).toBeGreaterThan(0);
      }
    });

    test('should process multiple primitive nodes', async () => {
      const nodes: ASTNode[] = [
        { type: 'cube', size: [1, 1, 1] } as CubeNode,
        { type: 'sphere', r: 0.5 } as any
      ];

      const result = await pipelineService.processNodes(nodes);

      expect(result.success).toBe(true);
      if (result.success) {
        // Multiple separate primitive nodes are processed individually
        expect(result.data.geometries).toHaveLength(2);
        expect(result.data.metadata.nodeCount).toBe(2);
        expect(result.data.operationsPerformed).toContain('primitive_creation');
      }
    });
  });

  describe('Transformation Processing', () => {
    test('should process transformation nodes through pipeline', async () => {
      const translateNode: TranslateNode = {
        type: 'translate',
        v: [1, 2, 3],
        children: [{
          type: 'cube',
          size: [1, 1, 1]
        } as CubeNode]
      };

      const result = await pipelineService.processNodes([translateNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.geometries).toHaveLength(1);
        expect(result.data.operationsPerformed).toContain('transformation');
        expect(result.data.manifoldness).toBe(true);
      }
    });
  });

  describe('CSG Operations Processing', () => {
    test('should process CSG operations through pipeline', async () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          { type: 'cube', size: [1, 1, 1] } as CubeNode,
          { type: 'sphere', r: 0.7 } as any
        ]
      };

      const result = await pipelineService.processNodes([unionNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.geometries).toHaveLength(1);
        expect(result.data.operationsPerformed).toContain('csg_operations');
        expect(result.data.manifoldness).toBe(true);
      }
    });
  });

  describe('Complex Pipeline Operations', () => {
    test('should handle nested transformations and CSG operations', async () => {
      const complexNode: TranslateNode = {
        type: 'translate',
        v: [2, 0, 0],
        children: [{
          type: 'union',
          children: [
            { type: 'cube', size: [1, 1, 1] } as CubeNode,
            { type: 'sphere', r: 0.5 } as any
          ]
        } as UnionNode]
      };

      const result = await pipelineService.processNodes([complexNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.geometries).toHaveLength(1);
        expect(result.data.operationsPerformed).toContain('primitive_creation');
        expect(result.data.operationsPerformed).toContain('transformation');
        expect(result.data.operationsPerformed).toContain('csg_operations');
        expect(result.data.manifoldness).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid AST nodes', async () => {
      const invalidNodes = [null, undefined, { type: 'invalid' }] as any[];

      const result = await pipelineService.processNodes(invalidNodes);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid AST node');
    });

    test('should handle empty node array', async () => {
      const result = await pipelineService.processNodes([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one AST node is required');
    });

    test('should handle pipeline not initialized', async () => {
      const uninitializedPipeline = new ManifoldPipelineService({
        primitiveProcessor: new ManifoldPrimitiveProcessor(),
        transformationProcessor: new ManifoldTransformationProcessor(),
        csgProcessor: new ManifoldCSGProcessor()
      });

      const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };
      const result = await uninitializedPipeline.processNodes([cubeNode]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not initialized');
    });
  });

  describe('Performance and Memory Management', () => {
    test('should track processing time for performance monitoring', async () => {
      const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };

      const startTime = performance.now();
      const result = await pipelineService.processNodes([cubeNode]);
      const actualTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processingTime).toBeGreaterThan(0);
        expect(result.data.processingTime).toBeLessThanOrEqual(actualTime + 10); // Allow small margin
      }
    });

    test('should manage memory resources properly', async () => {
      const initialStats = getMemoryStats();
      const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };

      const result = await pipelineService.processNodes([cubeNode]);

      expect(result.success).toBe(true);
      const afterStats = getMemoryStats();
      expect(afterStats.activeResources).toBeGreaterThanOrEqual(initialStats.activeResources);
    });

    test('should clean up resources on disposal', async () => {
      const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };
      await pipelineService.processNodes([cubeNode]);

      const beforeDisposeStats = getMemoryStats();
      pipelineService.dispose();

      // Memory should be reduced after disposal
      const afterDisposeStats = getMemoryStats();
      expect(afterDisposeStats.activeResources).toBeLessThanOrEqual(beforeDisposeStats.activeResources);
    });
  });

  describe('Pipeline Metadata', () => {
    test('should provide comprehensive pipeline metadata', async () => {
      const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };

      const result = await pipelineService.processNodes([cubeNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata.nodeCount).toBe(1);
        expect(result.data.metadata.pipelineVersion).toBe('1.0.0');
        expect(result.data.metadata.timestamp).toBeInstanceOf(Date);
        expect(result.data.operationsPerformed).toBeInstanceOf(Array);
        expect(result.data.operationsPerformed.length).toBeGreaterThan(0);
      }
    });
  });
});
