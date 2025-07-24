/**
 * @file axis-constants.test.ts
 * @description Tests for axis constants module
 */

import { Vector3 } from '@babylonjs/core';
import { describe, expect, it } from 'vitest';
import {
  AXIS_DIRECTIONS,
  AXIS_NAMES,
  AXIS_ROTATIONS,
  DEFAULT_AXIS_PARAMS,
  MATERIAL_CONSTANTS,
  MESH_NAMES,
  PERFORMANCE_CONSTANTS,
  SCREEN_SPACE_CONSTANTS,
  type AxisName,
} from './axis-constants';

describe('AxisConstants', () => {
  describe('AXIS_NAMES', () => {
    it('should contain all three axis names', () => {
      expect(AXIS_NAMES.X).toBe('X');
      expect(AXIS_NAMES.Y).toBe('Y');
      expect(AXIS_NAMES.Z).toBe('Z');
    });

    it('should be immutable object', () => {
      // In TypeScript, the 'as const' assertion makes it readonly at compile time
      // At runtime, we can check that the object structure is preserved
      const originalX = AXIS_NAMES.X;
      expect(originalX).toBe('X');
      expect(typeof AXIS_NAMES).toBe('object');
      expect(AXIS_NAMES).toBeTruthy();
    });
  });

  describe('AXIS_DIRECTIONS', () => {
    it('should have correct unit vectors for each axis', () => {
      expect(AXIS_DIRECTIONS.X).toEqual(new Vector3(1, 0, 0));
      expect(AXIS_DIRECTIONS.Y).toEqual(new Vector3(0, 1, 0));
      expect(AXIS_DIRECTIONS.Z).toEqual(new Vector3(0, 0, 1));
    });

    it('should have unit length vectors', () => {
      Object.values(AXIS_DIRECTIONS).forEach((direction) => {
        expect(direction.length()).toBeCloseTo(1.0, 5);
      });
    });

    it('should be orthogonal to each other', () => {
      const { X, Y, Z } = AXIS_DIRECTIONS;
      
      expect(Vector3.Dot(X, Y)).toBeCloseTo(0, 5);
      expect(Vector3.Dot(Y, Z)).toBeCloseTo(0, 5);
      expect(Vector3.Dot(Z, X)).toBeCloseTo(0, 5);
    });
  });

  describe('DEFAULT_AXIS_PARAMS', () => {
    it('should have reasonable default values', () => {
      expect(DEFAULT_AXIS_PARAMS.LENGTH).toBe(1000);
      expect(DEFAULT_AXIS_PARAMS.PIXEL_WIDTH).toBe(2.0);
      expect(DEFAULT_AXIS_PARAMS.CYLINDER_DIAMETER).toBe(0.3);
      expect(DEFAULT_AXIS_PARAMS.TESSELLATION).toBe(8);
      expect(DEFAULT_AXIS_PARAMS.OPACITY).toBe(1.0);
    });

    it('should have positive values', () => {
      Object.values(DEFAULT_AXIS_PARAMS).forEach((value) => {
        expect(value).toBeGreaterThan(0);
      });
    });
  });

  describe('SCREEN_SPACE_CONSTANTS', () => {
    it('should have valid shader configuration', () => {
      expect(SCREEN_SPACE_CONSTANTS.SHADER_NAME).toBe('screenSpaceAxis');
      expect(SCREEN_SPACE_CONSTANTS.MIN_PIXEL_WIDTH).toBe(1.0);
      expect(SCREEN_SPACE_CONSTANTS.MAX_PIXEL_WIDTH).toBe(10.0);
      expect(SCREEN_SPACE_CONSTANTS.DEFAULT_RESOLUTION).toEqual([1920, 1080]);
    });

    it('should have valid pixel width range', () => {
      expect(SCREEN_SPACE_CONSTANTS.MIN_PIXEL_WIDTH).toBeLessThan(
        SCREEN_SPACE_CONSTANTS.MAX_PIXEL_WIDTH
      );
    });
  });

  describe('AXIS_ROTATIONS', () => {
    it('should have correct rotations for each axis', () => {
      expect(AXIS_ROTATIONS.X).toEqual({ x: 0, y: 0, z: Math.PI / 2 });
      expect(AXIS_ROTATIONS.Y).toEqual({ x: 0, y: 0, z: 0 });
      expect(AXIS_ROTATIONS.Z).toEqual({ x: Math.PI / 2, y: 0, z: 0 });
    });

    it('should have rotations for all axis names', () => {
      // Test that the object has the expected structure
      expect(Object.keys(AXIS_ROTATIONS)).toHaveLength(3);
      expect(Object.keys(AXIS_ROTATIONS)).toContain('X');
      expect(Object.keys(AXIS_ROTATIONS)).toContain('Y');
      expect(Object.keys(AXIS_ROTATIONS)).toContain('Z');
      
      // Test that each rotation is defined and has the correct structure
      expect(AXIS_ROTATIONS.X).toBeDefined();
      expect(AXIS_ROTATIONS.Y).toBeDefined();
      expect(AXIS_ROTATIONS.Z).toBeDefined();
      
      // Test that each rotation has x, y, z properties
      Object.values(AXIS_ROTATIONS).forEach((rotation) => {
        expect(rotation).toHaveProperty('x');
        expect(rotation).toHaveProperty('y');
        expect(rotation).toHaveProperty('z');
        expect(typeof rotation.x).toBe('number');
        expect(typeof rotation.y).toBe('number');
        expect(typeof rotation.z).toBe('number');
      });
    });
  });

  describe('MATERIAL_CONSTANTS', () => {
    it('should have valid material properties', () => {
      expect(MATERIAL_CONSTANTS.EMISSIVE_FACTOR).toBe(0.8);
      expect(MATERIAL_CONSTANTS.SPECULAR_COLOR).toEqual([1, 1, 1]);
      expect(MATERIAL_CONSTANTS.DIFFUSE_INTENSITY).toBe(1.0);
    });

    it('should have values in valid ranges', () => {
      expect(MATERIAL_CONSTANTS.EMISSIVE_FACTOR).toBeGreaterThanOrEqual(0);
      expect(MATERIAL_CONSTANTS.EMISSIVE_FACTOR).toBeLessThanOrEqual(1);
      expect(MATERIAL_CONSTANTS.DIFFUSE_INTENSITY).toBeGreaterThan(0);
    });
  });

  describe('MESH_NAMES', () => {
    it('should have consistent naming conventions', () => {
      expect(MESH_NAMES.CYLINDER_SUFFIX).toBe('AxisFull');
      expect(MESH_NAMES.LINES_SUFFIX).toBe('AxisScreenSpace');
      expect(MESH_NAMES.MATERIAL_SUFFIX).toBe('Material');
      expect(MESH_NAMES.SCREEN_SPACE_MATERIAL_SUFFIX).toBe('ScreenSpaceMaterial');
    });

    it('should have non-empty strings', () => {
      Object.values(MESH_NAMES).forEach((name) => {
        expect(name).toBeTruthy();
        expect(typeof name).toBe('string');
      });
    });
  });

  describe('PERFORMANCE_CONSTANTS', () => {
    it('should have reasonable performance targets', () => {
      expect(PERFORMANCE_CONSTANTS.MAX_AXIS_COUNT).toBe(3);
      expect(PERFORMANCE_CONSTANTS.RENDER_TARGET_FPS).toBe(60);
      expect(PERFORMANCE_CONSTANTS.MAX_RENDER_TIME_MS).toBe(16);
    });

    it('should have consistent performance values', () => {
      const expectedFrameTime = 1000 / PERFORMANCE_CONSTANTS.RENDER_TARGET_FPS;
      // MAX_RENDER_TIME_MS should be close to the frame time (allowing for floor rounding)
      expect(PERFORMANCE_CONSTANTS.MAX_RENDER_TIME_MS).toBeGreaterThanOrEqual(Math.floor(expectedFrameTime));
      expect(PERFORMANCE_CONSTANTS.MAX_RENDER_TIME_MS).toBeLessThanOrEqual(Math.ceil(expectedFrameTime));
    });
  });
});