/**
 * @file trigonometry.test.ts
 * @description Test suite for OpenSCAD-compatible trigonometry functions.
 * Tests degree-based trigonometry functions that match OpenSCAD's behavior exactly.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { describe, expect, it } from 'vitest';
import {
  cosDegrees,
  degreesToRadians,
  radiansToDegrees,
  sinDegrees,
  tanDegrees,
} from './trigonometry';

describe('Trigonometry Utilities', () => {
  describe('degreesToRadians', () => {
    it('should convert 0 degrees to 0 radians', () => {
      expect(degreesToRadians(0)).toBeCloseTo(0);
    });

    it('should convert 90 degrees to π/2 radians', () => {
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
    });

    it('should convert 180 degrees to π radians', () => {
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    });

    it('should convert 360 degrees to 2π radians', () => {
      expect(degreesToRadians(360)).toBeCloseTo(2 * Math.PI);
    });

    it('should handle negative angles', () => {
      expect(degreesToRadians(-90)).toBeCloseTo(-Math.PI / 2);
    });

    it('should handle angles > 360 degrees', () => {
      expect(degreesToRadians(450)).toBeCloseTo(2.5 * Math.PI);
    });
  });

  describe('radiansToDegrees', () => {
    it('should convert 0 radians to 0 degrees', () => {
      expect(radiansToDegrees(0)).toBeCloseTo(0);
    });

    it('should convert π/2 radians to 90 degrees', () => {
      expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90);
    });

    it('should convert π radians to 180 degrees', () => {
      expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
    });

    it('should convert 2π radians to 360 degrees', () => {
      expect(radiansToDegrees(2 * Math.PI)).toBeCloseTo(360);
    });

    it('should handle negative angles', () => {
      expect(radiansToDegrees(-Math.PI / 2)).toBeCloseTo(-90);
    });
  });

  describe('cosDegrees', () => {
    it('should calculate cos(0°) = 1', () => {
      expect(cosDegrees(0)).toBeCloseTo(1);
    });

    it('should calculate cos(90°) = 0', () => {
      expect(cosDegrees(90)).toBeCloseTo(0, 10);
    });

    it('should calculate cos(180°) = -1', () => {
      expect(cosDegrees(180)).toBeCloseTo(-1);
    });

    it('should calculate cos(270°) = 0', () => {
      expect(cosDegrees(270)).toBeCloseTo(0, 10);
    });

    it('should calculate cos(360°) = 1', () => {
      expect(cosDegrees(360)).toBeCloseTo(1);
    });

    it('should handle negative angles', () => {
      expect(cosDegrees(-90)).toBeCloseTo(0, 10);
    });

    it('should handle angles > 360°', () => {
      expect(cosDegrees(450)).toBeCloseTo(0, 10); // 450° = 90°
    });

    it('should match OpenSCAD sphere generation values', () => {
      // For $fn=3 sphere, phi angles are 45° and 135°
      expect(cosDegrees(45)).toBeCloseTo(Math.sqrt(2) / 2, 10);
      expect(cosDegrees(135)).toBeCloseTo(-Math.sqrt(2) / 2, 10);
    });
  });

  describe('sinDegrees', () => {
    it('should calculate sin(0°) = 0', () => {
      expect(sinDegrees(0)).toBeCloseTo(0, 10);
    });

    it('should calculate sin(90°) = 1', () => {
      expect(sinDegrees(90)).toBeCloseTo(1);
    });

    it('should calculate sin(180°) = 0', () => {
      expect(sinDegrees(180)).toBeCloseTo(0, 10);
    });

    it('should calculate sin(270°) = -1', () => {
      expect(sinDegrees(270)).toBeCloseTo(-1);
    });

    it('should calculate sin(360°) = 0', () => {
      expect(sinDegrees(360)).toBeCloseTo(0, 10);
    });

    it('should handle negative angles', () => {
      expect(sinDegrees(-90)).toBeCloseTo(-1);
    });

    it('should handle angles > 360°', () => {
      expect(sinDegrees(450)).toBeCloseTo(1); // 450° = 90°
    });

    it('should match OpenSCAD sphere generation values', () => {
      // For $fn=3 sphere, phi angles are 45° and 135°
      expect(sinDegrees(45)).toBeCloseTo(Math.sqrt(2) / 2, 10);
      expect(sinDegrees(135)).toBeCloseTo(Math.sqrt(2) / 2, 10);
    });
  });

  describe('tanDegrees', () => {
    it('should calculate tan(0°) = 0', () => {
      expect(tanDegrees(0)).toBeCloseTo(0, 10);
    });

    it('should calculate tan(45°) = 1', () => {
      expect(tanDegrees(45)).toBeCloseTo(1);
    });

    it('should calculate tan(180°) = 0', () => {
      expect(tanDegrees(180)).toBeCloseTo(0, 10);
    });

    it('should handle negative angles', () => {
      expect(tanDegrees(-45)).toBeCloseTo(-1);
    });

    it('should handle angles > 360°', () => {
      expect(tanDegrees(405)).toBeCloseTo(1); // 405° = 45°
    });

    it('should return very large values near 90°', () => {
      expect(Math.abs(tanDegrees(89.9))).toBeGreaterThan(100);
      expect(Math.abs(tanDegrees(90.1))).toBeGreaterThan(100);
    });
  });

  describe('OpenSCAD-specific test cases', () => {
    it('should generate correct circle vertices for $fn=3', () => {
      // OpenSCAD circle with $fn=3 generates vertices at 0°, 120°, 240°
      const radius = 5;
      const vertices = [];

      for (let i = 0; i < 3; i++) {
        const phi = (360.0 * i) / 3;
        vertices.push({
          x: radius * cosDegrees(phi),
          y: radius * sinDegrees(phi),
        });
      }

      // Vertex 0: 0°
      expect(vertices[0]).toBeDefined();
      expect(vertices[0]?.x).toBeCloseTo(5);
      expect(vertices[0]?.y).toBeCloseTo(0, 10);

      // Vertex 1: 120°
      expect(vertices[1]).toBeDefined();
      expect(vertices[1]?.x).toBeCloseTo(-2.5);
      expect(vertices[1]?.y).toBeCloseTo(4.330127, 5);

      // Vertex 2: 240°
      expect(vertices[2]).toBeDefined();
      expect(vertices[2]?.x).toBeCloseTo(-2.5);
      expect(vertices[2]?.y).toBeCloseTo(-4.330127, 5);
    });

    it('should generate correct sphere ring vertices for $fn=3', () => {
      // OpenSCAD sphere with $fn=3 generates 2 rings at phi=45° and phi=135°
      const radius = 5;
      const fragments = 3;
      const numRings = Math.floor((fragments + 1) / 2); // 2 rings

      const rings = [];
      for (let i = 0; i < numRings; i++) {
        const phi = (180.0 * (i + 0.5)) / numRings;
        const ringRadius = radius * sinDegrees(phi);
        const z = radius * cosDegrees(phi);

        rings.push({ phi, ringRadius, z });
      }

      // Ring 0: phi = 45°
      expect(rings[0]).toBeDefined();
      expect(rings[0]?.phi).toBeCloseTo(45);
      expect(rings[0]?.ringRadius).toBeCloseTo(3.535534, 5);
      expect(rings[0]?.z).toBeCloseTo(3.535534, 5);

      // Ring 1: phi = 135°
      expect(rings[1]).toBeDefined();
      expect(rings[1]?.phi).toBeCloseTo(135);
      expect(rings[1]?.ringRadius).toBeCloseTo(3.535534, 5);
      expect(rings[1]?.z).toBeCloseTo(-3.535534, 5);
    });

    it('should handle edge cases that OpenSCAD encounters', () => {
      // Very small angles (0.001 degrees ≈ 0.0000175 radians)
      expect(cosDegrees(0.001)).toBeCloseTo(1, 9);
      expect(sinDegrees(0.001)).toBeCloseTo(0.0000174533, 5); // sin(0.001°) ≈ 0.0000174533

      // Very large angles
      expect(cosDegrees(36000)).toBeCloseTo(1, 9); // 36000° = 0°
      expect(sinDegrees(36000)).toBeCloseTo(0, 9);

      // Fractional angles
      expect(cosDegrees(30.5)).toBeCloseTo(Math.cos(degreesToRadians(30.5)), 9);
      expect(sinDegrees(30.5)).toBeCloseTo(Math.sin(degreesToRadians(30.5)), 9);
    });
  });
});
