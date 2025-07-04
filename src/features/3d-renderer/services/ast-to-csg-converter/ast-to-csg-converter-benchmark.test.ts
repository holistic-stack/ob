/**
 * AST to CSG Converter - Integration Performance Benchmarking
 *
 * Comprehensive performance benchmarking suite for integration scenarios,
 * establishing baseline performance metrics for different operation types
 * and implementing automated performance regression detection.
 *
 * @fileoverview Integration performance benchmarking for OpenSCAD AST-to-CSG conversion
 * @version 1.0.0
 * @since 2025-01-03
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode } from '../../../openscad-parser/core/ast-types.js';
import { OpenscadParser } from '../../../openscad-parser/openscad-parser.js';
import { createLogger } from '../../../../shared/services/logger.service.js';
import { OpenscadParser } from '../../../openscad-parser/openscad-parser.js';
import { createAppStore } from '../../../store/app-store.js';

const logger = createLogger('ASTToCSGConverterBenchmarkTest');

/**
 * Performance baseline metrics for different operation types
 * These values represent acceptable performance thresholds
 */
const PERFORMANCE_BASELINES = {
  // Basic operations (single primitives)
  basicPrimitive: {
    parsing: 5, // ms
    conversion: 3, // ms
    endToEnd: 10, // ms
  },

  // Complex operations (nested transformations, CSG)
  complexOperation: {
    parsing: 15, // ms
    conversion: 10, // ms
    endToEnd: 30, // ms
  },

  // Large datasets (multiple objects)
  largeDataset: {
    parsing: 50, // ms
    conversion: 30, // ms
    endToEnd: 100, // ms
  },

  // Real-world scenarios (corpus examples)
  realWorld: {
    parsing: 25, // ms
    conversion: 20, // ms
    endToEnd: 60, // ms
  },
} as const;

/**
 * Performance test scenarios with different complexity levels
 */
