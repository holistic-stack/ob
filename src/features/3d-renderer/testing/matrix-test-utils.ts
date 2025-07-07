/**
 * Matrix Testing Utilities
 *
 * Specialized testing utilities for matrix operations, performance validation,
 * and numerical accuracy testing following bulletproof-react architecture.
 */

import { mat4 } from 'gl-matrix';
import { Matrix4 } from 'three';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { error, success } from '../../../shared/utils/functional/result.js';

const logger = createLogger('MatrixTestUtils');

/**
 * Matrix test data configuration
 */
export interface MatrixTestConfig {
  readonly size: number;
  readonly precision: number;
  readonly includeEdgeCases: boolean;
  readonly performanceThreshold: number; // milliseconds
}

/**
 * Matrix test data generator
 */
export class MatrixTestDataGenerator {
  private readonly config: MatrixTestConfig;

  constructor(config: Partial<MatrixTestConfig> = {}) {
    this.config = {
      size: 4,
      precision: 1e-10,
      includeEdgeCases: true,
      performanceThreshold: 16,
      ...config,
    };
  }

  /**
   * Generate identity matrix
   */
  generateIdentityMatrix(): mat4 {
    return mat4.create(); // gl-matrix creates identity by default
  }

  /**
   * Generate random matrix with controlled properties
   */
  generateRandomMatrix(seed?: number): mat4 {
    const result = mat4.create();

    if (seed !== undefined) {
      // Simple seeded random for reproducible tests
      let seedValue = seed;
      const seededRandom = () => {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        return seedValue / 233280;
      };

      for (let i = 0; i < 16; i++) {
        result[i] = seededRandom() * 10 - 5; // Range [-5, 5]
      }
    } else {
      for (let i = 0; i < 16; i++) {
        result[i] = Math.random() * 10 - 5; // Range [-5, 5]
      }
    }

    return result;
  }

  /**
   * Generate well-conditioned matrix (good for numerical operations)
   */
  generateWellConditionedMatrix(): mat4 {
    const result = mat4.create();
    // Generate random values and add diagonal dominance
    for (let i = 0; i < 16; i++) {
      result[i] = Math.random() * 2 - 1; // Range [-1, 1]
    }
    // Add diagonal dominance to ensure good conditioning
    result[0] += 4; // m00
    result[5] += 4; // m11
    result[10] += 4; // m22
    result[15] += 4; // m33
    return result;
  }

  /**
   * Generate ill-conditioned matrix (for edge case testing)
   */
  generateIllConditionedMatrix(): mat4 {
    const result = mat4.create();
    // Create near-singular matrix with very small diagonal values
    for (let i = 0; i < 16; i++) {
      result[i] = 1.0;
    }
    result[0] = 1e-12; // m00
    result[5] = 1e-12; // m11
    result[10] = 1e-12; // m22
    result[15] = 1e-12; // m33
    return result;
  }

  /**
   * Generate singular matrix (determinant = 0)
   */
  generateSingularMatrix(): mat4 {
    // Create matrix with zero determinant by setting diagonal elements to 0
    // This creates an upper triangular matrix with zeros on the diagonal
    // Using fromValues to be explicit about all matrix elements
    return mat4.fromValues(
      0,
      1,
      2,
      3, // Column 0: m00=0 (diagonal), m10=1, m20=2, m30=3
      0,
      0,
      4,
      5, // Column 1: m01=0, m11=0 (diagonal), m21=4, m31=5
      0,
      0,
      0,
      6, // Column 2: m02=0, m12=0, m22=0 (diagonal), m32=6
      0,
      0,
      0,
      0 // Column 3: m03=0, m13=0, m23=0, m33=0 (diagonal)
    );
  }

  /**
   * Generate Three.js Matrix4 test data
   */
  generateMatrix4TestData(): {
    identity: Matrix4;
    translation: Matrix4;
    rotation: Matrix4;
    scale: Matrix4;
    complex: Matrix4;
  } {
    return {
      identity: new Matrix4(),
      translation: new Matrix4().makeTranslation(1, 2, 3),
      rotation: new Matrix4().makeRotationX(Math.PI / 4),
      scale: new Matrix4().makeScale(2, 3, 4),
      complex: new Matrix4()
        .makeTranslation(1, 2, 3)
        .multiply(new Matrix4().makeRotationY(Math.PI / 6))
        .multiply(new Matrix4().makeScale(0.5, 1.5, 2)),
    };
  }

