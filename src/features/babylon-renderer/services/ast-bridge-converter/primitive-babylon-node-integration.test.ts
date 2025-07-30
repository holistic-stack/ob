/**
 * @file primitive-babylon-node-integration.test.ts
 * @description Integration tests for PrimitiveBabylonNode with OpenSCAD Geometry Builder
 *
 * Tests the integration between BabylonJS renderer and OpenSCAD Geometry Builder
 * to ensure seamless primitive generation with OpenSCAD-compatible geometry.
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  CubeNode,
  CylinderNode,
  OpenSCADGlobalsState,
  SphereNode,
} from '@/features/openscad-parser/types';
import { isError, isSuccess } from '@/shared/types';
import { PrimitiveBabylonNode } from './primitive-babylon-node';

describe('PrimitiveBabylonNode Integration with OpenSCAD Geometry Builder', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;
  let openscadGlobals: OpenSCADGlobalsState;

  beforeEach(() => {
    // Create headless BabylonJS environment
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);

    // Setup OpenSCAD globals for testing
    openscadGlobals = {
      $fn: undefined,
      $fa: 12,
      $fs: 2,
      $t: 0,
      $vpr: [55, 0, 25] as const,
      $vpt: [0, 0, 0] as const,
      $vpd: 140,
      $children: 0,
      $preview: true,
      lastUpdated: Date.now(),
      isModified: false,
    };
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  describe('Sphere Integration', () => {
    it('should generate sphere using OpenSCAD Geometry Builder', async () => {
      // Create sphere AST node
      const sphereNode: SphereNode = {
        type: 'sphere',
        r: 5,
        $fn: 8,
        $fa: undefined,
        $fs: undefined,
        location: { line: 1, column: 0 },
      };

      // Create primitive node
      const primitiveNode = new PrimitiveBabylonNode(
        'test-sphere',
        scene,
        sphereNode,
        openscadGlobals
      );

      // Generate mesh
      const result = await primitiveNode.generateMesh();

      // Verify successful generation
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;

        // Verify mesh properties
        expect(mesh).toBeInstanceOf(BABYLON.AbstractMesh);
        expect(mesh.name).toBe('test-sphere');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);

        // Verify metadata
        expect(mesh.metadata).toBeDefined();
        expect(mesh.metadata.isPrimitive).toBe(true);
        expect(mesh.metadata.primitiveType).toBe('sphere');
        expect(mesh.metadata.parameters).toBeDefined();

        // Verify material is applied
        expect(mesh.material).toBeInstanceOf(BABYLON.StandardMaterial);
      }
    });

    it('should handle $fn=3 sphere correctly (main issue fix)', async () => {
      // Create low-fragment sphere (the original failing case)
      const sphereNode: SphereNode = {
        type: 'sphere',
        r: 5,
        $fn: 3,
        $fa: undefined,
        $fs: undefined,
        location: { line: 1, column: 0 },
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-sphere-fn3',
        scene,
        sphereNode,
        openscadGlobals
      );

      const result = await primitiveNode.generateMesh();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;

        // Verify the mesh was created successfully
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
        expect(mesh.metadata.primitiveType).toBe('sphere');

        // Verify it's using OpenSCAD-compatible geometry
        // (The exact vertex count depends on the ring-based algorithm)
        expect(mesh.getTotalVertices()).toBeGreaterThanOrEqual(6); // Minimum for $fn=3
      }
    });
  });

  describe('Cube Integration', () => {
    it('should generate cube using OpenSCAD Geometry Builder', async () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: { x: 2, y: 4, z: 6 },
        center: true,
        location: { line: 1, column: 0 },
      };

      const primitiveNode = new PrimitiveBabylonNode('test-cube', scene, cubeNode, openscadGlobals);

      const result = await primitiveNode.generateMesh();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;

        expect(mesh).toBeInstanceOf(BABYLON.AbstractMesh);
        expect(mesh.name).toBe('test-cube');
        expect(mesh.getTotalVertices()).toBe(8); // Cube has 8 vertices
        expect(mesh.metadata.primitiveType).toBe('cube');
      }
    });
  });

  describe('Cylinder Integration', () => {
    it('should generate cylinder using OpenSCAD Geometry Builder', async () => {
      const cylinderNode: CylinderNode = {
        type: 'cylinder',
        h: 10,
        r: 3,
        r1: undefined,
        r2: undefined,
        center: false,
        $fn: 8,
        $fa: undefined,
        $fs: undefined,
        location: { line: 1, column: 0 },
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-cylinder',
        scene,
        cylinderNode,
        openscadGlobals
      );

      const result = await primitiveNode.generateMesh();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;

        expect(mesh).toBeInstanceOf(BABYLON.AbstractMesh);
        expect(mesh.name).toBe('test-cylinder');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
        expect(mesh.metadata.primitiveType).toBe('cylinder');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid parameters gracefully', async () => {
      const invalidSphereNode: SphereNode = {
        type: 'sphere',
        r: -5, // Invalid negative radius
        $fn: 8,
        $fa: undefined,
        $fs: undefined,
        location: { line: 1, column: 0 },
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-invalid-sphere',
        scene,
        invalidSphereNode,
        openscadGlobals
      );

      const result = await primitiveNode.generateMesh();

      // Should either succeed with fallback or fail gracefully
      if (isError(result)) {
        expect(result.error.type).toBeDefined();
        expect(result.error.message).toContain('sphere');
      } else {
        // If it succeeds, it should be using fallback
        expect(result.data).toBeInstanceOf(BABYLON.AbstractMesh);
      }
    });
  });

  describe('Performance', () => {
    it('should generate meshes within performance targets', async () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        r: 5,
        $fn: 16,
        $fa: undefined,
        $fs: undefined,
        location: { line: 1, column: 0 },
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'test-performance-sphere',
        scene,
        sphereNode,
        openscadGlobals
      );

      const startTime = performance.now();
      const result = await primitiveNode.generateMesh();
      const endTime = performance.now();

      const generationTime = endTime - startTime;

      expect(isSuccess(result)).toBe(true);
      expect(generationTime).toBeLessThan(16); // <16ms target
    });
  });
});
