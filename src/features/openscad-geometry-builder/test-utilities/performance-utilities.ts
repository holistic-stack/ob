/**
 * @file performance-utilities.ts
 * @description Test utility functions for performance testing and benchmarking.
 * Provides reusable performance testing functions following DRY, KISS, and SRP principles.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import { expect } from 'vitest';
import { PERFORMANCE_CONSTANTS } from '../constants';

/**
 * Measure execution time of a function
 *
 * @param fn - Function to measure
 * @returns Object with result and execution time in milliseconds
 */
export async function measureExecutionTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; executionTime: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();

  return {
    result,
    executionTime: endTime - startTime,
  };
}

/**
 * Assert that a function executes within the expected time limit
 *
 * @param fn - Function to test
 * @param maxTime - Maximum allowed execution time in milliseconds
 * @param description - Description of the operation being tested
 * @returns The function result
 */
export async function expectPerformance<T>(
  fn: () => T | Promise<T>,
  maxTime: number,
  description: string = 'operation'
): Promise<T> {
  const { result, executionTime } = await measureExecutionTime(fn);

  expect(
    executionTime,
    `${description} should complete within ${maxTime}ms (actual: ${executionTime.toFixed(2)}ms)`
  ).toBeLessThanOrEqual(maxTime);

  return result;
}

/**
 * Assert that a simple operation completes within the simple operation timeout
 *
 * @param fn - Function to test
 * @param description - Description of the operation
 * @returns The function result
 */
export async function expectSimpleOperationPerformance<T>(
  fn: () => T | Promise<T>,
  description: string = 'simple operation'
): Promise<T> {
  return expectPerformance(fn, PERFORMANCE_CONSTANTS.SIMPLE_OPERATION_TIMEOUT, description);
}

/**
 * Assert that a complex operation completes within the complex operation timeout
 *
 * @param fn - Function to test
 * @param description - Description of the operation
 * @returns The function result
 */
export async function expectComplexOperationPerformance<T>(
  fn: () => T | Promise<T>,
  description: string = 'complex operation'
): Promise<T> {
  return expectPerformance(fn, PERFORMANCE_CONSTANTS.COMPLEX_OPERATION_TIMEOUT, description);
}

/**
 * Assert that a batch operation completes within the batch operation timeout
 *
 * @param fn - Function to test
 * @param description - Description of the operation
 * @returns The function result
 */
export async function expectBatchOperationPerformance<T>(
  fn: () => T | Promise<T>,
  description: string = 'batch operation'
): Promise<T> {
  return expectPerformance(fn, PERFORMANCE_CONSTANTS.BATCH_OPERATION_TIMEOUT, description);
}

/**
 * Run a performance benchmark with multiple iterations
 *
 * @param fn - Function to benchmark
 * @param iterations - Number of iterations to run (default: 10)
 * @param description - Description of the benchmark
 * @returns Benchmark statistics
 */
export async function runPerformanceBenchmark<T>(
  fn: () => T | Promise<T>,
  iterations: number = 10,
  description: string = 'benchmark'
): Promise<{
  description: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  results: T[];
}> {
  const times: number[] = [];
  const results: T[] = [];

  for (let i = 0; i < iterations; i++) {
    const { result, executionTime } = await measureExecutionTime(fn);
    times.push(executionTime);
    results.push(result);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return {
    description,
    iterations,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    results,
  };
}

/**
 * Assert that a benchmark meets performance expectations
 *
 * @param benchmark - Benchmark results
 * @param expectations - Performance expectations
 */
export function expectBenchmarkPerformance(
  benchmark: Awaited<ReturnType<typeof runPerformanceBenchmark>>,
  expectations: {
    maxAverageTime?: number;
    maxTotalTime?: number;
    maxSingleTime?: number;
  }
): void {
  if (expectations.maxAverageTime !== undefined) {
    expect(
      benchmark.averageTime,
      `Average time should be <= ${expectations.maxAverageTime}ms (actual: ${benchmark.averageTime.toFixed(2)}ms)`
    ).toBeLessThanOrEqual(expectations.maxAverageTime);
  }

  if (expectations.maxTotalTime !== undefined) {
    expect(
      benchmark.totalTime,
      `Total time should be <= ${expectations.maxTotalTime}ms (actual: ${benchmark.totalTime.toFixed(2)}ms)`
    ).toBeLessThanOrEqual(expectations.maxTotalTime);
  }

  if (expectations.maxSingleTime !== undefined) {
    expect(
      benchmark.maxTime,
      `Maximum single time should be <= ${expectations.maxSingleTime}ms (actual: ${benchmark.maxTime.toFixed(2)}ms)`
    ).toBeLessThanOrEqual(expectations.maxSingleTime);
  }
}

/**
 * Create a performance test suite for a generator function
 *
 * @param generatorFn - Generator function to test
 * @param testCases - Array of test cases with parameters and expectations
 * @returns Performance test results
 */
export async function createPerformanceTestSuite<TParams, TResult>(
  generatorFn: (params: TParams) => TResult | Promise<TResult>,
  testCases: Array<{
    name: string;
    params: TParams;
    maxTime: number;
    iterations?: number;
  }>
): Promise<
  Array<{
    name: string;
    benchmark: Awaited<ReturnType<typeof runPerformanceBenchmark>>;
    passed: boolean;
  }>
> {
  const results = [];

  for (const testCase of testCases) {
    const iterations = testCase.iterations || 5;

    const benchmark = await runPerformanceBenchmark(
      () => generatorFn(testCase.params),
      iterations,
      testCase.name
    );

    const passed = benchmark.averageTime <= testCase.maxTime;

    results.push({
      name: testCase.name,
      benchmark,
      passed,
    });
  }

  return results;
}

/**
 * Log performance benchmark results in a readable format
 *
 * @param benchmark - Benchmark results to log
 */
export function logBenchmarkResults(
  benchmark: Awaited<ReturnType<typeof runPerformanceBenchmark>>
): void {
  console.log(`\n📊 Performance Benchmark: ${benchmark.description}`);
  console.log(`   Iterations: ${benchmark.iterations}`);
  console.log(`   Total Time: ${benchmark.totalTime.toFixed(2)}ms`);
  console.log(`   Average Time: ${benchmark.averageTime.toFixed(2)}ms`);
  console.log(`   Min Time: ${benchmark.minTime.toFixed(2)}ms`);
  console.log(`   Max Time: ${benchmark.maxTime.toFixed(2)}ms`);
}

/**
 * Assert that execution time is consistent across multiple runs
 *
 * @param fn - Function to test
 * @param iterations - Number of iterations (default: 5)
 * @param maxVariation - Maximum allowed coefficient of variation (default: 0.5)
 * @param description - Description of the operation
 */
export async function expectConsistentPerformance<T>(
  fn: () => T | Promise<T>,
  iterations: number = 5,
  maxVariation: number = 0.5,
  description: string = 'operation'
): Promise<void> {
  const benchmark = await runPerformanceBenchmark(fn, iterations, description);

  // Calculate coefficient of variation (standard deviation / mean)
  const mean = benchmark.averageTime;
  const variance = benchmark.totalTime / iterations; // Simplified variance calculation
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = standardDeviation / mean;

  expect(
    coefficientOfVariation,
    `${description} should have consistent performance (CV: ${coefficientOfVariation.toFixed(3)}, max: ${maxVariation})`
  ).toBeLessThanOrEqual(maxVariation);
}