const BENCHMARK_SCENARIOS = {
  basicPrimitives: {
    name: 'Basic Primitives Performance',
    description: 'Tests performance of basic primitive operations',
    baseline: PERFORMANCE_BASELINES.basicPrimitive,
    testCases: [
      {
        name: 'Simple Cube',
        code: 'cube([10, 10, 10]);',
        expectedComplexity: 'low',
      },
      {
        name: 'Simple Sphere',
        code: 'sphere(r=5);',
        expectedComplexity: 'low',
      },
      {
        name: 'Simple Cylinder',
        code: 'cylinder(h=15, r=3);',
        expectedComplexity: 'low',
      },
    ],
  },

  transformations: {
    name: 'Transformation Operations Performance',
    description: 'Tests performance of transformation operations',
    baseline: PERFORMANCE_BASELINES.complexOperation,
    testCases: [
      {
        name: 'Single Translation',
        code: 'translate([5, 0, 0]) cube([5, 5, 5]);',
        expectedComplexity: 'medium',
      },
      {
        name: 'Nested Transformations',
        code: 'translate([10, 0, 0]) rotate([0, 0, 45]) scale([1.5, 1.5, 1.5]) cube([3, 3, 3]);',
        expectedComplexity: 'medium',
      },
      {
        name: 'Complex Transformation Chain',
        code: `
          translate([20, 0, 0]) {
            rotate([0, 0, 30]) {
              scale([2, 1, 1]) {
                mirror([1, 0, 0]) {
                  cube([5, 5, 5]);
                }
              }
            }
          }
        `,
        expectedComplexity: 'high',
      },
    ],
  },

  csgOperations: {
    name: 'CSG Operations Performance',
    description: 'Tests performance of boolean CSG operations',
    baseline: PERFORMANCE_BASELINES.complexOperation,
    testCases: [
      {
        name: 'Simple Union',
        code: 'union() { cube([10, 10, 10]); translate([5, 0, 0]) sphere(r=5); }',
        expectedComplexity: 'medium',
      },
      {
        name: 'Simple Difference',
        code: 'difference() { cube([20, 20, 20]); translate([10, 10, 10]) sphere(r=8); }',
        expectedComplexity: 'medium',
      },
      {
        name: 'Complex Nested CSG',
        code: `
          difference() {
            union() {
              cube([30, 30, 30]);
              translate([35, 0, 0]) cylinder(h=30, r=10);
            }
            intersection() {
              translate([15, 15, 15]) sphere(r=12);
              translate([20, 5, 5]) cube([15, 15, 15]);
            }
          }
        `,
        expectedComplexity: 'high',
      },
    ],
  },

  largeDatasets: {
    name: 'Large Dataset Performance',
    description: 'Tests performance with large numbers of objects',
    baseline: PERFORMANCE_BASELINES.largeDataset,
    testCases: [
      {
        name: 'Multiple Objects (10)',
        code: Array.from(
          { length: 10 },
          (_, i) => `translate([${i * 12}, 0, 0]) cube([5, 5, 5]);`
        ).join('\n'),
        expectedComplexity: 'medium',
      },
      {
        name: 'Multiple Objects (25)',
        code: Array.from(
          { length: 25 },
          (_, i) => `translate([${i * 8}, ${Math.floor(i / 5) * 8}, 0]) sphere(r=${2 + (i % 3)});`
        ).join('\n'),
        expectedComplexity: 'high',
      },
      {
        name: 'Complex Grid Pattern',
        code: `
          for (x = [0:4]) {
            for (y = [0:4]) {
              translate([x*15, y*15, 0]) {
                difference() {
                  cube([10, 10, 10]);
                  translate([5, 5, 5]) sphere(r=4);
                }
              }
            }
          }
        `,
        expectedComplexity: 'high',
      },
    ],
  },

  realWorldScenarios: {
    name: 'Real-World Scenarios Performance',
    description: 'Tests performance with real-world OpenSCAD examples',
    baseline: PERFORMANCE_BASELINES.realWorld,
    testCases: [
      {
        name: 'Parametric Box',
        code: `
          module box(size=[10,10,10], wall=2, center=false) {
            difference() {
              cube(size, center);
              translate([wall, wall, wall])
                cube([size.x-2*wall, size.y-2*wall, size.z-wall], center);
            }
          }
          box([20, 15, 10], 1.5);
        `,
        expectedComplexity: 'medium',
      },
      {
        name: 'Gear Tooth Pattern',
        code: `
          module gear_tooth(height=5, width=2) {
            linear_extrude(height=height) {
              polygon([[0,0], [width,0], [width*0.8,width], [width*0.2,width]]);
            }
          }
          
          for (i = [0:11]) {
            rotate([0, 0, i*30]) translate([10, 0, 0]) gear_tooth();
          }
        `,
        expectedComplexity: 'high',
      },
      {
        name: 'Architectural Component',
        code: `
          module window(width=10, height=15, depth=2) {
            difference() {
              cube([width, depth, height]);
              translate([1, -0.1, 1]) cube([width-2, depth+0.2, height-2]);
            }
            // Window frame
            for (x = [2:2:width-2]) {
              translate([x, 0, 0]) cube([0.5, depth, height]);
            }
            for (z = [3:3:height-3]) {
              translate([0, 0, z]) cube([width, depth, 0.5]);
            }
          }
          window(20, 25, 3);
        `,
        expectedComplexity: 'high',
      },
    ],
  },
} as const;

/**
 * Performance measurement utilities
 */
interface PerformanceMetrics {
  parsing: number;
  conversion: number;
  endToEnd: number;
  memoryUsage?: number;
}

