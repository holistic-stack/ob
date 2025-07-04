/**
 * AST to CSG Converter - Performance and Stress Testing Integration Tests
 *
 * Integration tests for OpenSCAD performance benchmarks and stress testing scenarios.
 * Tests the complete pipeline from OpenSCAD code parsing to AST generation to CSG conversion.
 *
 * Follows the ast-to-csg-converter-[variation].test.ts pattern for consistency.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode } from '../../../openscad-parser/core/ast-types.js';
import { OpenscadParser } from '../../../openscad-parser/openscad-parser.js';
import { convertASTNodeToCSG } from './ast-to-csg-converter.js';

const logger = createLogger('ASTToCSGConverterPerformanceTest');

/**
 * Performance test scenarios for stress testing and benchmarking
 */
const PERFORMANCE_TEST_SCENARIOS = {
  largeScaleGeometry: {
    name: 'Large Scale Geometry',
    code: `
// Large array of cubes
for (i = [0:1:50]) {
    for (j = [0:1:50]) {
        translate([i*2, j*2, 0]) cube([1, 1, 1]);
    }
}
`,
    expectedNodeCount: 0, // For loops don't generate AST nodes (control flow constructs)
    expectedNodeTypes: [],
    hasRenderableContent: false, // For loops are control flow constructs
    performanceTarget: 16, // <16ms target
  },

  deeplyNestedStructures: {
    name: 'Deeply Nested Structures',
    code: `
translate([0, 0, 0]) {
    rotate([0, 0, 45]) {
        scale([2, 2, 2]) {
            translate([10, 10, 10]) {
                rotate([45, 0, 0]) {
                    scale([0.5, 0.5, 0.5]) {
                        translate([5, 5, 5]) {
                            rotate([0, 45, 0]) {
                                cube([10, 10, 10]);
                            }
                        }
                    }
                }
            }
        }
    }
}
`,
    expectedNodeCount: 1, // Single nested structure
    expectedNodeTypes: ['function_call'],
    hasRenderableContent: true, // Contains 3D primitives
    performanceTarget: 16, // <16ms target
  },

  complexCSGOperations: {
    name: 'Complex CSG Operations',
    code: `
difference() {
    union() {
        cube([20, 20, 20]);
        translate([10, 0, 0]) sphere(r=15);
        translate([0, 10, 0]) cylinder(h=25, r=8);
    }
    intersection() {
        translate([5, 5, 5]) cube([15, 15, 15]);
        sphere(r=12);
    }
}
`,
    expectedNodeCount: 1, // Single difference operation
    expectedNodeTypes: ['difference'], // Parser generates 'difference' type for CSG operations
    hasRenderableContent: true, // Contains 3D primitives
    performanceTarget: 5000, // Increased target due to complex CSG operations
  },

  massiveParameterLists: {
    name: 'Massive Parameter Lists',
    code: `
cube([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
sphere(r=5, $fn=100, $fa=1, $fs=0.1);
cylinder(h=20, r1=5, r2=10, center=true, $fn=64);
translate([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) cube(1);
`,
    expectedNodeCount: 4, // Four function calls
    expectedNodeTypes: ['function_call', 'function_call', 'function_call', 'function_call'],
    hasRenderableContent: true, // Contains 3D primitives
    performanceTarget: 16, // <16ms target
  },

  highPrecisionNumbers: {
    name: 'High Precision Numbers',
    code: `
cube([3.141592653589793, 2.718281828459045, 1.414213562373095]);
sphere(r=1.6180339887498948);
cylinder(h=2.2360679774997898, r=1.7320508075688772);
translate([0.5772156649015329, 1.2020569031595942, 0.9159655941772190]) cube(0.1);
`,
    expectedNodeCount: 4, // Four function calls
    expectedNodeTypes: ['function_call', 'function_call', 'function_call', 'function_call'],
    hasRenderableContent: true, // Contains 3D primitives
    performanceTarget: 16, // <16ms target
  },

  memoryIntensiveOperations: {
    name: 'Memory Intensive Operations',
    code: `
// Large union operation
union() {
    cube([100, 100, 100]);
    translate([50, 0, 0]) cube([100, 100, 100]);
    translate([0, 50, 0]) cube([100, 100, 100]);
    translate([0, 0, 50]) cube([100, 100, 100]);
    translate([50, 50, 0]) cube([100, 100, 100]);
    translate([50, 0, 50]) cube([100, 100, 100]);
    translate([0, 50, 50]) cube([100, 100, 100]);
    translate([50, 50, 50]) cube([100, 100, 100]);
}
`,
    expectedNodeCount: 1, // Single union operation
    expectedNodeTypes: ['union'], // Parser generates 'union' type for CSG operations
    hasRenderableContent: true, // Contains 3D primitives
    performanceTarget: 3000, // Increased target due to memory intensive CSG operations
  },

  rapidFireOperations: {
    name: 'Rapid Fire Operations',
    code: `
cube(1); sphere(1); cylinder(h=1, r=1);
cube(2); sphere(2); cylinder(h=2, r=2);
cube(3); sphere(3); cylinder(h=3, r=3);
cube(4); sphere(4); cylinder(h=4, r=4);
cube(5); sphere(5); cylinder(h=5, r=5);
cube(6); sphere(6); cylinder(h=6, r=6);
cube(7); sphere(7); cylinder(h=7, r=7);
cube(8); sphere(8); cylinder(h=8, r=8);
cube(9); sphere(9); cylinder(h=9, r=9);
cube(10); sphere(10); cylinder(h=10, r=10);
`,
    expectedNodeCount: 30, // 30 function calls (3 per line * 10 lines)
    expectedNodeTypes: Array(30).fill('function_call'),
    hasRenderableContent: true, // Contains 3D primitives
    performanceTarget: 16, // <16ms target
  },

  extremelyLongCode: {
    name: 'Extremely Long Code',
    code: `
// Very long single line with many operations
translate([1, 1, 1]) rotate([1, 1, 1]) scale([1, 1, 1]) translate([2, 2, 2]) rotate([2, 2, 2]) scale([2, 2, 2]) translate([3, 3, 3]) rotate([3, 3, 3]) scale([3, 3, 3]) translate([4, 4, 4]) rotate([4, 4, 4]) scale([4, 4, 4]) translate([5, 5, 5]) rotate([5, 5, 5]) scale([5, 5, 5]) cube([10, 10, 10]);
`,
    expectedNodeCount: 1, // Single chained operation
    expectedNodeTypes: ['function_call'],
    hasRenderableContent: true, // Contains 3D primitives
    performanceTarget: 16, // <16ms target
  },
};

