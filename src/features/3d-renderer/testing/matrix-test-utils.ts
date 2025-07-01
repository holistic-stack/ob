/**
 * Matrix Testing Utilities
 *
 * Specialized testing utilities for matrix operations, performance validation,
 * and numerical accuracy testing following bulletproof-react architecture.
 */

import { Matrix } from 'ml-matrix';
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
 * Performance assertion configuration
 */
export interface PerformanceAssertionConfig {
  readonly maxExecutionTime: number;
  readonly maxMemoryUsage: number;
  readonly minAccuracy: number;
  readonly enableRegression: boolean;
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
  generateIdentityMatrix(size = this.config.size): Matrix {
    return Matrix.eye(size);
  }

  /**
   * Generate random matrix with controlled properties
   */
  generateRandomMatrix(rows = this.config.size, cols = this.config.size, seed?: number): Matrix {
    if (seed !== undefined) {
      // Simple seeded random for reproducible tests
      let seedValue = seed;
      const seededRandom = () => {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        return seedValue / 233280;
      };

      const data: number[][] = [];
      for (let i = 0; i < rows; i++) {
        const row: number[] = [];
        for (let j = 0; j < cols; j++) {
          row.push(seededRandom() * 10 - 5); // Range [-5, 5]
        }
        data.push(row);
      }
      return new Matrix(data);
    }

    return Matrix.random(rows, cols);
  }

  /**
   * Generate well-conditioned matrix (good for numerical operations)
   */
  generateWellConditionedMatrix(size = this.config.size): Matrix {
    const matrix = Matrix.random(size, size);
    // Add diagonal dominance to ensure good conditioning
    for (let i = 0; i < size; i++) {
      matrix.set(i, i, matrix.get(i, i) + size);
    }
    return matrix;
  }

  /**
   * Generate ill-conditioned matrix (for edge case testing)
   */
  generateIllConditionedMatrix(size = this.config.size): Matrix {
    const matrix = Matrix.ones(size, size);
    // Create near-singular matrix
    for (let i = 0; i < size; i++) {
      matrix.set(i, i, 1e-12);
    }
    return matrix;
  }

  /**
   * Generate singular matrix (determinant = 0)
   */
  generateSingularMatrix(size = this.config.size): Matrix {
    const matrix = Matrix.zeros(size, size);
    // Fill only upper triangle
    for (let i = 0; i < size - 1; i++) {
      for (let j = i + 1; j < size; j++) {
        matrix.set(i, j, Math.random());
      }
    }
    return matrix;
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
    matrix: Matrix;
    expectedBehavior: 'success' | 'warning' | 'error';
  }[] {
    if (!this.config.includeEdgeCases) {
      return [];
    }

    return [
      {
        name: 'Very large values',
        matrix: Matrix.ones(3, 3).mul(1e10),
        expectedBehavior: 'warning',
      },
      {
        name: 'Very small values',
        matrix: Matrix.ones(3, 3).mul(1e-10),
        expectedBehavior: 'warning',
      },
      {
        name: 'Mixed scale values',
        matrix: new Matrix([
          [1e10, 1, 1],
          [1, 1e-10, 1],
          [1, 1, 1],
        ]),
        expectedBehavior: 'warning',
      },
      {
        name: 'Near-zero determinant',
        matrix: new Matrix([
          [1, 2, 3],
          [2, 4, 6],
          [3, 6, 9.000001],
        ]),
        expectedBehavior: 'warning',
      },
      {
        name: 'Exactly singular',
        matrix: new Matrix([
          [1, 2, 3],
          [2, 4, 6],
          [3, 6, 9],
        ]),
        expectedBehavior: 'error',
      },
    ];
  }
}

/**
 * Performance assertion utilities
 */
export class PerformanceAssertion {
  private readonly config: PerformanceAssertionConfig;

  constructor(config: Partial<PerformanceAssertionConfig> = {}) {
    this.config = {
      maxExecutionTime: 16, // <16ms requirement
      maxMemoryUsage: 10 * 1024 * 1024, // 10MB
      minAccuracy: 1e-10,
      enableRegression: true,
      ...config,
    };
  }

