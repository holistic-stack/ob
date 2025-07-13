/**
 * @file AST Tree Walker Test Suite
 * @description TDD test suite for AST tree walking and transformation application
 * Following project guidelines: real implementations, no mocks for core logic, Result<T,E> patterns
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ASTTreeWalker } from './ast-tree-walker';
import type { ASTNode, CubeNode, TranslateNode, UnionNode } from '../../../../openscad-parser/core/ast-types';
import type { Result } from '../../../../../shared/types/result.types';
import type { ManifoldPrimitive } from '../types/processor-types';
import { ManifoldPrimitiveProcessor } from '../processors/manifold-primitive-processor';
import { ManifoldTransformationProcessor } from '../processors/manifold-transformation-processor';
import { ManifoldCSGProcessor } from '../processors/manifold-csg-processor';
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

describe('ASTTreeWalker', () => {
  let treeWalker: ASTTreeWalker;
  let primitiveProcessor: ManifoldPrimitiveProcessor;
  let transformationProcessor: ManifoldTransformationProcessor;
  let csgProcessor: ManifoldCSGProcessor;

  beforeEach(async () => {
    // Clean up any existing resources before starting
    clearAllResources();
    
    // Create processors
    primitiveProcessor = new ManifoldPrimitiveProcessor();
    transformationProcessor = new ManifoldTransformationProcessor();
    csgProcessor = new ManifoldCSGProcessor();

    // Create tree walker with dependencies
    treeWalker = new ASTTreeWalker({
      primitiveProcessor,
      transformationProcessor,
      csgProcessor
    });

    // Initialize the tree walker
    const initResult = await treeWalker.initialize();
    if (!initResult.success) {
      console.error('Tree walker initialization failed:', initResult.error);
      throw new Error(`Failed to initialize tree walker: ${initResult.error}`);
    }
  });

  afterEach(async () => {
    if (treeWalker) {
      treeWalker.dispose();
    }
    // Clean up all resources after each test
    clearAllResources();
  });

  describe('Simple Primitive Processing', () => {
    test('should process single primitive node', async () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [1, 1, 1],
        center: false
      };

      const result = await treeWalker.walkAST(cubeNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].type).toBe('cube');
      }
    });

    test('should process multiple primitive nodes', async () => {
      const nodes: ASTNode[] = [
        { type: 'cube', size: [1, 1, 1] } as CubeNode,
        { type: 'sphere', r: 0.5 } as any
      ];

      const results = await Promise.all(nodes.map(node => treeWalker.walkAST(node)));

      expect(results.every(r => r.success)).toBe(true);
      expect(results).toHaveLength(2);
    });
  });

  describe('Transformation Processing', () => {
    test('should apply transformation to child primitive', async () => {
      const translateNode: TranslateNode = {
        type: 'translate',
        v: [2, 3, 4],
        children: [{
          type: 'cube',
          size: [1, 1, 1]
        } as CubeNode]
      };

      const result = await treeWalker.walkAST(translateNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].type).toBe('cube');
        // The primitive should have transformation applied
        expect(result.data[0].parameters).toHaveProperty('translation');
      }
    });

    test('should handle nested transformations', async () => {
      const nestedTransform: TranslateNode = {
        type: 'translate',
        v: [1, 0, 0],
        children: [{
          type: 'translate',
          v: [0, 1, 0],
          children: [{
            type: 'cube',
            size: [1, 1, 1]
          } as CubeNode]
        } as TranslateNode]
      };

      const result = await treeWalker.walkAST(nestedTransform);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].type).toBe('cube');
      }
    });
  });

  describe('CSG Operations Processing', () => {
    test('should process union operation with children', async () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          { type: 'cube', size: [1, 1, 1] } as CubeNode,
          { type: 'sphere', r: 0.7 } as any
        ]
      };

      const result = await treeWalker.walkAST(unionNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].type).toBe('union');
      }
    });

    test('should handle complex nested CSG and transformations', async () => {
      const complexNode: TranslateNode = {
        type: 'translate',
        v: [5, 0, 0],
        children: [{
          type: 'union',
          children: [
            { type: 'cube', size: [1, 1, 1] } as CubeNode,
            { type: 'sphere', r: 0.5 } as any
          ]
        } as UnionNode]
      };

      const result = await treeWalker.walkAST(complexNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        // Should be a union result with transformation applied
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid AST nodes', async () => {
      const invalidNode = { type: 'invalid' } as any;

      const result = await treeWalker.walkAST(invalidNode);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported node type');
    });

    test('should handle nodes with invalid children', async () => {
      const nodeWithInvalidChild: TranslateNode = {
        type: 'translate',
        v: [1, 1, 1],
        children: [{ type: 'invalid' } as any]
      };

      const result = await treeWalker.walkAST(nodeWithInvalidChild);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to process child node');
    });

    test('should handle tree walker not initialized', async () => {
      const uninitializedWalker = new ASTTreeWalker({
        primitiveProcessor: new ManifoldPrimitiveProcessor(),
        transformationProcessor: new ManifoldTransformationProcessor(),
        csgProcessor: new ManifoldCSGProcessor()
      });

      const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };
      const result = await uninitializedWalker.walkAST(cubeNode);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not initialized');
    });
  });

  describe('Memory Management', () => {
    test('should track resources during AST processing', async () => {
      const initialStats = getMemoryStats();
      const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };

      const result = await treeWalker.walkAST(cubeNode);

      expect(result.success).toBe(true);
      const afterStats = getMemoryStats();
      expect(afterStats.activeResources).toBeGreaterThanOrEqual(initialStats.activeResources);
    });

    test('should clean up resources on disposal', async () => {
      const cubeNode: CubeNode = { type: 'cube', size: [1, 1, 1] };
      await treeWalker.walkAST(cubeNode);

      const beforeDisposeStats = getMemoryStats();
      treeWalker.dispose();

      // Memory should be reduced after disposal
      const afterDisposeStats = getMemoryStats();
      expect(afterDisposeStats.activeResources).toBeLessThanOrEqual(beforeDisposeStats.activeResources);
    });
  });
});