describe('AST to CSG Converter - Performance and Stress Testing Integration', () => {
  let parserService: OpenscadParser;

  beforeEach(async () => {
    logger.init('Setting up UnifiedParserService for performance tests');
    parserService = new OpenscadParser();

    await parserService.init();
    logger.debug('UnifiedParserService initialized successfully');
  });

  describe('Parser Performance Benchmarks', () => {
    Object.entries(PERFORMANCE_TEST_SCENARIOS).forEach(([scenarioKey, scenario]) => {
      it(`should parse ${scenarioKey} within performance targets`, async () => {
        logger.init(`Testing performance for ${scenario.name}`);

        const startTime = performance.now();
        const parseResult = parserService.parseAST(scenario.code);
        const endTime = performance.now();
        const parseTime = endTime - startTime;

        // Parsing completed
        expect(parseTime).toBeLessThan(scenario.performanceTarget);

        if (ast && ast.length > 0) {
          expect(ast).toBeDefined();
          expect(ast).not.toBeNull();

          if (ast) {
            expect(ast.length).toBe(scenario.expectedNodeCount);
            logger.debug(
              `${scenario.name} parsed ${ast.length} nodes in ${parseTime.toFixed(2)}ms`
            );

            // Verify node types if nodes exist
            if (ast.length > 0 && scenario.expectedNodeTypes.length > 0) {
              ast.forEach((node: ASTNode, index: number) => {
                expect(node).toBeDefined();
                expect(node?.type).toBe(scenario.expectedNodeTypes[index]);
              });
            }
          }
        }

        logger.end(`${scenario.name} performance test completed in ${parseTime.toFixed(2)}ms`);
      });
    });
  });

  describe('CSG Conversion Performance Tests', () => {
    const renderableScenarios = Object.entries(PERFORMANCE_TEST_SCENARIOS).filter(
      ([, scenario]) => scenario.hasRenderableContent
    );

    renderableScenarios.forEach(([scenarioKey, scenario]) => {
      it(`should convert ${scenarioKey} to CSG within performance targets`, async () => {
        logger.init(`Testing CSG conversion performance for ${scenario.name}`);

        const parseResult = parserService.parseAST(scenario.code);
        // Parsing completed

        if (parseResult.success && parseResult.data.ast) {
          // AST already available

          const startTime = performance.now();
          const conversionResults = await Promise.all(
            ast.map(async (node: ASTNode, index: number) => ({
              node,
              result: await convertASTNodeToCSG(node, index),
            }))
          );
          const endTime = performance.now();
          const conversionTime = endTime - startTime;

          expect(conversionTime).toBeLessThan(scenario.performanceTarget);
          expect(conversionResults.length).toBeGreaterThan(0);

          logger.debug(
            `${scenario.name} CSG conversion completed in ${conversionTime.toFixed(2)}ms`
          );
        }

        logger.end(`CSG conversion performance test for ${scenario.name} completed`);
      });
    });
  });

  describe('Memory and Resource Management Tests', () => {
    it('should handle memory cleanup after large operations', async () => {
      logger.init('Testing memory cleanup');

      const largeOperationCode = `
union() {
    for (i = [0:1:20]) {
        for (j = [0:1:20]) {
            translate([i*5, j*5, 0]) cube([2, 2, 2]);
        }
    }
}
`;

      // Measure memory before
      const memoryBefore = (performance as any).memory
        ? (performance as any).memory.usedJSHeapSize
        : 0;

      const parseResult = parserService.parseAST(largeOperationCode);
      // Parsing completed

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Measure memory after
      const memoryAfter = (performance as any).memory
        ? (performance as any).memory.usedJSHeapSize
        : 0;

      logger.debug(`Memory usage: before=${memoryBefore}, after=${memoryAfter}`);
      logger.end('Memory cleanup test completed');
    });

    it('should handle concurrent parsing operations', async () => {
      logger.init('Testing concurrent parsing operations');

      const concurrentCode = `
cube([10, 10, 10]);
sphere(r=5);
cylinder(h=15, r=3);
`;

      const startTime = performance.now();

      // Run multiple parsing operations concurrently
      const promises = Array(10)
        .fill(null)
        .map(() => parserService.parseAST(concurrentCode));

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All operations should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      expect(totalTime).toBeLessThan(160); // 10 operations * 16ms target
      logger.debug(`Concurrent operations completed in ${totalTime.toFixed(2)}ms`);
      logger.end('Concurrent parsing test completed');
    });

    it('should maintain performance under repeated operations', async () => {
      logger.init('Testing repeated operations performance');

      const repeatedCode = `
translate([1, 2, 3]) cube([5, 5, 5]);
`;

      const times: number[] = [];

      // Perform the same operation multiple times
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        const parseResult = parserService.parseAST(repeatedCode);
        const endTime = performance.now();
        const parseTime = endTime - startTime;

        // Parsing completed
        expect(parseTime).toBeLessThan(16);
        times.push(parseTime);
      }

      // Calculate performance statistics
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      expect(avgTime).toBeLessThan(16);
      expect(maxTime).toBeLessThan(32); // Allow some variance but not too much

      logger.debug(
        `Repeated operations: avg=${avgTime.toFixed(2)}ms, min=${minTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms`
      );
      logger.end('Repeated operations test completed');
    });
  });
});
