/**
 * Enhanced Testing Utilities with Logging and Performance Integration
 *
 * Provides comprehensive testing utilities that integrate with tslog and
 * performance monitoring for bulletproof-react architecture compliance.
 */

import { createLogger } from '../../services/logger.service';
import type { Result } from '../../types/result.types';
import { error, success } from '../functional/result';
import {
  type EnhancedPerformanceMetrics,
  performanceMonitor,
} from '../performance/performance-monitor';

const logger = createLogger('TestUtils');

/**
 * Test execution context interface
 */
export interface TestContext {
  readonly testName: string;
  readonly startTime: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Test result interface with performance metrics
 */
export interface TestResult {
  readonly testName: string;
  readonly success: boolean;
  readonly executionTime: number;
  readonly performanceMetrics?: EnhancedPerformanceMetrics;
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Enhanced test runner with logging and performance monitoring
 */
export class EnhancedTestRunner {
  private testResults: TestResult[] = [];
  private currentContext: TestContext | null = null;

  /**
   * Start a test with enhanced logging
   */
  startTest(testName: string, metadata?: Record<string, unknown>): TestContext {
    logger.init(`Starting test: ${testName}`);

    const context: TestContext = {
      testName,
      startTime: performance.now(),
      ...(metadata && { metadata }),
    };

    this.currentContext = context;

    if (metadata) {
      logger.debug('Test metadata:', metadata);
    }

    return context;
  }

  /**
   * End a test and record results
   */
  endTest(context: TestContext, success: boolean, error?: string): TestResult {
    const executionTime = performance.now() - context.startTime;

    const result: TestResult = {
      testName: context.testName,
      success,
      executionTime,
      ...(error && { error }),
      ...(context.metadata && { metadata: context.metadata }),
    };

    this.testResults.push(result);

    if (success) {
      logger.info(`Test passed: ${context.testName} (${executionTime.toFixed(2)}ms)`);
    } else {
      logger.error(`Test failed: ${context.testName} (${executionTime.toFixed(2)}ms)`, error);
    }

    this.currentContext = null;
    return result;
  }

  /**
   * Run a test with automatic performance monitoring
   */
  async runTest<T>(
    testName: string,
    testFn: () => Promise<T> | T,
    metadata?: Record<string, unknown>
  ): Promise<Result<{ data: T; result: TestResult }, string>> {
    const context = this.startTest(testName, metadata);

    try {
      // Use performance monitor to track the test execution
      const performanceResult = await performanceMonitor.measureAsync(
        `test_${testName}`,
        'ui', // Tests are UI category for timing purposes
        async () => testFn()
      );

      if (!performanceResult.success) {
        this.endTest(context, false, performanceResult.error);
        return error(`Test execution failed: ${performanceResult.error}`);
      }

      const testResult = this.endTest(context, true);
      // Create a new result with performance metrics
      const enhancedResult: TestResult = {
        ...testResult,
        performanceMetrics: performanceResult.data.metrics,
      };

      return success({
        data: performanceResult.data.data,
        result: enhancedResult,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.endTest(context, false, errorMessage);
      return error(`Test execution failed: ${errorMessage}`);
    }
  }

  /**
   * Get test summary with performance insights
   */
  getSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageExecutionTime: number;
    slowTests: TestResult[];
    failedTestsArray: TestResult[];
  } {
    const passedTests = this.testResults.filter((r) => r.success);
    const failedTests = this.testResults.filter((r) => !r.success);
    const slowTests = this.testResults.filter((r) => r.executionTime > 100); // >100ms is slow for tests

    const averageExecutionTime =
      this.testResults.length > 0
        ? this.testResults.reduce((sum, r) => sum + r.executionTime, 0) / this.testResults.length
        : 0;

    const summary = {
      totalTests: this.testResults.length,
      passedTests: passedTests.length,
      failedTests: failedTests.length,
      averageExecutionTime,
      slowTests,
      failedTestsArray: failedTests,
    };

    logger.debug('Test summary generated:', summary);
    return summary;
  }

  /**
   * Clear all test results
   */
  clear(): void {
    logger.debug(`Clearing ${this.testResults.length} test results`);
    this.testResults = [];
    this.currentContext = null;
  }

  /**
   * Get all test results
   */
  getAllResults(): readonly TestResult[] {
    return Object.freeze([...this.testResults]);
  }
}

/**
 * Global test runner instance
 */
export const testRunner = new EnhancedTestRunner();

/**
 * Utility function to create a test assertion with logging
 */
export const createAssertion = <T>(
  name: string,
  actual: T,
  expected: T,
  compareFn?: (actual: T, expected: T) => boolean
): Result<T, string> => {
  logger.debug(`Assertion: ${name}`, { actual, expected });

  const isEqual = compareFn ? compareFn(actual, expected) : actual === expected;

  if (isEqual) {
    logger.debug(`Assertion passed: ${name}`);
    return success(actual);
  } else {
    const errorMessage = `Assertion failed: ${name}. Expected: ${String(expected)}, Actual: ${String(actual)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Utility to test async operations with timeout
 */
export const testWithTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs: number = 5000,
  operationName: string = 'async operation'
): Promise<Result<T, string>> => {
  logger.debug(`Starting ${operationName} with ${timeoutMs}ms timeout`);

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
        timeoutMs
      );
    });

    const result = await Promise.race([operation(), timeoutPromise]);
    logger.debug(`${operationName} completed successfully`);
    return success(result);
  } catch (err) {
    const errorMessage = `${operationName} failed: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(errorMessage);
    return error(errorMessage);
  }
};

/**
 * Mock function tracker with logging
 */
export class MockTracker {
  private calls: Array<{ args: unknown[]; timestamp: number; result?: unknown; error?: unknown }> =
    [];
  private readonly mockName: string;

