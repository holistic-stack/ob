/**
 * @file Extrusion BabylonJS Node Tests
 *
 * Tests for the ExtrusionBabylonNode implementation following TDD principles.
 * Uses real OpenSCAD parser instances and BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import type { LinearExtrudeNode, RotateExtrudeNode } from '../../../openscad-parser/ast/ast-types';
import { ExtrusionBabylonNode } from './extrusion-babylon-node';
import { PrimitiveBabylonNode } from './primitive-babylon-node';

describe('ExtrusionBabylonNode', () => {
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

  describe('Linear Extrude Operation', () => {
    it('should create linear extrude operation with height parameter', async () => {
      const openscadCode = 'linear_extrude(height=10) { circle(r=5); }';
      const ast = parser.parseAST(openscadCode);
      
      expect(ast).toBeDefined();
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);
      
      const linearExtrudeNode = ast[0] as LinearExtrudeNode;
      expect(linearExtrudeNode).toBeDefined();
      expect(linearExtrudeNode.type).toBe('linear_extrude');

      // Create child nodes for the extrusion
      const circleCode = 'circle(r=5);';
      const circleAst = parser.parseAST(circleCode);
      expect(circleAst.length).toBeGreaterThan(0);
      const circleNode = new PrimitiveBabylonNode('child_circle', scene, circleAst[0]!);

      const extrusionNode = new ExtrusionBabylonNode(
        'test_linear_extrude',
        scene,
        linearExtrudeNode,
        [circleNode]
      );

      const result = await extrusionNode.generateMesh();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_linear_extrude');
        expect(mesh.metadata?.isExtrusion).toBe(true);
        expect(mesh.metadata?.extrusionType).toBe('linear_extrude');
        expect(mesh.metadata?.childCount).toBe(1);
      }
    });

    it('should handle linear extrude with center parameter', async () => {
      const openscadCode = 'linear_extrude(height=5, center=true) { square(10); }';
      const ast = parser.parseAST(openscadCode);
      const linearExtrudeNode = ast[0] as LinearExtrudeNode;

      // Create child node
      const squareCode = 'square(10);';
      const squareAst = parser.parseAST(squareCode);
      expect(squareAst.length).toBeGreaterThan(0);
      const squareNode = new PrimitiveBabylonNode('child_square', scene, squareAst[0]!);

      const extrusionNode = new ExtrusionBabylonNode(
        'test_linear_extrude_center',
        scene,
        linearExtrudeNode,
        [squareNode]
      );

      const result = await extrusionNode.generateMesh();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.extrusionType).toBe('linear_extrude');
        expect(mesh.metadata?.parameters).toBeDefined();
      }
    });

    it('should handle linear extrude with twist parameter', async () => {
      const openscadCode = 'linear_extrude(height=20, twist=90) { circle(r=3); }';
      const ast = parser.parseAST(openscadCode);
      const linearExtrudeNode = ast[0] as LinearExtrudeNode;

      // Create child node
      const circleCode = 'circle(r=3);';
      const circleAst = parser.parseAST(circleCode);
      expect(circleAst.length).toBeGreaterThan(0);
      const circleNode = new PrimitiveBabylonNode('child_circle', scene, circleAst[0]!);

      const extrusionNode = new ExtrusionBabylonNode(
        'test_linear_extrude_twist',
        scene,
        linearExtrudeNode,
        [circleNode]
      );

      const result = await extrusionNode.generateMesh();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.extrusionType).toBe('linear_extrude');
      }
    });
  });

  describe('Rotate Extrude Operation', () => {
    it('should create rotate extrude operation with default angle', async () => {
      const openscadCode = 'rotate_extrude() { translate([10,0,0]) circle(r=2); }';
      const ast = parser.parseAST(openscadCode);
      const rotateExtrudeNode = ast[0] as RotateExtrudeNode;

      // Create child nodes
      const translateCode = 'translate([10,0,0]) circle(r=2);';
      const translateAst = parser.parseAST(translateCode);
      expect(translateAst.length).toBeGreaterThan(0);
      const translateNode = new PrimitiveBabylonNode('child_translate', scene, translateAst[0]!);

      const extrusionNode = new ExtrusionBabylonNode(
        'test_rotate_extrude',
        scene,
        rotateExtrudeNode,
        [translateNode]
      );

      const result = await extrusionNode.generateMesh();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_rotate_extrude');
        expect(mesh.metadata?.isExtrusion).toBe(true);
        expect(mesh.metadata?.extrusionType).toBe('rotate_extrude');
      }
    });

    it('should handle rotate extrude with angle parameter', async () => {
      const openscadCode = 'rotate_extrude(angle=180) { translate([5,0,0]) square([2,10]); }';
      const ast = parser.parseAST(openscadCode);
      const rotateExtrudeNode = ast[0] as RotateExtrudeNode;

      // Create child node
      const translateCode = 'translate([5,0,0]) square([2,10]);';
      const translateAst = parser.parseAST(translateCode);
      expect(translateAst.length).toBeGreaterThan(0);
      const translateNode = new PrimitiveBabylonNode('child_translate', scene, translateAst[0]!);

      const extrusionNode = new ExtrusionBabylonNode(
        'test_rotate_extrude_angle',
        scene,
        rotateExtrudeNode,
        [translateNode]
      );

      const result = await extrusionNode.generateMesh();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.extrusionType).toBe('rotate_extrude');
        expect(mesh.metadata?.parameters).toBeDefined();
      }
    });

    it('should handle rotate extrude with fragment parameters', async () => {
      const openscadCode = 'rotate_extrude($fn=32) { translate([8,0,0]) circle(r=1); }';
      const ast = parser.parseAST(openscadCode);
      const rotateExtrudeNode = ast[0] as RotateExtrudeNode;

      // Create child node
      const translateCode = 'translate([8,0,0]) circle(r=1);';
      const translateAst = parser.parseAST(translateCode);
      expect(translateAst.length).toBeGreaterThan(0);
      const translateNode = new PrimitiveBabylonNode('child_translate', scene, translateAst[0]!);

      const extrusionNode = new ExtrusionBabylonNode(
        'test_rotate_extrude_fn',
        scene,
        rotateExtrudeNode,
        [translateNode]
      );

      const result = await extrusionNode.generateMesh();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.extrusionType).toBe('rotate_extrude');
      }
    });
  });

  describe('Node Validation', () => {
    it('should validate extrusion node successfully with valid parameters', async () => {
      const openscadCode = 'linear_extrude(height=10) { circle(r=5); }';
      const ast = parser.parseAST(openscadCode);
      const linearExtrudeNode = ast[0] as LinearExtrudeNode;

      // Create child node
      const circleCode = 'circle(r=5);';
      const circleAst = parser.parseAST(circleCode);
      expect(circleAst.length).toBeGreaterThan(0);
      const circleNode = new PrimitiveBabylonNode('child_circle', scene, circleAst[0]!);

      const extrusionNode = new ExtrusionBabylonNode(
        'test_linear_extrude_validation',
        scene,
        linearExtrudeNode,
        [circleNode]
      );

      const validationResult = extrusionNode.validateNode();
      expect(validationResult.success).toBe(true);
    });

    it('should fail validation with no children', async () => {
      const openscadCode = 'linear_extrude(height=10) { }';
      const ast = parser.parseAST(openscadCode);
      const linearExtrudeNode = ast[0] as LinearExtrudeNode;

      const extrusionNode = new ExtrusionBabylonNode(
        'test_linear_extrude_no_children',
        scene,
        linearExtrudeNode,
        [] // No children
      );

      const validationResult = extrusionNode.validateNode();
      expect(validationResult.success).toBe(false);
      if (!validationResult.success) {
        expect(validationResult.error.code).toBe('VALIDATION_FAILED');
        expect(validationResult.error.message).toContain('Node validation failed');
      }
    });

    it('should fail validation with empty name', async () => {
      const openscadCode = 'rotate_extrude() { circle(r=5); }';
      const ast = parser.parseAST(openscadCode);
      const rotateExtrudeNode = ast[0] as RotateExtrudeNode;

      const extrusionNode = new ExtrusionBabylonNode(
        '', // Empty name
        scene,
        rotateExtrudeNode,
        []
      );

      const validationResult = extrusionNode.validateNode();
      expect(validationResult.success).toBe(false);
      if (!validationResult.success) {
        expect(validationResult.error.code).toBe('VALIDATION_FAILED');
        expect(validationResult.error.message).toContain('Node validation failed');
      }
    });
  });

  describe('Node Cloning', () => {
    it('should clone extrusion node successfully', async () => {
      const openscadCode = 'linear_extrude(height=15) { square(5); }';
      const ast = parser.parseAST(openscadCode);
      const linearExtrudeNode = ast[0] as LinearExtrudeNode;

      // Create child node
      const squareCode = 'square(5);';
      const squareAst = parser.parseAST(squareCode);
      expect(squareAst.length).toBeGreaterThan(0);
      const squareNode = new PrimitiveBabylonNode('child_square', scene, squareAst[0]!);

      const originalNode = new ExtrusionBabylonNode(
        'original_linear_extrude',
        scene,
        linearExtrudeNode,
        [squareNode]
      );

      const clonedNode = originalNode.clone();
      
      expect(clonedNode).toBeDefined();
      expect(clonedNode.name).toContain('original_linear_extrude_clone_');
      expect(clonedNode.nodeType).toBe(originalNode.nodeType);
      expect(clonedNode.originalOpenscadNode).toBe(originalNode.originalOpenscadNode);
    });
  });

  describe('Error Handling', () => {
    it('should handle mesh generation without scene', async () => {
      const openscadCode = 'linear_extrude(height=10) { circle(r=5); }';
      const ast = parser.parseAST(openscadCode);
      const linearExtrudeNode = ast[0] as LinearExtrudeNode;

      const extrusionNode = new ExtrusionBabylonNode(
        'test_linear_extrude_no_scene',
        null, // No scene
        linearExtrudeNode,
        []
      );

      const result = await extrusionNode.generateMesh();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MESH_GENERATION_FAILED');
        expect(result.error.message).toContain('Failed to generate linear_extrude extrusion');
      }
    });
  });

  describe('Debug Information', () => {
    it('should provide comprehensive debug information', async () => {
      const openscadCode = 'rotate_extrude(angle=270) { translate([6,0,0]) circle(r=2); }';
      const ast = parser.parseAST(openscadCode);
      const rotateExtrudeNode = ast[0] as RotateExtrudeNode;

      // Create child node
      const translateCode = 'translate([6,0,0]) circle(r=2);';
      const translateAst = parser.parseAST(translateCode);
      expect(translateAst.length).toBeGreaterThan(0);
      const translateNode = new PrimitiveBabylonNode('child_translate', scene, translateAst[0]!);

      const extrusionNode = new ExtrusionBabylonNode(
        'debug_rotate_extrude',
        scene,
        rotateExtrudeNode,
        [translateNode]
      );

      const debugInfo = extrusionNode.getDebugInfo();
      
      expect(debugInfo).toBeDefined();
      expect(debugInfo.isExtrusion).toBe(true);
      expect(debugInfo.extrusionType).toBe('rotate_extrude');
      expect(debugInfo.parameters).toBeDefined();
      expect(debugInfo.childCount).toBe(1);
      expect(debugInfo.name).toBe('debug_rotate_extrude');
    });
  });
});
