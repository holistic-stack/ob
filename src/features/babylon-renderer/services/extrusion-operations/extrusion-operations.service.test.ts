/**
 * @file Extrusion Operations Service Tests
 *
 * Tests for the ExtrusionOperationsService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ExtrusionOperationsService,
  type OpenSCADLinearExtrudeParams,
  type OpenSCADRotateExtrudeParams,
  type Profile2DPoint,
} from './extrusion-operations.service';

describe('ExtrusionOperationsService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let extrusionService: ExtrusionOperationsService;
  let squareProfile: Profile2DPoint[];
  let circleProfile: Profile2DPoint[];

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    extrusionService = new ExtrusionOperationsService(scene);

    // Create test profiles
    squareProfile = createSquareProfile(1);
    circleProfile = createCircleProfile(1, 8);
  });

  afterEach(() => {
    // Clean up resources
    scene.dispose();
    engine.dispose();
  });

  describe('Linear Extrude Operations', () => {
    it('should perform basic linear extrusion', async () => {
      const params: OpenSCADLinearExtrudeParams = {
        height: 5,
      };

      const result = await extrusionService.linearExtrude(squareProfile, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const extrudedMesh = result.data;
        expect(extrudedMesh.id).toBeDefined();
        expect(extrudedMesh.metadata.nodeType).toBe('linear_extrude');
        expect(extrudedMesh.metadata.openscadParameters.height).toBe(5);
        expect(extrudedMesh.geometry.vertexCount).toBeGreaterThan(0);
        expect(extrudedMesh.geometry.triangleCount).toBeGreaterThan(0);
      }
    });

    it('should perform centered linear extrusion', async () => {
      const params: OpenSCADLinearExtrudeParams = {
        height: 10,
        center: true,
      };

      const result = await extrusionService.linearExtrude(squareProfile, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const extrudedMesh = result.data;
        expect(extrudedMesh.metadata.openscadParameters.center).toBe(true);
        expect(extrudedMesh.metadata.openscadParameters.height).toBe(10);
      }
    });

    it('should handle linear extrusion with twist parameter', async () => {
      const params: OpenSCADLinearExtrudeParams = {
        height: 8,
        twist: 45,
      };

      const result = await extrusionService.linearExtrude(squareProfile, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const extrudedMesh = result.data;
        expect(extrudedMesh.metadata.openscadParameters.twist).toBe(45);
      }
    });

    it('should handle linear extrusion with scale parameter', async () => {
      const params: OpenSCADLinearExtrudeParams = {
        height: 6,
        scale: [1.5, 2.0],
      };

      const result = await extrusionService.linearExtrude(squareProfile, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const extrudedMesh = result.data;
        expect(extrudedMesh.metadata.openscadParameters.scale).toEqual([1.5, 2.0]);
      }
    });

    it('should handle linear extrusion with uniform scale', async () => {
      const params: OpenSCADLinearExtrudeParams = {
        height: 4,
        scale: 2.0,
      };

      const result = await extrusionService.linearExtrude(squareProfile, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const extrudedMesh = result.data;
        expect(extrudedMesh.metadata.openscadParameters.scale).toBe(2.0);
      }
    });

    it('should fail with invalid height', async () => {
      const params: OpenSCADLinearExtrudeParams = {
        height: 0,
      };

      const result = await extrusionService.linearExtrude(squareProfile, params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PARAMETERS');
        expect(result.error.operationType).toBe('linear_extrude');
      }
    });

    it('should fail with negative height', async () => {
      const params: OpenSCADLinearExtrudeParams = {
        height: -5,
      };

      const result = await extrusionService.linearExtrude(squareProfile, params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PARAMETERS');
      }
    });

    it('should fail with invalid scale values', async () => {
      const params: OpenSCADLinearExtrudeParams = {
        height: 5,
        scale: [0, 1],
      };

      const result = await extrusionService.linearExtrude(squareProfile, params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PARAMETERS');
      }
    });
  });

  describe('Rotate Extrude Operations', () => {
    it('should perform basic rotate extrusion', async () => {
      const params: OpenSCADRotateExtrudeParams = {};

      const result = await extrusionService.rotateExtrude(squareProfile, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const extrudedMesh = result.data;
        expect(extrudedMesh.id).toBeDefined();
        expect(extrudedMesh.metadata.nodeType).toBe('rotate_extrude');
        expect(extrudedMesh.geometry.vertexCount).toBeGreaterThan(0);
        expect(extrudedMesh.geometry.triangleCount).toBeGreaterThan(0);
      }
    });

    it('should perform partial rotate extrusion', async () => {
      const params: OpenSCADRotateExtrudeParams = {
        angle: 180,
      };

      const result = await extrusionService.rotateExtrude(squareProfile, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const extrudedMesh = result.data;
        expect(extrudedMesh.metadata.openscadParameters.angle).toBe(180);
      }
    });

    it('should handle custom tessellation', async () => {
      const params: OpenSCADRotateExtrudeParams = {
        $fn: 32,
      };

      const result = await extrusionService.rotateExtrude(circleProfile, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const extrudedMesh = result.data;
        expect(extrudedMesh.metadata.openscadParameters.$fn).toBe(32);
      }
    });

    it('should fail with invalid angle', async () => {
      const params: OpenSCADRotateExtrudeParams = {
        angle: 400,
      };

      const result = await extrusionService.rotateExtrude(squareProfile, params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PARAMETERS');
        expect(result.error.operationType).toBe('rotate_extrude');
      }
    });

    it('should fail with invalid tessellation', async () => {
      const params: OpenSCADRotateExtrudeParams = {
        $fn: 2,
      };

      const result = await extrusionService.rotateExtrude(squareProfile, params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PARAMETERS');
      }
    });
  });

  describe('Profile Validation', () => {
    it('should fail with insufficient profile points', async () => {
      const invalidProfile: Profile2DPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ];

      const params: OpenSCADLinearExtrudeParams = { height: 5 };
      const result = await extrusionService.linearExtrude(invalidProfile, params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PROFILE');
      }
    });

    it('should fail with invalid coordinates', async () => {
      const invalidProfile: Profile2DPoint[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: Number.NaN, y: 1 },
        { x: 0, y: 1 },
      ];

      const params: OpenSCADLinearExtrudeParams = { height: 5 };
      const result = await extrusionService.linearExtrude(invalidProfile, params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PROFILE');
      }
    });

    it('should handle complex profiles', async () => {
      const complexProfile = createStarProfile(2, 1, 5);
      const params: OpenSCADLinearExtrudeParams = { height: 3 };

      const result = await extrusionService.linearExtrude(complexProfile, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const extrudedMesh = result.data;
        expect(extrudedMesh.geometry.vertexCount).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance and Metadata', () => {
    it('should track operation timing', async () => {
      const params: OpenSCADLinearExtrudeParams = { height: 5 };
      const result = await extrusionService.linearExtrude(squareProfile, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const extrudedMesh = result.data;
        expect(extrudedMesh.metadata.generationTime).toBeGreaterThan(0);
      }
    });

    it('should preserve operation parameters in metadata', async () => {
      const params: OpenSCADLinearExtrudeParams = {
        height: 7,
        center: true,
        twist: 30,
        scale: [1.2, 1.8],
        convexity: 10,
      };

      const result = await extrusionService.linearExtrude(squareProfile, params);
      expect(result.success).toBe(true);

      if (result.success) {
        const extrudedMesh = result.data;
        const openscadParams = extrudedMesh.metadata.openscadParameters;
        expect(openscadParams.height).toBe(7);
        expect(openscadParams.center).toBe(true);
        expect(openscadParams.twist).toBe(30);
        expect(openscadParams.scale).toEqual([1.2, 1.8]);
        expect(openscadParams.convexity).toBe(10);
      }
    });
  });

  // Helper function to create square profile
  function createSquareProfile(size: number): Profile2DPoint[] {
    return [
      { x: -size / 2, y: -size / 2 },
      { x: size / 2, y: -size / 2 },
      { x: size / 2, y: size / 2 },
      { x: -size / 2, y: size / 2 },
    ];
  }

  // Helper function to create circle profile
  function createCircleProfile(radius: number, segments: number): Profile2DPoint[] {
    const points: Profile2DPoint[] = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    }
    return points;
  }

  // Helper function to create star profile
  function createStarProfile(
    outerRadius: number,
    innerRadius: number,
    points: number
  ): Profile2DPoint[] {
    const profile: Profile2DPoint[] = [];
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * 2 * Math.PI;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      profile.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    }
    return profile;
  }
});
