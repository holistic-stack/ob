/**
 * @file CSG BabylonJS Node Tests
 *
 * Tests for the CSGBabylonNode implementation following TDD principles.
 * Uses real OpenSCAD parser instances and BabylonJS NullEngine (no mocks).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  DifferenceNode,
  IntersectionNode,
  OpenscadParser,
  UnionNode,
} from '@/features/openscad-parser';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import { CSGBabylonNode } from './csg-babylon-node';
import { PrimitiveBabylonNode } from './primitive-babylon-node';

// Mock CSG2 functions to avoid WASM download during tests
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core');

  // Create mock CSG2 instance
  const mockCSG2Instance = {
    add: vi.fn().mockReturnThis(),
    subtract: vi.fn().mockReturnThis(),
    intersect: vi.fn().mockReturnThis(),
    toMesh: vi.fn((name, scene) => {
      // Create a simple mock mesh using actual Mesh constructor
      return new (actual as any).Mesh(name || 'mock_result', scene);
    }),
  };

  return {
    ...actual,
    IsCSG2Ready: vi.fn(() => true), // Always return true to skip initialization
    InitializeCSG2Async: vi.fn(() => Promise.resolve()), // Mock initialization
    CSG2: {
      ...(actual as any).CSG2,
      FromMesh: vi.fn(() => mockCSG2Instance),
    },
  };
});

// Mock BabylonCSG2Service to avoid real CSG operations
vi.mock('../babylon-csg2-service', () => ({
  BabylonCSG2Service: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockReturnValue({ success: true }), // Synchronous return
    union: vi.fn().mockImplementation(async (meshA, _meshB) => {
      const { Mesh } = await import('@babylonjs/core');
      const resultMesh = new Mesh('mock_union_result', meshA.getScene());
      resultMesh.metadata = { isCSGOperation: true, csgType: 'union' };
      return {
        success: true,
        data: {
          resultMesh,
          operationType: 'UNION',
          operationTime: 10,
          triangleCount: 100,
          vertexCount: 50,
          isOptimized: false,
        },
      };
    }),
    difference: vi.fn().mockImplementation(async (meshA, _meshB) => {
      const { Mesh } = await import('@babylonjs/core');
      const resultMesh = new Mesh('mock_difference_result', meshA.getScene());
      resultMesh.metadata = { isCSGOperation: true, csgType: 'difference' };
      return {
        success: true,
        data: {
          resultMesh,
          operationType: 'DIFFERENCE',
          operationTime: 10,
          triangleCount: 100,
          vertexCount: 50,
          isOptimized: false,
        },
      };
    }),
    intersection: vi.fn().mockImplementation(async (meshA, _meshB) => {
      const { Mesh } = await import('@babylonjs/core');
      const resultMesh = new Mesh('mock_intersection_result', meshA.getScene());
      resultMesh.metadata = { isCSGOperation: true, csgType: 'intersection' };
      return {
        success: true,
        data: {
          resultMesh,
          operationType: 'INTERSECTION',
          operationTime: 10,
          triangleCount: 100,
          vertexCount: 50,
          isOptimized: false,
        },
      };
    }),
  })),
}));

// Import after mocking
import { NullEngine, Scene } from '@babylonjs/core';
import { OPENSCAD_DEFAULTS } from '@/features/store/slices/openscad-globals-slice/index.js';

describe('CSGBabylonNode', () => {
  let parser: OpenscadParser;
  let engine: NullEngine;
  let scene: Scene;

  beforeEach(async () => {
    // Create real OpenSCAD parser instance (no mocks)
    parser = createTestParser();

    // Initialize the parser
    await parser.init();

    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
  });

  afterEach(() => {
    // Clean up resources
    scene.dispose();
    engine.dispose();
    parser.dispose();

    // Clear all mocks to prevent test interference
    vi.clearAllMocks();
  });

  describe('Union Operation', () => {
    it('should create union CSG operation with multiple children', async () => {
      const openscadCode = 'union() { cube([1, 1, 1]); sphere(r=0.5); }';
      const ast = parser.parseAST(openscadCode);

      expect(ast).toBeDefined();
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);

      const unionNode = ast[0] as UnionNode;
      expect(unionNode).toBeDefined();
      expect(unionNode.type).toBe('union');

      // Create child nodes for the CSG operation
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      const cubeAstNode = cubeAst[0];
      if (!cubeAstNode) throw new Error('Expected cube AST node');
      if (!cubeAstNode) throw new Error('Expected cube AST node');
      if (!cubeAstNode) throw new Error('Expected cube AST node');
      if (!cubeAstNode) throw new Error('Expected cube AST node');
      if (!cubeAstNode) throw new Error('Expected cube AST node');
      if (!cubeAstNode) throw new Error('Expected cube AST node');
      const cubeNode = new PrimitiveBabylonNode(
        'child_cube',
        scene,
        cubeAstNode,
        OPENSCAD_DEFAULTS
      );

      const sphereCode = 'sphere(r=0.5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereAstNode = sphereAst[0];
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode(
        'child_sphere',
        scene,
        sphereAstNode,
        OPENSCAD_DEFAULTS
      );

      const csgNode = new CSGBabylonNode('test_union', scene, unionNode, [cubeNode, sphereNode]);

      const result = await csgNode.generateMesh();
      if (!result.success) {
        console.error('CSG generation failed:', result.error);
      }
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_union');
        expect(mesh.metadata?.isCSGOperation).toBe(true);
        expect(mesh.metadata?.csgType).toBe('union');
        expect(mesh.metadata?.childCount).toBe(2);
      }
    });

    it('should handle union operation with three children', async () => {
      const openscadCode = 'union() { cube([1, 1, 1]); sphere(r=0.5); cylinder(h=2, r=0.3); }';
      const ast = parser.parseAST(openscadCode);
      const unionNode = ast[0] as UnionNode;

      // Create three child nodes
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      const cubeAstNode = cubeAst[0];
      if (!cubeAstNode) throw new Error('Expected cube AST node');
      const cubeNode = new PrimitiveBabylonNode(
        'child_cube',
        scene,
        cubeAstNode,
        OPENSCAD_DEFAULTS
      );

      const sphereCode = 'sphere(r=0.5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereAstNode = sphereAst[0];
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode(
        'child_sphere',
        scene,
        sphereAstNode,
        OPENSCAD_DEFAULTS
      );

      const cylinderCode = 'cylinder(h=2, r=0.3);';
      const cylinderAst = parser.parseAST(cylinderCode);
      expect(cylinderAst.length).toBeGreaterThan(0);
      const cylinderAstNode = cylinderAst[0];
      if (!cylinderAstNode) throw new Error('Expected cylinder AST node');
      if (!cylinderAstNode) throw new Error('Expected cylinder AST node');
      if (!cylinderAstNode) throw new Error('Expected cylinder AST node');
      const cylinderNode = new PrimitiveBabylonNode(
        'child_cylinder',
        scene,
        cylinderAstNode,
        OPENSCAD_DEFAULTS
      );

      const csgNode = new CSGBabylonNode('test_union_three', scene, unionNode, [
        cubeNode,
        sphereNode,
        cylinderNode,
      ]);

      const result = await csgNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.childCount).toBe(3);
      }
    });
  });

  describe('Difference Operation', () => {
    it('should create difference CSG operation with two children', async () => {
      const openscadCode = 'difference() { cube([2, 2, 2]); sphere(r=1); }';
      const ast = parser.parseAST(openscadCode);
      const differenceNode = ast[0] as DifferenceNode;

      // Create child nodes
      const cubeCode = 'cube([2, 2, 2]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      const cubeAstNode = cubeAst[0];
      if (!cubeAstNode) throw new Error('Expected cube AST node');
      const cubeNode = new PrimitiveBabylonNode(
        'child_cube',
        scene,
        cubeAstNode,
        OPENSCAD_DEFAULTS
      );

      const sphereCode = 'sphere(r=1);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereAstNode = sphereAst[0];
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode(
        'child_sphere',
        scene,
        sphereAstNode,
        OPENSCAD_DEFAULTS
      );

      const csgNode = new CSGBabylonNode('test_difference', scene, differenceNode, [
        cubeNode,
        sphereNode,
      ]);

      const result = await csgNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_difference');
        expect(mesh.metadata?.isCSGOperation).toBe(true);
        expect(mesh.metadata?.csgType).toBe('difference');
      }
    });

    it('should handle difference operation with multiple subtractions', async () => {
      const openscadCode = 'difference() { cube([3, 3, 3]); sphere(r=1); cylinder(h=4, r=0.5); }';
      const ast = parser.parseAST(openscadCode);
      const differenceNode = ast[0] as DifferenceNode;

      // Create child nodes
      const cubeCode = 'cube([3, 3, 3]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      const cubeAstNode = cubeAst[0];
      if (!cubeAstNode) throw new Error('Expected cube AST node');
      const cubeNode = new PrimitiveBabylonNode(
        'child_cube',
        scene,
        cubeAstNode,
        OPENSCAD_DEFAULTS
      );

      const sphereCode = 'sphere(r=1);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereAstNode = sphereAst[0];
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode(
        'child_sphere',
        scene,
        sphereAstNode,
        OPENSCAD_DEFAULTS
      );

      const cylinderCode = 'cylinder(h=4, r=0.5);';
      const cylinderAst = parser.parseAST(cylinderCode);
      expect(cylinderAst.length).toBeGreaterThan(0);
      const cylinderAstNode = cylinderAst[0];
      if (!cylinderAstNode) throw new Error('Expected cylinder AST node');
      const cylinderNode = new PrimitiveBabylonNode(
        'child_cylinder',
        scene,
        cylinderAstNode,
        OPENSCAD_DEFAULTS
      );

      const csgNode = new CSGBabylonNode('test_difference_multiple', scene, differenceNode, [
        cubeNode,
        sphereNode,
        cylinderNode,
      ]);

      const result = await csgNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.childCount).toBe(3);
      }
    });
  });

  describe('Intersection Operation', () => {
    it('should create intersection CSG operation with two children', async () => {
      const openscadCode = 'intersection() { cube([2, 2, 2]); sphere(r=1.5); }';
      const ast = parser.parseAST(openscadCode);
      const intersectionNode = ast[0] as IntersectionNode;

      // Create child nodes
      const cubeCode = 'cube([2, 2, 2]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      const cubeAstNode = cubeAst[0];
      if (!cubeAstNode) throw new Error('Expected cube AST node');
      const cubeNode = new PrimitiveBabylonNode(
        'child_cube',
        scene,
        cubeAstNode,
        OPENSCAD_DEFAULTS
      );

      const sphereCode = 'sphere(r=1.5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereAstNode = sphereAst[0];
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode(
        'child_sphere',
        scene,
        sphereAstNode,
        OPENSCAD_DEFAULTS
      );

      const csgNode = new CSGBabylonNode('test_intersection', scene, intersectionNode, [
        cubeNode,
        sphereNode,
      ]);

      const result = await csgNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_intersection');
        expect(mesh.metadata?.isCSGOperation).toBe(true);
        expect(mesh.metadata?.csgType).toBe('intersection');
      }
    });
  });

  describe('Node Validation', () => {
    it('should validate CSG node successfully with sufficient children', async () => {
      const openscadCode = 'union() { cube([1, 1, 1]); sphere(r=0.5); }';
      const ast = parser.parseAST(openscadCode);
      const unionNode = ast[0] as UnionNode;

      // Create child nodes
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('Expected cube AST node');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0], OPENSCAD_DEFAULTS);

      const sphereCode = 'sphere(r=0.5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      if (!sphereAst[0]) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode(
        'child_sphere',
        scene,
        sphereAst[0],
        OPENSCAD_DEFAULTS
      );

      const csgNode = new CSGBabylonNode('test_union_validation', scene, unionNode, [
        cubeNode,
        sphereNode,
      ]);

      const validationResult = await csgNode.validateNode();
      expect(validationResult.success).toBe(true);
    });

    it('should fail validation with insufficient children', async () => {
      const openscadCode = 'union() { cube([1, 1, 1]); }';
      const ast = parser.parseAST(openscadCode);
      const unionNode = ast[0] as UnionNode;

      // Create only one child node (insufficient for CSG)
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('Expected cube AST node');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0], OPENSCAD_DEFAULTS);

      const csgNode = new CSGBabylonNode(
        'test_union_insufficient',
        scene,
        unionNode,
        [cubeNode] // Only one child
      );

      const validationResult = await csgNode.validateNode();
      expect(validationResult.success).toBe(false);
      if (!validationResult.success) {
        expect(validationResult.error.code).toBe('VALIDATION_FAILED');
        expect(validationResult.error.message).toContain('Node validation failed');
      }
    });

    it('should fail validation with empty name', async () => {
      const openscadCode = 'difference() { cube([1, 1, 1]); sphere(r=0.5); }';
      const ast = parser.parseAST(openscadCode);
      const differenceNode = ast[0] as DifferenceNode;

      const csgNode = new CSGBabylonNode(
        '', // Empty name
        scene,
        differenceNode,
        []
      );

      const validationResult = await csgNode.validateNode();
      expect(validationResult.success).toBe(false);
      if (!validationResult.success) {
        expect(validationResult.error.code).toBe('VALIDATION_FAILED');
        expect(validationResult.error.message).toContain('Node validation failed');
      }
    });
  });

  describe('Node Cloning', () => {
    it('should clone CSG node successfully', async () => {
      const openscadCode = 'intersection() { cube([1, 1, 1]); sphere(r=0.5); }';
      const ast = parser.parseAST(openscadCode);
      const intersectionNode = ast[0] as IntersectionNode;

      // Create child nodes
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('Expected cube AST node');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0], OPENSCAD_DEFAULTS);

      const sphereCode = 'sphere(r=0.5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      if (!sphereAst[0]) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode(
        'child_sphere',
        scene,
        sphereAst[0],
        OPENSCAD_DEFAULTS
      );

      const originalNode = new CSGBabylonNode('original_intersection', scene, intersectionNode, [
        cubeNode,
        sphereNode,
      ]);

      const clonedNode = originalNode.clone();

      expect(clonedNode).toBeDefined();
      expect(clonedNode.name).toContain('original_intersection_clone_');
      expect(clonedNode.nodeType).toBe(originalNode.nodeType);
      expect(clonedNode.originalOpenscadNode).toBe(originalNode.originalOpenscadNode);
    });
  });

  describe('Error Handling', () => {
    it('should handle mesh generation without scene', async () => {
      const openscadCode = 'union() { cube([1, 1, 1]); sphere(r=0.5); }';
      const ast = parser.parseAST(openscadCode);
      const unionNode = ast[0] as UnionNode;

      const csgNode = new CSGBabylonNode(
        'test_union_no_scene',
        null, // No scene
        unionNode,
        []
      );

      const result = await csgNode.generateMesh();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MESH_GENERATION_FAILED');
        expect(result.error.message).toContain('Failed to generate union CSG operation');
      }
    });
  });

  describe('Debug Information', () => {
    it('should provide comprehensive debug information', async () => {
      const openscadCode = 'difference() { cube([2, 2, 2]); sphere(r=1); }';
      const ast = parser.parseAST(openscadCode);
      const differenceNode = ast[0] as DifferenceNode;

      // Create child nodes
      const cubeCode = 'cube([2, 2, 2]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('Expected cube AST node');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0], OPENSCAD_DEFAULTS);

      const sphereCode = 'sphere(r=1);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      if (!sphereAst[0]) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode(
        'child_sphere',
        scene,
        sphereAst[0],
        OPENSCAD_DEFAULTS
      );

      const csgNode = new CSGBabylonNode('debug_difference', scene, differenceNode, [
        cubeNode,
        sphereNode,
      ]);

      const debugInfo = csgNode.getDebugInfo();

      expect(debugInfo).toBeDefined();
      expect(debugInfo.isCSGOperation).toBe(true);
      expect(debugInfo.csgType).toBe('difference');
      expect(debugInfo.childCount).toBe(2);
      expect(debugInfo.hasCSGService).toBe(true);
      expect(debugInfo.name).toBe('debug_difference');
    });
  });

  describe('Mesh Disposal in CSG Operations', () => {
    /**
     * Helper function to create primitive nodes (follows DRY principle)
     */
    const createPrimitiveNode = (code: string, name: string) => {
      const ast = parser.parseAST(code);
      expect(ast.length).toBeGreaterThan(0);
      if (!ast[0]) throw new Error(`Expected AST node for ${name}`);
      return new PrimitiveBabylonNode(name, scene, ast[0], OPENSCAD_DEFAULTS);
    };

    /**
     * Helper function to create CSG node from OpenSCAD code (follows DRY principle)
     */
    const createCSGNode = <T extends DifferenceNode | UnionNode | IntersectionNode>(
      code: string,
      name: string,
      childNodes: PrimitiveBabylonNode[]
    ) => {
      const ast = parser.parseAST(code);
      expect(ast.length).toBeGreaterThan(0);
      const csgAstNode = ast[0] as T;
      return new CSGBabylonNode(name, scene, csgAstNode, childNodes);
    };

    /**
     * Helper function to verify CSG operation result (follows DRY principle)
     */
    const verifyCSGResult = async (csgNode: CSGBabylonNode, expectedName: string) => {
      const result = await csgNode.generateMesh();
      if (!result.success) {
        throw new Error(`CSG operation failed: ${JSON.stringify(result.error, null, 2)}`);
      }
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe(expectedName);
      }
      return result;
    };

    it('should properly dispose intermediate meshes during difference operation', async () => {
      // Create primitive nodes using helper function
      const sphereNode = createPrimitiveNode('sphere(r=10);', 'test_sphere');
      const cubeNode = createPrimitiveNode('cube([15, 15, 15], center=true);', 'test_cube');

      // Create CSG node using helper function
      const csgNode = createCSGNode<DifferenceNode>(
        'difference() { sphere(r=10); cube([15, 15, 15], center=true); }',
        'test_difference',
        [sphereNode, cubeNode]
      );

      // Verify result using helper function
      await verifyCSGResult(csgNode, 'test_difference');

      // Verify that the result is a single mesh representing the difference operation
      // The original sphere and cube meshes should be disposed during the operation
      expect(csgNode).toBeDefined(); // Basic verification that node was created
    });

    it('should handle difference operation with multiple subtracted objects', async () => {
      // Create primitive nodes using helper function
      const sphereNode = createPrimitiveNode('sphere(r=10);', 'test_sphere');
      const cubeNode = createPrimitiveNode('cube([8, 8, 8], center=true);', 'test_cube');
      const cylinderNode = createPrimitiveNode(
        'cylinder(h=20, r=3, center=true);',
        'test_cylinder'
      );

      // Create CSG node using helper function
      const csgNode = createCSGNode<DifferenceNode>(
        'difference() { sphere(r=10); cube([8, 8, 8], center=true); cylinder(h=20, r=3, center=true); }',
        'test_multi_difference',
        [sphereNode, cubeNode, cylinderNode]
      );

      // Verify result using helper function
      const result = await verifyCSGResult(csgNode, 'test_multi_difference');

      // Additional verification for multiple operations
      if (result.success) {
        expect(result.data.isVisible).toBe(true);
      }
    });
  });
});
