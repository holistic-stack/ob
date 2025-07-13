/**
 * @file Manifold Mesh Format Converter Tests
 * @description TDD tests for mesh format conversion between IManifoldMesh and Manifold-compatible format
 * Following project guidelines: no mocks, real implementations, Result<T,E> patterns
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { ManifoldWasmLoader } from '../manifold-wasm-loader/manifold-wasm-loader';
import type { IManifoldMesh } from './manifold-mesh-converter';
import {
  convertFromManifoldFormat,
  convertToManifoldFormat,
  type ManifoldCompatibleMesh,
  validateManifoldFormat,
} from './manifold-mesh-format-converter';

describe('Manifold Mesh Format Converter', () => {
  let manifoldModule: any;

  beforeEach(async () => {
    const loader = new ManifoldWasmLoader();
    manifoldModule = await loader.load();
  });

  afterEach(() => {
    // Clean up any created Manifold objects
  });

  describe('Step D.3.1: Format Conversion', () => {
    test('should convert IManifoldMesh to Manifold-compatible format', () => {
      const inputMesh: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([
          0.0,
          1.0,
          0.0, // vertex 0
          -1.0,
          -1.0,
          0.0, // vertex 1
          1.0,
          -1.0,
          0.0, // vertex 2
        ]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      const result = convertToManifoldFormat(inputMesh);
      expect(result.success).toBe(true);

      if (result.success) {
        const converted = result.data;

        // Check basic properties
        expect(converted.numProp).toBe(3);
        expect(converted.vertProperties).toEqual(inputMesh.vertProperties);
        expect(converted.triVerts).toEqual(inputMesh.triVerts);

        // Check required additional fields
        expect(converted.mergeFromVert).toBeInstanceOf(Uint32Array);
        expect(converted.mergeToVert).toBeInstanceOf(Uint32Array);
        expect(converted.faceID).toBeInstanceOf(Uint32Array);
        expect(converted.halfedgeTangent).toBeInstanceOf(Float32Array);
        expect(converted.runTransform).toBeInstanceOf(Float32Array);

        // Check faceID has correct length (one per triangle)
        expect(converted.faceID.length).toBe(1); // 1 triangle
        expect(converted.faceID[0]).toBe(0);
      }
    });

    test('should validate converted format is correct', () => {
      const inputMesh: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      const convertResult = convertToManifoldFormat(inputMesh);
      expect(convertResult.success).toBe(true);

      if (convertResult.success) {
        const validateResult = validateManifoldFormat(convertResult.data);
        expect(validateResult.success).toBe(true);
      }
    });

    test('should handle multiple triangles correctly', () => {
      const inputMesh: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([
          0.0,
          0.0,
          0.0, // vertex 0
          1.0,
          0.0,
          0.0, // vertex 1
          0.0,
          1.0,
          0.0, // vertex 2
          1.0,
          1.0,
          0.0, // vertex 3
        ]),
        triVerts: new Uint32Array([0, 1, 2, 1, 3, 2]), // 2 triangles
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      const result = convertToManifoldFormat(inputMesh);
      expect(result.success).toBe(true);

      if (result.success) {
        const converted = result.data;
        expect(converted.faceID.length).toBe(2); // 2 triangles
        expect(converted.faceID[0]).toBe(0);
        expect(converted.faceID[1]).toBe(1);
      }
    });

    test('should handle error cases gracefully', () => {
      // Test empty mesh
      const emptyMesh: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([]),
        triVerts: new Uint32Array([]),
        runIndex: new Uint32Array([]),
        runOriginalID: new Uint32Array([]),
        numRun: 0,
      };

      const result = convertToManifoldFormat(emptyMesh);
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('Step D.3.2: Manifold Constructor Integration', () => {
    test('should create working Manifold object from converted format', () => {
      const inputMesh: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([0.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      // Convert to Manifold-compatible format
      const convertResult = convertToManifoldFormat(inputMesh);
      expect(convertResult.success).toBe(true);

      if (convertResult.success) {
        // Test that Manifold constructor accepts the converted format
        let manifoldObject: any;
        expect(() => {
          manifoldObject = new manifoldModule.Manifold(convertResult.data);
        }).not.toThrow();

        expect(manifoldObject).toBeDefined();
        expect(manifoldObject.isEmpty()).toBe(false);
        expect(manifoldObject.numVert()).toBeGreaterThan(0);
        expect(manifoldObject.numTri()).toBeGreaterThan(0);

        console.log('Converted mesh Manifold stats:', {
          isEmpty: manifoldObject.isEmpty(),
          numVert: manifoldObject.numVert(),
          numTri: manifoldObject.numTri(),
        });

        // Clean up
        manifoldObject.delete();
      }
    });

    test('should perform CSG operations with converted meshes', () => {
      // Create two simple triangle meshes
      const mesh1: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([0.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      const mesh2: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([0.0, 2.0, 0.0, -0.5, 0.0, 0.0, 0.5, 0.0, 0.0]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      // Convert both meshes
      const convert1 = convertToManifoldFormat(mesh1);
      const convert2 = convertToManifoldFormat(mesh2);

      expect(convert1.success).toBe(true);
      expect(convert2.success).toBe(true);

      if (convert1.success && convert2.success) {
        // Create Manifold objects
        const manifold1 = new manifoldModule.Manifold(convert1.data);
        const manifold2 = new manifoldModule.Manifold(convert2.data);

        expect(manifold1.isEmpty()).toBe(false);
        expect(manifold2.isEmpty()).toBe(false);

        // Perform union operation
        const union = manifold1.add(manifold2);
        expect(union.isEmpty()).toBe(false);
        expect(union.numVert()).toBeGreaterThan(0);

        console.log('CSG operation with converted meshes:', {
          mesh1_verts: manifold1.numVert(),
          mesh2_verts: manifold2.numVert(),
          union_verts: union.numVert(),
        });

        // Clean up
        manifold1.delete();
        manifold2.delete();
        union.delete();
      }
    });
  });

  describe('Step D.3.3: Round-trip Conversion', () => {
    test('should convert back from Manifold format to IManifoldMesh', () => {
      const originalMesh: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      // Convert to Manifold format
      const toManifoldResult = convertToManifoldFormat(originalMesh);
      expect(toManifoldResult.success).toBe(true);

      if (toManifoldResult.success) {
        // Convert back to IManifoldMesh
        const backResult = convertFromManifoldFormat(toManifoldResult.data);
        expect(backResult.success).toBe(true);

        if (backResult.success) {
          const converted = backResult.data;
          expect(converted.numProp).toBe(originalMesh.numProp);
          expect(converted.vertProperties).toEqual(originalMesh.vertProperties);
          expect(converted.triVerts).toEqual(originalMesh.triVerts);
          expect(converted.numRun).toBe(originalMesh.numRun);
        }
      }
    });
  });
});
