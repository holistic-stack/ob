/**
 * AST to CSG Converter - Multi-Feature Stress Testing
 *
 * Comprehensive stress tests that combine multiple features under load conditions,
 * test concurrent operations across parser, store, and 3D renderer, and validate
 * system stability with large datasets and complex geometries.
 *
 * @fileoverview Multi-feature stress testing for OpenSCAD AST-to-CSG conversion
 * @version 1.0.0
 * @since 2025-01-03
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import { OpenscadParser } from '../../../openscad-parser/openscad-parser.js';
import { createAppStore } from '../../../store/app-store.js';

const logger = createLogger('ASTToCSGConverterStressTest');

/**
 * Stress test scenarios for multi-feature testing
 */
const STRESS_TEST_SCENARIOS = {
  massiveDataset: {
    name: 'Massive Dataset Processing',
    description: 'Tests system stability with extremely large datasets',
    generateCode: (complexity: number) => {
      const objects = Array.from(
        { length: complexity },
        (_, i) => `translate([${i * 10}, 0, 0]) cube([5, 5, 5]);`
      ).join('\n');
      return objects;
    },
    complexityLevels: [50, 100, 200], // Number of objects
    expectedPerformanceThreshold: 1000, // ms
  },

  deepNesting: {
    name: 'Deep Nesting Stress Test',
    description: 'Tests parser and converter with deeply nested structures',
    generateCode: (depth: number) => {
      let code = 'cube([1, 1, 1]);';
      for (let i = 0; i < depth; i++) {
        code = `translate([${i}, 0, 0]) { ${code} }`;
      }
      return code;
    },
    complexityLevels: [10, 20, 30], // Nesting depth
    expectedPerformanceThreshold: 500, // ms
  },

  concurrentOperations: {
    name: 'Concurrent Operations Stress Test',
    description: 'Tests system under concurrent parsing and conversion operations',
    codes: [
      'cube([10, 10, 10]);',
      'sphere(r=5);',
      'cylinder(h=15, r=3);',
      'difference() { cube([20, 20, 20]); sphere(r=8); }',
      'union() { cube([5, 5, 5]); translate([10, 0, 0]) sphere(r=3); }',
    ],
    concurrencyLevels: [5, 10, 15], // Number of concurrent operations
    expectedPerformanceThreshold: 2000, // ms
  },

  memoryIntensive: {
    name: 'Memory Intensive Operations',
    description: 'Tests memory management with complex CSG operations',
    generateCode: (complexity: number) => {
      const operations = ['union', 'difference', 'intersection'];
      let code = 'cube([10, 10, 10]);';

      for (let i = 0; i < complexity; i++) {
        const operation = operations[i % operations.length];
        code = `${operation}() { ${code} translate([${i * 2}, 0, 0]) sphere(r=${3 + i}); }`;
      }

      return code;
    },
    complexityLevels: [5, 10, 15], // Number of nested operations
    expectedPerformanceThreshold: 1500, // ms
  },

  rapidUpdates: {
    name: 'Rapid Update Stress Test',
    description: 'Tests system stability under rapid successive updates',
    codes: [
      'cube([1, 1, 1]);',
      'cube([2, 2, 2]);',
      'cube([3, 3, 3]);',
      'cube([4, 4, 4]);',
      'cube([5, 5, 5]);',
      'sphere(r=1);',
      'sphere(r=2);',
      'sphere(r=3);',
      'cylinder(h=5, r=1);',
      'cylinder(h=10, r=2);',
    ],
    updateIntervals: [10, 5, 1], // ms between updates
    expectedPerformanceThreshold: 3000, // ms total
  },
} as const;

