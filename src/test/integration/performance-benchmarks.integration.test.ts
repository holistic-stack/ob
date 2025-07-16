/**
 * @file Performance Benchmarks Integration Tests
 *
 * Performance benchmarks for the complete OpenSCAD→Babylon.js pipeline.
 * Tests performance targets and identifies bottlenecks in complex model processing.
 * 
 * @example
 * Tests measure performance across the complete pipeline:
 * - Parsing performance for complex OpenSCAD code
 * - AST conversion performance for nested operations
 * - CSG operation performance for boolean operations
 * - Rendering performance for complex meshes
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OpenscadParser } from '../../features/openscad-parser';
import { ManifoldASTConverter } from '../../features/babylon-renderer/services/manifold-csg/manifold-ast-converter';
// Mock logger to avoid console output during tests
import { vi } from 'vitest';
vi.mock('../../shared/services/logger.service', () => ({
  createLogger: vi.fn(() => ({
    init: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { createLogger } from '../../shared/services/logger.service';

const logger = createLogger('PerformanceBenchmarks');

// Performance targets (in milliseconds)
const PERFORMANCE_TARGETS = {
  SIMPLE_PARSE: 50,        // Simple primitives should parse in <50ms
  COMPLEX_PARSE: 200,      // Complex models should parse in <200ms
  SIMPLE_CONVERT: 100,     // Simple AST conversion in <100ms
  COMPLEX_CONVERT: 500,    // Complex AST conversion in <500ms
  TOTAL_PIPELINE: 1000,    // Complete pipeline in <1000ms
} as const;

describe('Performance Benchmarks Integration Tests', () => {
  let engine: NullEngine;
  let scene: Scene;
  let parser: OpenscadParser;
  let astConverter: ManifoldASTConverter;

  beforeEach(async () => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    
    // Create and initialize OpenSCAD parser
    parser = new OpenscadParser();
    await parser.init();
    
    // Create AST converter
    astConverter = new ManifoldASTConverter();
    
    logger.debug('[SETUP] Performance benchmark environment initialized');
  });

  afterEach(() => {
    // Clean up resources
    if (parser) {
      parser.dispose();
    }
    scene.dispose();
    engine.dispose();
  });

  describe('Simple Model Performance Benchmarks', () => {
    it('should parse simple primitives within performance targets', async () => {
      const simpleModels = [
        'cube([2, 3, 4]);',
        'sphere(r=5);',
        'cylinder(h=10, r=3);',
        'translate([1, 2, 3]) cube([1, 1, 1]);',
        'rotate([45, 0, 0]) sphere(r=2);',
      ];

      for (const model of simpleModels) {
        const startTime = performance.now();
        
        const parseResult = await parser.parse(model);
        
        const endTime = performance.now();
        const parseTime = endTime - startTime;
        
        expect(parseResult.success).toBe(true);
        expect(parseTime).toBeLessThan(PERFORMANCE_TARGETS.SIMPLE_PARSE);
        
        logger.debug(`[SIMPLE_PARSE] ${model.slice(0, 20)}... parsed in ${parseTime.toFixed(2)}ms`);
      }
    });

    it('should convert simple ASTs within performance targets', async () => {
      const simpleModel = 'union() { cube([2, 2, 2]); sphere(r=1.5); }';
      
      // Parse first
      const parseResult = await parser.parse(simpleModel);
      expect(parseResult.success).toBe(true);
      
      if (!parseResult.success) return;
      const ast = parseResult.data;
      
      // Measure conversion time
      const startTime = performance.now();
      
      const convertResult = await astConverter.convertAST(ast);
      
      const endTime = performance.now();
      const convertTime = endTime - startTime;
      
      expect(convertResult.success).toBe(true);
      expect(convertTime).toBeLessThan(PERFORMANCE_TARGETS.SIMPLE_CONVERT);
      
      logger.debug(`[SIMPLE_CONVERT] Simple union converted in ${convertTime.toFixed(2)}ms`);
    });

    it('should complete simple pipeline within performance targets', async () => {
      const simpleModel = 'difference() { cube([3, 3, 3]); sphere(r=2); }';
      
      const startTime = performance.now();
      
      // Step 1: Parse
      const parseResult = await parser.parse(simpleModel);
      expect(parseResult.success).toBe(true);
      
      if (!parseResult.success) return;
      const ast = parseResult.data;
      
      // Step 2: Convert
      const convertResult = await astConverter.convertAST(ast);
      expect(convertResult.success).toBe(true);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(PERFORMANCE_TARGETS.SIMPLE_PARSE + PERFORMANCE_TARGETS.SIMPLE_CONVERT);
      
      logger.debug(`[SIMPLE_PIPELINE] Simple pipeline completed in ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Complex Model Performance Benchmarks', () => {
    it('should parse complex nested models within performance targets', async () => {
      const complexModel = `
        difference() {
          union() {
            cube([20, 20, 20]);
            translate([10, 10, 10]) sphere(r=8);
            for (i = [0:2]) {
              translate([i*7, 0, 0]) cylinder(h=25, r=2);
            }
          }
          union() {
            translate([5, 5, 5]) cube([10, 10, 10]);
            translate([15, 15, 15]) sphere(r=5);
            for (j = [0:3]) {
              translate([0, j*5, 0]) cylinder(h=30, r=1);
            }
          }
        }
      `;
      
      const startTime = performance.now();
      
      const parseResult = await parser.parse(complexModel);
      
      const endTime = performance.now();
      const parseTime = endTime - startTime;
      
      expect(parseResult.success).toBe(true);
      expect(parseTime).toBeLessThan(PERFORMANCE_TARGETS.COMPLEX_PARSE);
      
      logger.debug(`[COMPLEX_PARSE] Complex model parsed in ${parseTime.toFixed(2)}ms`);
    });

    it('should convert complex ASTs within performance targets', async () => {
      const complexModel = `
        intersection() {
          union() {
            cube([15, 15, 15]);
            translate([7.5, 7.5, 7.5]) sphere(r=6);
          }
          difference() {
            sphere(r=10);
            translate([0, 0, 0]) cube([8, 8, 8], center=true);
          }
        }
      `;
      
      // Parse first
      const parseResult = await parser.parse(complexModel);
      expect(parseResult.success).toBe(true);
      
      if (!parseResult.success) return;
      const ast = parseResult.data;
      
      // Measure conversion time
      const startTime = performance.now();
      
      const convertResult = await astConverter.convertAST(ast);
      
      const endTime = performance.now();
      const convertTime = endTime - startTime;
      
      expect(convertResult.success).toBe(true);
      expect(convertTime).toBeLessThan(PERFORMANCE_TARGETS.COMPLEX_CONVERT);
      
      logger.debug(`[COMPLEX_CONVERT] Complex intersection converted in ${convertTime.toFixed(2)}ms`);
    });

    it('should complete complex pipeline within performance targets', async () => {
      const complexModel = `
        difference() {
          cube([25, 25, 25]);
          union() {
            for (x = [0:4]) {
              for (y = [0:4]) {
                translate([x*5, y*5, 0]) cylinder(h=30, r=1.5);
              }
            }
            translate([12.5, 12.5, 12.5]) sphere(r=8);
          }
        }
      `;
      
      const startTime = performance.now();
      
      // Step 1: Parse
      const parseResult = await parser.parse(complexModel);
      expect(parseResult.success).toBe(true);
      
      if (!parseResult.success) return;
      const ast = parseResult.data;
      
      // Step 2: Convert
      const convertResult = await astConverter.convertAST(ast);
      expect(convertResult.success).toBe(true);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(PERFORMANCE_TARGETS.TOTAL_PIPELINE);
      
      logger.debug(`[COMPLEX_PIPELINE] Complex pipeline completed in ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Stress Test Performance Benchmarks', () => {
    it('should handle deeply nested operations efficiently', async () => {
      // Generate deeply nested model
      let nestedModel = 'cube([1, 1, 1])';
      for (let i = 0; i < 10; i++) {
        nestedModel = `translate([${i}, 0, 0]) union() { ${nestedModel}; sphere(r=0.5); }`;
      }
      
      const startTime = performance.now();
      
      const parseResult = await parser.parse(nestedModel);
      expect(parseResult.success).toBe(true);
      
      if (!parseResult.success) return;
      const ast = parseResult.data;
      
      const convertResult = await astConverter.convertAST(ast);
      expect(convertResult.success).toBe(true);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time for stress test
      expect(totalTime).toBeLessThan(2000); // 2 seconds for stress test
      
      logger.debug(`[STRESS_TEST] Deeply nested model processed in ${totalTime.toFixed(2)}ms`);
    });

    it('should handle many primitive objects efficiently', async () => {
      // Generate model with many primitives
      const primitives = [];
      for (let i = 0; i < 50; i++) {
        primitives.push(`translate([${i % 10}, ${Math.floor(i / 10)}, 0]) cube([0.8, 0.8, 0.8]);`);
      }
      const manyPrimitivesModel = primitives.join('\n');
      
      const startTime = performance.now();
      
      const parseResult = await parser.parse(manyPrimitivesModel);
      expect(parseResult.success).toBe(true);
      
      if (!parseResult.success) return;
      const ast = parseResult.data;
      
      const convertResult = await astConverter.convertAST(ast);
      expect(convertResult.success).toBe(true);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle many primitives efficiently
      expect(totalTime).toBeLessThan(1500); // 1.5 seconds for many primitives
      
      logger.debug(`[MANY_PRIMITIVES] 50 primitives processed in ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Performance Benchmarks', () => {
    it('should not leak memory during repeated operations', async () => {
      const testModel = 'difference() { cube([5, 5, 5]); sphere(r=3); }';
      
      // Measure initial memory (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform repeated operations
      for (let i = 0; i < 10; i++) {
        const parseResult = await parser.parse(testModel);
        expect(parseResult.success).toBe(true);
        
        if (!parseResult.success) continue;
        const ast = parseResult.data;
        
        const convertResult = await astConverter.convertAST(ast);
        expect(convertResult.success).toBe(true);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Measure final memory (if available)
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        // Memory increase should be reasonable (less than 50% for repeated operations)
        expect(memoryIncreasePercent).toBeLessThan(50);
        
        logger.debug(`[MEMORY_TEST] Memory increase: ${memoryIncreasePercent.toFixed(2)}%`);
      } else {
        logger.debug('[MEMORY_TEST] Memory measurement not available in this environment');
      }
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance across multiple runs', async () => {
      const testModel = 'union() { cube([3, 3, 3]); translate([2, 2, 2]) sphere(r=2); }';
      const runs = 5;
      const times: number[] = [];
      
      for (let i = 0; i < runs; i++) {
        const startTime = performance.now();
        
        const parseResult = await parser.parse(testModel);
        expect(parseResult.success).toBe(true);
        
        if (!parseResult.success) continue;
        const ast = parseResult.data;
        
        const convertResult = await astConverter.convertAST(ast);
        expect(convertResult.success).toBe(true);
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }
      
      // Calculate statistics
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const variance = maxTime - minTime;
      
      // Performance should be consistent (variance < 50% of average)
      expect(variance).toBeLessThan(avgTime * 0.5);
      
      logger.debug(`[CONSISTENCY_TEST] Avg: ${avgTime.toFixed(2)}ms, Variance: ${variance.toFixed(2)}ms`);
    });
  });

  describe('Performance Profiling', () => {
    it('should identify performance bottlenecks in the pipeline', async () => {
      const complexModel = `
        difference() {
          cube([20, 20, 20]);
          union() {
            for (i = [0:3]) {
              for (j = [0:3]) {
                translate([i*5, j*5, 0]) cylinder(h=25, r=2);
              }
            }
          }
        }
      `;
      
      // Measure parsing time
      const parseStart = performance.now();
      const parseResult = await parser.parse(complexModel);
      const parseEnd = performance.now();
      const parseTime = parseEnd - parseStart;
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      // Measure conversion time
      const convertStart = performance.now();
      const convertResult = await astConverter.convertAST(parseResult.data);
      const convertEnd = performance.now();
      const convertTime = convertEnd - convertStart;
      
      expect(convertResult.success).toBe(true);
      
      const totalTime = parseTime + convertTime;
      
      // Log performance breakdown
      logger.debug(`[PROFILING] Parse: ${parseTime.toFixed(2)}ms (${((parseTime/totalTime)*100).toFixed(1)}%)`);
      logger.debug(`[PROFILING] Convert: ${convertTime.toFixed(2)}ms (${((convertTime/totalTime)*100).toFixed(1)}%)`);
      logger.debug(`[PROFILING] Total: ${totalTime.toFixed(2)}ms`);
      
      // Both phases should complete within reasonable time
      expect(parseTime).toBeLessThan(PERFORMANCE_TARGETS.COMPLEX_PARSE);
      expect(convertTime).toBeLessThan(PERFORMANCE_TARGETS.COMPLEX_CONVERT);
    });
  });
});