  /**
   * Assert operation performance meets requirements
   */
  async assertPerformance<T>(
    operation: () => Promise<T> | T,
    operationName: string
  ): Promise<Result<T, string>> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      logger.debug(`[DEBUG][PerformanceAssertion] Starting performance test: ${operationName}`);

      const result = await operation();

      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const executionTime = endTime - startTime;
      const memoryUsage = endMemory - startMemory;

      // Performance assertions
      if (executionTime > this.config.maxExecutionTime) {
        return error(
          `Performance assertion failed: ${operationName} took ${executionTime.toFixed(2)}ms, exceeds limit of ${this.config.maxExecutionTime}ms`
        );
      }

      if (memoryUsage > this.config.maxMemoryUsage) {
        return error(
          `Memory assertion failed: ${operationName} used ${(memoryUsage / 1024 / 1024).toFixed(2)}MB, exceeds limit of ${(this.config.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`
        );
      }

      logger.debug(
        `[DEBUG][PerformanceAssertion] Performance test passed: ${operationName} (${executionTime.toFixed(2)}ms, ${(memoryUsage / 1024).toFixed(2)}KB)`
      );

      return success(result);
    } catch (err) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      logger.error(
        `[ERROR][PerformanceAssertion] Performance test failed: ${operationName} (${executionTime.toFixed(2)}ms)`,
        err
      );

      return error(`Performance test failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Assert numerical accuracy
   */
  assertNumericalAccuracy(
    actual: number | Matrix,
    expected: number | Matrix,
    tolerance = this.config.minAccuracy
  ): Result<void, string> {
    try {
      if (typeof actual === 'number' && typeof expected === 'number') {
        const diff = Math.abs(actual - expected);
        if (diff > tolerance) {
          return error(
            `Numerical accuracy assertion failed: difference ${diff} exceeds tolerance ${tolerance}`
          );
        }
      } else if (actual instanceof Matrix && expected instanceof Matrix) {
        if (actual.rows !== expected.rows || actual.columns !== expected.columns) {
          return error('Matrix dimensions do not match');
        }

        for (let i = 0; i < actual.rows; i++) {
          for (let j = 0; j < actual.columns; j++) {
            const diff = Math.abs(actual.get(i, j) - expected.get(i, j));
            if (diff > tolerance) {
              return error(
                `Matrix accuracy assertion failed at [${i}, ${j}]: difference ${diff} exceeds tolerance ${tolerance}`
              );
            }
          }
        }
      } else {
        return error('Type mismatch: both values must be numbers or both must be matrices');
      }

      return success(undefined);
    } catch (err) {
      return error(`Accuracy assertion error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      return memory.usedJSHeapSize;
    }
    return 0;
  }
}

/**
 * Matrix operation test helpers
 */
export class MatrixOperationTester {
  private readonly dataGenerator: MatrixTestDataGenerator;
  private readonly performanceAssertion: PerformanceAssertion;

  constructor(
    testConfig: Partial<MatrixTestConfig> = {},
    perfConfig: Partial<PerformanceAssertionConfig> = {}
  ) {
    this.dataGenerator = new MatrixTestDataGenerator(testConfig);
    this.performanceAssertion = new PerformanceAssertion(perfConfig);
  }

  /**
   * Test matrix operation with comprehensive validation
   */
  async testMatrixOperation<T>(
    operation: (matrix: Matrix) => Promise<Result<T, string>> | Result<T, string>,
    operationName: string,
    testMatrix?: Matrix
  ): Promise<Result<T, string>> {
    const matrix = testMatrix || this.dataGenerator.generateWellConditionedMatrix();

    return this.performanceAssertion.assertPerformance(async () => {
      const result = await operation(matrix);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    }, operationName);
  }

  /**
   * Test edge cases systematically
   */
  async testEdgeCases<T>(
    operation: (matrix: Matrix) => Promise<Result<T, string>> | Result<T, string>,
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

  /**
   * Get performance assertion utility
   */
  getPerformanceAssertion(): PerformanceAssertion {
    return this.performanceAssertion;
  }
}

/**
 * Default instances for convenience
 */
export const matrixTestDataGenerator = new MatrixTestDataGenerator();
export const performanceAssertion = new PerformanceAssertion();
export const matrixOperationTester = new MatrixOperationTester();
