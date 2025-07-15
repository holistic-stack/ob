/**
 * @file Primitive BabylonJS Node Tests
 *
 * Tests for the PrimitiveBabylonNode implementation following TDD principles.
 * Uses real OpenSCAD parser instances and BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { CubeNode, CylinderNode, SphereNode } from '../../../openscad-parser/ast/ast-types';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import { PrimitiveBabylonNode } from './primitive-babylon-node';

describe('PrimitiveBabylonNode', () => {
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

  describe('Cube Primitive', () => {
    it('should create cube mesh with default parameters', async () => {
      const openscadCode = 'cube();';
      const ast = parser.parseAST(openscadCode);

      expect(ast).toBeDefined();
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);

      const cubeNode = ast[0] as CubeNode;
      expect(cubeNode).toBeDefined();
      expect(cubeNode.type).toBe('cube');

      const primitiveNode = new PrimitiveBabylonNode('test_cube', scene, cubeNode);

      const result = await primitiveNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_cube');
        expect(mesh.metadata?.isPrimitive).toBe(true);
        expect(mesh.metadata?.primitiveType).toBe('cube');
      }
    });

    it('should create cube mesh with size array [2, 3, 4]', async () => {
      const openscadCode = 'cube([2, 3, 4]);';
      const ast = parser.parseAST(openscadCode);
      const cubeNode = ast[0] as CubeNode;

      const primitiveNode = new PrimitiveBabylonNode('test_cube_sized', scene, cubeNode);

      const result = await primitiveNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.parameters).toBeDefined();

        // Verify the mesh has correct scaling
        // Note: BabylonJS CreateBox uses width/height/depth parameters
        expect(mesh.scaling.x).toBeCloseTo(1); // BabylonJS handles size in creation
      }
    });

    it('should create cube mesh with center=true', async () => {
      const openscadCode = 'cube([2, 2, 2], center=true);';
      const ast = parser.parseAST(openscadCode);
      const cubeNode = ast[0] as CubeNode;

      const primitiveNode = new PrimitiveBabylonNode('test_cube_centered', scene, cubeNode);

      const result = await primitiveNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();

        // When center=true, cube should be centered at origin
        expect(mesh.position.x).toBeCloseTo(0);
        expect(mesh.position.y).toBeCloseTo(0);
        expect(mesh.position.z).toBeCloseTo(0);
      }
    });

    it('should create cube mesh with center=false (default)', async () => {
      const openscadCode = 'cube([2, 2, 2], center=false);';
      const ast = parser.parseAST(openscadCode);
      const cubeNode = ast[0] as CubeNode;

      const primitiveNode = new PrimitiveBabylonNode('test_cube_not_centered', scene, cubeNode);

      const result = await primitiveNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();

        // When center=false, cube should be positioned with corner at origin
        expect(mesh.position.x).toBeCloseTo(1); // size/2
        expect(mesh.position.y).toBeCloseTo(1); // size/2
        expect(mesh.position.z).toBeCloseTo(1); // size/2
      }
    });
  });

  describe('Sphere Primitive', () => {
    it('should create sphere mesh with radius parameter', async () => {
      const openscadCode = 'sphere(r=5);';
      const ast = parser.parseAST(openscadCode);
      const sphereNode = ast[0] as SphereNode;

      const primitiveNode = new PrimitiveBabylonNode('test_sphere', scene, sphereNode);

      const result = await primitiveNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_sphere');
        expect(mesh.metadata?.isPrimitive).toBe(true);
        expect(mesh.metadata?.primitiveType).toBe('sphere');
      }
    });

    it('should create sphere mesh with diameter parameter', async () => {
      const openscadCode = 'sphere(d=10);';
      const ast = parser.parseAST(openscadCode);
      const sphereNode = ast[0] as SphereNode;

      const primitiveNode = new PrimitiveBabylonNode('test_sphere_diameter', scene, sphereNode);

      const result = await primitiveNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.parameters).toBeDefined();
      }
    });
  });

  describe('Cylinder Primitive', () => {
    it('should create cylinder mesh with height and radius', async () => {
      const openscadCode = 'cylinder(h=10, r=2);';
      const ast = parser.parseAST(openscadCode);
      const cylinderNode = ast[0] as CylinderNode;

      const primitiveNode = new PrimitiveBabylonNode('test_cylinder', scene, cylinderNode);

      const result = await primitiveNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_cylinder');
        expect(mesh.metadata?.isPrimitive).toBe(true);
        expect(mesh.metadata?.primitiveType).toBe('cylinder');
      }
    });

    it('should create cylinder mesh with center=false (default)', async () => {
      const openscadCode = 'cylinder(h=4, r=1, center=false);';
      const ast = parser.parseAST(openscadCode);
      const cylinderNode = ast[0] as CylinderNode;

      const primitiveNode = new PrimitiveBabylonNode(
        'test_cylinder_not_centered',
        scene,
        cylinderNode
      );

      const result = await primitiveNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();

        // When center=false, cylinder base should be at z=0
        expect(mesh.position.z).toBeCloseTo(2); // height/2
      }
    });
  });

  describe('Node Validation', () => {
    it('should validate cube node successfully', async () => {
      const openscadCode = 'cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const cubeNode = ast[0] as CubeNode;

      const primitiveNode = new PrimitiveBabylonNode('test_cube_validation', scene, cubeNode);

      const validationResult = primitiveNode.validateNode();
      expect(validationResult.success).toBe(true);
    });

    it('should fail validation with empty name', async () => {
      const openscadCode = 'sphere(r=1);';
      const ast = parser.parseAST(openscadCode);
      const sphereNode = ast[0] as SphereNode;

      const primitiveNode = new PrimitiveBabylonNode(
        '', // Empty name
        scene,
        sphereNode
      );

      const validationResult = primitiveNode.validateNode();
      expect(validationResult.success).toBe(false);
      if (!validationResult.success) {
        expect(validationResult.error.code).toBe('VALIDATION_FAILED');
        // The error message should indicate validation failure
        expect(validationResult.error.message).toContain('Node validation failed');
      }
    });
  });

  describe('Node Cloning', () => {
    it('should clone primitive node successfully', async () => {
      const openscadCode = 'cube([2, 2, 2]);';
      const ast = parser.parseAST(openscadCode);
      const cubeNode = ast[0] as CubeNode;

      const originalNode = new PrimitiveBabylonNode('original_cube', scene, cubeNode);

      const clonedNode = originalNode.clone();

      expect(clonedNode).toBeDefined();
      expect(clonedNode.name).toContain('original_cube_clone_');
      expect(clonedNode.nodeType).toBe(originalNode.nodeType);
      expect(clonedNode.originalOpenscadNode).toBe(originalNode.originalOpenscadNode);
    });
  });

  describe('Error Handling', () => {
    it('should handle mesh generation without scene', async () => {
      const openscadCode = 'cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);
      const cubeNode = ast[0] as CubeNode;

      const primitiveNode = new PrimitiveBabylonNode(
        'test_cube_no_scene',
        null, // No scene
        cubeNode
      );

      const result = await primitiveNode.generateMesh();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MESH_GENERATION_FAILED');
        // The error message should contain information about the failure
        expect(result.error.message).toContain('Failed to generate cube mesh');
      }
    });
  });

  describe('Debug Information', () => {
    it('should provide comprehensive debug information', async () => {
      const openscadCode = 'sphere(r=3);';
      const ast = parser.parseAST(openscadCode);
      const sphereNode = ast[0] as SphereNode;

      const primitiveNode = new PrimitiveBabylonNode('debug_sphere', scene, sphereNode);

      const debugInfo = primitiveNode.getDebugInfo();

      expect(debugInfo).toBeDefined();
      expect(debugInfo.isPrimitive).toBe(true);
      expect(debugInfo.primitiveType).toBe('sphere');
      expect(debugInfo.parameters).toBeDefined();
      expect(debugInfo.name).toBe('debug_sphere');
    });
  });
});
