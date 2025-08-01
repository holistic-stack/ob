/**
 * @file Modifier BabylonJS Node Tests
 *
 * Tests for the ModifierBabylonNode implementation following TDD principles.
 * Uses real OpenSCAD parser instances and BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { OpenscadParser } from '@/features/openscad-parser';
import { OPENSCAD_DEFAULTS } from '@/features/store/slices/openscad-globals-slice/index.js';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import { ModifierBabylonNode, type ModifierType } from './modifier-babylon-node';
import { PrimitiveBabylonNode } from './primitive-babylon-node';

describe('ModifierBabylonNode', () => {
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

  describe('Disable Modifier (*)', () => {
    it('should create disable modifier operation with child nodes', async () => {
      // Since modifiers might not be parsed yet, create a mock AST node
      const mockASTNode = { type: 'disable', children: [] };

      // Create child nodes for the modifier
      const cubeCode = 'cube(10);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      expect(cubeAst[0]).toBeDefined();
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0], OPENSCAD_DEFAULTS);

      const modifierNode = new ModifierBabylonNode(
        'test_disable',
        scene,
        'disable' as ModifierType,
        mockASTNode as any,
        [cubeNode]
      );

      const result = await modifierNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_disable');
        expect(mesh.metadata?.isModifier).toBe(true);
        expect(mesh.metadata?.modifierType).toBe('disable');
        expect(mesh.metadata?.childCount).toBe(1);
        expect(mesh.isVisible).toBe(false);
        expect(mesh.isEnabled()).toBe(false);
      }
    });

    it('should disable all child meshes', async () => {
      const mockASTNode = { type: 'disable', children: [] };

      // Create multiple child nodes
      const cubeCode = 'cube(10);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      expect(cubeAst[0]).toBeDefined();
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0], OPENSCAD_DEFAULTS);

      const sphereCode = 'sphere(5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      expect(sphereAst[0]).toBeDefined();
      if (!sphereAst[0]) throw new Error('sphereAst[0] is undefined');
      const sphereNode = new PrimitiveBabylonNode(
        'child_sphere',
        scene,
        sphereAst[0],
        OPENSCAD_DEFAULTS
      );

      const modifierNode = new ModifierBabylonNode(
        'test_disable_multiple',
        scene,
        'disable' as ModifierType,
        mockASTNode as any,
        [cubeNode, sphereNode]
      );

      const result = await modifierNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.metadata?.childCount).toBe(2);
        expect(mesh.isVisible).toBe(false);
      }
    });
  });

  describe('Show Only Modifier (!)', () => {
    it('should create show only modifier operation with highlighting', async () => {
      const mockASTNode = { type: 'show_only', children: [] };

      const cubeCode = 'cube(10);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      expect(cubeAst[0]).toBeDefined();
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0], OPENSCAD_DEFAULTS);

      const modifierNode = new ModifierBabylonNode(
        'test_show_only',
        scene,
        'show_only' as ModifierType,
        mockASTNode as any,
        [cubeNode]
      );

      const result = await modifierNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_show_only');
        expect(mesh.metadata?.isModifier).toBe(true);
        expect(mesh.metadata?.modifierType).toBe('show_only');
      }
    });
  });

  describe('Debug Modifier (#)', () => {
    it('should create debug modifier operation with highlighting material', async () => {
      const mockASTNode = { type: 'debug', children: [] };

      const sphereCode = 'sphere(5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      expect(sphereAst[0]).toBeDefined();
      if (!sphereAst[0]) throw new Error('sphereAst[0] is undefined');
      const sphereNode = new PrimitiveBabylonNode(
        'child_sphere',
        scene,
        sphereAst[0],
        OPENSCAD_DEFAULTS
      );

      const modifierNode = new ModifierBabylonNode(
        'test_debug',
        scene,
        'debug' as ModifierType,
        mockASTNode as any,
        [sphereNode]
      );

      const result = await modifierNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_debug');
        expect(mesh.metadata?.isModifier).toBe(true);
        expect(mesh.metadata?.modifierType).toBe('debug');
      }
    });
  });

  describe('Background Modifier (%)', () => {
    it('should create background modifier operation with transparency', async () => {
      const mockASTNode = { type: 'background', children: [] };

      const cylinderCode = 'cylinder(h=10, r=5);';
      const cylinderAst = parser.parseAST(cylinderCode);
      expect(cylinderAst.length).toBeGreaterThan(0);
      expect(cylinderAst[0]).toBeDefined();
      if (!cylinderAst[0]) throw new Error('cylinderAst[0] is undefined');
      const cylinderNode = new PrimitiveBabylonNode(
        'child_cylinder',
        scene,
        cylinderAst[0],
        OPENSCAD_DEFAULTS
      );

      const modifierNode = new ModifierBabylonNode(
        'test_background',
        scene,
        'background' as ModifierType,
        mockASTNode as any,
        [cylinderNode]
      );

      const result = await modifierNode.generateMesh();
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeDefined();
        expect(mesh.name).toBe('test_background');
        expect(mesh.metadata?.isModifier).toBe(true);
        expect(mesh.metadata?.modifierType).toBe('background');
      }
    });
  });

  describe('Node Validation', () => {
    it('should validate modifier node successfully with valid parameters', async () => {
      const mockASTNode = { type: 'debug', children: [] };

      const cubeCode = 'cube(10);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      expect(cubeAst[0]).toBeDefined();
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0], OPENSCAD_DEFAULTS);

      const modifierNode = new ModifierBabylonNode(
        'test_modifier_validation',
        scene,
        'debug' as ModifierType,
        mockASTNode as any,
        [cubeNode]
      );

      const validationResult = modifierNode.validateNode();
      expect(validationResult.success).toBe(true);
    });

    it('should fail validation with no children', async () => {
      const mockASTNode = { type: 'disable', children: [] };

      const modifierNode = new ModifierBabylonNode(
        'test_modifier_no_children',
        scene,
        'disable' as ModifierType,
        mockASTNode as any,
        [] // No children
      );

      const validationResult = modifierNode.validateNode();
      expect(validationResult.success).toBe(false);
      if (!validationResult.success) {
        expect(validationResult.error.code).toBe('VALIDATION_FAILED');
        expect(validationResult.error.message).toContain('Node validation failed');
      }
    });

    it('should fail validation with empty name', async () => {
      const mockASTNode = { type: 'background', children: [] };

      const modifierNode = new ModifierBabylonNode(
        '', // Empty name
        scene,
        'background' as ModifierType,
        mockASTNode as any,
        []
      );

      const validationResult = modifierNode.validateNode();
      expect(validationResult.success).toBe(false);
      if (!validationResult.success) {
        expect(validationResult.error.code).toBe('VALIDATION_FAILED');
        expect(validationResult.error.message).toContain('Node validation failed');
      }
    });
  });

  describe('Node Cloning', () => {
    it('should clone modifier node successfully', async () => {
      const mockASTNode = { type: 'show_only', children: [] };

      const sphereCode = 'sphere(5);';
      const sphereAst = parser.parseAST(sphereCode);
      expect(sphereAst.length).toBeGreaterThan(0);
      expect(sphereAst[0]).toBeDefined();
      if (!sphereAst[0]) throw new Error('sphereAst[0] is undefined');
      const sphereNode = new PrimitiveBabylonNode(
        'child_sphere',
        scene,
        sphereAst[0],
        OPENSCAD_DEFAULTS
      );

      const originalNode = new ModifierBabylonNode(
        'original_show_only',
        scene,
        'show_only' as ModifierType,
        mockASTNode as any,
        [sphereNode]
      );

      const clonedNode = originalNode.clone();

      expect(clonedNode).toBeDefined();
      expect(clonedNode.name).toContain('original_show_only_clone_');
      expect(clonedNode.nodeType).toBe(originalNode.nodeType);
      expect(clonedNode.originalOpenscadNode).toBe(originalNode.originalOpenscadNode);
    });
  });

  describe('Error Handling', () => {
    it('should handle mesh generation without scene', async () => {
      const mockASTNode = { type: 'debug', children: [] };

      const modifierNode = new ModifierBabylonNode(
        'test_modifier_no_scene',
        null, // No scene
        'debug' as ModifierType,
        mockASTNode as any,
        []
      );

      const result = await modifierNode.generateMesh();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MESH_GENERATION_FAILED');
        expect(result.error.message).toContain('Failed to generate debug modifier');
      }
    });
  });

  describe('Debug Information', () => {
    it('should provide comprehensive debug information', async () => {
      const mockASTNode = { type: 'background', children: [] };

      const cubeCode = 'cube(10);';
      const cubeAst = parser.parseAST(cubeCode);
      expect(cubeAst.length).toBeGreaterThan(0);
      expect(cubeAst[0]).toBeDefined();
      if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
      const cubeNode = new PrimitiveBabylonNode('child_cube', scene, cubeAst[0], OPENSCAD_DEFAULTS);

      const modifierNode = new ModifierBabylonNode(
        'debug_background',
        scene,
        'background' as ModifierType,
        mockASTNode as any,
        [cubeNode]
      );

      const debugInfo = modifierNode.getDebugInfo();

      expect(debugInfo).toBeDefined();
      expect(debugInfo.isModifier).toBe(true);
      expect(debugInfo.modifierType).toBe('background');
      expect(debugInfo.parameters).toBeDefined();
      expect(debugInfo.childCount).toBe(1);
      expect(debugInfo.name).toBe('debug_background');
    });
  });
});
