/**
 * @file CSG BabylonJS Node Tests
 *
 * Tests for the CSGBabylonNode implementation following TDD principles.
 * Uses real OpenSCAD parser instances and BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type {
  DifferenceNode,
  IntersectionNode,
  UnionNode,
} from '../../../openscad-parser/ast/ast-types';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import { CSGBabylonNode } from './csg-babylon-node';
import { PrimitiveBabylonNode } from './primitive-babylon-node';

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
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAstNode);

      const sphereCode = 'sphere(r=0.5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereAstNode = sphereAst[0];
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode('child_sphere', scene, sphereAstNode);

      const csgNode = new CSGBabylonNode('test_union', scene, unionNode, [cubeNode, sphereNode]);

      const result = await csgNode.generateMesh();
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
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAstNode);

      const sphereCode = 'sphere(r=0.5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereAstNode = sphereAst[0];
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode('child_sphere', scene, sphereAstNode);

      const cylinderCode = 'cylinder(h=2, r=0.3);';
      const cylinderAst = parser.parseAST(cylinderCode);
      expect(cylinderAst.length).toBeGreaterThan(0);
      const cylinderAstNode = cylinderAst[0];
      if (!cylinderAstNode) throw new Error('Expected cylinder AST node');
      const cylinderNode = new PrimitiveBabylonNode('child_cylinder', scene, cylinderAstNode);

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
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAstNode);

      const sphereCode = 'sphere(r=1);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereAstNode = sphereAst[0];
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode('child_sphere', scene, sphereAstNode);

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
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAstNode);

      const sphereCode = 'sphere(r=1);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereAstNode = sphereAst[0];
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode('child_sphere', scene, sphereAstNode);

      const cylinderCode = 'cylinder(h=4, r=0.5);';
      const cylinderAst = parser.parseAST(cylinderCode);
      expect(cylinderAst.length).toBeGreaterThan(0);
      const cylinderAstNode = cylinderAst[0];
      if (!cylinderAstNode) throw new Error('Expected cylinder AST node');
      const cylinderNode = new PrimitiveBabylonNode('child_cylinder', scene, cylinderAstNode);

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
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAstNode);

      const sphereCode = 'sphere(r=1.5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereAstNode = sphereAst[0];
      if (!sphereAstNode) throw new Error('Expected sphere AST node');
      const sphereNode = new PrimitiveBabylonNode('child_sphere', scene, sphereAstNode);

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
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]!);

      const sphereCode = 'sphere(r=0.5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereNode = new PrimitiveBabylonNode('child_sphere', scene, sphereAst[0]!);

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
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]!);

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
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]!);

      const sphereCode = 'sphere(r=0.5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereNode = new PrimitiveBabylonNode('child_sphere', scene, sphereAst[0]!);

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
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]!);

      const sphereCode = 'sphere(r=1);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      const sphereNode = new PrimitiveBabylonNode('child_sphere', scene, sphereAst[0]!);

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
});
