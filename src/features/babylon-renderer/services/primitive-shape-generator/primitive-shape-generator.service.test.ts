/**
 * @file Primitive Shape Generator Service Tests
 *
 * Tests for the PrimitiveShapeGeneratorService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PrimitiveShapeGeneratorService,
  type OpenSCADCubeParams,
  type OpenSCADSphereParams,
  type OpenSCADCylinderParams,
} from './primitive-shape-generator.service';

describe('PrimitiveShapeGeneratorService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let generator: PrimitiveShapeGeneratorService;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    generator = new PrimitiveShapeGeneratorService(scene);
  });

  afterEach(() => {
    // Clean up resources
    scene.dispose();
    engine.dispose();
  });

  describe('Cube Generation', () => {
    it('should generate cube with scalar size', async () => {
      const params: OpenSCADCubeParams = {
        size: 10,
        center: false,
      };

      const result = await generator.generateCube(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        expect(meshData.id).toBeDefined();
        expect(meshData.metadata.nodeType).toBe('cube');
        expect(meshData.metadata.openscadParameters).toEqual(params);
        expect(meshData.geometry.vertexCount).toBeGreaterThan(0);
        expect(meshData.geometry.triangleCount).toBeGreaterThan(0);
      }
    });

    it('should generate cube with vector size', async () => {
      const params: OpenSCADCubeParams = {
        size: [10, 20, 30],
        center: true,
      };

      const result = await generator.generateCube(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        expect(meshData.metadata.nodeType).toBe('cube');
        expect(meshData.metadata.openscadParameters).toEqual(params);
      }
    });

    it('should fail with invalid size parameter', async () => {
      const params: OpenSCADCubeParams = {
        size: null as any,
        center: false,
      };

      const result = await generator.generateCube(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('MESH_GENERATION_FAILED');
        expect(result.error.primitiveType).toBe('cube');
      }
    });
  });

  describe('Sphere Generation', () => {
    it('should generate sphere with radius parameter', async () => {
      const params: OpenSCADSphereParams = {
        radius: 5,
      };

      const result = await generator.generateSphere(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        expect(meshData.metadata.nodeType).toBe('sphere');
        expect(meshData.metadata.openscadParameters).toEqual(params);
        expect(meshData.geometry.vertexCount).toBeGreaterThan(0);
      }
    });

    it('should generate sphere with diameter parameter', async () => {
      const params: OpenSCADSphereParams = {
        diameter: 20,
      };

      const result = await generator.generateSphere(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        expect(meshData.metadata.nodeType).toBe('sphere');
      }
    });

    it('should generate sphere with fragment control', async () => {
      const params: OpenSCADSphereParams = {
        radius: 5,
        fn: 16, // Specific fragment number
      };

      const result = await generator.generateSphere(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        expect(meshData.metadata.nodeType).toBe('sphere');
        expect(meshData.metadata.openscadParameters).toEqual(params);
      }
    });

    it('should use default radius when no parameters provided', async () => {
      const params: OpenSCADSphereParams = {};

      const result = await generator.generateSphere(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        expect(meshData.metadata.nodeType).toBe('sphere');
      }
    });

    it('should fail with negative radius', async () => {
      const params: OpenSCADSphereParams = {
        radius: -5,
      };

      const result = await generator.generateSphere(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('MESH_GENERATION_FAILED');
        expect(result.error.primitiveType).toBe('sphere');
      }
    });
  });

  describe('Cylinder Generation', () => {
    it('should generate cylinder with basic parameters', async () => {
      const params: OpenSCADCylinderParams = {
        height: 10,
        radius: 5,
        center: false,
      };

      const result = await generator.generateCylinder(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        expect(meshData.metadata.nodeType).toBe('cylinder');
        expect(meshData.metadata.openscadParameters).toEqual(params);
        expect(meshData.geometry.vertexCount).toBeGreaterThan(0);
      }
    });

    it('should generate cylinder with different top/bottom radii', async () => {
      const params: OpenSCADCylinderParams = {
        height: 15,
        radius1: 8, // Bottom radius
        radius2: 4, // Top radius
        center: true,
      };

      const result = await generator.generateCylinder(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        expect(meshData.metadata.nodeType).toBe('cylinder');
      }
    });

    it('should generate cylinder with diameter parameters', async () => {
      const params: OpenSCADCylinderParams = {
        height: 20,
        diameter: 12,
        center: false,
      };

      const result = await generator.generateCylinder(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        expect(meshData.metadata.nodeType).toBe('cylinder');
      }
    });

    it('should generate cylinder with fragment control', async () => {
      const params: OpenSCADCylinderParams = {
        height: 10,
        radius: 5,
        center: false,
        fn: 8, // Octagonal cylinder
      };

      const result = await generator.generateCylinder(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        expect(meshData.metadata.nodeType).toBe('cylinder');
      }
    });

    it('should fail with invalid height', async () => {
      const params: OpenSCADCylinderParams = {
        height: 0,
        radius: 5,
        center: false,
      };

      const result = await generator.generateCylinder(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('MESH_GENERATION_FAILED');
        expect(result.error.primitiveType).toBe('cylinder');
      }
    });

    it('should fail with negative height', async () => {
      const params: OpenSCADCylinderParams = {
        height: -10,
        radius: 5,
        center: false,
      };

      const result = await generator.generateCylinder(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('MESH_GENERATION_FAILED');
        expect(result.error.primitiveType).toBe('cylinder');
      }
    });
  });

  describe('Fragment Tessellation', () => {
    it('should calculate tessellation based on fragment number', async () => {
      const params: OpenSCADSphereParams = {
        radius: 5,
        fn: 12,
      };

      const result = await generator.generateSphere(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        // Should use the specified fragment number for tessellation
        expect(meshData.geometry.vertexCount).toBeGreaterThan(0);
      }
    });

    it('should calculate tessellation based on fragment angle and size', async () => {
      const params: OpenSCADSphereParams = {
        radius: 10,
        fa: 30, // Fragment angle
        fs: 1,  // Fragment size
      };

      const result = await generator.generateSphere(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        expect(meshData.geometry.vertexCount).toBeGreaterThan(0);
      }
    });
  });

  describe('Generic Mesh Data Output', () => {
    it('should output proper GenericMeshData structure', async () => {
      const params: OpenSCADCubeParams = {
        size: 5,
        center: true,
      };

      const result = await generator.generateCube(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const meshData = result.data;
        
        // Check structure
        expect(meshData.id).toBeDefined();
        expect(meshData.geometry).toBeDefined();
        expect(meshData.material).toBeDefined();
        expect(meshData.transform).toBeDefined();
        expect(meshData.metadata).toBeDefined();
        
        // Check geometry
        expect(meshData.geometry.positions).toBeInstanceOf(Float32Array);
        expect(meshData.geometry.indices).toBeInstanceOf(Uint32Array);
        expect(meshData.geometry.vertexCount).toBeGreaterThan(0);
        expect(meshData.geometry.triangleCount).toBeGreaterThan(0);
        
        // Check metadata
        expect(meshData.metadata.meshId).toBe(meshData.id);
        expect(meshData.metadata.nodeType).toBe('cube');
        expect(meshData.metadata.generationTime).toBeGreaterThan(0);
        expect(meshData.metadata.openscadParameters).toEqual(params);
      }
    });
  });
});
