/**
 * @file Transformation Operations Service Tests
 *
 * Tests for the TransformationOperationsService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import { BoundingBox, Matrix, NullEngine, Scene, Vector3 } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GenericMeshData } from '../../types/generic-mesh-data.types';
import { DEFAULT_MESH_METADATA, MATERIAL_PRESETS } from '../../types/generic-mesh-data.types';
import {
  type OpenSCADColorParams,
  type OpenSCADMatrixParams,
  type OpenSCADMirrorParams,
  type OpenSCADRotateParams,
  type OpenSCADScaleParams,
  type OpenSCADTranslateParams,
  TransformationOperationsService,
} from './transformation-operations.service';

describe('TransformationOperationsService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let transformService: TransformationOperationsService;
  let testMeshData: GenericMeshData;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    transformService = new TransformationOperationsService();

    // Create test mesh data (simple triangle)
    testMeshData = {
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
        nodeType: 'test',
        vertexCount: 3,
        triangleCount: 1,
        boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
      },
    };
  });

  afterEach(() => {
    // Clean up resources
    scene.dispose();
    engine.dispose();
  });

  describe('Translation Operations', () => {
    it('should translate mesh by vector', async () => {
      const params: OpenSCADTranslateParams = {
        vector: [10, 5, -3],
      };

      const result = await transformService.translate(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const transformedMesh = result.data;
        expect(transformedMesh.id).toBe(testMeshData.id);
        expect(transformedMesh.metadata.transformations).toContain('translate');

        // Check that positions were translated
        const positions = transformedMesh.geometry.positions;
        expect(positions[0]).toBeCloseTo(10); // x + 10
        expect(positions[1]).toBeCloseTo(5); // y + 5
        expect(positions[2]).toBeCloseTo(-3); // z + -3
      }
    });

    it('should fail with invalid translation vector', async () => {
      const params: OpenSCADTranslateParams = {
        vector: [10, 5] as any, // Invalid: only 2 components
      };

      const result = await transformService.translate(testMeshData, params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('TRANSFORMATION_FAILED');
        expect(result.error.operationType).toBe('translate');
      }
    });
  });

  describe('Rotation Operations', () => {
    it('should rotate mesh with Euler angles', async () => {
      const params: OpenSCADRotateParams = {
        vector: [0, 0, 90], // 90 degrees around Z-axis
      };

      const result = await transformService.rotate(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const transformedMesh = result.data;
        expect(transformedMesh.metadata.transformations).toContain('rotate');

        // Check that geometry was rotated
        expect(transformedMesh.geometry.vertexCount).toBe(testMeshData.geometry.vertexCount);
        expect(transformedMesh.geometry.triangleCount).toBe(testMeshData.geometry.triangleCount);
      }
    });

    it('should rotate mesh with single angle (Z-axis)', async () => {
      const params: OpenSCADRotateParams = {
        angle: 45,
      };

      const result = await transformService.rotate(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const transformedMesh = result.data;
        expect(transformedMesh.metadata.transformations).toContain('rotate');
      }
    });

    it('should rotate mesh with axis-angle', async () => {
      const params: OpenSCADRotateParams = {
        angle: 90,
        axis: [0, 0, 1], // Z-axis
      };

      const result = await transformService.rotate(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const transformedMesh = result.data;
        expect(transformedMesh.metadata.transformations).toContain('rotate');
      }
    });
  });

  describe('Scale Operations', () => {
    it('should scale mesh uniformly', async () => {
      const params: OpenSCADScaleParams = {
        factor: 2.0,
      };

      const result = await transformService.scale(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const transformedMesh = result.data;
        expect(transformedMesh.metadata.transformations).toContain('scale');

        // Check that positions were scaled
        const positions = transformedMesh.geometry.positions;
        expect(positions[3]).toBeCloseTo(2); // Second vertex x: 1 * 2 = 2
      }
    });

    it('should scale mesh non-uniformly', async () => {
      const params: OpenSCADScaleParams = {
        factor: [2, 3, 0.5],
      };

      const result = await transformService.scale(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const transformedMesh = result.data;
        expect(transformedMesh.metadata.transformations).toContain('scale');
      }
    });
  });

  describe('Mirror Operations', () => {
    it('should mirror mesh across plane', async () => {
      const params: OpenSCADMirrorParams = {
        normal: [1, 0, 0], // Mirror across YZ plane
      };

      const result = await transformService.mirror(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const transformedMesh = result.data;
        expect(transformedMesh.metadata.transformations).toContain('mirror');

        // Check that positions were mirrored
        const positions = transformedMesh.geometry.positions;
        expect(positions[3]).toBeCloseTo(-1); // Second vertex x: 1 -> -1
      }
    });

    it('should fail with invalid normal vector', async () => {
      const params: OpenSCADMirrorParams = {
        normal: [1, 0] as any, // Invalid: only 2 components
      };

      const result = await transformService.mirror(testMeshData, params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('TRANSFORMATION_FAILED');
        expect(result.error.operationType).toBe('mirror');
      }
    });
  });

  describe('Matrix Operations', () => {
    it('should apply matrix transformation', async () => {
      const params: OpenSCADMatrixParams = {
        matrix: [
          [1, 0, 0, 5], // Translation by 5 in X
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ],
      };

      const result = await transformService.multmatrix(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const transformedMesh = result.data;
        expect(transformedMesh.metadata.transformations).toContain('multmatrix');

        // Check that positions were transformed
        const positions = transformedMesh.geometry.positions;
        expect(positions[0]).toBeCloseTo(5); // First vertex x: 0 + 5 = 5
      }
    });

    it('should fail with invalid matrix', async () => {
      const params: OpenSCADMatrixParams = {
        matrix: [
          [1, 0, 0], // Invalid: not 4x4
          [0, 1, 0],
          [0, 0, 1],
        ] as any,
      };

      const result = await transformService.multmatrix(testMeshData, params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('TRANSFORMATION_FAILED');
        expect(result.error.operationType).toBe('multmatrix');
      }
    });
  });

  describe('Color Operations', () => {
    it('should apply RGB color', async () => {
      const params: OpenSCADColorParams = {
        color: [1, 0, 0], // Red
      };

      const result = await transformService.color(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const coloredMesh = result.data;
        expect(coloredMesh.metadata.transformations).toContain('color');
        expect(coloredMesh.material.diffuseColor).toEqual([1, 0, 0]);
        expect(coloredMesh.material.alpha).toBe(1.0);
      }
    });

    it('should apply RGBA color', async () => {
      const params: OpenSCADColorParams = {
        color: [0, 1, 0, 0.5], // Semi-transparent green
      };

      const result = await transformService.color(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const coloredMesh = result.data;
        expect(coloredMesh.material.diffuseColor).toEqual([0, 1, 0]);
        expect(coloredMesh.material.alpha).toBe(0.5);
        expect(coloredMesh.material.transparent).toBe(true);
      }
    });

    it('should apply named color', async () => {
      const params: OpenSCADColorParams = {
        color: 'blue',
      };

      const result = await transformService.color(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const coloredMesh = result.data;
        expect(coloredMesh.material.diffuseColor).toEqual([0, 0, 1]);
      }
    });

    it('should apply hex color', async () => {
      const params: OpenSCADColorParams = {
        color: '#FF8000', // Orange
      };

      const result = await transformService.color(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const coloredMesh = result.data;
        expect(coloredMesh.material.diffuseColor[0]).toBeCloseTo(1.0); // Red component
        expect(coloredMesh.material.diffuseColor[1]).toBeCloseTo(0.5); // Green component
        expect(coloredMesh.material.diffuseColor[2]).toBeCloseTo(0.0); // Blue component
      }
    });

    it('should override alpha parameter', async () => {
      const params: OpenSCADColorParams = {
        color: [1, 1, 1, 1], // Opaque white
        alpha: 0.3, // Override to semi-transparent
      };

      const result = await transformService.color(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const coloredMesh = result.data;
        expect(coloredMesh.material.alpha).toBe(0.3);
        expect(coloredMesh.material.transparent).toBe(true);
      }
    });
  });

  describe('Metadata Updates', () => {
    it('should update metadata correctly after transformation', async () => {
      const params: OpenSCADTranslateParams = {
        vector: [1, 2, 3],
      };

      const result = await transformService.translate(testMeshData, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const transformedMesh = result.data;

        // Check metadata updates
        expect(transformedMesh.metadata.transformations).toContain('translate');
        expect(transformedMesh.metadata.generationTime).toBeGreaterThan(
          testMeshData.metadata.generationTime
        );
        expect(transformedMesh.metadata.lastModified).toBeInstanceOf(Date);
        expect(transformedMesh.metadata.openscadParameters.translate).toEqual(params);
      }
    });
  });
});
