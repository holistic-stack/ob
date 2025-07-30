/**
 * @file trigonometry.ts
 * @description OpenSCAD-compatible trigonometry functions using degree-based calculations.
 * These functions replicate OpenSCAD's degree_trig.cc functionality exactly.
 *
 * @example
 * ```typescript
 * // Generate circle vertices like OpenSCAD
 * const radius = 5;
 * const fragments = 3;
 * const vertices = [];
 *
 * for (let i = 0; i < fragments; i++) {
 *   const phi = (360.0 * i) / fragments;
 *   vertices.push({
 *     x: radius * cosDegrees(phi),
 *     y: radius * sinDegrees(phi)
 *   });
 * }
 *
 * // Generate sphere ring like OpenSCAD
 * const phi = 45; // Ring angle
 * const ringRadius = radius * sinDegrees(phi);
 * const z = radius * cosDegrees(phi);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

/**
 * Convert degrees to radians
 *
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 *
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate cosine of angle in degrees
 * Replicates OpenSCAD's cos_degrees function
 *
 * @param degrees - Angle in degrees
 * @returns Cosine value
 */
export function cosDegrees(degrees: number): number {
  return Math.cos(degreesToRadians(degrees));
}

/**
 * Calculate sine of angle in degrees
 * Replicates OpenSCAD's sin_degrees function
 *
 * @param degrees - Angle in degrees
 * @returns Sine value
 */
export function sinDegrees(degrees: number): number {
  return Math.sin(degreesToRadians(degrees));
}

/**
 * Calculate tangent of angle in degrees
 * Replicates OpenSCAD's tan_degrees function
 *
 * @param degrees - Angle in degrees
 * @returns Tangent value
 */
export function tanDegrees(degrees: number): number {
  return Math.tan(degreesToRadians(degrees));
}

/**
 * Calculate arc cosine and return result in degrees
 *
 * @param value - Value between -1 and 1
 * @returns Angle in degrees
 */
export function acosDegrees(value: number): number {
  return radiansToDegrees(Math.acos(value));
}

/**
 * Calculate arc sine and return result in degrees
 *
 * @param value - Value between -1 and 1
 * @returns Angle in degrees
 */
export function asinDegrees(value: number): number {
  return radiansToDegrees(Math.asin(value));
}

/**
 * Calculate arc tangent and return result in degrees
 *
 * @param value - Input value
 * @returns Angle in degrees
 */
export function atanDegrees(value: number): number {
  return radiansToDegrees(Math.atan(value));
}

/**
 * Calculate arc tangent of y/x and return result in degrees
 * Handles quadrant correctly
 *
 * @param y - Y coordinate
 * @param x - X coordinate
 * @returns Angle in degrees
 */
export function atan2Degrees(y: number, x: number): number {
  return radiansToDegrees(Math.atan2(y, x));
}

/**
 * Normalize angle to [0, 360) degrees range
 *
 * @param degrees - Input angle in degrees
 * @returns Normalized angle in [0, 360) range
 */
export function normalizeAngle(degrees: number): number {
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * Normalize angle to [-180, 180) degrees range
 *
 * @param degrees - Input angle in degrees
 * @returns Normalized angle in [-180, 180) range
 */
export function normalizeAngleSigned(degrees: number): number {
  let normalized = degrees % 360;
  if (normalized > 180) {
    normalized -= 360;
  } else if (normalized <= -180) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Check if two angles are approximately equal (within tolerance)
 *
 * @param angle1 - First angle in degrees
 * @param angle2 - Second angle in degrees
 * @param tolerance - Tolerance in degrees (default: 1e-10)
 * @returns True if angles are approximately equal
 */
export function anglesEqual(angle1: number, angle2: number, tolerance: number = 1e-10): boolean {
  const diff = Math.abs(normalizeAngleSigned(angle1 - angle2));
  return diff <= tolerance;
}

/**
 * Linear interpolation between two angles (handles wraparound)
 *
 * @param angle1 - Start angle in degrees
 * @param angle2 - End angle in degrees
 * @param t - Interpolation factor [0, 1]
 * @returns Interpolated angle in degrees
 */
export function lerpAngle(angle1: number, angle2: number, t: number): number {
  const diff = normalizeAngleSigned(angle2 - angle1);
  return angle1 + diff * t;
}

/**
 * Constants for common angles in degrees
 */
export const ANGLE_CONSTANTS = {
  /** 0 degrees */
  ZERO: 0,
  /** 30 degrees */
  THIRTY: 30,
  /** 45 degrees */
  FORTY_FIVE: 45,
  /** 60 degrees */
  SIXTY: 60,
  /** 90 degrees (right angle) */
  RIGHT: 90,
  /** 120 degrees */
  ONE_TWENTY: 120,
  /** 135 degrees */
  ONE_THIRTY_FIVE: 135,
  /** 180 degrees (straight angle) */
  STRAIGHT: 180,
  /** 270 degrees */
  TWO_SEVENTY: 270,
  /** 360 degrees (full circle) */
  FULL_CIRCLE: 360,
} as const;

/**
 * Utility functions for OpenSCAD-specific calculations
 */
export const OpenSCADTrig = {
  /**
   * Generate circle vertices like OpenSCAD's generate_circle function
   *
   * @param radius - Circle radius
   * @param z - Z coordinate for all vertices
   * @param fragments - Number of fragments
   * @returns Array of 3D vertices
   */
  generateCircleVertices(
    radius: number,
    z: number,
    fragments: number
  ): Array<{ x: number; y: number; z: number }> {
    const vertices = [];
    for (let i = 0; i < fragments; i++) {
      const phi = (360.0 * i) / fragments;
      vertices.push({
        x: radius * cosDegrees(phi),
        y: radius * sinDegrees(phi),
        z,
      });
    }
    return vertices;
  },

  /**
   * Calculate sphere ring parameters like OpenSCAD
   *
   * @param radius - Sphere radius
   * @param ringIndex - Ring index (0-based)
   * @param totalRings - Total number of rings
   * @returns Ring parameters
   */
  calculateSphereRing(
    radius: number,
    ringIndex: number,
    totalRings: number
  ): {
    phi: number;
    ringRadius: number;
    z: number;
  } {
    const phi = (180.0 * (ringIndex + 0.5)) / totalRings;
    const ringRadius = radius * sinDegrees(phi);
    const z = radius * cosDegrees(phi);

    return { phi, ringRadius, z };
  },

  /**
   * Calculate cylinder side face normal
   *
   * @param fragmentIndex - Fragment index
   * @param totalFragments - Total number of fragments
   * @returns Normal vector
   */
  calculateCylinderNormal(
    fragmentIndex: number,
    totalFragments: number
  ): { x: number; y: number; z: number } {
    const phi = (360.0 * fragmentIndex) / totalFragments;
    return {
      x: cosDegrees(phi),
      y: sinDegrees(phi),
      z: 0,
    };
  },
} as const;
