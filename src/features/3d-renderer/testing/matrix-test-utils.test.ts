/**
 * Matrix Test Utils Test Suite
 *
 * Tests for matrix testing utilities following TDD methodology
 * with comprehensive coverage of test data generation and performance assertions.
 */

import { mat4 } from 'gl-matrix';
import { Matrix4 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import {
  MatrixOperationTester,
  MatrixTestDataGenerator,
  matrixOperationTester,
  matrixTestDataGenerator,
} from './matrix-test-utils.js';

const logger = createLogger('MatrixTestUtilsTest');

describe('Matrix Test Utils', () => {
  describe('MatrixTestDataGenerator', () => {
    let generator: MatrixTestDataGenerator;

    beforeEach(() => {
      logger.init('Setting up test environment');
      generator = new MatrixTestDataGenerator({
        size: 3,
        precision: 1e-10,
        includeEdgeCases: true,
        performanceThreshold: 16,
      });
    });

    afterEach(() => {
      logger.end('Cleaning up test environment');
    });

    it('should generate identity matrix', () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing identity matrix generation');

      const matrix = generator.generateIdentityMatrix();

      expect(matrix.length).toBe(16); // 4x4 matrix
      expect(matrix[0]).toBe(1); // m00
      expect(matrix[5]).toBe(1); // m11
      expect(matrix[10]).toBe(1); // m22
      expect(matrix[15]).toBe(1); // m33
      expect(matrix[1]).toBe(0); // m01
      expect(matrix[4]).toBe(0); // m10
    });

    it('should generate reproducible random matrix with seed', () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing seeded random matrix generation');

      const matrix1 = generator.generateRandomMatrix(12345);
      const matrix2 = generator.generateRandomMatrix(12345);

      expect(matrix1.length).toBe(16); // 4x4 matrix
      expect(matrix2.length).toBe(16); // 4x4 matrix

      // Should be identical with same seed
      for (let i = 0; i < 16; i++) {
        expect(matrix1[i]).toBeCloseTo(matrix2[i], 10);
      }
    });

    it('should generate well-conditioned matrix', () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing well-conditioned matrix generation');

      const matrix = generator.generateWellConditionedMatrix();

      expect(matrix.length).toBe(16); // 4x4 matrix

      // Check diagonal dominance (well-conditioned property)
      // Diagonal elements are at indices 0, 5, 10, 15 in column-major order
      expect(Math.abs(matrix[0])).toBeGreaterThan(1); // m00
      expect(Math.abs(matrix[5])).toBeGreaterThan(1); // m11
      expect(Math.abs(matrix[10])).toBeGreaterThan(1); // m22
      expect(Math.abs(matrix[15])).toBeGreaterThan(1); // m33
    });

    it('should generate ill-conditioned matrix', () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing ill-conditioned matrix generation');

      const matrix = generator.generateIllConditionedMatrix();

      expect(matrix.length).toBe(16); // 4x4 matrix

      // Check that diagonal elements are very small (ill-conditioned property)
      // Diagonal elements are at indices 0, 5, 10, 15 in column-major order
      expect(Math.abs(matrix[0])).toBeLessThan(1e-10); // m00
      expect(Math.abs(matrix[5])).toBeLessThan(1e-10); // m11
      expect(Math.abs(matrix[10])).toBeLessThan(1e-10); // m22
      expect(Math.abs(matrix[15])).toBeLessThan(1e-10); // m33
    });

    it('should generate singular matrix', () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing singular matrix generation');

      const matrix = generator.generateSingularMatrix();

      expect(matrix.length).toBe(16); // 4x4 matrix

      // Check that it's upper triangular with zeros on diagonal
      // Diagonal elements are at indices 0, 5, 10, 15 in column-major order
      expect(matrix[0]).toBe(0); // m00
      expect(matrix[5]).toBe(0); // m11
      expect(matrix[10]).toBe(0); // m22
      expect(matrix[15]).toBe(0); // m33
    });

    it('should generate Matrix4 test data', () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing Matrix4 test data generation');

      const testData = generator.generateMatrix4TestData();

      expect(testData.identity).toBeInstanceOf(Matrix4);
      expect(testData.translation).toBeInstanceOf(Matrix4);
      expect(testData.rotation).toBeInstanceOf(Matrix4);
      expect(testData.scale).toBeInstanceOf(Matrix4);
      expect(testData.complex).toBeInstanceOf(Matrix4);

      // Verify identity matrix
      const identity = testData.identity;
      expect(identity.elements[0]).toBe(1);
      expect(identity.elements[5]).toBe(1);
      expect(identity.elements[10]).toBe(1);
      expect(identity.elements[15]).toBe(1);
    });

    it('should generate edge cases when enabled', () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing edge case generation');

      const edgeCases = generator.generateEdgeCases();

      expect(edgeCases.length).toBeGreaterThan(0);

      const caseNames = edgeCases.map((c) => c.name);
      expect(caseNames).toContain('Very large values');
      expect(caseNames).toContain('Very small values');
      expect(caseNames).toContain('Exactly singular');

      // Check that each edge case has required properties
      for (const edgeCase of edgeCases) {
        expect(edgeCase.matrix).toBeInstanceOf(Float32Array);
        expect(edgeCase.matrix.length).toBe(16); // 4x4 matrix
        expect(['success', 'warning', 'error']).toContain(edgeCase.expectedBehavior);
      }
    });
  });

  describe('MatrixOperationTester', () => {
    let tester: MatrixOperationTester;

    beforeEach(() => {
      logger.init('Setting up test environment');
      tester = new MatrixOperationTester({ size: 3, includeEdgeCases: true });
    });

    afterEach(() => {
      logger.end('Cleaning up test environment');
    });

    it('should test successful matrix operation', async () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing successful matrix operation');

      const mockOperation = async (matrix: mat4): Promise<Result<mat4, string>> => {
        // Simple successful operation
        const result = mat4.create();
        mat4.transpose(result, matrix);
        return {
          success: true,
          data: result,
        };
      };

      const result = await tester.testMatrixOperation(mockOperation, 'transpose');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(Float32Array);
        expect(result.data.length).toBe(16); // 4x4 matrix
      }
    });

    it('should test failing matrix operation', async () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing failing matrix operation');

      const mockOperation = async (_matrix: mat4): Promise<Result<mat4, string>> => {
        // Simulated failure
        return {
          success: false,
          error: 'Simulated operation failure',
        };
      };

      const result = await tester.testMatrixOperation(mockOperation, 'failing_operation');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Simulated operation failure');
      }
    });

    it('should test edge cases systematically', async () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing edge case handling');

      const mockOperation = async (matrix: mat4): Promise<Result<mat4, string>> => {
        // Operation that fails for singular matrices
        try {
          // Use gl-matrix determinant calculation for 4x4 matrices
          const det = mat4.determinant(matrix);

          if (Math.abs(det) < 1e-10) {
            return {
              success: false,
              error: 'Matrix is singular',
            };
          }

          // Simple mock inversion (not real inverse)
          const result = mat4.create();
          mat4.transpose(result, matrix);
          return {
            success: true,
            data: result,
          };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      };

      const results = await tester.testEdgeCases(mockOperation, 'inversion');

      expect(results.passed).toBeGreaterThanOrEqual(0);
      expect(results.failed).toBeGreaterThanOrEqual(0);
      expect(results.warnings).toBeGreaterThanOrEqual(0);
      expect(results.results.length).toBeGreaterThan(0);

      // Should have at least one result for singular matrix
      const singularResult = results.results.find((r) => r.name === 'Exactly singular');
      expect(singularResult).toBeDefined();
    });

    it('should provide access to data generator', () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing utility access');

      const dataGenerator = tester.getDataGenerator();

      expect(dataGenerator).toBeInstanceOf(MatrixTestDataGenerator);
    });
  });

  describe('Default Instances', () => {
    it('should provide working default instances', () => {
      logger.debug('[DEBUG][MatrixTestUtilsTest] Testing default instances');

      expect(matrixTestDataGenerator).toBeInstanceOf(MatrixTestDataGenerator);
      expect(matrixOperationTester).toBeInstanceOf(MatrixOperationTester);

      // Test that they work
      const matrix = matrixTestDataGenerator.generateIdentityMatrix();
      expect(matrix.length).toBe(16); // 4x4 matrix
      expect(matrix[0]).toBe(1); // Identity matrix diagonal
    });
  });
});
