/**
 * @file Generic Mesh Data Types Tests
 *
 * Tests for the GenericMeshData types and utilities following TDD principles.
 * Tests type guards, material presets, and utility functions.
 */

import { BoundingBox, Matrix, Vector3 } from '@babylonjs/core';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MESH_METADATA,
  type GenericMaterialConfig,
  type GenericMeshCollection,
  type GenericMeshData,
  type GenericMeshMetadata,
  isGenericMeshCollection,
  isGenericMeshData,
  MATERIAL_PRESETS,
} from './generic-mesh-data.types';

describe('Generic Mesh Data Types', () => {
  describe('Material Presets', () => {
    it('should have DEFAULT material preset with correct properties', () => {
      const defaultMaterial = MATERIAL_PRESETS.DEFAULT;

      expect(defaultMaterial.diffuseColor).toEqual([0.8, 0.8, 0.8]);
      expect(defaultMaterial.alpha).toBe(1.0);
      expect(defaultMaterial.metallicFactor).toBe(0.1);
      expect(defaultMaterial.roughnessFactor).toBe(0.8);
      expect(defaultMaterial.transparent).toBe(false);
      expect(defaultMaterial.wireframe).toBe(false);
      expect(defaultMaterial.isDebugMaterial).toBe(false);
      expect(defaultMaterial.isBackgroundMaterial).toBe(false);
      expect(defaultMaterial.isShowOnlyMaterial).toBe(false);
      expect(defaultMaterial.isDisabled).toBe(false);
    });

    it('should have DEBUG material preset with bright red color', () => {
      const debugMaterial = MATERIAL_PRESETS.DEBUG;

      expect(debugMaterial.diffuseColor).toEqual([1.0, 0.0, 0.0]);
      expect(debugMaterial.emissiveColor).toEqual([0.2, 0.0, 0.0]);
      expect(debugMaterial.isDebugMaterial).toBe(true);
      expect(debugMaterial.isBackgroundMaterial).toBe(false);
      expect(debugMaterial.isShowOnlyMaterial).toBe(false);
      expect(debugMaterial.isDisabled).toBe(false);
    });

    it('should have BACKGROUND material preset with transparency', () => {
      const backgroundMaterial = MATERIAL_PRESETS.BACKGROUND;

      expect(backgroundMaterial.diffuseColor).toEqual([0.7, 0.7, 0.7]);
      expect(backgroundMaterial.alpha).toBe(0.3);
      expect(backgroundMaterial.transparent).toBe(true);
      expect(backgroundMaterial.isDebugMaterial).toBe(false);
      expect(backgroundMaterial.isBackgroundMaterial).toBe(true);
      expect(backgroundMaterial.isShowOnlyMaterial).toBe(false);
      expect(backgroundMaterial.isDisabled).toBe(false);
    });

    it('should have SHOW_ONLY material preset with bright yellow color', () => {
      const showOnlyMaterial = MATERIAL_PRESETS.SHOW_ONLY;

      expect(showOnlyMaterial.diffuseColor).toEqual([1.0, 1.0, 0.0]);
      expect(showOnlyMaterial.emissiveColor).toEqual([0.3, 0.3, 0.0]);
      expect(showOnlyMaterial.isDebugMaterial).toBe(false);
      expect(showOnlyMaterial.isBackgroundMaterial).toBe(false);
      expect(showOnlyMaterial.isShowOnlyMaterial).toBe(true);
      expect(showOnlyMaterial.isDisabled).toBe(false);
    });

    it('should have DISABLED material preset with zero alpha', () => {
      const disabledMaterial = MATERIAL_PRESETS.DISABLED;

      expect(disabledMaterial.diffuseColor).toEqual([0.5, 0.5, 0.5]);
      expect(disabledMaterial.alpha).toBe(0.0);
      expect(disabledMaterial.transparent).toBe(true);
      expect(disabledMaterial.isDebugMaterial).toBe(false);
      expect(disabledMaterial.isBackgroundMaterial).toBe(false);
      expect(disabledMaterial.isShowOnlyMaterial).toBe(false);
      expect(disabledMaterial.isDisabled).toBe(true);
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify valid GenericMeshData', () => {
      const validMeshData: GenericMeshData = {
        id: 'test-mesh',
        geometry: {
          positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
          indices: new Uint32Array([0, 1, 2]),
          vertexCount: 3,
          triangleCount: 1,
          boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
        },
        material: MATERIAL_PRESETS.DEFAULT,
        transform: Matrix.Identity(),
        metadata: {
          ...DEFAULT_MESH_METADATA,
          meshId: 'test-mesh',
          name: 'Test Mesh',
          nodeType: 'cube',
          vertexCount: 3,
          triangleCount: 1,
          boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
        },
      };

      expect(isGenericMeshData(validMeshData)).toBe(true);
    });

    it('should reject invalid GenericMeshData objects', () => {
      const invalidObjects = [
        null,
        undefined,
        {},
        { id: 'test' }, // Missing required properties
        { id: 'test', geometry: {} }, // Missing other required properties
        'not an object',
        42,
        [],
      ];

      for (const obj of invalidObjects) {
        expect(isGenericMeshData(obj)).toBe(false);
      }
    });

    it('should correctly identify valid GenericMeshCollection', () => {
      const validCollection: GenericMeshCollection = {
        id: 'test-collection',
        meshes: [],
        metadata: {
          collectionType: 'csg_result',
          totalVertices: 0,
          totalTriangles: 0,
          boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
          generationTime: 0,
        },
      };

      expect(isGenericMeshCollection(validCollection)).toBe(true);
    });

    it('should reject invalid GenericMeshCollection objects', () => {
      const invalidObjects = [
        null,
        undefined,
        {},
        { id: 'test' }, // Missing required properties
        { id: 'test', meshes: 'not an array' }, // Invalid meshes type
        'not an object',
        42,
      ];

      for (const obj of invalidObjects) {
        expect(isGenericMeshCollection(obj)).toBe(false);
      }
    });
  });

  describe('Default Mesh Metadata', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_MESH_METADATA.surfaceArea).toBe(0);
      expect(DEFAULT_MESH_METADATA.volume).toBe(0);
      expect(DEFAULT_MESH_METADATA.generationTime).toBe(0);
      expect(DEFAULT_MESH_METADATA.optimizationTime).toBe(0);
      expect(DEFAULT_MESH_METADATA.memoryUsage).toBe(0);
      expect(DEFAULT_MESH_METADATA.complexity).toBe(0);
      expect(DEFAULT_MESH_METADATA.isOptimized).toBe(false);
      expect(DEFAULT_MESH_METADATA.hasErrors).toBe(false);
      expect(DEFAULT_MESH_METADATA.warnings).toEqual([]);
      expect(DEFAULT_MESH_METADATA.debugInfo).toEqual({});
      expect(DEFAULT_MESH_METADATA.childIds).toEqual([]);
      expect(DEFAULT_MESH_METADATA.depth).toBe(0);
      expect(DEFAULT_MESH_METADATA.openscadParameters).toEqual({});
      expect(DEFAULT_MESH_METADATA.modifiers).toEqual([]);
      expect(DEFAULT_MESH_METADATA.transformations).toEqual([]);
      expect(DEFAULT_MESH_METADATA.csgOperations).toEqual([]);
    });

    it('should have valid Date objects for timestamps', () => {
      expect(DEFAULT_MESH_METADATA.createdAt).toBeInstanceOf(Date);
      expect(DEFAULT_MESH_METADATA.lastModified).toBeInstanceOf(Date);
      expect(DEFAULT_MESH_METADATA.lastAccessed).toBeInstanceOf(Date);
    });
  });

  describe('Material Configuration', () => {
    it('should support custom material configuration', () => {
      const customMaterial: GenericMaterialConfig = {
        diffuseColor: [0.5, 0.8, 0.2],
        alpha: 0.9,
        emissiveColor: [0.1, 0.1, 0.0],
        specularColor: [1.0, 1.0, 1.0],
        metallicFactor: 0.3,
        roughnessFactor: 0.6,
        normalScale: 1.2,
        occlusionStrength: 0.8,
        transparent: true,
        wireframe: false,
        backFaceCulling: true,
        side: 'double',
        isDebugMaterial: false,
        isBackgroundMaterial: false,
        isShowOnlyMaterial: false,
        isDisabled: false,
        textures: {
          diffuse: 'texture1.jpg',
          normal: 'normal1.jpg',
          metallic: 'metallic1.jpg',
        },
      };

      expect(customMaterial.diffuseColor).toEqual([0.5, 0.8, 0.2]);
      expect(customMaterial.alpha).toBe(0.9);
      expect(customMaterial.textures?.diffuse).toBe('texture1.jpg');
      expect(customMaterial.textures?.normal).toBe('normal1.jpg');
      expect(customMaterial.textures?.metallic).toBe('metallic1.jpg');
    });
  });

  describe('Mesh Metadata', () => {
    it('should support comprehensive metadata', () => {
      const metadata: GenericMeshMetadata = {
        ...DEFAULT_MESH_METADATA,
        meshId: 'cube-001',
        name: 'Test Cube',
        nodeType: 'cube',
        vertexCount: 24,
        triangleCount: 12,
        boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
        surfaceArea: 6.0,
        volume: 1.0,
        generationTime: 15.5,
        optimizationTime: 2.3,
        memoryUsage: 1024,
        complexity: 50,
        sourceLocation: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 10 },
        },
        originalOpenscadCode: 'cube(10);',
        astNodeId: 'node-123',
        isOptimized: true,
        hasErrors: false,
        warnings: ['Low polygon count'],
        debugInfo: { renderTime: 5.2 },
        parentId: 'parent-001',
        childIds: ['child-001', 'child-002'],
        depth: 2,
        openscadParameters: { size: 10, center: false },
        modifiers: ['#'],
        transformations: ['translate', 'rotate'],
        csgOperations: ['union'],
      };

      expect(metadata.meshId).toBe('cube-001');
      expect(metadata.name).toBe('Test Cube');
      expect(metadata.nodeType).toBe('cube');
      expect(metadata.vertexCount).toBe(24);
      expect(metadata.triangleCount).toBe(12);
      expect(metadata.surfaceArea).toBe(6.0);
      expect(metadata.volume).toBe(1.0);
      expect(metadata.generationTime).toBe(15.5);
      expect(metadata.sourceLocation?.start.line).toBe(1);
      expect(metadata.originalOpenscadCode).toBe('cube(10);');
      expect(metadata.warnings).toEqual(['Low polygon count']);
      expect(metadata.childIds).toEqual(['child-001', 'child-002']);
      expect(metadata.modifiers).toEqual(['#']);
      expect(metadata.transformations).toEqual(['translate', 'rotate']);
      expect(metadata.csgOperations).toEqual(['union']);
    });
  });

  describe('Mesh Collection', () => {
    it('should support mesh collections with metadata', () => {
      const collection: GenericMeshCollection = {
        id: 'csg-result-001',
        meshes: [],
        metadata: {
          collectionType: 'csg_result',
          totalVertices: 100,
          totalTriangles: 50,
          boundingBox: new BoundingBox(Vector3.Zero(), new Vector3(10, 10, 10)),
          generationTime: 25.7,
          sourceLocation: {
            start: { line: 5, column: 1, offset: 100 },
            end: { line: 8, column: 20, offset: 200 },
          },
        },
      };

      expect(collection.id).toBe('csg-result-001');
      expect(collection.metadata.collectionType).toBe('csg_result');
      expect(collection.metadata.totalVertices).toBe(100);
      expect(collection.metadata.totalTriangles).toBe(50);
      expect(collection.metadata.generationTime).toBe(25.7);
      expect(collection.metadata.sourceLocation?.start.line).toBe(5);
    });
  });
});
