/**
 * @file geometry-utils.ts
 * @description Utility functions for geometric calculations in axis rendering
 * Centralizes common geometric operations to eliminate duplication
 */

import { Vector3 } from '@babylonjs/core';

/**
 * Configuration for calculating axis endpoints
 */
export interface AxisEndpointsConfig {
  readonly origin: Vector3;
  readonly direction: Vector3;
  readonly length: number;
}

/**
 * Result of axis endpoint calculation
 */
export interface AxisEndpoints {
  readonly positiveEnd: Vector3;
  readonly negativeEnd: Vector3;
  readonly fullLength: number;
}

/**
 * Standard axis directions for coordinate systems
 */
export const STANDARD_AXIS_DIRECTIONS = {
  X: new Vector3(1, 0, 0),
  Y: new Vector3(0, 1, 0),
  Z: new Vector3(0, 0, 1),
} as const;

/**
 * Standard axis rotations for cylinder alignment
 */
export const STANDARD_AXIS_ROTATIONS = {
  X: new Vector3(0, 0, Math.PI / 2),  // Rotate 90° around Z
  Y: new Vector3(0, 0, 0),            // Default orientation
  Z: new Vector3(Math.PI / 2, 0, 0),  // Rotate 90° around X
} as const;

/**
 * Utility class for geometric calculations in axis rendering
 * 
 * @example
 * ```typescript
 * const endpoints = GeometryUtils.calculateAxisEndpoints({
 *   origin: Vector3.Zero(),
 *   direction: new Vector3(1, 0, 0),
 *   length: 100
 * });
 * ```
 */
export class GeometryUtils {
  /**
   * Calculates the positive and negative endpoints of an axis
   * 
   * @param config - Axis configuration
   * @returns Calculated endpoints and total length
   */
  static calculateAxisEndpoints(config: AxisEndpointsConfig): AxisEndpoints {
    const halfLength = config.length / 2;
    const scaledDirection = config.direction.scale(halfLength);
    
    const positiveEnd = config.origin.add(scaledDirection);
    const negativeEnd = config.origin.subtract(scaledDirection);
    
    return {
      positiveEnd,
      negativeEnd,
      fullLength: config.length,
    };
  }

  /**
   * Calculates endpoints for a full-length axis (from negative to positive)
   * 
   * @param config - Axis configuration
   * @returns Endpoints for full axis length
   */
  static calculateFullAxisEndpoints(config: AxisEndpointsConfig): AxisEndpoints {
    const scaledDirection = config.direction.scale(config.length);
    
    const positiveEnd = config.origin.add(scaledDirection);
    const negativeEnd = config.origin.subtract(scaledDirection);
    
    return {
      positiveEnd,
      negativeEnd,
      fullLength: config.length * 2,
    };
  }

  /**
   * Gets the standard rotation for aligning a cylinder with an axis
   * 
   * @param axisName - Name of the axis ('X', 'Y', or 'Z')
   * @returns Rotation vector for cylinder alignment
   */
  static getAxisRotation(axisName: 'X' | 'Y' | 'Z'): Vector3 {
    return STANDARD_AXIS_ROTATIONS[axisName].clone();
  }

  /**
   * Gets the standard direction vector for an axis
   * 
   * @param axisName - Name of the axis ('X', 'Y', or 'Z')
   * @returns Direction vector for the axis
   */
  static getAxisDirection(axisName: 'X' | 'Y' | 'Z'): Vector3 {
    return STANDARD_AXIS_DIRECTIONS[axisName].clone();
  }

  /**
   * Normalizes a direction vector to ensure unit length
   * 
   * @param direction - Direction vector to normalize
   * @returns Normalized direction vector
   */
  static normalizeDirection(direction: Vector3): Vector3 {
    const length = direction.length();
    if (length === 0) {
      return new Vector3(1, 0, 0); // Default to X-axis if zero vector
    }
    return direction.scale(1 / length);
  }

  /**
   * Calculates the distance between two points
   * 
   * @param point1 - First point
   * @param point2 - Second point
   * @returns Distance between the points
   */
  static calculateDistance(point1: Vector3, point2: Vector3): number {
    return Vector3.Distance(point1, point2);
  }

  /**
   * Creates a point array for a line from origin to endpoint
   * 
   * @param origin - Starting point
   * @param endpoint - Ending point
   * @returns Array of points for line creation
   */
  static createLinePoints(origin: Vector3, endpoint: Vector3): Vector3[] {
    return [origin.clone(), endpoint.clone()];
  }

  /**
   * Creates point arrays for positive and negative axis segments
   * 
   * @param config - Axis configuration
   * @returns Object containing positive and negative line points
   */
  static createAxisLinePoints(config: AxisEndpointsConfig): {
    positive: Vector3[];
    negative: Vector3[];
  } {
    const endpoints = this.calculateAxisEndpoints(config);
    
    return {
      positive: this.createLinePoints(config.origin, endpoints.positiveEnd),
      negative: this.createLinePoints(endpoints.negativeEnd, config.origin),
    };
  }

  /**
   * Validates that a direction vector is not zero
   * 
   * @param direction - Direction vector to validate
   * @returns True if direction is valid (non-zero)
   */
  static isValidDirection(direction: Vector3): boolean {
    return direction.length() > 0;
  }

  /**
   * Validates that a length value is positive
   * 
   * @param length - Length value to validate
   * @returns True if length is positive
   */
  static isValidLength(length: number): boolean {
    return length > 0 && Number.isFinite(length);
  }

  /**
   * Clamps a value between minimum and maximum bounds
   * 
   * @param value - Value to clamp
   * @param min - Minimum bound
   * @param max - Maximum bound
   * @returns Clamped value
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
