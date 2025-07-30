/**
 * @file result-assertions.ts
 * @description Test utility functions for Result<T,E> assertion patterns.
 * Provides reusable assertion functions following DRY, KISS, and SRP principles.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { expect } from 'vitest';
import type { Result } from '../../../shared/types/result.types';
import { isError, isSuccess } from '../../../shared/types/result.types';
import type { GeometryGenerationError } from '../types/geometry-data';

/**
 * Assert that a result is successful and optionally validate the data
 *
 * @param result - Result to validate
 * @param dataValidator - Optional function to validate the success data
 * @returns The success data for further testing
 */
export function expectSuccess<T, E>(result: Result<T, E>, dataValidator?: (data: T) => void): T {
  expect(isSuccess(result)).toBe(true);

  if (isSuccess(result)) {
    if (dataValidator) {
      dataValidator(result.data);
    }
    return result.data;
  }

  // This should never happen due to the expect above, but TypeScript needs it
  throw new Error('Result was not successful despite assertion');
}

/**
 * Assert that a result is an error and optionally validate the error
 *
 * @param result - Result to validate
 * @param errorValidator - Optional function to validate the error
 * @returns The error for further testing
 */
export function expectError<T, E>(result: Result<T, E>, errorValidator?: (error: E) => void): E {
  expect(isError(result)).toBe(true);

  if (isError(result)) {
    if (errorValidator) {
      errorValidator(result.error);
    }
    return result.error;
  }

  // This should never happen due to the expect above, but TypeScript needs it
  throw new Error('Result was not an error despite assertion');
}

/**
 * Assert that a result is an error with specific type and message pattern
 *
 * @param result - Result to validate
 * @param expectedType - Expected error type
 * @param messagePattern - Pattern that should be contained in the error message
 * @returns The error for further testing
 */
export function expectErrorType(
  result: Result<unknown, GeometryGenerationError>,
  expectedType: GeometryGenerationError['type'],
  messagePattern?: string
): GeometryGenerationError {
  const error = expectError<unknown, GeometryGenerationError>(result);

  expect(error.type).toBe(expectedType);

  if (messagePattern) {
    expect(error.message).toContain(messagePattern);
  }

  return error;
}

/**
 * Assert that a result is a successful geometry generation
 *
 * @param result - Result to validate
 * @param expectedProperties - Optional properties to validate
 * @returns The geometry data for further testing
 */
export function expectSuccessfulGeometry<T>(
  result: Result<T, GeometryGenerationError>,
  expectedProperties?: {
    vertexCount?: number;
    faceCount?: number;
    hasNormals?: boolean;
    hasMetadata?: boolean;
  }
): T {
  return expectSuccess(result, (data) => {
    if (expectedProperties) {
      const geometry = data as Record<string, unknown>; // Type assertion for validation

      if (expectedProperties.vertexCount !== undefined) {
        expect(geometry.vertices).toHaveLength(expectedProperties.vertexCount);
      }

      if (expectedProperties.faceCount !== undefined) {
        expect(geometry.faces).toHaveLength(expectedProperties.faceCount);
      }

      if (expectedProperties.hasNormals) {
        expect(geometry.normals).toBeDefined();
        expect(Array.isArray(geometry.normals)).toBe(true);
      }

      if (expectedProperties.hasMetadata) {
        expect(geometry.metadata).toBeDefined();
        expect(typeof geometry.metadata).toBe('object');
      }
    }
  });
}

/**
 * Assert that a result is an invalid parameters error
 *
 * @param result - Result to validate
 * @param messagePattern - Optional pattern that should be in the error message
 * @returns The error for further testing
 */
export function expectInvalidParametersError(
  result: Result<unknown, GeometryGenerationError>,
  messagePattern?: string
): GeometryGenerationError {
  return expectErrorType(result, 'INVALID_PARAMETERS', messagePattern);
}

/**
 * Assert that a result is a computation error
 *
 * @param result - Result to validate
 * @param messagePattern - Optional pattern that should be in the error message
 * @returns The error for further testing
 */
export function expectComputationError(
  result: Result<unknown, GeometryGenerationError>,
  messagePattern?: string
): GeometryGenerationError {
  return expectErrorType(result, 'COMPUTATION_ERROR', messagePattern);
}

/**
 * Assert that multiple results are all successful
 *
 * @param results - Array of results to validate
 * @returns Array of success data for further testing
 */
export function expectAllSuccessful<T, E>(results: Array<Result<T, E>>): T[] {
  const successData: T[] = [];

  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    expect(isSuccess(result), `Result at index ${index} should be successful`).toBe(true);

    if (isSuccess(result)) {
      successData.push(result.data);
    }
  }

  return successData;
}

/**
 * Assert that multiple results are all errors
 *
 * @param results - Array of results to validate
 * @returns Array of errors for further testing
 */
export function expectAllErrors<T, E>(results: Array<Result<T, E>>): E[] {
  const errors: E[] = [];

  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    expect(isError(result), `Result at index ${index} should be an error`).toBe(true);

    if (isError(result)) {
      errors.push(result.error);
    }
  }

  return errors;
}
