/**
 * OpenSCAD AST Visitor Tests with CSG2 Integration
 * Tests the enhanced visitor with proper CSG2 initialization
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenScadAstVisitor } from './openscad-ast-visitor';
import { initializeCSG2ForTests, createTestScene, disposeTestScene } from '../../vitest-setup';
import type { CubeNode, SphereNode, UnionNode } from '@holistic-stack/openscad-parser';

describe('OpenScadAstVisitor with CSG2', () => {
  let visitor: OpenScadAstVisitor;
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;

  beforeAll(async () => {
    console.log('[INIT] Initializing CSG2 for OpenScadAstVisitor tests');
    await initializeCSG2ForTests();
  });

  beforeEach(() => {
    console.log('[DEBUG] Setting up test scene');
    const testScene = createTestScene();
    engine = testScene.engine;
    scene = testScene.scene;
    visitor = new OpenScadAstVisitor(scene);
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up test scene');
    disposeTestScene(engine, scene);
  });

  describe('CSG2 Initialization', () => {
    it('should initialize CSG2 successfully', async () => {
      console.log('[DEBUG] Testing CSG2 initialization');

      expect(visitor.isCSG2Ready()).toBe(false);

      await visitor.initializeCSG2();

      expect(visitor.isCSG2Ready()).toBe(true);
      console.log('[DEBUG] CSG2 initialization test passed');
    });

    it('should handle multiple initialization calls gracefully', async () => {
      console.log('[DEBUG] Testing multiple CSG2 initialization calls');

      await visitor.initializeCSG2();
      expect(visitor.isCSG2Ready()).toBe(true);

      // Second call should not throw
      await visitor.initializeCSG2();
      expect(visitor.isCSG2Ready()).toBe(true);

      console.log('[DEBUG] Multiple initialization test passed');
    });
  });

  describe('Primitive Shapes', () => {
    beforeEach(async () => {
      await visitor.initializeCSG2();
    });

    it('should create a cube mesh', () => {
      console.log('[DEBUG] Testing cube creation');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [10, 20, 30],
        center: false,
        location: { start: { line: 1, column: 1 }, end: { line: 1, column: 20 } }
      };

      const mesh = visitor.visit(cubeNode);

      expect(mesh).toBeInstanceOf(BABYLON.Mesh);
      expect(mesh?.name).toContain('cube_');
      console.log('[DEBUG] Cube creation test passed');
    });

    it('should create a sphere mesh', () => {
      console.log('[DEBUG] Testing sphere creation');

      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 5,
        location: { start: { line: 1, column: 1 }, end: { line: 1, column: 15 } }
      };

      const mesh = visitor.visit(sphereNode);

      expect(mesh).toBeInstanceOf(BABYLON.Mesh);
      expect(mesh?.name).toContain('sphere_');
      console.log('[DEBUG] Sphere creation test passed');
    });
  });

  describe('CSG Operations', () => {
    beforeEach(async () => {
      await visitor.initializeCSG2();
    });

    it('should handle union with no children', () => {
      console.log('[DEBUG] Testing union with no children');

      const unionNode: UnionNode = {
        type: 'union',
        children: [],
        location: { start: { line: 1, column: 1 }, end: { line: 3, column: 1 } }
      };

      const mesh = visitor.visit(unionNode);

      expect(mesh).toBeNull();
      console.log('[DEBUG] Union with no children test passed');
    });

    it('should handle union with single child', () => {
      console.log('[DEBUG] Testing union with single child');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [5, 5, 5],
        center: false,
        location: { start: { line: 2, column: 3 }, end: { line: 2, column: 15 } }
      };

      const unionNode: UnionNode = {
        type: 'union',
        children: [cubeNode],
        location: { start: { line: 1, column: 1 }, end: { line: 3, column: 1 } }
      };

      const mesh = visitor.visit(unionNode);

      expect(mesh).toBeInstanceOf(BABYLON.Mesh);
      expect(mesh?.name).toContain('cube_');
      console.log('[DEBUG] Union with single child test passed');
    });
  });

  describe('Error Handling', () => {
    it('should handle CSG operations gracefully when CSG2 not initialized', () => {
      console.log('[DEBUG] Testing CSG2 not initialized graceful handling');

      const cubeNode1: CubeNode = {
        type: 'cube',
        size: [5, 5, 5],
        center: false,
        location: { start: { line: 2, column: 3 }, end: { line: 2, column: 15 } }
      };

      const cubeNode2: CubeNode = {
        type: 'cube',
        size: [3, 3, 3],
        center: false,
        location: { start: { line: 3, column: 3 }, end: { line: 3, column: 15 } }
      };

      const unionNode: UnionNode = {
        type: 'union',
        children: [cubeNode1, cubeNode2],
        location: { start: { line: 1, column: 1 }, end: { line: 4, column: 1 } }
      };

      // Should return a fallback mesh instead of throwing
      const result = visitor.visit(unionNode);
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      expect(result?.name).toContain('cube_');
      console.log('[DEBUG] CSG2 not initialized graceful handling test passed');
    });
  });
});
