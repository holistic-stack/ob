/**
 * @file Generic Mesh Utilities Tests
 *
 * Tests for the GenericMeshUtils functions following TDD principles.
 * Tests mesh creation, validation, and utility functions.
 */

import { BoundingBox, Matrix, Vector3 } from '@babylonjs/core';
import { describe, expect, it } from 'vitest';
import type {
  GenericGeometry,
  GenericMeshCollection,
  GenericMeshData,
} from '../types/generic-mesh-data.types';
import { DEFAULT_MESH_METADATA, MATERIAL_PRESETS } from '../types/generic-mesh-data.types';
import {
  applyModifierToMaterial,
  calculateSurfaceArea,
  calculateVolume,
  createBoundingBoxFromGeometry,
  createGenericMeshData,
  createMaterialConfig,
  createMeshCollection,
  mergeMeshCollections,
  validateMeshData,
} from './generic-mesh-utils';

describe('Generic Mesh Utils', () => {
  // Test geometry for a simple triangle
  const testGeometry: GenericGeometry = {
    positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    indices: new Uint32Array([0, 1, 2]),
    vertexCount: 3,
    triangleCount: 1,
    boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
  };

  describe('createGenericMeshData', () => {
    it('should create valid mesh data with required parameters', () => {
      const result = createGenericMeshData(
        'test-mesh',
        testGeometry,
        MATERIAL_PRESETS.DEFAULT,
        Matrix.Identity(),
        {
          meshId: 'test-mesh',
          name: 'Test Mesh',
          nodeType: 'cube',
          vertexCount: 3,
          triangleCount: 1,
          boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('test-mesh');
        expect(result.data.geometry).toBe(testGeometry);
        expect(result.data.material).toBe(MATERIAL_PRESETS.DEFAULT);
        expect(result.data.metadata.name).toBe('Test Mesh');
        expect(result.data.metadata.nodeType).toBe('cube');
      }
    });

    it('should fail with empty ID', () => {
      const result = createGenericMeshData(
        '',
        testGeometry,
        MATERIAL_PRESETS.DEFAULT,
        Matrix.Identity(),
        {
          meshId: '',
          name: 'Test',
          nodeType: 'cube',
          vertexCount: 3,
          triangleCount: 1,
          boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
        }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CREATION_FAILED');
        expect(result.error.message).toContain('Mesh ID cannot be empty');
      }
    });

    it('should fail with invalid geometry', () => {
      const invalidGeometry = {
        ...testGeometry,
        positions: null as any,
      };

      const result = createGenericMeshData(
        'test-mesh',
        invalidGeometry,
        MATERIAL_PRESETS.DEFAULT,
        Matrix.Identity(),
        {
          meshId: 'test-mesh',
          name: 'Test',
          nodeType: 'cube',
          vertexCount: 3,
          triangleCount: 1,
          boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
        }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_GEOMETRY');
      }
    });
  });

  describe('createMaterialConfig', () => {
    it('should create material config from builder', () => {
      const result = createMaterialConfig({
        diffuseColor: [0.5, 0.8, 0.2],
        alpha: 0.9,
        metallicFactor: 0.3,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.diffuseColor).toEqual([0.5, 0.8, 0.2]);
        expect(result.data.alpha).toBe(0.9);
        expect(result.data.metallicFactor).toBe(0.3);
        // Should inherit defaults for other properties
        expect(result.data.roughnessFactor).toBe(MATERIAL_PRESETS.DEFAULT.roughnessFactor);
      }
    });

    it('should fail with invalid diffuseColor', () => {
      const result = createMaterialConfig({
        diffuseColor: [0.5, 0.8] as any, // Invalid length
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MATERIAL');
      }
    });
  });

  describe('createBoundingBoxFromGeometry', () => {
    it('should calculate correct bounding box', () => {
      const geometry: GenericGeometry = {
        positions: new Float32Array([-1, -2, -3, 4, 5, 6, 0, 0, 0]),
        indices: new Uint32Array([0, 1, 2]),
        vertexCount: 3,
        triangleCount: 1,
        boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()), // Will be recalculated
      };

      const bbox = createBoundingBoxFromGeometry(geometry);

      expect(bbox.minimum.x).toBe(-1);
      expect(bbox.minimum.y).toBe(-2);
      expect(bbox.minimum.z).toBe(-3);
      expect(bbox.maximum.x).toBe(4);
      expect(bbox.maximum.y).toBe(5);
      expect(bbox.maximum.z).toBe(6);
    });
  });

  describe('calculateSurfaceArea', () => {
    it('should calculate surface area for triangle', () => {
      const area = calculateSurfaceArea(testGeometry);

      // Triangle with vertices at (0,0,0), (1,0,0), (0,1,0) has area 0.5
      expect(area).toBeCloseTo(0.5, 2);
    });
  });

  describe('calculateVolume', () => {
    it('should calculate volume for simple geometry', () => {
      const volume = calculateVolume(testGeometry);

      // Single triangle has minimal volume
      expect(volume).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createMeshCollection', () => {
    it('should create mesh collection with multiple meshes', () => {
      const mesh1Result = createGenericMeshData(
        'mesh1',
        testGeometry,
        MATERIAL_PRESETS.DEFAULT,
        Matrix.Identity(),
        {
          meshId: 'mesh1',
          name: 'Mesh 1',
          nodeType: 'cube',
          vertexCount: 3,
          triangleCount: 1,
          boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
        }
      );

      const mesh2Result = createGenericMeshData(
        'mesh2',
        testGeometry,
        MATERIAL_PRESETS.DEFAULT,
        Matrix.Identity(),
        {
          meshId: 'mesh2',
          name: 'Mesh 2',
          nodeType: 'sphere',
          vertexCount: 3,
          triangleCount: 1,
          boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
        }
      );

      expect(mesh1Result.success).toBe(true);
      expect(mesh2Result.success).toBe(true);

      if (mesh1Result.success && mesh2Result.success) {
        const collectionResult = createMeshCollection(
          'test-collection',
          [mesh1Result.data, mesh2Result.data],
          'csg_result'
        );

        expect(collectionResult.success).toBe(true);
        if (collectionResult.success) {
          expect(collectionResult.data.id).toBe('test-collection');
          expect(collectionResult.data.meshes.length).toBe(2);
          expect(collectionResult.data.metadata.collectionType).toBe('csg_result');
          expect(collectionResult.data.metadata.totalVertices).toBe(6);
          expect(collectionResult.data.metadata.totalTriangles).toBe(2);
        }
      }
    });

    it('should fail with empty mesh array', () => {
      const result = createMeshCollection('test', [], 'csg_result');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CREATION_FAILED');
      }
    });
  });

  describe('applyModifierToMaterial', () => {
    it('should apply debug modifier correctly', () => {
      const baseMaterial = MATERIAL_PRESETS.DEFAULT;
      const debugMaterial = applyModifierToMaterial(baseMaterial, 'debug');

      expect(debugMaterial.isDebugMaterial).toBe(true);
      expect(debugMaterial.diffuseColor).toEqual([1.0, 0.0, 0.0]);
    });

    it('should apply background modifier correctly', () => {
      const baseMaterial = MATERIAL_PRESETS.DEFAULT;
      const backgroundMaterial = applyModifierToMaterial(baseMaterial, 'background');

      expect(backgroundMaterial.isBackgroundMaterial).toBe(true);
      expect(backgroundMaterial.alpha).toBe(0.3);
      expect(backgroundMaterial.transparent).toBe(true);
    });

    it('should apply show_only modifier correctly', () => {
      const baseMaterial = MATERIAL_PRESETS.DEFAULT;
      const showOnlyMaterial = applyModifierToMaterial(baseMaterial, 'show_only');

      expect(showOnlyMaterial.isShowOnlyMaterial).toBe(true);
      expect(showOnlyMaterial.diffuseColor).toEqual([1.0, 1.0, 0.0]);
    });

    it('should apply disable modifier correctly', () => {
      const baseMaterial = MATERIAL_PRESETS.DEFAULT;
      const disabledMaterial = applyModifierToMaterial(baseMaterial, 'disable');

      expect(disabledMaterial.isDisabled).toBe(true);
      expect(disabledMaterial.alpha).toBe(0.0);
    });
  });

  describe('validateMeshData', () => {
    it('should validate correct mesh data', () => {
      const meshResult = createGenericMeshData(
        'valid-mesh',
        testGeometry,
        MATERIAL_PRESETS.DEFAULT,
        Matrix.Identity(),
        {
          meshId: 'valid-mesh',
          name: 'Valid Mesh',
          nodeType: 'cube',
          vertexCount: 3,
          triangleCount: 1,
          boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
        }
      );

      expect(meshResult.success).toBe(true);
      if (meshResult.success) {
        const validationResult = validateMeshData(meshResult.data);
        expect(validationResult.success).toBe(true);
      }
    });

    it('should fail validation for invalid geometry', () => {
      const invalidMesh: GenericMeshData = {
        id: 'invalid',
        geometry: {
          positions: new Float32Array([0, 0]), // Invalid length (not divisible by 3)
          indices: new Uint32Array([0, 1, 2]),
          vertexCount: 2,
          triangleCount: 1,
          boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
        },
        material: MATERIAL_PRESETS.DEFAULT,
        transform: Matrix.Identity(),
        metadata: {
          ...DEFAULT_MESH_METADATA,
          meshId: 'invalid',
          name: 'Invalid',
          nodeType: 'cube',
          vertexCount: 2,
          triangleCount: 1,
          boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
        },
      };

      const result = validateMeshData(invalidMesh);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_GEOMETRY');
      }
    });
  });
});