  constructor(mockName: string) {
    this.mockName = mockName;
    logger.debug(`Mock tracker created for: ${mockName}`);
  }

  /**
   * Record a mock function call
   */
  recordCall(args: unknown[], result?: unknown, error?: unknown): void {
    const call = {
      args,
      timestamp: Date.now(),
      result,
      error,
    };

    this.calls.push(call);
    logger.debug(`Mock call recorded for ${this.mockName}:`, call);
  }

  /**
   * Get call count
   */
  getCallCount(): number {
    return this.calls.length;
  }

  /**
   * Get all calls
   */
  getCalls(): ReadonlyArray<{
    args: unknown[];
    timestamp: number;
    result?: unknown;
    error?: unknown;
  }> {
    return Object.freeze([...this.calls]);
  }

  /**
   * Get calls with specific arguments
   */
  getCallsWithArgs(
    expectedArgs: unknown[]
  ): ReadonlyArray<{ args: unknown[]; timestamp: number; result?: unknown; error?: unknown }> {
    return this.calls.filter(
      (call) =>
        call.args.length === expectedArgs.length &&
        call.args.every((arg, index) => arg === expectedArgs[index])
    );
  }

  /**
   * Clear all recorded calls
   */
  clear(): void {
    logger.debug(`Clearing ${this.calls.length} mock calls for ${this.mockName}`);
    this.calls = [];
  }

  /**
   * Create a mock function that automatically tracks calls
   */
  createMockFunction<TArgs extends readonly unknown[], TReturn>(
    implementation?: (...args: TArgs) => TReturn
  ): (...args: TArgs) => TReturn {
    return (...args: TArgs): TReturn => {
      try {
        const result = implementation ? implementation(...args) : (undefined as TReturn);
        this.recordCall([...args], result);
        return result;
      } catch (error) {
        this.recordCall([...args], undefined, error);
        throw error;
      }
    };
  }
}

/**
 * Utility to create a mock tracker
 */
export const createMockTracker = (mockName: string): MockTracker => {
  return new MockTracker(mockName);
};

/**
 * Test data generator utilities
 */
export const testDataGenerators = {
  /**
   * Generate random string
   */
  randomString: (length: number = 10): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Generate random number in range
   */
  randomNumber: (min: number = 0, max: number = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate random boolean
   */
  randomBoolean: (): boolean => {
    return Math.random() < 0.5;
  },

  /**
   * Generate test matrix data
   */
  testMatrix: (rows: number, cols: number): number[][] => {
    const matrix: number[][] = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      const row = matrix[i];
      if (row) {
        for (let j = 0; j < cols; j++) {
          row[j] = testDataGenerators.randomNumber(1, 10);
        }
      }
    }
    return matrix;
  },
};
