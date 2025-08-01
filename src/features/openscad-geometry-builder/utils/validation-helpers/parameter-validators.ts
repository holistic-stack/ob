/**
 * @file parameter-validators.ts
 * @description Common parameter validation utilities for OpenSCAD Geometry Builder.
 * Provides reusable validation functions following DRY, KISS, and SRP principles.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Result } from '@/shared';
import { error, success } from '@/shared';
import {
  ERROR_MESSAGES,
  FRAGMENT_CONSTANTS,
  GEOMETRY_CONSTANTS,
  VALIDATION_CONSTANTS,
} from '../../constants';
import type { GeometryGenerationError } from '../../types/geometry-data';

/**
 * Validate that a number is positive (greater than minimum positive value)
 *
 * @param value - Number to validate
 * @param parameterName - Name of the parameter for error messages
 * @returns Result indicating success or validation error
 */
export function validatePositiveNumber(
  value: number,
  parameterName: string
): Result<void, GeometryGenerationError> {
  if (value <= VALIDATION_CONSTANTS.MIN_POSITIVE_VALUE) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: `${parameterName} must be positive`,
    });
  }

  return success(undefined);
}

/**
 * Validate that a number is finite (not NaN or Infinity)
 *
 * @param value - Number to validate
 * @param parameterName - Name of the parameter for error messages
 * @returns Result indicating success or validation error
 */
export function validateFiniteNumber(
  value: number,
  parameterName: string
): Result<void, GeometryGenerationError> {
  if (!Number.isFinite(value)) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: `${parameterName} must be a finite number`,
    });
  }

  return success(undefined);
}

/**
 * Validate fragment count for OpenSCAD primitives
 *
 * @param fragments - Fragment count to validate
 * @returns Result indicating success or validation error
 */
export function validateFragmentCount(fragments: number): Result<void, GeometryGenerationError> {
  if (fragments < FRAGMENT_CONSTANTS.MIN_FRAGMENTS) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: ERROR_MESSAGES.INVALID_FRAGMENTS,
    });
  }

  if (!Number.isInteger(fragments)) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: 'Fragments must be an integer',
    });
  }

  return success(undefined);
}

/**
 * Validate that an array is non-empty
 *
 * @param array - Array to validate
 * @param parameterName - Name of the parameter for error messages
 * @returns Result indicating success or validation error
 */
export function validateNonEmptyArray<T>(
  array: readonly T[],
  parameterName: string
): Result<void, GeometryGenerationError> {
  if (array.length === 0) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: `${parameterName} must not be empty`,
    });
  }

  return success(undefined);
}

/**
 * Validate radius parameter (combines positive and finite checks)
 *
 * @param radius - Radius value to validate
 * @returns Result indicating success or validation error
 */
export function validateRadius(radius: number): Result<void, GeometryGenerationError> {
  // Check if radius is positive
  const positiveResult = validatePositiveNumber(radius, 'Radius');
  if (!positiveResult.success) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: ERROR_MESSAGES.INVALID_RADIUS,
    });
  }

  // Check if radius is finite
  const finiteResult = validateFiniteNumber(radius, 'Radius');
  if (!finiteResult.success) {
    return finiteResult;
  }

  return success(undefined);
}

/**
 * Validate height parameter (combines positive and finite checks)
 *
 * @param height - Height value to validate
 * @returns Result indicating success or validation error
 */
export function validateHeight(height: number): Result<void, GeometryGenerationError> {
  // Check if height is positive
  const positiveResult = validatePositiveNumber(height, 'Height');
  if (!positiveResult.success) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: ERROR_MESSAGES.INVALID_HEIGHT,
    });
  }

  // Check if height is finite
  const finiteResult = validateFiniteNumber(height, 'Height');
  if (!finiteResult.success) {
    return finiteResult;
  }

  return success(undefined);
}

/**
 * Validate size dimensions for cube-like primitives
 *
 * @param size - Size object with x, y, z dimensions
 * @returns Result indicating success or validation error
 */
export function validateSizeDimensions(size: {
  x: number;
  y: number;
  z: number;
}): Result<void, GeometryGenerationError> {
  // Validate each dimension
  const dimensions = [
    { value: size.x, name: 'x' },
    { value: size.y, name: 'y' },
    { value: size.z, name: 'z' },
  ];

  for (const dimension of dimensions) {
    const positiveResult = validatePositiveNumber(dimension.value, dimension.name);
    if (!positiveResult.success) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: ERROR_MESSAGES.INVALID_SIZE,
      });
    }

    const finiteResult = validateFiniteNumber(dimension.value, dimension.name);
    if (!finiteResult.success) {
      return finiteResult;
    }
  }

  return success(undefined);
}

/**
 * Validate vertex coordinates (must be array of 3 finite numbers)
 *
 * @param vertex - Vertex coordinates to validate
 * @param vertexIndex - Index of the vertex for error messages
 * @returns Result indicating success or validation error
 */
export function validateVertexCoordinates(
  vertex: readonly number[],
  vertexIndex: number
): Result<void, GeometryGenerationError> {
  if (vertex.length !== 3) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: `Vertex ${vertexIndex} must have exactly 3 coordinates [x, y, z]`,
    });
  }

  for (const coord of vertex) {
    const finiteResult = validateFiniteNumber(coord, `Vertex ${vertexIndex} coordinate`);
    if (!finiteResult.success) {
      return finiteResult;
    }
  }

  return success(undefined);
}

/**
 * Validate face indices (must reference valid vertices)
 *
 * @param face - Face vertex indices to validate
 * @param faceIndex - Index of the face for error messages
 * @param vertexCount - Total number of vertices available
 * @returns Result indicating success or validation error
 */
export function validateFaceIndices(
  face: readonly number[],
  _faceIndex: number,
  vertexCount: number
): Result<void, GeometryGenerationError> {
  if (face.length < GEOMETRY_CONSTANTS.MIN_FACE_VERTICES) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: ERROR_MESSAGES.INVALID_FACE,
    });
  }

  // Check for valid vertex indices
  for (const index of face) {
    if (!Number.isInteger(index) || index < 0 || index >= vertexCount) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: ERROR_MESSAGES.INVALID_VERTEX_INDEX,
      });
    }
  }

  // Check for duplicate indices
  const uniqueIndices = new Set(face);
  if (uniqueIndices.size !== face.length) {
    return error({
      type: 'INVALID_PARAMETERS',
      message: ERROR_MESSAGES.DUPLICATE_VERTEX_INDEX,
    });
  }

  return success(undefined);
}