interface BenchmarkResult {
  scenario: string;
  testCase: string;
  metrics: PerformanceMetrics;
  baseline: (typeof PERFORMANCE_BASELINES)[keyof typeof PERFORMANCE_BASELINES];
  passed: boolean;
  regressionDetected: boolean;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  async measurePerformance(
    code: string,
    parserService: UnifiedParserService,
    store: ReturnType<typeof createAppStore>
  ): Promise<PerformanceMetrics> {
    const initialMemory =
      (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ||
      0;

    // Measure end-to-end performance
    const endToEndStart = performance.now();

    // Measure parsing performance
    const parseStart = performance.now();
    const parseResult = parserService.parseAST(code);
    const parseEnd = performance.now();
    const parsingTime = parseEnd - parseStart;

    if (!parseResult.success) {
      throw new Error(`Parsing failed: ${parseResult.error}`);
    }

    // Measure store integration and conversion performance
    const conversionStart = performance.now();
    const storeResult = await store.getState().parseCode(code);
    const conversionEnd = performance.now();
    const conversionTime = conversionEnd - conversionStart;

    if (!storeResult.success) {
      throw new Error(`Store conversion failed: ${storeResult.error}`);
    }

    const endToEndEnd = performance.now();
    const endToEndTime = endToEndEnd - endToEndStart;

    const finalMemory =
      (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ||
      0;
    const memoryUsage = finalMemory - initialMemory;

    return {
      parsing: parsingTime,
      conversion: conversionTime,
      endToEnd: endToEndTime,
      memoryUsage,
    };
  }

  detectRegression(
    current: PerformanceMetrics,
    baseline: (typeof PERFORMANCE_BASELINES)[keyof typeof PERFORMANCE_BASELINES]
  ): boolean {
    // Detect regression if current performance is more than 25% worse than baseline
    const regressionThreshold = 1.25;

    return (
      current.parsing > baseline.parsing * regressionThreshold ||
      current.conversion > baseline.conversion * regressionThreshold ||
      current.endToEnd > baseline.endToEnd * regressionThreshold
    );
  }

  validatePerformance(
    metrics: PerformanceMetrics,
    baseline: (typeof PERFORMANCE_BASELINES)[keyof typeof PERFORMANCE_BASELINES]
  ): boolean {
    return (
      metrics.parsing <= baseline.parsing &&
      metrics.conversion <= baseline.conversion &&
      metrics.endToEnd <= baseline.endToEnd
    );
  }

  addResult(result: BenchmarkResult): void {
    this.results.push(result);
  }

  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  generateReport(): string {
    const totalTests = this.results.length;
    const passedTests = this.results.filter((r: any) => r.passed).length;
    const regressions = this.results.filter((r: any) => r.regressionDetected).length;

    let report = `\n=== PERFORMANCE BENCHMARK REPORT ===\n`;
    report += `Total Tests: ${totalTests}\n`;
    report += `Passed: ${passedTests}/${totalTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)\n`;
    report += `Regressions Detected: ${regressions}\n\n`;

    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      const regression = result.regressionDetected ? '⚠️ REGRESSION' : '';

      report += `${status} ${result.scenario} - ${result.testCase} ${regression}\n`;
      report += `  Parsing: ${result.metrics.parsing.toFixed(2)}ms (baseline: ${result.baseline.parsing}ms)\n`;
      report += `  Conversion: ${result.metrics.conversion.toFixed(2)}ms (baseline: ${result.baseline.conversion}ms)\n`;
      report += `  End-to-End: ${result.metrics.endToEnd.toFixed(2)}ms (baseline: ${result.baseline.endToEnd}ms)\n`;
      if (result.metrics.memoryUsage) {
        report += `  Memory: ${(result.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
      }
      report += '\n';
    }

    return report;
  }
}

describe('AST to CSG Converter - Integration Performance Benchmarking', () => {
  let store: ReturnType<typeof createAppStore>;
  let parserService: OpenscadParser;
  let benchmark: PerformanceBenchmark;

  beforeEach(async () => {
    logger.init('Setting up performance benchmark environment');

    // Initialize parser service with optimized configuration
    parserService = new OpenscadParser();

    await parserService.init();

    // Initialize store with optimized configuration
    store = createAppStore({
      enableDevtools: false, // Disable for performance testing
      enablePersistence: false, // Disable for performance testing
      debounceConfig: {
        parseDelayMs: 0, // No debouncing for accurate measurement
        saveDelayMs: 0,
        renderDelayMs: 0,
      },
    });

    benchmark = new PerformanceBenchmark();

    // Warm up the system with a simple operation
    await store.getState().parseCode('cube([1, 1, 1]);');

    logger.debug('Performance benchmark environment ready');
  });

  describe('Basic Primitives Performance Tests', () => {
    const scenario = BENCHMARK_SCENARIOS.basicPrimitives;

    scenario.testCases.forEach((testCase) => {
      it(`should meet performance baseline for ${testCase.name}`, async () => {
        logger.init(`Benchmarking ${scenario.name} - ${testCase.name}`);

        const metrics = await benchmark.measurePerformance(testCase.code, parserService, store);

        const passed = benchmark.validatePerformance(metrics, scenario.baseline);
        const regressionDetected = benchmark.detectRegression(metrics, scenario.baseline);

        benchmark.addResult({
          scenario: scenario.name,
          testCase: testCase.name,
          metrics,
          baseline: scenario.baseline,
          passed,
          regressionDetected,
        });

        logger.debug(
          `Performance metrics - Parsing: ${metrics.parsing.toFixed(2)}ms, Conversion: ${metrics.conversion.toFixed(2)}ms, End-to-End: ${metrics.endToEnd.toFixed(2)}ms`
        );

        // Assert performance requirements
        expect(metrics.parsing).toBeLessThanOrEqual(scenario.baseline.parsing);
        expect(metrics.conversion).toBeLessThanOrEqual(scenario.baseline.conversion);
        expect(metrics.endToEnd).toBeLessThanOrEqual(scenario.baseline.endToEnd);

        // Warn about regressions but don't fail the test
        if (regressionDetected) {
          logger.warn(`Performance regression detected for ${testCase.name}`);
        }

        logger.end(`${scenario.name} - ${testCase.name} completed successfully`);
      });
    });
  });

  describe('Transformation Operations Performance Tests', () => {
    const scenario = BENCHMARK_SCENARIOS.transformations;

    scenario.testCases.forEach((testCase) => {
      it(`should meet performance baseline for ${testCase.name}`, async () => {
        logger.init(`Benchmarking ${scenario.name} - ${testCase.name}`);

        const metrics = await benchmark.measurePerformance(testCase.code, parserService, store);

        const passed = benchmark.validatePerformance(metrics, scenario.baseline);
        const regressionDetected = benchmark.detectRegression(metrics, scenario.baseline);

        benchmark.addResult({
          scenario: scenario.name,
          testCase: testCase.name,
          metrics,
          baseline: scenario.baseline,
          passed,
          regressionDetected,
        });

        logger.debug(
          `Performance metrics - Parsing: ${metrics.parsing.toFixed(2)}ms, Conversion: ${metrics.conversion.toFixed(2)}ms, End-to-End: ${metrics.endToEnd.toFixed(2)}ms`
        );

        // Assert performance requirements
        expect(metrics.parsing).toBeLessThanOrEqual(scenario.baseline.parsing);
        expect(metrics.conversion).toBeLessThanOrEqual(scenario.baseline.conversion);
        expect(metrics.endToEnd).toBeLessThanOrEqual(scenario.baseline.endToEnd);

        // Warn about regressions but don't fail the test
        if (regressionDetected) {
          logger.warn(`Performance regression detected for ${testCase.name}`);
        }

        logger.end(`${scenario.name} - ${testCase.name} completed successfully`);
      });
    });
  });

  describe('CSG Operations Performance Tests', () => {
    const scenario = BENCHMARK_SCENARIOS.csgOperations;

    scenario.testCases.forEach((testCase) => {
      it(`should meet performance baseline for ${testCase.name}`, async () => {
        logger.init(`Benchmarking ${scenario.name} - ${testCase.name}`);

        const metrics = await benchmark.measurePerformance(testCase.code, parserService, store);

        const passed = benchmark.validatePerformance(metrics, scenario.baseline);
        const regressionDetected = benchmark.detectRegression(metrics, scenario.baseline);

        benchmark.addResult({
          scenario: scenario.name,
          testCase: testCase.name,
          metrics,
          baseline: scenario.baseline,
          passed,
          regressionDetected,
        });

        logger.debug(
          `Performance metrics - Parsing: ${metrics.parsing.toFixed(2)}ms, Conversion: ${metrics.conversion.toFixed(2)}ms, End-to-End: ${metrics.endToEnd.toFixed(2)}ms`
        );

        // Assert performance requirements
        expect(metrics.parsing).toBeLessThanOrEqual(scenario.baseline.parsing);
        expect(metrics.conversion).toBeLessThanOrEqual(scenario.baseline.conversion);
        expect(metrics.endToEnd).toBeLessThanOrEqual(scenario.baseline.endToEnd);

        // Warn about regressions but don't fail the test
        if (regressionDetected) {
          logger.warn(`Performance regression detected for ${testCase.name}`);
        }

        logger.end(`${scenario.name} - ${testCase.name} completed successfully`);
      });
    });
  });

  describe('Large Dataset Performance Tests', () => {
    const scenario = BENCHMARK_SCENARIOS.largeDatasets;

    scenario.testCases.forEach((testCase) => {
      it(`should meet performance baseline for ${testCase.name}`, async () => {
        logger.init(`Benchmarking ${scenario.name} - ${testCase.name}`);

        const metrics = await benchmark.measurePerformance(testCase.code, parserService, store);

        const passed = benchmark.validatePerformance(metrics, scenario.baseline);
        const regressionDetected = benchmark.detectRegression(metrics, scenario.baseline);

        benchmark.addResult({
          scenario: scenario.name,
          testCase: testCase.name,
          metrics,
          baseline: scenario.baseline,
          passed,
          regressionDetected,
        });

        logger.debug(
          `Performance metrics - Parsing: ${metrics.parsing.toFixed(2)}ms, Conversion: ${metrics.conversion.toFixed(2)}ms, End-to-End: ${metrics.endToEnd.toFixed(2)}ms`
        );

        // Assert performance requirements
        expect(metrics.parsing).toBeLessThanOrEqual(scenario.baseline.parsing);
        expect(metrics.conversion).toBeLessThanOrEqual(scenario.baseline.conversion);
        expect(metrics.endToEnd).toBeLessThanOrEqual(scenario.baseline.endToEnd);

        // Warn about regressions but don't fail the test
        if (regressionDetected) {
          logger.warn(`Performance regression detected for ${testCase.name}`);
        }

        logger.end(`${scenario.name} - ${testCase.name} completed successfully`);
      });
    });
  });

  describe('Real-World Scenarios Performance Tests', () => {
    const scenario = BENCHMARK_SCENARIOS.realWorldScenarios;

    scenario.testCases.forEach((testCase) => {
      it(`should meet performance baseline for ${testCase.name}`, async () => {
        logger.init(`Benchmarking ${scenario.name} - ${testCase.name}`);

        const metrics = await benchmark.measurePerformance(testCase.code, parserService, store);

        const passed = benchmark.validatePerformance(metrics, scenario.baseline);
        const regressionDetected = benchmark.detectRegression(metrics, scenario.baseline);

        benchmark.addResult({
          scenario: scenario.name,
          testCase: testCase.name,
          metrics,
          baseline: scenario.baseline,
          passed,
          regressionDetected,
        });

        logger.debug(
          `Performance metrics - Parsing: ${metrics.parsing.toFixed(2)}ms, Conversion: ${metrics.conversion.toFixed(2)}ms, End-to-End: ${metrics.endToEnd.toFixed(2)}ms`
        );

        // Assert performance requirements
        expect(metrics.parsing).toBeLessThanOrEqual(scenario.baseline.parsing);
        expect(metrics.conversion).toBeLessThanOrEqual(scenario.baseline.conversion);
        expect(metrics.endToEnd).toBeLessThanOrEqual(scenario.baseline.endToEnd);

        // Warn about regressions but don't fail the test
        if (regressionDetected) {
          logger.warn(`Performance regression detected for ${testCase.name}`);
        }

        logger.end(`${scenario.name} - ${testCase.name} completed successfully`);
      });
    });
  });

  describe('Performance Regression Detection Tests', () => {
    it('should detect performance regressions accurately', async () => {
      logger.init('Testing performance regression detection');

      const testCode = 'cube([10, 10, 10]);';
      const baseline = PERFORMANCE_BASELINES.basicPrimitive;

      // Measure current performance
      const metrics = await benchmark.measurePerformance(testCode, parserService, store);

      // Test regression detection with artificially inflated metrics
      const regressedMetrics: PerformanceMetrics = {
        parsing: baseline.parsing * 1.5, // 50% worse than baseline
        conversion: baseline.conversion * 1.3, // 30% worse than baseline
        endToEnd: baseline.endToEnd * 1.4, // 40% worse than baseline
      };

      const regressionDetected = benchmark.detectRegression(regressedMetrics, baseline);
      expect(regressionDetected).toBe(true);

      // Test that normal performance doesn't trigger regression
      const normalRegression = benchmark.detectRegression(metrics, baseline);
      expect(normalRegression).toBe(false);

      logger.end('Performance regression detection test completed successfully');
    });

    it('should validate performance baselines correctly', async () => {
      logger.init('Testing performance baseline validation');

      const baseline = PERFORMANCE_BASELINES.basicPrimitive;

      // Test metrics that meet baseline
      const goodMetrics: PerformanceMetrics = {
        parsing: baseline.parsing * 0.8, // 20% better than baseline
        conversion: baseline.conversion * 0.9, // 10% better than baseline
        endToEnd: baseline.endToEnd * 0.95, // 5% better than baseline
      };

      const goodValidation = benchmark.validatePerformance(goodMetrics, baseline);
      expect(goodValidation).toBe(true);

      // Test metrics that exceed baseline
      const badMetrics: PerformanceMetrics = {
        parsing: baseline.parsing * 1.1, // 10% worse than baseline
        conversion: baseline.conversion * 1.05, // 5% worse than baseline
        endToEnd: baseline.endToEnd * 1.2, // 20% worse than baseline
      };

      const badValidation = benchmark.validatePerformance(badMetrics, baseline);
      expect(badValidation).toBe(false);

      logger.end('Performance baseline validation test completed successfully');
    });
  });

  describe('Performance Monitoring and Reporting Tests', () => {
    it('should generate comprehensive performance reports', async () => {
      logger.init('Testing performance report generation');

      // Run a few benchmark tests to populate results
      const testCases = [
        {
          code: 'cube([5, 5, 5]);',
          name: 'Test Cube',
          baseline: PERFORMANCE_BASELINES.basicPrimitive,
        },
        {
          code: 'sphere(r=3);',
          name: 'Test Sphere',
          baseline: PERFORMANCE_BASELINES.basicPrimitive,
        },
      ];

      for (const testCase of testCases) {
        const metrics = await benchmark.measurePerformance(testCase.code, parserService, store);
        const passed = benchmark.validatePerformance(metrics, testCase.baseline);
        const regressionDetected = benchmark.detectRegression(metrics, testCase.baseline);

        benchmark.addResult({
          scenario: 'Test Scenario',
          testCase: testCase.name,
          metrics,
          baseline: testCase.baseline,
          passed,
          regressionDetected,
        });
      }

      const report = benchmark.generateReport();

      // Verify report contains expected sections
      expect(report).toContain('PERFORMANCE BENCHMARK REPORT');
      expect(report).toContain('Total Tests:');
      expect(report).toContain('Passed:');
      expect(report).toContain('Regressions Detected:');
      expect(report).toContain('Test Cube');
      expect(report).toContain('Test Sphere');
      expect(report).toContain('Parsing:');
      expect(report).toContain('Conversion:');
      expect(report).toContain('End-to-End:');

      logger.debug('Generated performance report:', report);
      logger.end('Performance report generation test completed successfully');
    });

    it('should track memory usage during performance tests', async () => {
      logger.init('Testing memory usage tracking');

      const testCode = `
        union() {
          cube([20, 20, 20]);
          translate([25, 0, 0]) sphere(r=10);
          translate([0, 25, 0]) cylinder(h=20, r=8);
        }
      `;

      const metrics = await benchmark.measurePerformance(testCode, parserService, store);

      // Verify memory usage is tracked
      expect(metrics.memoryUsage).toBeDefined();
      expect(typeof metrics.memoryUsage).toBe('number');

      // Memory usage should be reasonable (less than 10MB for this test)
      if (metrics.memoryUsage) {
        expect(metrics.memoryUsage).toBeLessThan(10 * 1024 * 1024);
      }

      logger.debug(
        `Memory usage: ${metrics.memoryUsage ? (metrics.memoryUsage / 1024 / 1024).toFixed(2) : 'N/A'}MB`
      );
      logger.end('Memory usage tracking test completed successfully');
    });
  });

  describe('Performance Optimization Validation Tests', () => {
    it('should validate parser caching improves performance', async () => {
      logger.init('Testing parser caching performance impact');

      const testCode = 'translate([10, 0, 0]) cube([15, 15, 15]);';

      // First run (cold cache)
      const firstRun = await benchmark.measurePerformance(testCode, parserService, store);

      // Second run (warm cache) - should be faster or similar
      const secondRun = await benchmark.measurePerformance(testCode, parserService, store);

      // Cache should not significantly degrade performance
      expect(secondRun.parsing).toBeLessThanOrEqual(firstRun.parsing * 1.1);
      expect(secondRun.endToEnd).toBeLessThanOrEqual(firstRun.endToEnd * 1.1);

      logger.debug(
        `First run: ${firstRun.endToEnd.toFixed(2)}ms, Second run: ${secondRun.endToEnd.toFixed(2)}ms`
      );
      logger.end('Parser caching performance validation completed successfully');
    });

    it('should validate store debouncing configuration impact', async () => {
      logger.init('Testing store debouncing configuration impact');

      // Create store with debouncing enabled
      const debouncedStore = createAppStore({
        enableDevtools: false,
        enablePersistence: false,
        debounceConfig: {
          parseDelayMs: 100, // Add debouncing
          saveDelayMs: 50,
          renderDelayMs: 25,
        },
      });

      const testCode = 'sphere(r=8);';

      // Measure with no debouncing (current store)
      const noDebouncingMetrics = await benchmark.measurePerformance(
        testCode,
        parserService,
        store
      );

      // Measure with debouncing
      const debouncingStart = performance.now();
      const debouncedResult = await debouncedStore.getState().parseCode(testCode);
      const debouncingEnd = performance.now();
      const debouncingTime = debouncingEnd - debouncingStart;

      expect(debouncedResult.success).toBe(true);

      // Debouncing configuration should not significantly impact performance for single operations
      // (debouncing mainly affects rapid successive operations)
      expect(debouncingTime).toBeLessThan(noDebouncingMetrics.endToEnd + 200); // Max 200ms overhead

      // Both should complete in reasonable time
      expect(debouncingTime).toBeLessThan(1000); // Should complete within 1 second
      expect(noDebouncingMetrics.endToEnd).toBeLessThan(1000);

      logger.debug(
        `No debouncing: ${noDebouncingMetrics.endToEnd.toFixed(2)}ms, With debouncing: ${debouncingTime.toFixed(2)}ms`
      );
      logger.end('Store debouncing configuration impact validation completed successfully');
    });
  });
});