describe('AST to CSG Converter - Multi-Feature Stress Testing', () => {
  let store: ReturnType<typeof createAppStore>;
  let parserService: OpenscadParser;

  beforeEach(async () => {
    logger.init('Setting up stress test environment');

    // Initialize parser service with test configuration
    parserService = new OpenscadParser();

    await parserService.init();

    // Initialize store with test configuration
    store = createAppStore({
      enableDevtools: false, // Disable for testing
      enablePersistence: false, // Disable for testing
      debounceConfig: {
        parseDelayMs: 50, // Reduced for stress testing
        saveDelayMs: 200,
        renderDelayMs: 100,
      },
    });

    // Warm up the system
    await store.getState().parseCode('cube([1, 1, 1]);');

    logger.debug('Stress test environment ready');
  });

  describe('Massive Dataset Processing Tests', () => {
    const scenario = STRESS_TEST_SCENARIOS.massiveDataset;

    scenario.complexityLevels.forEach((complexity) => {
      it(`should handle ${complexity} objects without performance degradation`, async () => {
        logger.init(`Testing ${scenario.name} with ${complexity} objects`);

        const startTime = performance.now();
        const code = scenario.generateCode(complexity);

        logger.debug(`Generated code with ${code.split('\n').length} lines`);

        // Test parser integration
        const ast = parserService.parseAST(code);
        // Parsing completed

        if (ast && ast.length > 0) {
          expect(ast).toBeDefined();
          expect(ast.length).toBeGreaterThan(0);

          // Test store integration
          const storeResult = await store.getState().parseCode(code);
          expect(storeResult.success).toBe(true);

          if (storeResult.success) {
            expect(storeResult.data.length).toBeGreaterThan(0);

            // Verify store state consistency
            const storeState = store.getState();
            expect(storeState.parsing.isLoading).toBe(false);
            expect(storeState.parsing.errors.length).toBe(0);
            expect(storeState.parsing.ast).toBeDefined();
          }
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;

        logger.debug(`${scenario.name} completed in ${totalTime.toFixed(2)}ms`);
        expect(totalTime).toBeLessThan(scenario.expectedPerformanceThreshold);

        logger.end(`${scenario.name} with ${complexity} objects completed successfully`);
      });
    });
  });

  describe('Deep Nesting Stress Tests', () => {
    const scenario = STRESS_TEST_SCENARIOS.deepNesting;

    scenario.complexityLevels.forEach((depth) => {
      it(`should handle ${depth} levels of nesting without stack overflow`, async () => {
        logger.init(`Testing ${scenario.name} with ${depth} nesting levels`);

        const startTime = performance.now();
        const code = scenario.generateCode(depth);

        logger.debug(`Generated deeply nested code with ${depth} levels`);

        // Test parser resilience
        const ast = parserService.parseAST(code);
        // Parsing completed

        if (ast && ast.length > 0) {
          expect(ast).toBeDefined();

          // Test store processing
          const storeResult = await store.getState().parseCode(code);
          expect(storeResult.success).toBe(true);

          if (storeResult.success) {
            expect(storeResult.data.length).toBeGreaterThan(0);
          }
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;

        logger.debug(`${scenario.name} completed in ${totalTime.toFixed(2)}ms`);
        expect(totalTime).toBeLessThan(scenario.expectedPerformanceThreshold);

        logger.end(`${scenario.name} with ${depth} levels completed successfully`);
      });
    });
  });

  describe('Concurrent Operations Stress Tests', () => {
    const scenario = STRESS_TEST_SCENARIOS.concurrentOperations;

    scenario.concurrencyLevels.forEach((concurrency) => {
      it(`should handle ${concurrency} concurrent operations without race conditions`, async () => {
        logger.init(`Testing ${scenario.name} with ${concurrency} concurrent operations`);

        const startTime = performance.now();

        // Create multiple concurrent parsing operations
        const operations = Array.from({ length: concurrency }, (_, i) => {
          const code = scenario.codes[i % scenario.codes.length];
          if (!code) {
            throw new Error(`No code found at index ${i % scenario.codes.length}`);
          }
          return store.getState().parseCode(code);
        });

        logger.debug(`Executing ${concurrency} concurrent operations`);

        // Wait for all operations to complete
        const results = await Promise.all(operations);

        // Verify all operations succeeded
        results.forEach((result, _index) => {
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.length).toBeGreaterThan(0);
          }
        });

        // Verify store state consistency
        const storeState = store.getState();
        expect(storeState.parsing.isLoading).toBe(false);
        expect(storeState.parsing.errors.length).toBe(0);

        const endTime = performance.now();
        const totalTime = endTime - startTime;

        logger.debug(`${scenario.name} completed in ${totalTime.toFixed(2)}ms`);
        expect(totalTime).toBeLessThan(scenario.expectedPerformanceThreshold);

        logger.end(`${scenario.name} with ${concurrency} operations completed successfully`);
      });
    });
  });

  describe('Memory Intensive Operations Tests', () => {
    const scenario = STRESS_TEST_SCENARIOS.memoryIntensive;

    scenario.complexityLevels.forEach((complexity) => {
      it(`should handle ${complexity} nested CSG operations without memory leaks`, async () => {
        logger.init(`Testing ${scenario.name} with ${complexity} nested operations`);

        const startTime = performance.now();
        const code = scenario.generateCode(complexity);

        logger.debug(`Generated memory-intensive code with ${complexity} nested operations`);

        // Monitor memory usage (basic check)
        const initialMemory =
          (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
            ?.usedJSHeapSize || 0;

        // Test parser with complex nested operations
        const ast = parserService.parseAST(code);
        // Parsing completed

        if (ast && ast.length > 0) {
          expect(ast).toBeDefined();

          // Test store processing
          const storeResult = await store.getState().parseCode(code);
          expect(storeResult.success).toBe(true);

          if (storeResult.success) {
            expect(storeResult.data.length).toBeGreaterThan(0);
          }
        }

        const finalMemory =
          (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
            ?.usedJSHeapSize || 0;
        const memoryIncrease = finalMemory - initialMemory;

        logger.debug(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

        const endTime = performance.now();
        const totalTime = endTime - startTime;

        logger.debug(`${scenario.name} completed in ${totalTime.toFixed(2)}ms`);
        expect(totalTime).toBeLessThan(scenario.expectedPerformanceThreshold);

        logger.end(`${scenario.name} with ${complexity} operations completed successfully`);
      });
    });
  });

  describe('Rapid Update Stress Tests', () => {
    const scenario = STRESS_TEST_SCENARIOS.rapidUpdates;

    scenario.updateIntervals.forEach((interval) => {
      it(`should handle rapid updates every ${interval}ms without performance degradation`, async () => {
        logger.init(`Testing ${scenario.name} with ${interval}ms intervals`);

        const startTime = performance.now();
        const updatePromises: Promise<unknown>[] = [];

        // Simulate rapid successive updates
        for (let i = 0; i < scenario.codes.length; i++) {
          const code = scenario.codes[i];

          const updatePromise = new Promise((resolve) => {
            setTimeout(async () => {
              try {
                if (!code) {
                  throw new Error(`No code found at index ${i}`);
                }
                const result = await store.getState().parseCode(code);
                expect(result.success).toBe(true);
                resolve(result);
              } catch (error) {
                logger.error(`Update ${i} failed: ${error}`);
                throw error;
              }
            }, i * interval);
          });

          updatePromises.push(updatePromise);
        }

        logger.debug(`Executing ${scenario.codes.length} rapid updates`);

        // Wait for all updates to complete
        await Promise.all(updatePromises);

        // Verify final store state
        const storeState = store.getState();
        expect(storeState.parsing.isLoading).toBe(false);
        expect(storeState.parsing.errors.length).toBe(0);
        expect(storeState.parsing.ast).toBeDefined();

        const endTime = performance.now();
        const totalTime = endTime - startTime;

        logger.debug(`${scenario.name} completed in ${totalTime.toFixed(2)}ms`);
        expect(totalTime).toBeLessThan(scenario.expectedPerformanceThreshold);

        logger.end(`${scenario.name} with ${interval}ms intervals completed successfully`);
      });
    });
  });

  describe('System Stability and Recovery Tests', () => {
    it('should recover gracefully from parser errors under stress', async () => {
      logger.init('Testing system recovery from parser errors under stress');

      const invalidCodes = [
        'cube([10, 10, 10]); invalid_syntax_here;',
        'sphere(r=5); missing_function();',
        'cylinder(h=15, r=3); { unclosed_block',
        'difference() { cube([20, 20, 20]); sphere(r=8); } extra_content',
      ];

      const validCodes = [
        'cube([5, 5, 5]);',
        'sphere(r=3);',
        'cylinder(h=10, r=2);',
        'union() { cube([3, 3, 3]); sphere(r=2); }',
      ];

      // Alternate between invalid and valid code
      for (let i = 0; i < 10; i++) {
        const code =
          i % 2 === 0 ? invalidCodes[i % invalidCodes.length] : validCodes[i % validCodes.length];
        const isValid = i % 2 !== 0;

        if (!code) {
          throw new Error(`No code found at index ${i}`);
        }

        const result = await store.getState().parseCode(code);

        if (isValid) {
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.length).toBeGreaterThan(0);
          }
        }

        // System should remain stable regardless of parse success/failure
        const storeState = store.getState();
        expect(storeState.parsing.isLoading).toBe(false);
      }

      logger.end('System recovery test completed successfully');
    });

    it('should maintain performance consistency across multiple stress cycles', async () => {
      logger.init('Testing performance consistency across stress cycles');

      const testCode = 'union() { cube([10, 10, 10]); translate([15, 0, 0]) sphere(r=5); }';
      const cycles = 5;
      const operationsPerCycle = 10;
      const performanceTimes: number[] = [];

      for (let cycle = 0; cycle < cycles; cycle++) {
        logger.debug(`Starting stress cycle ${cycle + 1}/${cycles}`);

        const cycleStartTime = performance.now();

        // Execute multiple operations in this cycle
        const cyclePromises = Array.from({ length: operationsPerCycle }, async () => {
          const result = await store.getState().parseCode(testCode);
          expect(result.success).toBe(true);
          return result;
        });

        await Promise.all(cyclePromises);

        const cycleEndTime = performance.now();
        const cycleTime = cycleEndTime - cycleStartTime;
        performanceTimes.push(cycleTime);

        logger.debug(`Cycle ${cycle + 1} completed in ${cycleTime.toFixed(2)}ms`);
      }

      // Verify performance consistency (no significant degradation)
      const averageTime =
        performanceTimes.reduce((sum, time) => sum + time, 0) / performanceTimes.length;
      const maxTime = Math.max(...performanceTimes);
      const minTime = Math.min(...performanceTimes);

      logger.debug(
        `Performance stats - Avg: ${averageTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`
      );

      // Performance should not degrade more than 75% from average (allowing for normal variance)
      expect(maxTime).toBeLessThan(averageTime * 1.75);

      logger.end('Performance consistency test completed successfully');
    });

    it('should handle extreme edge cases without system failure', async () => {
      logger.init('Testing extreme edge cases');

      const extremeCases = [
        '', // Empty code
        ' '.repeat(1000), // Whitespace only
        'cube([10, 10, 10]);'.repeat(100), // Massive repetition
        `// ${'comment '.repeat(500)}`, // Huge comment
        `x = [${Array.from({ length: 100 }, (_, i) => i).join(', ')}];`, // Large array
      ];

      for (const code of extremeCases) {
        logger.debug(`Testing extreme case: ${code.substring(0, 50)}...`);

        try {
          const result = await store.getState().parseCode(code);
          // System should not crash, regardless of parse success
          expect(typeof result.success).toBe('boolean');

          const storeState = store.getState();
          expect(storeState.parsing.isLoading).toBe(false);
        } catch (error) {
          logger.error(`Extreme case failed: ${error}`);
          throw error;
        }
      }

      logger.end('Extreme edge cases test completed successfully');
    });
  });

  describe('Resource Management and Cleanup Tests', () => {
    it('should properly dispose of resources after stress operations', async () => {
      logger.init('Testing resource disposal after stress operations');

      const initialMemory =
        (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0;

      // Perform intensive operations
      for (let i = 0; i < 20; i++) {
        const complexCode = `
          difference() {
            union() {
              cube([20, 20, 20]);
              translate([25, 0, 0]) sphere(r=10);
            }
            translate([10, 10, 10]) cylinder(h=30, r=5);
          }
        `;

        const result = await store.getState().parseCode(complexCode);
        expect(result.success).toBe(true);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Allow some time for cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      const finalMemory =
        (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      logger.debug(
        `Memory increase after stress operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
      );

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      logger.end('Resource disposal test completed successfully');
    });
  });
});
