/**
 * @file babylon-mesh-builder.test.ts
 * @description Test suite for BabylonJS Mesh Builder Service following TDD methodology.
 * Tests the bridge between OpenSCAD geometry data and BabylonJS mesh creation.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types/result.types';
import type { CubeGeometryData, SphereGeometryData } from '../../../types/geometry-data';
import { BabylonMeshBuilderService } from './babylon-mesh-builder';

describe('BabylonMeshBuilderService', () => {
  let meshBuilder: BabylonMeshBuilderService;
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    // Create a null engine (headless) for testing
    engine = new BABYLON.NullEngine();

    // Create a real scene
    scene = new BABYLON.Scene(engine);

    // Create the mesh builder service
    meshBuilder = new BabylonMeshBuilderService();
  });

  afterEach(() => {
    // Clean up
    scene.dispose();
    engine.dispose();
  });

  describe('createPolyhedronMesh', () => {
    it('should create a valid BabylonJS mesh from sphere geometry data', () => {
      // Create test sphere geometry data (simple triangle)
      const sphereData: SphereGeometryData = {
        vertices: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: 1 },
        ],
        faces: [[0, 1, 2]],
        normals: [
          { x: 0.577, y: 0.577, z: 0.577 },
          { x: 0.577, y: 0.577, z: 0.577 },
          { x: 0.577, y: 0.577, z: 0.577 },
        ],
        metadata: {
          primitiveType: '3d-sphere',
          parameters: { radius: 1, fragments: 3 },
          fragmentCount: 3,
          generatedAt: Date.now(),
          isConvex: true,
        },
      };

      const result = meshBuilder.createPolyhedronMesh(sphereData, scene, 'test-sphere');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;

        // Verify mesh properties
        expect(mesh).toBeInstanceOf(BABYLON.Mesh);
        expect(mesh.name).toBe('test-sphere');
        expect(mesh.getTotalVertices()).toBe(3);
        expect(mesh.getTotalIndices()).toBe(3);

        // Verify mesh is in the scene
        expect(scene.meshes).toContain(mesh);
      }
    });

    it('should create a valid BabylonJS mesh from cube geometry data', () => {
      // Create test cube geometry data (simple quad)
      const cubeData: CubeGeometryData = {
        vertices: [
          { x: -1, y: -1, z: 0 },
          { x: 1, y: -1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: -1, y: 1, z: 0 },
        ],
        faces: [[0, 1, 2, 3]],
        normals: [
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
        ],
        metadata: {
          primitiveType: '3d-cube',
          parameters: { size: { x: 2, y: 2, z: 2 }, center: true },
          generatedAt: Date.now(),
          isConvex: true,
        },
      };

      const result = meshBuilder.createPolyhedronMesh(cubeData, scene, 'test-cube');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;

        // Verify mesh properties
        expect(mesh).toBeInstanceOf(BABYLON.Mesh);
        expect(mesh.name).toBe('test-cube');
        expect(mesh.getTotalVertices()).toBe(4);
        expect(mesh.getTotalIndices()).toBe(6); // Quad converted to 2 triangles
      }
    });

    it('should handle triangular faces correctly', () => {
      const triangleData: SphereGeometryData = {
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0.5, y: 1, z: 0 },
        ],
        faces: [[0, 1, 2]],
        normals: [
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
        ],
        metadata: {
          primitiveType: '3d-sphere',
          parameters: { radius: 1, fragments: 3 },
          fragmentCount: 3,
          generatedAt: Date.now(),
          isConvex: true,
        },
      };

      const result = meshBuilder.createPolyhedronMesh(triangleData, scene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.getTotalIndices()).toBe(3); // Single triangle
      }
    });

    it('should handle quad faces correctly (convert to triangles)', () => {
      const quadData: CubeGeometryData = {
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 0, y: 1, z: 0 },
        ],
        faces: [[0, 1, 2, 3]],
        normals: [
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
        ],
        metadata: {
          primitiveType: '3d-cube',
          parameters: { size: { x: 1, y: 1, z: 1 }, center: false },
          generatedAt: Date.now(),
          isConvex: true,
        },
      };

      const result = meshBuilder.createPolyhedronMesh(quadData, scene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.getTotalIndices()).toBe(6); // Quad converted to 2 triangles
      }
    });

    it('should handle empty geometry data', () => {
      const emptyData: SphereGeometryData = {
        vertices: [],
        faces: [],
        normals: [],
        metadata: {
          primitiveType: '3d-sphere',
          parameters: { radius: 0, fragments: 0 },
          fragmentCount: 0,
          generatedAt: Date.now(),
          isConvex: true,
        },
      };

      const result = meshBuilder.createPolyhedronMesh(emptyData, scene);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('INVALID_GEOMETRY');
        expect(result.error.message).toContain('empty');
      }
    });

    it('should handle invalid face indices', () => {
      const invalidData: SphereGeometryData = {
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
        ],
        faces: [[0, 1, 5]], // Index 5 is out of bounds
        normals: [
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
        ],
        metadata: {
          primitiveType: '3d-sphere',
          parameters: { radius: 1, fragments: 3 },
          fragmentCount: 3,
          generatedAt: Date.now(),
          isConvex: true,
        },
      };

      const result = meshBuilder.createPolyhedronMesh(invalidData, scene);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('INVALID_GEOMETRY');
        expect(result.error.message).toContain('index');
      }
    });

    it('should generate default name when not provided', () => {
      const simpleData: SphereGeometryData = {
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0.5, y: 1, z: 0 },
        ],
        faces: [[0, 1, 2]],
        normals: [
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
          { x: 0, y: 0, z: 1 },
        ],
        metadata: {
          primitiveType: '3d-sphere',
          parameters: { radius: 1, fragments: 3 },
          fragmentCount: 3,
          generatedAt: Date.now(),
          isConvex: true,
        },
      };

      const result = meshBuilder.createPolyhedronMesh(simpleData, scene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.name).toMatch(/^openscad-3d-sphere-\d+-\d+$/);
      }
    });
  });

  describe('performance and memory', () => {
    it('should handle large geometry efficiently', () => {
      // Create a larger geometry (100 vertices)
      const vertices = [];
      const normals = [];
      const faces = [];

      for (let i = 0; i < 100; i++) {
        vertices.push({ x: Math.random(), y: Math.random(), z: Math.random() });
        normals.push({ x: 0, y: 0, z: 1 });
      }

      // Create triangular faces
      for (let i = 0; i < 98; i += 3) {
        faces.push([i, i + 1, i + 2]);
      }

      const largeData: SphereGeometryData = {
        vertices,
        faces,
        normals,
        metadata: {
          primitiveType: '3d-sphere',
          parameters: { radius: 1, fragments: 100 },
          fragmentCount: 100,
          generatedAt: Date.now(),
          isConvex: true,
        },
      };

      const startTime = performance.now();
      const result = meshBuilder.createPolyhedronMesh(largeData, scene);
      const endTime = performance.now();

      expect(isSuccess(result)).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should be fast (<50ms)
    });
  });
});