  /**
   * Generate edge case test matrices
   */
  generateEdgeCases(): {
    name: string;
    matrix: mat4;
    expectedBehavior: 'success' | 'warning' | 'error';
  }[] {
    if (!this.config.includeEdgeCases) {
      return [];
    }

    return [
      {
        name: 'Very large values',
        matrix: mat4.fromValues(1e10, 0, 0, 0, 0, 1e10, 0, 0, 0, 0, 1e10, 0, 0, 0, 0, 1e10),
        expectedBehavior: 'warning',
      },
      {
        name: 'Very small values',
        matrix: mat4.fromValues(1e-10, 0, 0, 0, 0, 1e-10, 0, 0, 0, 0, 1e-10, 0, 0, 0, 0, 1e-10),
        expectedBehavior: 'warning',
      },
      {
        name: 'Mixed scale values',
        matrix: mat4.fromValues(1e10, 0, 0, 0, 0, 1e-10, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1),
        expectedBehavior: 'warning',
      },
      {
        name: 'Near-zero determinant',
        matrix: mat4.fromValues(1, 2, 3, 0, 2, 4, 6, 0, 3, 6, 9.000001, 0, 0, 0, 0, 1),
        expectedBehavior: 'warning',
      },
      {
        name: 'Exactly singular',
        matrix: mat4.fromValues(1, 2, 3, 0, 2, 4, 6, 0, 3, 6, 9, 0, 0, 0, 0, 0),
        expectedBehavior: 'error',
      },
    ];
  }
}

/**
 * Matrix operation test helpers
 */
export class MatrixOperationTester {
  private readonly dataGenerator: MatrixTestDataGenerator;

  constructor(testConfig: Partial<MatrixTestConfig> = {}) {
    this.dataGenerator = new MatrixTestDataGenerator(testConfig);
  }

  /**
   * Test matrix operation with comprehensive validation
   */
  async testMatrixOperation<T>(
    operation: (matrix: unknown) => Promise<Result<T, string>> | Result<T, string>,
    operationName: string,
    testMatrix?: unknown
  ): Promise<Result<T, string>> {
    const matrix = testMatrix || this.dataGenerator.generateWellConditionedMatrix();

    try {
      logger.debug(`[DEBUG][MatrixOperationTester] Testing operation: ${operationName}`);
      const result = await operation(matrix);

      if (!result.success) {
        return error(result.error);
      }

      return success(result.data);
    } catch (err) {
      return error(`Operation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Test edge cases systematically
   */
  async testEdgeCases<T>(
    operation: (matrix: unknown) => Promise<Result<T, string>> | Result<T, string>,
    operationName: string
  ): Promise<{
    passed: number;
    failed: number;
    warnings: number;
    results: Array<{ name: string; success: boolean; error?: string }>;
  }> {
    const edgeCases = this.dataGenerator.generateEdgeCases();
    const results: Array<{ name: string; success: boolean; error?: string }> = [];

    let passed = 0;
    let failed = 0;
    let warnings = 0;

    for (const edgeCase of edgeCases) {
      try {
        const result = await operation(edgeCase.matrix);

        if (result.success) {
          if (edgeCase.expectedBehavior === 'error') {
            warnings++;
            results.push({
              name: edgeCase.name,
              success: false,
              error: 'Expected error but operation succeeded',
            });
          } else {
            passed++;
            results.push({ name: edgeCase.name, success: true });
          }
        } else if (edgeCase.expectedBehavior === 'error') {
          passed++;
          results.push({ name: edgeCase.name, success: true });
        } else {
          failed++;
          results.push({
            name: edgeCase.name,
            success: false,
            error: result.error,
          });
        }
      } catch (err) {
        failed++;
        results.push({
          name: edgeCase.name,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    logger.debug(
      `[DEBUG][MatrixOperationTester] Edge case testing for ${operationName}: ${passed} passed, ${failed} failed, ${warnings} warnings`
    );

    return { passed, failed, warnings, results };
  }

  /**
   * Get test data generator
   */
  getDataGenerator(): MatrixTestDataGenerator {
    return this.dataGenerator;
  }
}

/**
 * Default instances for convenience
 */
export const matrixTestDataGenerator = new MatrixTestDataGenerator();
export const matrixOperationTester = new MatrixOperationTester();
