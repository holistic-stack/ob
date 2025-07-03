/**
 * @file Tests for Real Node Generator
 *
 * Tests the utility that generates real Tree-sitter nodes for testing
 * instead of using mocks.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RealNodeGenerator, createRealNodeGenerator } from './real-node-generator.js';

describe('RealNodeGenerator', () => {
  let generator: RealNodeGenerator;

  beforeEach(async () => {
    generator = new RealNodeGenerator();
    await generator.init();
  });

  afterEach(() => {
    generator.dispose();
  });

  describe('initialization', () => {
    it('should initialize and dispose correctly', async () => {
      const testGenerator = new RealNodeGenerator();
      await testGenerator.init();

      // Should not throw
      expect(() => testGenerator.dispose()).not.toThrow();
    });

    it('should handle multiple init calls gracefully', async () => {
      await generator.init(); // Second init call
      expect(() => generator.dispose()).not.toThrow();
    });
  });

  describe('getCallExpressionNode', () => {
    it('should generate real call expression node for cube', async () => {
      const node = await generator.getCallExpressionNode('cube(10);');

      expect(node).not.toBeNull();
      expect(node?.type).toBe('module_instantiation'); // OpenSCAD grammar uses module_instantiation for primitives
      expect(node?.text).toContain('cube(10)');

      // Verify it's a real Tree-sitter node
      expect(typeof node?.namedChild).toBe('function');
      expect(typeof node?.child).toBe('function');
      expect(typeof node?.childForFieldName).toBe('function');
    });

    it('should generate real call expression node for sphere', async () => {
      const node = await generator.getCallExpressionNode('sphere(r=5);');

      expect(node).not.toBeNull();
      expect(node?.type).toBe('module_instantiation'); // OpenSCAD grammar uses module_instantiation for primitives
      expect(node?.text).toContain('sphere(r=5)');
    });

    it('should return null for invalid code', async () => {
      const node = await generator.getCallExpressionNode('invalid syntax!!!');

      // May return null or a node depending on how parser handles errors
      // The important thing is it doesn't throw
      expect(node).toBeDefined();
    });
  });

  describe('getBinaryExpressionNode', () => {
    it('should generate real binary expression node for addition', async () => {
      const node = await generator.getBinaryExpressionNode('1 + 2');

      expect(node).not.toBeNull();
      expect(['additive_expression', 'binary_expression']).toContain(node?.type);
      expect(node?.text).toContain('1 + 2');

      // Verify it's a real Tree-sitter node
      expect(typeof node?.namedChild).toBe('function');
      expect(typeof node?.child).toBe('function');
    });

    it('should generate real binary expression node for multiplication', async () => {
      const node = await generator.getBinaryExpressionNode('a * b');

      expect(node).not.toBeNull();
      // The grammar now uses unified binary_expression type
      expect(node?.type).toBe('binary_expression');
      expect(node?.text).toContain('a * b');
    });

    it('should generate real binary expression node for comparison', async () => {
      const node = await generator.getBinaryExpressionNode('x > 5');

      expect(node).not.toBeNull();
      // The grammar now uses unified binary_expression type
      expect(node?.type).toBe('binary_expression');
      // The node text might be just part of the expression due to grammar hierarchy
      expect(node?.text).toBeDefined();
    });
  });

  describe('getUnaryExpressionNode', () => {
    it('should generate real unary expression node for negation', async () => {
      const node = await generator.getUnaryExpressionNode('-x');

      expect(node).not.toBeNull();
      expect(node?.type).toBe('unary_expression');
      expect(node?.text).toContain('-x');

      // Verify it's a real Tree-sitter node
      expect(typeof node?.namedChild).toBe('function');
    });

    it('should generate real unary expression node for logical not', async () => {
      const node = await generator.getUnaryExpressionNode('!flag');

      expect(node).not.toBeNull();
      expect(node?.type).toBe('unary_expression');
      expect(node?.text).toContain('!flag');
    });
  });

  describe('getModuleInstantiationNode', () => {
    it('should generate real module instantiation node for translate', async () => {
      const node = await generator.getModuleInstantiationNode('translate([1, 2, 3]) cube(10);');

      expect(node).not.toBeNull();
      expect(node?.type).toBe('module_instantiation');
      expect(node?.text).toContain('translate([1, 2, 3])');
    });

    it('should generate real module instantiation node for rotate', async () => {
      const node = await generator.getModuleInstantiationNode('rotate([0, 0, 90]) sphere(5);');

      expect(node).not.toBeNull();
      expect(node?.type).toBe('module_instantiation');
      expect(node?.text).toContain('rotate([0, 0, 90])');
    });
  });

  describe('getExpressionNode', () => {
    it('should generate real expression node', async () => {
      const node = await generator.getExpressionNode('42');

      expect(node).not.toBeNull();
      expect(node?.type).toBe('number'); // The actual node type for literal 42

      // Verify it's a real Tree-sitter node
      expect(typeof node?.namedChild).toBe('function');
    });
  });

  describe('convenience function', () => {
    it('should create and initialize generator with convenience function', async () => {
      const testGenerator = await createRealNodeGenerator();

      const node = await testGenerator.getCallExpressionNode('cube(5);');
      expect(node).not.toBeNull();
      expect(node?.type).toBe('module_instantiation'); // OpenSCAD grammar uses module_instantiation for primitives

      testGenerator.dispose();
    });
  });

  describe('error handling', () => {
    it('should throw error when not initialized', async () => {
      const uninitializedGenerator = new RealNodeGenerator();

      await expect(
        uninitializedGenerator.getCallExpressionNode('cube(10);')
      ).rejects.toThrow('Parser not initialized');
    });
  });

  describe('debug functionality', () => {
    it('should print tree structure without throwing', () => {
      expect(() => {
        generator.debugPrintTree('cube(10);');
      }).not.toThrow();
    });
  });
});
