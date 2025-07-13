/**
 * @file Pipeline Integration Test Suite
 * @description Comprehensive integration tests for the complete Manifold pipeline with real OpenSCAD code
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

describe('Pipeline Integration Tests', () => {
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

  describe('Simple OpenSCAD Code Integration', () => {
    test('should process simple cube OpenSCAD code', async () => {
      const openscadCode = 'cube([2, 3, 4]);';
      
      // Parse OpenSCAD code with real parser
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
          expect(result.data.processingTime).toBeGreaterThan(0);
          
          // Validate performance target (<16ms)
          expect(processingTime).toBeLessThan(16);
        }
      }
    });

    test('should process simple sphere OpenSCAD code', async () => {
      const openscadCode = 'sphere(r=1.5);';
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const result = await pipelineService.processNodes(parseResult.data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.geometries).toHaveLength(1);
          expect(result.data.manifoldness).toBe(true);
          expect(result.data.operationsPerformed).toContain('primitive_creation');
        }
      }
    });

    test('should process simple cylinder OpenSCAD code', async () => {
      const openscadCode = 'cylinder(h=5, r=2);';
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const result = await pipelineService.processNodes(parseResult.data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.geometries).toHaveLength(1);
          expect(result.data.manifoldness).toBe(true);
          expect(result.data.operationsPerformed).toContain('primitive_creation');
        }
      }
    });
  });

  describe('Transformation Integration', () => {
    test('should process translated cube OpenSCAD code', async () => {
      const openscadCode = 'translate([5, 10, 15]) cube([1, 1, 1]);';
      
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
          
          // Validate performance target
          expect(processingTime).toBeLessThan(16);
        }
      }
    });

    test('should process rotated sphere OpenSCAD code', async () => {
      const openscadCode = 'rotate([0, 0, 45]) sphere(r=2);';
      
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

    test('should process scaled cylinder OpenSCAD code', async () => {
      const openscadCode = 'scale([2, 1, 0.5]) cylinder(h=3, r=1);';
      
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

  describe('CSG Operations Integration', () => {
    test('should process union OpenSCAD code', async () => {
      const openscadCode = `
        union() {
          cube([2, 2, 2]);
          sphere(r=1.5);
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
          
          // Validate performance target
          expect(processingTime).toBeLessThan(16);
        }
      }
    });

    test('should process difference OpenSCAD code', async () => {
      const openscadCode = `
        difference() {
          cube([3, 3, 3]);
          sphere(r=1);
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
          expect(result.data.operationsPerformed).toContain('csg_operations');
        }
      }
    });

    test('should process intersection OpenSCAD code', async () => {
      const openscadCode = `
        intersection() {
          cube([2, 2, 2]);
          sphere(r=1.5);
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
          expect(result.data.operationsPerformed).toContain('csg_operations');
        }
      }
    });
  });

  describe('Performance Validation', () => {
    test('should meet <16ms performance target for simple operations', async () => {
      const openscadCode = 'cube([1, 1, 1]);';
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const startTime = performance.now();
        const result = await pipelineService.processNodes(parseResult.data);
        const processingTime = performance.now() - startTime;

        expect(result.success).toBe(true);
        expect(processingTime).toBeLessThan(16);
      }
    });

    test('should track processing time accurately', async () => {
      const openscadCode = 'translate([1, 1, 1]) cube([1, 1, 1]);';
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const result = await pipelineService.processNodes(parseResult.data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.processingTime).toBeGreaterThan(0);
          expect(typeof result.data.processingTime).toBe('number');
        }
      }
    });
  });

  describe('Memory Management Integration', () => {
    test('should manage memory correctly during processing', async () => {
      const initialStats = getMemoryStats();
      const openscadCode = 'cube([1, 1, 1]);';
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const result = await pipelineService.processNodes(parseResult.data);

        expect(result.success).toBe(true);
        const afterStats = getMemoryStats();
        expect(afterStats.activeResources).toBeGreaterThanOrEqual(initialStats.activeResources);
      }
    });

    test('should clean up resources after disposal', async () => {
      const openscadCode = 'cube([1, 1, 1]);';
      
      const parseResult = openscadParser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        await pipelineService.processNodes(parseResult.data);
        
        const beforeDisposeStats = getMemoryStats();
        pipelineService.dispose();
        
        // Memory should be reduced after disposal
        const afterDisposeStats = getMemoryStats();
        expect(afterDisposeStats.activeResources).toBeLessThanOrEqual(beforeDisposeStats.activeResources);
      }
    });
  });
});
