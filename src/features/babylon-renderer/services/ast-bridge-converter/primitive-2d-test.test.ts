/**
 * @file 2D Primitive Mesh Generation Test
 *
 * Tests the 2D primitive mesh generation functionality for OpenSCAD primitives
 * using BabylonJS polygon creation capabilities.
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CircleNode, SquareNode } from '../../../openscad-parser/ast/ast-types';
import { createSourceLocation } from '../../../openscad-parser/services/test-utils';
import type { OpenSCADGlobalsState } from '../../../store/slices/openscad-globals-slice/openscad-globals-slice.types';
import { PrimitiveBabylonNode } from './primitive-babylon-node';

describe('PrimitiveBabylonNode - 2D Primitives', () => {
  let engine: NullEngine;
  let scene: Scene;
  let mockGlobals: OpenSCADGlobalsState;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);

    // Mock OpenSCAD globals with default values
    mockGlobals = {
      $fn: undefined,
      $fa: 12,
      $fs: 2,
      $t: 0,
      $vpr: [0, 0, 0],
      $vpt: [0, 0, 0],
      $vpd: 500,
      $vpf: 22.5,
      isModified: false,
      lastModified: new Date(),
    };
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  describe('Circle Mesh Generation', () => {
    it('should create circle mesh with default parameters', async () => {
      const circleNode: CircleNode = {
        type: 'circle',
        r: 10,
        location: createSourceLocation(1, 1, 0, 1, 10, 9),
      };

      const primitiveNode = new PrimitiveBabylonNode('test-circle', scene, circleNode, mockGlobals);

      const result = await primitiveNode.generateMesh();

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh.name).toBe('test-circle');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
        expect(mesh.position.z).toBe(0); // 2D shape at Z=0
      }
    });

    it('should create pentagon with $fn = 5', async () => {
      const circleNode: CircleNode = {
        type: 'circle',
        r: 30,
        $fn: 5,
        location: createSourceLocation(1, 1, 0, 1, 10, 9),
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-pentagon',
        scene,
        circleNode,
        mockGlobals
      );

      const result = await primitiveNode.generateMesh();

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh.name).toBe('test-pentagon');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
        // Pentagon should have 5 vertices for the shape
        // Note: BabylonJS may add additional vertices for triangulation
      }
    });

    it('should use global $fn variable when local $fn not specified', async () => {
      const globalsWithFn: OpenSCADGlobalsState = {
        ...mockGlobals,
        $fn: 5,
      };

      const circleNode: CircleNode = {
        type: 'circle',
        r: 30,
        location: createSourceLocation(1, 1, 0, 1, 10, 9),
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-global-fn',
        scene,
        circleNode,
        globalsWithFn
      );

      const result = await primitiveNode.generateMesh();

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh.name).toBe('test-global-fn');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
      }
    });

    it('should handle diameter parameter', async () => {
      const circleNode: CircleNode = {
        type: 'circle',
        d: 20, // diameter = 20, radius = 10
        location: createSourceLocation(1, 1, 0, 1, 10, 9),
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-diameter',
        scene,
        circleNode,
        mockGlobals
      );

      const result = await primitiveNode.generateMesh();

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh.name).toBe('test-diameter');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
      }
    });
  });

  describe('Square Mesh Generation', () => {
    it('should create square mesh with default parameters', async () => {
      const squareNode: SquareNode = {
        type: 'square',
        size: 10,
        location: createSourceLocation(1, 1, 0, 1, 10, 9),
      };

      const primitiveNode = new PrimitiveBabylonNode('test-square', scene, squareNode, mockGlobals);

      const result = await primitiveNode.generateMesh();

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh.name).toBe('test-square');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
        expect(mesh.position.z).toBe(0); // 2D shape at Z=0
      }
    });

    it('should create rectangle with array size', async () => {
      const squareNode: SquareNode = {
        type: 'square',
        size: [10, 20],
        location: createSourceLocation(1, 1, 0, 1, 10, 9),
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-rectangle',
        scene,
        squareNode,
        mockGlobals
      );

      const result = await primitiveNode.generateMesh();

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh.name).toBe('test-rectangle');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
      }
    });

    it('should handle center parameter', async () => {
      const squareNode: SquareNode = {
        type: 'square',
        size: [10, 20],
        center: true,
        location: createSourceLocation(1, 1, 0, 1, 10, 9),
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-centered-square',
        scene,
        squareNode,
        mockGlobals
      );

      const result = await primitiveNode.generateMesh();

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh.name).toBe('test-centered-square');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
      }
    });
  });

  describe('Validation', () => {
    it('should validate circle with positive radius', () => {
      const circleNode: CircleNode = {
        type: 'circle',
        r: 10,
        location: createSourceLocation(1, 1, 0, 1, 10, 9),
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-validation',
        scene,
        circleNode,
        mockGlobals
      );

      const result = primitiveNode.validateNode();
      expect(result.success).toBe(true);
    });

    it('should fail validation for circle with negative radius', () => {
      const circleNode: CircleNode = {
        type: 'circle',
        r: -5,
        location: createSourceLocation(1, 1, 0, 1, 10, 9),
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-invalid',
        scene,
        circleNode,
        mockGlobals
      );

      const result = primitiveNode.validateNode();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('radius must be positive');
      }
    });

    it('should validate square with positive dimensions', () => {
      const squareNode: SquareNode = {
        type: 'square',
        size: [10, 20],
        location: createSourceLocation(1, 1, 0, 1, 10, 9),
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-square-validation',
        scene,
        squareNode,
        mockGlobals
      );

      const result = primitiveNode.validateNode();
      expect(result.success).toBe(true);
    });
  });
});
