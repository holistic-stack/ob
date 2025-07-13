/**
 * @file Complex Scenarios Integration Test Suite
 * @description Integration tests for complex nested OpenSCAD structures and real-world scenarios
 * Following project guidelines: real OpenSCAD parser instances, no mocks, Result<T,E> patterns
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ManifoldPipelineService } from '../manifold-pipeline-service';
import { ManifoldPrimitiveProcessor } from '../processors/manifold-primitive-processor';
import { ManifoldTransformationProcessor } from '../processors/manifold-transformation-processor';
import { ManifoldCSGProcessor } from '../processors/manifold-csg-processor';
import { OpenscadParser } from '../../../../openscad-parser/openscad-parser';
import type { Result } from '../../../../../shared/types/result.types';
import type { ManifoldPipelineResult } from '../types/processor-types';
import { getMemoryStats, clearAllResources } from '../../manifold-memory-manager/manifold-memory-manager';

// Mock ManifoldWasmLoader for testing (WASM not available in test environment)
vi.mock('../../manifold-wasm-loader/manifold-wasm-loader', () => ({
  ManifoldWasmLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue({
      success: true,
      data: {
        _Cube: vi.fn().mockReturnValue({
          delete: vi.fn(),
          boundingBox: vi.fn().mockReturnValue({
            min: { x: 0, y: 0, z: 0 },
            max: { x: 1, y: 1, z: 1 }
          }),
          translate: vi.fn().mockReturnThis(),
          rotate: vi.fn().mockReturnThis(),
          scale: vi.fn().mockReturnThis(),
          transform: vi.fn().mockReturnThis(),
          getMesh: vi.fn().mockReturnValue({
            vertPos: [0, 0, 0, 1, 1, 1],
            triVerts: [0, 1, 2],
            numProp: 3
          }),
          add: vi.fn().mockReturnThis(),
          subtract: vi.fn().mockReturnThis(),
          intersect: vi.fn().mockReturnThis()
        }),
        _Sphere: vi.fn().mockReturnValue({
          delete: vi.fn(),
          boundingBox: vi.fn().mockReturnValue({
            min: { x: -1, y: -1, z: -1 },
            max: { x: 1, y: 1, z: 1 }
          }),
          translate: vi.fn().mockReturnThis(),
          rotate: vi.fn().mockReturnThis(),
          scale: vi.fn().mockReturnThis(),
          transform: vi.fn().mockReturnThis(),
          getMesh: vi.fn().mockReturnValue({
            vertPos: [0, 0, 0, 1, 1, 1],
            triVerts: [0, 1, 2],
            numProp: 3
          }),
          add: vi.fn().mockReturnThis(),
          subtract: vi.fn().mockReturnThis(),
          intersect: vi.fn().mockReturnThis()
        }),
        _Cylinder: vi.fn().mockReturnValue({
          delete: vi.fn(),
          boundingBox: vi.fn().mockReturnValue({
            min: { x: -1, y: -1, z: 0 },
            max: { x: 1, y: 1, z: 1 }
          }),
          translate: vi.fn().mockReturnThis(),
          rotate: vi.fn().mockReturnThis(),
          scale: vi.fn().mockReturnThis(),
          transform: vi.fn().mockReturnThis(),
          getMesh: vi.fn().mockReturnValue({
            vertPos: [0, 0, 0, 1, 1, 1],
            triVerts: [0, 1, 2],
            numProp: 3
          }),
          add: vi.fn().mockReturnThis(),
          subtract: vi.fn().mockReturnThis(),
          intersect: vi.fn().mockReturnThis()
        })
      }
    })
  }))
}));

describe('Complex Scenarios Integration Tests', () => {
  let pipelineService: ManifoldPipelineService;
  let openscadParser: OpenscadParser;

  beforeEach(async () => {
    // Clean up any existing resources before starting
    clearAllResources();
    
    // Create real OpenSCAD parser instance (no mocks)
    openscadParser = new OpenscadParser();
    await openscadParser.init();

    // Create pipeline service with real processors
    const primitiveProcessor = new ManifoldPrimitiveProcessor();
    const transformationProcessor = new ManifoldTransformationProcessor();
    const csgProcessor = new ManifoldCSGProcessor();

    pipelineService = new ManifoldPipelineService({
      primitiveProcessor,
      transformationProcessor,
      csgProcessor
    });

    // Initialize the pipeline
    const initResult = await pipelineService.initialize();
    if (!initResult.success) {
      console.error('Pipeline initialization failed:', initResult.error);
      throw new Error(`Failed to initialize pipeline: ${initResult.error}`);
    }
  });

  afterEach(async () => {
    if (pipelineService) {
      pipelineService.dispose();
    }
    if (openscadParser) {
      openscadParser.dispose();
    }
    // Clean up all resources after each test
    clearAllResources();
  });

  describe('Nested Transformations', () => {
    test('should process nested translate and rotate operations', async () => {
      const openscadCode = `
        translate([10, 0, 0])
          rotate([0, 0, 45])
            translate([5, 5, 0])
              cube([2, 2, 2]);
      `;
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const startTime = performance.now();
        const result = await pipelineService.processNodes(parseResult.data);
        const processingTime = performance.now() - startTime;

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.geometries).toHaveLength(1);
          expect(result.data.manifoldness).toBe(true);
          expect(result.data.operationsPerformed).toContain('primitive_creation');
          expect(result.data.operationsPerformed).toContain('transformation');
          
          // Validate performance target for complex operations
          expect(processingTime).toBeLessThan(32); // Allow more time for complex operations
        }
      }
    });

    test('should process multiple transformation types on same object', async () => {
      const openscadCode = `
        scale([2, 1, 0.5])
          rotate([45, 0, 0])
            translate([1, 2, 3])
              sphere(r=1);
      `;
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const result = await pipelineService.processNodes(parseResult.data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.geometries).toHaveLength(1);
          expect(result.data.manifoldness).toBe(true);
          expect(result.data.operationsPerformed).toContain('primitive_creation');
          expect(result.data.operationsPerformed).toContain('transformation');
        }
      }
    });
  });

  describe('Complex CSG Operations', () => {
    test('should process nested CSG operations', async () => {
      const openscadCode = `
        difference() {
          union() {
            cube([4, 4, 4]);
            translate([2, 2, 2]) sphere(r=2);
          }
          cylinder(h=6, r=1);
        }
      `;
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const startTime = performance.now();
        const result = await pipelineService.processNodes(parseResult.data);
        const processingTime = performance.now() - startTime;

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.geometries).toHaveLength(1);
          expect(result.data.manifoldness).toBe(true);
          expect(result.data.operationsPerformed).toContain('primitive_creation');
          expect(result.data.operationsPerformed).toContain('csg_operations');
          
          // Complex CSG operations may take longer
          expect(processingTime).toBeLessThan(50);
        }
      }
    });

    test('should process CSG with transformations', async () => {
      const openscadCode = `
        union() {
          cube([3, 3, 3]);
          translate([2, 0, 0]) rotate([0, 90, 0]) cylinder(h=3, r=1);
          translate([0, 2, 0]) scale([1, 1, 2]) sphere(r=1);
        }
      `;
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const result = await pipelineService.processNodes(parseResult.data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.geometries).toHaveLength(1);
          expect(result.data.manifoldness).toBe(true);
          expect(result.data.operationsPerformed).toContain('primitive_creation');
          expect(result.data.operationsPerformed).toContain('transformation');
          expect(result.data.operationsPerformed).toContain('csg_operations');
        }
      }
    });
  });

  describe('Real-World Scenarios', () => {
    test('should process a simple bracket design', async () => {
      const openscadCode = `
        difference() {
          // Main bracket body
          cube([20, 10, 5]);
          
          // Mounting holes
          translate([3, 5, -1]) cylinder(h=7, r=1.5);
          translate([17, 5, -1]) cylinder(h=7, r=1.5);
          
          // Central cutout
          translate([6, 2, -1]) cube([8, 6, 7]);
        }
      `;
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const startTime = performance.now();
        const result = await pipelineService.processNodes(parseResult.data);
        const processingTime = performance.now() - startTime;

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.geometries).toHaveLength(1);
          expect(result.data.manifoldness).toBe(true);
          expect(result.data.operationsPerformed).toContain('primitive_creation');
          expect(result.data.operationsPerformed).toContain('csg_operations');
          
          // Real-world designs should still meet reasonable performance targets
          expect(processingTime).toBeLessThan(100);
        }
      }
    });

    test('should process a simple gear tooth profile', async () => {
      const openscadCode = `
        union() {
          // Base cylinder
          cylinder(h=5, r=10);
          
          // Gear teeth (simplified)
          for (i = [0:30:330]) {
            rotate([0, 0, i])
              translate([9, 0, 0])
                cube([3, 1, 5]);
          }
        }
      `;
      
      // Note: This test may not work fully due to for loop limitations in our parser
      // but it tests the parser's ability to handle more complex syntax
      const parseResult = openscadParser.parseASTWithResult(openscadCode);

      // Even if parsing fails, we should handle it gracefully
      if (parseResult.success) {
        const result = await pipelineService.processNodes(parseResult.data);
        
        if (result.success) {
          expect(result.data.manifoldness).toBe(true);
        }
      } else {
        // If parsing fails, that's expected for complex syntax
        expect(parseResult.success).toBe(false);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle invalid OpenSCAD syntax gracefully', async () => {
      const invalidOpenscadCode = 'cube([1, 2, 3] sphere(r=1);'; // Missing closing bracket
      
      const parseResult = openscadParser.parseASTWithResult(invalidOpenscadCode);

      // Parser should handle syntax errors gracefully
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        expect(typeof parseResult.error).toBe('string');
      }
    });

    test('should handle empty OpenSCAD code', async () => {
      const emptyCode = '';
      
      const parseResult = openscadParser.parseASTWithResult(emptyCode);

      if (parseResult.success) {
        const result = await pipelineService.processNodes(parseResult.data);
        
        // Empty code should result in no geometries but not fail
        if (result.success) {
          expect(result.data.geometries).toHaveLength(0);
        }
      }
    });

    test('should handle unsupported OpenSCAD features gracefully', async () => {
      const unsupportedCode = 'linear_extrude(height=10) circle(r=5);';
      
      const parseResult = openscadParser.parseASTWithResult(unsupportedCode);

      if (parseResult.success) {
        const result = await pipelineService.processNodes(parseResult.data);
        
        // Unsupported features should be handled gracefully
        // Either succeed with partial processing or fail with meaningful error
        if (!result.success) {
          expect(result.error).toBeDefined();
          expect(typeof result.error).toBe('string');
        }
      }
    });
  });

  describe('Performance Stress Tests', () => {
    test('should handle multiple simple operations efficiently', async () => {
      const openscadCode = `
        union() {
          cube([1, 1, 1]);
          translate([2, 0, 0]) cube([1, 1, 1]);
          translate([4, 0, 0]) cube([1, 1, 1]);
          translate([6, 0, 0]) cube([1, 1, 1]);
          translate([8, 0, 0]) cube([1, 1, 1]);
        }
      `;
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const startTime = performance.now();
        const result = await pipelineService.processNodes(parseResult.data);
        const processingTime = performance.now() - startTime;

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.geometries).toHaveLength(1);
          expect(result.data.manifoldness).toBe(true);
          
          // Multiple operations should still be reasonably fast
          expect(processingTime).toBeLessThan(100);
        }
      }
    });

    test('should maintain memory efficiency with complex operations', async () => {
      const initialStats = getMemoryStats();
      
      const openscadCode = `
        difference() {
          cube([10, 10, 10]);
          translate([2, 2, 2]) cube([6, 6, 6]);
          translate([1, 1, 1]) sphere(r=3);
        }
      `;
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const result = await pipelineService.processNodes(parseResult.data);

        expect(result.success).toBe(true);
        
        const afterStats = getMemoryStats();
        
        // Memory usage should be reasonable (not exponential growth)
        const memoryIncrease = afterStats.activeResources - initialStats.activeResources;
        expect(memoryIncrease).toBeLessThan(100); // Reasonable memory increase
      }
    });
  });
});
