/**
 * @file Ghost Object Positioning Utility Tests
 * 
 * Tests for calculating optimal ghost object positioning to avoid overlap
 * with transformed objects while maintaining visual comparison context.
 * 
 * Following TDD, DRY, KISS, and SRP principles:
 * - TDD: Tests written first to define expected behavior
 * - DRY: Reusable positioning logic for all transformation types
 * - KISS: Simple, clear positioning calculations
 * - SRP: Single responsibility for ghost positioning
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { describe, test, expect } from 'vitest';
import { 
  detectTransformationType, 
  calculateGhostOffset, 
  calculateCameraBounds,
  type TransformationType,
  type GhostPositionConfig
} from './ghost-positioning';

describe('Ghost Object Positioning Utilities', () => {
  describe('detectTransformationType', () => {
    test('should detect translate transformation', () => {
      const openscadCode = 'translate([10, 0, 0]) cube([5, 5, 5]);';
      const result = detectTransformationType(openscadCode);
      
      expect(result.type).toBe('translate');
      expect(result.values).toEqual([10, 0, 0]);
    });

    test('should detect rotate transformation', () => {
      const openscadCode = 'rotate([45, 0, 0]) cube([5, 5, 5]);';
      const result = detectTransformationType(openscadCode);
      
      expect(result.type).toBe('rotate');
      expect(result.values).toEqual([45, 0, 0]);
    });

    test('should detect scale transformation', () => {
      const openscadCode = 'scale([2, 2, 2]) cube([5, 5, 5]);';
      const result = detectTransformationType(openscadCode);
      
      expect(result.type).toBe('scale');
      expect(result.values).toEqual([2, 2, 2]);
    });

    test('should detect combined transformations', () => {
      const openscadCode = 'translate([10, 5, 0]) rotate([45, 0, 0]) scale([2, 1, 1]) cube([5, 5, 5]);';
      const result = detectTransformationType(openscadCode);
      
      expect(result.type).toBe('combined');
      expect(result.transformations).toHaveLength(3);
      expect(result.transformations?.[0]).toEqual({ type: 'translate', values: [10, 5, 0] });
      expect(result.transformations?.[1]).toEqual({ type: 'rotate', values: [45, 0, 0] });
      expect(result.transformations?.[2]).toEqual({ type: 'scale', values: [2, 1, 1] });
    });

    test('should handle single value transformations', () => {
      const openscadCode = 'rotate(30) cube([5, 5, 5]);';
      const result = detectTransformationType(openscadCode);
      
      expect(result.type).toBe('rotate');
      expect(result.values).toEqual([30]);
    });

    test('should return none for no transformations', () => {
      const openscadCode = 'cube([5, 5, 5]);';
      const result = detectTransformationType(openscadCode);
      
      expect(result.type).toBe('none');
      expect(result.values).toEqual([]);
    });
  });

  describe('calculateGhostOffset', () => {
    test('should calculate offset for translate transformation', () => {
      const transformation: TransformationType = {
        type: 'translate',
        values: [10, 0, 0]
      };
      
      const offset = calculateGhostOffset(transformation);
      
      // Ghost should be positioned opposite to translation direction
      expect(offset.x).toBeLessThan(0); // Opposite to positive X translation
      expect(offset.y).toBe(0); // No Y translation, so no Y offset needed
      expect(offset.z).toBe(0); // No Z translation, so no Z offset needed
    });

    test('should calculate offset for rotate transformation', () => {
      const transformation: TransformationType = {
        type: 'rotate',
        values: [45, 0, 0]
      };
      
      const offset = calculateGhostOffset(transformation);
      
      // For rotation, ghost should be positioned to show rotation effect
      expect(Math.abs(offset.x)).toBeGreaterThan(0);
      expect(Math.abs(offset.y)).toBeGreaterThan(0);
      expect(Math.abs(offset.z)).toBeGreaterThan(0);
    });

    test('should calculate offset for scale transformation', () => {
      const transformation: TransformationType = {
        type: 'scale',
        values: [2, 2, 2]
      };
      
      const offset = calculateGhostOffset(transformation);
      
      // For scaling, ghost should be positioned to show size comparison
      expect(Math.abs(offset.x)).toBeGreaterThan(0);
      expect(Math.abs(offset.y)).toBeGreaterThan(0);
      expect(Math.abs(offset.z)).toBeGreaterThan(0);
    });

    test('should calculate offset for combined transformations', () => {
      const transformation: TransformationType = {
        type: 'combined',
        transformations: [
          { type: 'translate', values: [10, 0, 0] },
          { type: 'rotate', values: [45, 0, 0] }
        ]
      };
      
      const offset = calculateGhostOffset(transformation);
      
      // Combined transformations should consider all effects
      expect(Math.abs(offset.x)).toBeGreaterThan(0);
      expect(Math.abs(offset.y)).toBeGreaterThan(0);
      expect(Math.abs(offset.z)).toBeGreaterThan(0);
    });

    test('should return zero offset for no transformation', () => {
      const transformation: TransformationType = {
        type: 'none',
        values: []
      };
      
      const offset = calculateGhostOffset(transformation);
      
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
      expect(offset.z).toBe(0);
    });
  });

  describe('calculateCameraBounds', () => {
    test('should calculate bounds including both objects', () => {
      const transformedBounds = {
        min: { x: 7.5, y: -2.5, z: -2.5 },
        max: { x: 12.5, y: 2.5, z: 2.5 }
      };
      
      const ghostBounds = {
        min: { x: -7.5, y: -2.5, z: -2.5 },
        max: { x: -2.5, y: 2.5, z: 2.5 }
      };
      
      const cameraBounds = calculateCameraBounds(transformedBounds, ghostBounds);
      
      expect(cameraBounds.min.x).toBe(-7.5); // Minimum of both objects
      expect(cameraBounds.max.x).toBe(12.5); // Maximum of both objects
      expect(cameraBounds.center.x).toBe(2.5); // Center between both objects
    });

    test('should handle overlapping bounds', () => {
      const transformedBounds = {
        min: { x: -2.5, y: -2.5, z: -2.5 },
        max: { x: 2.5, y: 2.5, z: 2.5 }
      };
      
      const ghostBounds = {
        min: { x: -3, y: -3, z: -3 },
        max: { x: 3, y: 3, z: 3 }
      };
      
      const cameraBounds = calculateCameraBounds(transformedBounds, ghostBounds);
      
      expect(cameraBounds.min.x).toBe(-3);
      expect(cameraBounds.max.x).toBe(3);
      expect(cameraBounds.center.x).toBe(0);
    });
  });
});
