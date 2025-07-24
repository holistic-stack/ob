/**
 * @file geometry-utils.test.ts
 * @description Tests for the GeometryUtils class
 */

import { describe, it, expect } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { GeometryUtils, STANDARD_AXIS_DIRECTIONS, STANDARD_AXIS_ROTATIONS } from './geometry-utils';

describe('GeometryUtils', () => {
  describe('calculateAxisEndpoints', () => {
    it('should calculate correct endpoints for X-axis', () => {
      const config = {
        origin: BABYLON.Vector3.Zero(),
        direction: new BABYLON.Vector3(1, 0, 0),
        length: 100,
      };

      const result = GeometryUtils.calculateAxisEndpoints(config);

      expect(result.positiveEnd.x).toBe(50);
      expect(result.positiveEnd.y).toBe(0);
      expect(result.positiveEnd.z).toBe(0);
      
      expect(result.negativeEnd.x).toBe(-50);
      expect(result.negativeEnd.y).toBe(0);
      expect(result.negativeEnd.z).toBe(0);
      
      expect(result.fullLength).toBe(100);
    });

    it('should calculate correct endpoints for Y-axis', () => {
      const config = {
        origin: new BABYLON.Vector3(10, 20, 30),
        direction: new BABYLON.Vector3(0, 1, 0),
        length: 200,
      };

      const result = GeometryUtils.calculateAxisEndpoints(config);

      expect(result.positiveEnd.x).toBe(10);
      expect(result.positiveEnd.y).toBe(120);
      expect(result.positiveEnd.z).toBe(30);
      
      expect(result.negativeEnd.x).toBe(10);
      expect(result.negativeEnd.y).toBe(-80);
      expect(result.negativeEnd.z).toBe(30);
    });

    it('should handle diagonal directions correctly', () => {
      const config = {
        origin: BABYLON.Vector3.Zero(),
        direction: new BABYLON.Vector3(1, 1, 0).normalize(),
        length: 100,
      };

      const result = GeometryUtils.calculateAxisEndpoints(config);

      // For normalized diagonal direction, endpoints should be at distance 50 from origin
      const positiveDistance = BABYLON.Vector3.Distance(config.origin, result.positiveEnd);
      const negativeDistance = BABYLON.Vector3.Distance(config.origin, result.negativeEnd);
      
      expect(positiveDistance).toBeCloseTo(50, 5);
      expect(negativeDistance).toBeCloseTo(50, 5);
    });
  });

  describe('calculateFullAxisEndpoints', () => {
    it('should calculate full-length endpoints', () => {
      const config = {
        origin: BABYLON.Vector3.Zero(),
        direction: new BABYLON.Vector3(0, 0, 1),
        length: 50,
      };

      const result = GeometryUtils.calculateFullAxisEndpoints(config);

      expect(result.positiveEnd.z).toBe(50);
      expect(result.negativeEnd.z).toBe(-50);
      expect(result.fullLength).toBe(100);
    });
  });

  describe('getAxisRotation', () => {
    it('should return correct rotations for standard axes', () => {
      const xRotation = GeometryUtils.getAxisRotation('X');
      const yRotation = GeometryUtils.getAxisRotation('Y');
      const zRotation = GeometryUtils.getAxisRotation('Z');

      expect(xRotation.z).toBeCloseTo(Math.PI / 2);
      expect(yRotation.x).toBe(0);
      expect(yRotation.y).toBe(0);
      expect(yRotation.z).toBe(0);
      expect(zRotation.x).toBeCloseTo(Math.PI / 2);
    });

    it('should return cloned vectors', () => {
      const rotation1 = GeometryUtils.getAxisRotation('X');
      const rotation2 = GeometryUtils.getAxisRotation('X');

      expect(rotation1).not.toBe(rotation2); // Different instances
      expect(rotation1.equals(rotation2)).toBe(true); // Same values
    });
  });

  describe('getAxisDirection', () => {
    it('should return correct directions for standard axes', () => {
      const xDirection = GeometryUtils.getAxisDirection('X');
      const yDirection = GeometryUtils.getAxisDirection('Y');
      const zDirection = GeometryUtils.getAxisDirection('Z');

      expect(xDirection.x).toBe(1);
      expect(xDirection.y).toBe(0);
      expect(xDirection.z).toBe(0);

      expect(yDirection.x).toBe(0);
      expect(yDirection.y).toBe(1);
      expect(yDirection.z).toBe(0);

      expect(zDirection.x).toBe(0);
      expect(zDirection.y).toBe(0);
      expect(zDirection.z).toBe(1);
    });
  });

  describe('normalizeDirection', () => {
    it('should normalize non-unit vectors', () => {
      const direction = new BABYLON.Vector3(3, 4, 0);
      const normalized = GeometryUtils.normalizeDirection(direction);

      expect(normalized.length()).toBeCloseTo(1, 5);
      expect(normalized.x).toBeCloseTo(0.6, 5);
      expect(normalized.y).toBeCloseTo(0.8, 5);
    });

    it('should handle zero vectors by returning default X-axis', () => {
      const zeroVector = BABYLON.Vector3.Zero();
      const normalized = GeometryUtils.normalizeDirection(zeroVector);

      expect(normalized.x).toBe(1);
      expect(normalized.y).toBe(0);
      expect(normalized.z).toBe(0);
    });

    it('should preserve already normalized vectors', () => {
      const unitVector = new BABYLON.Vector3(0, 1, 0);
      const normalized = GeometryUtils.normalizeDirection(unitVector);

      expect(normalized.length()).toBeCloseTo(1, 5);
      expect(normalized.equals(unitVector)).toBe(true);
    });
  });

  describe('createAxisLinePoints', () => {
    it('should create correct point arrays for positive and negative segments', () => {
      const config = {
        origin: BABYLON.Vector3.Zero(),
        direction: new BABYLON.Vector3(1, 0, 0),
        length: 100,
      };

      const result = GeometryUtils.createAxisLinePoints(config);

      expect(result.positive).toHaveLength(2);
      expect(result.negative).toHaveLength(2);

      // Positive segment: origin to positive end
      expect(result.positive[0].equals(BABYLON.Vector3.Zero())).toBe(true);
      expect(result.positive[1].x).toBe(50);

      // Negative segment: negative end to origin
      expect(result.negative[0].x).toBe(-50);
      expect(result.negative[1].equals(BABYLON.Vector3.Zero())).toBe(true);
    });
  });

  describe('validation methods', () => {
    describe('isValidDirection', () => {
      it('should return true for valid directions', () => {
        expect(GeometryUtils.isValidDirection(new BABYLON.Vector3(1, 0, 0))).toBe(true);
        expect(GeometryUtils.isValidDirection(new BABYLON.Vector3(1, 1, 1))).toBe(true);
      });

      it('should return false for zero vector', () => {
        expect(GeometryUtils.isValidDirection(BABYLON.Vector3.Zero())).toBe(false);
      });
    });

    describe('isValidLength', () => {
      it('should return true for positive finite numbers', () => {
        expect(GeometryUtils.isValidLength(1)).toBe(true);
        expect(GeometryUtils.isValidLength(100.5)).toBe(true);
      });

      it('should return false for invalid lengths', () => {
        expect(GeometryUtils.isValidLength(0)).toBe(false);
        expect(GeometryUtils.isValidLength(-1)).toBe(false);
        expect(GeometryUtils.isValidLength(Infinity)).toBe(false);
        expect(GeometryUtils.isValidLength(NaN)).toBe(false);
      });
    });
  });

  describe('clamp', () => {
    it('should clamp values within bounds', () => {
      expect(GeometryUtils.clamp(5, 0, 10)).toBe(5);
      expect(GeometryUtils.clamp(-5, 0, 10)).toBe(0);
      expect(GeometryUtils.clamp(15, 0, 10)).toBe(10);
    });
  });
});
