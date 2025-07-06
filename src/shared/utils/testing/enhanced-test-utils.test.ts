/**
 * Enhanced Test Utils Test Suite
 *
 * Tests for enhanced testing utilities with tslog integration
 * following TDD methodology with comprehensive coverage.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  createAssertion,
  createMockTracker,
  EnhancedTestRunner,
  testDataGenerators,
  testRunner,
  testWithTimeout,
} from './enhanced-test-utils';

describe('Enhanced Test Utils', () => {
  describe('EnhancedTestRunner', () => {
    let runner: EnhancedTestRunner;

    beforeEach(() => {
      runner = new EnhancedTestRunner();
    });

    describe('startTest and endTest', () => {
      it('should start and end a test successfully', () => {
        const context = runner.startTest('sample test', { category: 'unit' });

        expect(context.testName).toBe('sample test');
        expect(context.metadata).toEqual({ category: 'unit' });
        expect(typeof context.startTime).toBe('number');

        const result = runner.endTest(context, true);

        expect(result.testName).toBe('sample test');
        expect(result.success).toBe(true);
        expect(result.executionTime).toBeGreaterThan(0);
        expect(result.metadata).toEqual({ category: 'unit' });
      });

      it('should handle test failure', () => {
        const context = runner.startTest('failing test');
        const result = runner.endTest(context, false, 'Test error message');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Test error message');
      });
    });

    describe('runTest', () => {
      it('should run async test successfully', async () => {
        const testFn = async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return 'test result';
        };

        const result = await runner.runTest('async test', testFn, { type: 'async' });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toBe('test result');
          expect(result.data.result.testName).toBe('async test');
          expect(result.data.result.success).toBe(true);
        }
      });

      it('should run sync test successfully', async () => {
        const testFn = () => 'sync result';

        const result = await runner.runTest('sync test', testFn);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toBe('sync result');
          expect(result.data.result.testName).toBe('sync test');
          expect(result.data.result.success).toBe(true);
        }
      });

      it('should handle test function errors', async () => {
        const testFn = () => {
          throw new Error('Test function error');
        };

        const result = await runner.runTest('error test', testFn);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Test function error');
        }
      });
    });

    describe('getSummary', () => {
      it('should provide accurate test summary', async () => {
        // Run some tests
        await runner.runTest('test1', () => 'result1');
        await runner.runTest('test2', () => 'result2');
        await runner.runTest('test3', () => {
          throw new Error('Test error');
        });

        const summary = runner.getSummary();

        expect(summary.totalTests).toBe(3);
        expect(summary.passedTests).toBe(2);
        expect(summary.failedTests).toBe(1);
        expect(summary.averageExecutionTime).toBeGreaterThan(0);
        expect(summary.failedTestsArray).toHaveLength(1);
        expect(summary.failedTestsArray[0]?.testName).toBe('test3');
      });

      it('should handle empty test results', () => {
        const summary = runner.getSummary();

        expect(summary.totalTests).toBe(0);
        expect(summary.passedTests).toBe(0);
        expect(summary.failedTests).toBe(0);
        expect(summary.averageExecutionTime).toBe(0);
        expect(summary.slowTests).toEqual([]);
        expect(summary.failedTestsArray).toEqual([]);
      });
    });

    describe('clear', () => {
      it('should clear all test results', async () => {
        await runner.runTest('test1', () => 'result');
        expect(runner.getAllResults()).toHaveLength(1);

        runner.clear();
        expect(runner.getAllResults()).toHaveLength(0);
      });
    });
  });

  describe('Global Test Runner', () => {
    beforeEach(() => {
      testRunner.clear();
    });

    it('should work with global instance', async () => {
      const result = await testRunner.runTest('global test', () => 'global result');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toBe('global result');
      }
    });
  });

  describe('createAssertion', () => {
    it('should pass for equal values', () => {
      const result = createAssertion('equality test', 5, 5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(5);
      }
    });

    it('should fail for unequal values', () => {
      const result = createAssertion('inequality test', 5, 10);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Assertion failed');
        expect(result.error).toContain('Expected: 10');
        expect(result.error).toContain('Actual: 5');
      }
    });

    it('should use custom compare function', () => {
      const customCompare = (a: number, b: number) => Math.abs(a - b) < 0.1;
      const result = createAssertion('custom compare', 5.05, 5.0, customCompare);

      expect(result.success).toBe(true);
    });
  });

  describe('testWithTimeout', () => {
    it('should complete operation within timeout', async () => {
      const operation = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'completed';
      };

      const result = await testWithTimeout(operation, 100, 'fast operation');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('completed');
      }
    });

    it('should timeout for slow operations', async () => {
      const operation = async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 'completed';
      };

      const result = await testWithTimeout(operation, 50, 'slow operation');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('timed out');
      }
    });

    it('should handle operation errors', async () => {
      const operation = async () => {
        throw new Error('Operation error');
      };

      const result = await testWithTimeout(operation, 100, 'error operation');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Operation error');
      }
    });
  });

  describe('MockTracker', () => {
    it('should track function calls', () => {
      const tracker = createMockTracker('test mock');
      const mockFn = tracker.createMockFunction((x: number) => x * 2);

      expect(tracker.getCallCount()).toBe(0);

      const result1 = mockFn(5);
      expect(result1).toBe(10);
      expect(tracker.getCallCount()).toBe(1);

      const result2 = mockFn(3);
      expect(result2).toBe(6);
      expect(tracker.getCallCount()).toBe(2);

      const calls = tracker.getCalls();
      expect(calls).toHaveLength(2);
      expect(calls[0]?.args).toEqual([5]);
      expect(calls[0]?.result).toBe(10);
      expect(calls[1]?.args).toEqual([3]);
      expect(calls[1]?.result).toBe(6);
    });

    it('should track function errors', () => {
      const tracker = createMockTracker('error mock');
      const mockFn = tracker.createMockFunction(() => {
        throw new Error('Mock error');
      });

      expect(() => mockFn()).toThrow('Mock error');
      expect(tracker.getCallCount()).toBe(1);

      const calls = tracker.getCalls();
      expect(calls[0]?.error).toBeInstanceOf(Error);
    });

    it('should filter calls by arguments', () => {
      const tracker = createMockTracker('filter mock');
      const mockFn = tracker.createMockFunction((x: number, y: string) => `${x}-${y}`);

      mockFn(1, 'a');
      mockFn(2, 'b');
      mockFn(1, 'a');

      const filteredCalls = tracker.getCallsWithArgs([1, 'a']);
      expect(filteredCalls).toHaveLength(2);
    });

    it('should clear tracked calls', () => {
      const tracker = createMockTracker('clear mock');
      const mockFn = tracker.createMockFunction(() => 'result');

      mockFn();
      expect(tracker.getCallCount()).toBe(1);

      tracker.clear();
      expect(tracker.getCallCount()).toBe(0);
    });
  });

  describe('testDataGenerators', () => {
    describe('randomString', () => {
      it('should generate string of specified length', () => {
        const str = testDataGenerators.randomString(15);
        expect(str).toHaveLength(15);
        expect(typeof str).toBe('string');
      });

      it('should generate different strings', () => {
        const str1 = testDataGenerators.randomString(10);
        const str2 = testDataGenerators.randomString(10);
        expect(str1).not.toBe(str2);
      });
    });

    describe('randomNumber', () => {
      it('should generate number in range', () => {
        const num = testDataGenerators.randomNumber(5, 10);
        expect(num).toBeGreaterThanOrEqual(5);
        expect(num).toBeLessThanOrEqual(10);
        expect(Number.isInteger(num)).toBe(true);
      });
    });

    describe('randomBoolean', () => {
      it('should generate boolean value', () => {
        const bool = testDataGenerators.randomBoolean();
        expect(typeof bool).toBe('boolean');
      });
    });

    describe('testMatrix', () => {
      it('should generate matrix of specified dimensions', () => {
        const matrix = testDataGenerators.testMatrix(3, 4);
        expect(matrix).toHaveLength(3);
        expect(matrix[0]).toHaveLength(4);
        expect(matrix[1]).toHaveLength(4);
        expect(matrix[2]).toHaveLength(4);

        // Check all values are numbers
        for (const row of matrix) {
          for (const value of row) {
            expect(typeof value).toBe('number');
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(10);
          }
        }
      });
    });
  });
});
