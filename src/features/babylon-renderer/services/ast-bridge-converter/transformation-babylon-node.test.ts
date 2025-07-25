/**
 * @file Transformation BabylonJS Node Tests
 *
 * Tests for the TransformationBabylonNode implementation following TDD principles.
 * Uses real OpenSCAD parser instances and BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type {
  ColorNode,
  RotateNode,
  ScaleNode,
  TranslateNode,
} from '../../../openscad-parser/ast/ast-types';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import { PrimitiveBabylonNode } from './primitive-babylon-node';
import { TransformationBabylonNode } from './transformation-babylon-node';

describe('TransformationBabylonNode', () => {
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

  describe('Translate Transformation', () => {
    it('should create translate transformation with vector parameter', async () => {
      const openscadCode = 'translate([10, 5, 2]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);

      expect(ast).toBeDefined();
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);

      const translateNode = ast[0] as TranslateNode;
      expect(translateNode).toBeDefined();
      expect(translateNode.type).toBe('translate');

      // Create a child cube node for the transformation
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('test_cube', scene, cubeAst[0]);

      const transformationNode = new TransformationBabylonNode(
        'test_translate',
        scene,
        translateNode,
        [cubeNode]
      );

      const result = await transformationNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_translate');
        expect(mesh.metadata?.isTransformation).toBe(true);
        expect(mesh.metadata?.transformationType).toBe('translate');
      }
    });

    it('should apply correct translation to child meshes', async () => {
      const openscadCode = 'translate([5, 0, 0]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const translateNode = ast[0] as TranslateNode;

      // Create child cube
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]);

      const transformationNode = new TransformationBabylonNode(
        'test_translate_position',
        scene,
        translateNode,
        [cubeNode]
      );

      const result = await transformationNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();

        // Check that translation was applied using parent-based transformation
        // With parent-based transformation, the parent should have the translation [5,0,0]
        // and the child mesh should maintain its original position
        if (mesh.parent && 'position' in mesh.parent) {
          expect((mesh.parent as any).position.x).toBeCloseTo(5);
          expect((mesh.parent as any).position.y).toBeCloseTo(0);
          expect((mesh.parent as any).position.z).toBeCloseTo(0);
        } else {
          // If no parent, the mesh itself should have the translation
          expect(mesh.position.x).toBeCloseTo(5);
          expect(mesh.position.y).toBeCloseTo(0);
          expect(mesh.position.z).toBeCloseTo(0);
        }
      }
    });
  });

  describe('Rotate Transformation', () => {
    it('should create rotate transformation with angle vector', async () => {
      const openscadCode = 'rotate([0, 0, 45]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const rotateNode = ast[0] as RotateNode;

      // Create child cube
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]);

      const transformationNode = new TransformationBabylonNode('test_rotate', scene, rotateNode, [
        cubeNode,
      ]);

      const result = await transformationNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.isTransformation).toBe(true);
        expect(mesh.metadata?.transformationType).toBe('rotate');
      }
    });

    it('should apply correct rotation to child meshes', async () => {
      const openscadCode = 'rotate([0, 0, 90]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const rotateNode = ast[0] as RotateNode;

      // Create child cube
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]);

      const transformationNode = new TransformationBabylonNode(
        'test_rotate_angle',
        scene,
        rotateNode,
        [cubeNode]
      );

      const result = await transformationNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();

        // Check that rotation was applied using parent-based transformation (90 degrees = π/2 radians)
        if (mesh.parent && 'rotation' in mesh.parent) {
          expect((mesh.parent as any).rotation.z).toBeCloseTo(Math.PI / 2, 2);
        } else {
          // If no parent, the mesh itself should have the rotation
          expect(mesh.rotation.z).toBeCloseTo(Math.PI / 2, 2);
        }
      }
    });
  });

  describe('Scale Transformation', () => {
    it('should create scale transformation with scale vector', async () => {
      const openscadCode = 'scale([2, 1, 0.5]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const scaleNode = ast[0] as ScaleNode;

      // Create child cube
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]);

      const transformationNode = new TransformationBabylonNode('test_scale', scene, scaleNode, [
        cubeNode,
      ]);

      const result = await transformationNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.isTransformation).toBe(true);
        expect(mesh.metadata?.transformationType).toBe('scale');
      }
    });

    it('should apply correct scaling to child meshes', async () => {
      const openscadCode = 'scale([2, 2, 2]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const scaleNode = ast[0] as ScaleNode;

      // Create child cube
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]);

      const transformationNode = new TransformationBabylonNode(
        'test_scale_factor',
        scene,
        scaleNode,
        [cubeNode]
      );

      const result = await transformationNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();

        // Check that scaling was applied
        expect(mesh.scaling.x).toBeCloseTo(2);
        expect(mesh.scaling.y).toBeCloseTo(2);
        expect(mesh.scaling.z).toBeCloseTo(2);
      }
    });
  });

  describe('Color Transformation', () => {
    it('should create color transformation with RGB values', async () => {
      const openscadCode = 'color([1, 0, 0]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const colorNode = ast[0] as ColorNode;

      // Create child cube
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]);

      const transformationNode = new TransformationBabylonNode('test_color', scene, colorNode, [
        cubeNode,
      ]);

      const result = await transformationNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.isTransformation).toBe(true);
        expect(mesh.metadata?.transformationType).toBe('color');
      }
    });

    it('should create color transformation with RGBA values', async () => {
      const openscadCode = 'color([0, 1, 0, 0.5]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const colorNode = ast[0] as ColorNode;

      // Create child cube
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]);

      const transformationNode = new TransformationBabylonNode(
        'test_color_alpha',
        scene,
        colorNode,
        [cubeNode]
      );

      const result = await transformationNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.childCount).toBe(1);
      }
    });
  });

  describe('Node Validation', () => {
    it('should validate transformation node successfully', async () => {
      const openscadCode = 'translate([1, 1, 1]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const translateNode = ast[0] as TranslateNode;

      const transformationNode = new TransformationBabylonNode(
        'test_translate_validation',
        scene,
        translateNode,
        []
      );

      const validationResult = transformationNode.validateNode();
      expect(validationResult.success).toBe(true);
    });

    it('should fail validation with empty name', async () => {
      const openscadCode = 'rotate([0, 0, 45]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const rotateNode = ast[0] as RotateNode;

      const transformationNode = new TransformationBabylonNode(
        '', // Empty name
        scene,
        rotateNode,
        []
      );

      const validationResult = transformationNode.validateNode();
      expect(validationResult.success).toBe(false);
      if (!validationResult.success) {
        expect(validationResult.error.code).toBe('VALIDATION_FAILED');
        expect(validationResult.error.message).toContain('Node validation failed');
      }
    });
  });

  describe('Node Cloning', () => {
    it('should clone transformation node successfully', async () => {
      const openscadCode = 'scale([2, 2, 2]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const scaleNode = ast[0] as ScaleNode;

      // Create child cube
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]);

      const originalNode = new TransformationBabylonNode('original_scale', scene, scaleNode, [
        cubeNode,
      ]);

      const clonedNode = originalNode.clone();

      expect(clonedNode).toBeDefined();
      expect(clonedNode.name).toContain('original_scale_clone_');
      expect(clonedNode.nodeType).toBe(originalNode.nodeType);
      expect(clonedNode.originalOpenscadNode).toBe(originalNode.originalOpenscadNode);
    });
  });

  describe('Error Handling', () => {
    it('should handle mesh generation without scene', async () => {
      const openscadCode = 'translate([1, 1, 1]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const translateNode = ast[0] as TranslateNode;

      const transformationNode = new TransformationBabylonNode(
        'test_translate_no_scene',
        null, // No scene
        translateNode,
        []
      );

      const result = await transformationNode.generateMesh();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MESH_GENERATION_FAILED');
        expect(result.error.message).toContain('Failed to generate translate transformation');
      }
    });
  });

  describe('Debug Information', () => {
    it('should provide comprehensive debug information', async () => {
      const openscadCode = 'rotate([45, 0, 0]) cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const rotateNode = ast[0] as RotateNode;

      // Create child cube
      const cubeCode = 'cube([1, 1, 1]);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0]!);

      const transformationNode = new TransformationBabylonNode('debug_rotate', scene, rotateNode, [
        cubeNode,
      ]);

      const debugInfo = transformationNode.getDebugInfo();

      expect(debugInfo).toBeDefined();
      expect(debugInfo.isTransformation).toBe(true);
      expect(debugInfo.transformationType).toBe('rotate');
      expect(debugInfo.parameters).toBeDefined();
      expect(debugInfo.childCount).toBe(1);
      expect(debugInfo.name).toBe('debug_rotate');
    });
  });
});
