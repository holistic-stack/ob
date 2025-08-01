/**
 * @file result-assertions.test.ts
 * @description Test suite for result assertion utilities.
 * Tests the test utilities themselves to ensure they work correctly.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { describe, expect, it, vi } from 'vitest';
import type { Result } from '@/shared';
import { error, success } from '@/shared';
import type { GeometryGenerationError } from '../types/geometry-data';
import {
  expectAllErrors,
  expectAllSuccessful,
  expectComputationError,
  expectError,
  expectErrorType,
  expectInvalidParametersError,
  expectSuccess,
  expectSuccessfulGeometry,
} from './result-assertions';

describe('Result Assertions', () => {
  describe('expectSuccess', () => {
    it('should pass for successful results', () => {
      const result = success(42);
      const data = expectSuccess(result);
      expect(data).toBe(42);
    });

    it('should call data validator if provided', () => {
      const result = success({ value: 42 });
      const validator = vi.fn();

      expectSuccess(result, validator);

      expect(validator).toHaveBeenCalledWith({ value: 42 });
    });

    it('should throw for error results', () => {
      const result = error({ type: 'INVALID_PARAMETERS', message: 'test error' });

      expect(() => expectSuccess(result)).toThrow();
    });
  });

  describe('expectError', () => {
    it('should pass for error results', () => {
      const errorObj = { type: 'INVALID_PARAMETERS' as const, message: 'test error' };
      const result = error(errorObj);

      const returnedError = expectError(result);
      expect(returnedError).toBe(errorObj);
    });

    it('should call error validator if provided', () => {
      const errorObj = { type: 'INVALID_PARAMETERS' as const, message: 'test error' };
      const result = error(errorObj);
      const validator = vi.fn();

      expectError(result, validator);

      expect(validator).toHaveBeenCalledWith(errorObj);
    });

    it('should throw for successful results', () => {
      const result = success(42);

      expect(() => expectError(result)).toThrow();
    });
  });

  describe('expectErrorType', () => {
    it('should validate error type and message', () => {
      const errorObj: GeometryGenerationError = {
        type: 'INVALID_PARAMETERS',
        message: 'radius must be positive',
      };
      const result = error(errorObj);

      const returnedError = expectErrorType(result, 'INVALID_PARAMETERS', 'radius');
      expect(returnedError).toBe(errorObj);
    });

    it('should validate error type without message pattern', () => {
      const errorObj: GeometryGenerationError = {
        type: 'COMPUTATION_ERROR',
        message: 'calculation failed',
      };
      const result = error(errorObj);

      const returnedError = expectErrorType(result, 'COMPUTATION_ERROR');
      expect(returnedError).toBe(errorObj);
    });

    it('should throw for wrong error type', () => {
      const errorObj: GeometryGenerationError = {
        type: 'INVALID_PARAMETERS',
        message: 'test error',
      };
      const result = error(errorObj);

      expect(() => expectErrorType(result, 'COMPUTATION_ERROR')).toThrow();
    });
  });

  describe('expectSuccessfulGeometry', () => {
    it('should validate successful geometry with properties', () => {
      const geometry = {
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 1, z: 1 },
        ],
        faces: [[0, 1, 2]],
        normals: [{ x: 0, y: 0, z: 1 }],
        metadata: { primitiveType: 'test' },
      };
      const result: Result<typeof geometry, GeometryGenerationError> = success(geometry);

      const returnedGeometry = expectSuccessfulGeometry(result, {
        vertexCount: 2,
        faceCount: 1,
        hasNormals: true,
        hasMetadata: true,
      });

      expect(returnedGeometry).toBe(geometry);
    });

    it('should work without property validation', () => {
      const geometry = { vertices: [], faces: [], normals: [] };
      const result: Result<typeof geometry, GeometryGenerationError> = success(geometry);

      const returnedGeometry = expectSuccessfulGeometry(result);
      expect(returnedGeometry).toBe(geometry);
    });
  });

  describe('expectInvalidParametersError', () => {
    it('should validate invalid parameters error', () => {
      const errorObj: GeometryGenerationError = {
        type: 'INVALID_PARAMETERS',
        message: 'radius must be positive',
      };
      const result = error(errorObj);

      const returnedError = expectInvalidParametersError(result, 'radius');
      expect(returnedError).toBe(errorObj);
    });
  });

  describe('expectComputationError', () => {
    it('should validate computation error', () => {
      const errorObj: GeometryGenerationError = {
        type: 'COMPUTATION_ERROR',
        message: 'calculation failed',
      };
      const result = error(errorObj);

      const returnedError = expectComputationError(result, 'calculation');
      expect(returnedError).toBe(errorObj);
    });
  });

  describe('expectAllSuccessful', () => {
    it('should validate all successful results', () => {
      const results = [success(1), success(2), success(3)];

      const data = expectAllSuccessful(results);
      expect(data).toEqual([1, 2, 3]);
    });

    it('should throw if any result is an error', () => {
      const errorObj: GeometryGenerationError = { type: 'INVALID_PARAMETERS', message: 'test' };
      const results: Result<number, GeometryGenerationError>[] = [
        success(1),
        error(errorObj),
        success(3),
      ];

      expect(() => expectAllSuccessful(results)).toThrow();
    });
  });

  describe('expectAllErrors', () => {
    it('should validate all error results', () => {
      const error1: GeometryGenerationError = { type: 'INVALID_PARAMETERS', message: 'error 1' };
      const error2: GeometryGenerationError = { type: 'INVALID_PARAMETERS', message: 'error 2' };
      const results = [error(error1), error(error2)];

      const errors = expectAllErrors(results);
      expect(errors).toEqual([error1, error2]);
    });

    it('should throw if any result is successful', () => {
      const errorObj: GeometryGenerationError = { type: 'INVALID_PARAMETERS', message: 'test' };
      const results: Result<number, GeometryGenerationError>[] = [error(errorObj), success(42)];

      expect(() => expectAllErrors(results)).toThrow();
    });
  });
});
