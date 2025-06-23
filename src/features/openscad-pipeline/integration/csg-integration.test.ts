/**
 * @file CSG Integration Test
 * 
 * Integration test for the complete OpenSCAD to R3F pipeline with CSG operations.
 * Tests the end-to-end flow from OpenSCAD code to Three.js meshes using three-csg-ts.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processOpenSCADPipeline } from '../core/pipeline-processor';

// Mock the dependencies to focus on integration
vi.mock('../../ui-components/editor/code-editor/openscad-ast-service', () => ({
  parseOpenSCADCodeCached: vi.fn()
}));

vi.mock('three-csg-ts', () => ({
  CSG: {
    fromGeometry: vi.fn(() => ({
      union: vi.fn(() => ({ toGeometry: () => ({ type: 'UnionGeometry' }) })),
      subtract: vi.fn(() => ({ toGeometry: () => ({ type: 'DifferenceGeometry' }) })),
      intersect: vi.fn(() => ({ toGeometry: () => ({ type: 'IntersectionGeometry' }) }))
    })),
    toGeometry: vi.fn(() => ({
      type: 'BufferGeometry',
      attributes: { position: { count: 24 } },
      index: { count: 36 },
      computeVertexNormals: vi.fn(),
      computeBoundingBox: vi.fn(),
      computeBoundingSphere: vi.fn()
    }))
  }
}));

describe('CSG Integration Tests', () => {
  beforeEach(() => {
    console.log('[DEBUG] Setting up CSG integration test');
    vi.clearAllMocks();
  });

  describe('OpenSCAD CSG Operations', () => {
    it('should process union operation from OpenSCAD code', async () => {
      console.log('[DEBUG] Testing union operation integration');

      // Mock successful parsing with union operation
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [
          {
            type: 'union',
            children: [
              { type: 'cube', size: [10, 10, 10] },
              { type: 'sphere', radius: 5 }
            ]
          }
        ],
        errors: [],
        parseTime: 50
      });

      const openscadCode = `
        union() {
          cube([10, 10, 10]);
          sphere(5);
        }
      `;

      const result = await processOpenSCADPipeline(openscadCode, {
        enableLogging: true,
        enableOptimization: true
      });

      expect(result.success).toBe(true);
      expect(result.meshes).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      
      // Verify CSG operation was performed
      const { CSG } = await import('three-csg-ts');
      expect(CSG.fromGeometry).toHaveBeenCalled();
      expect(CSG.toGeometry).toHaveBeenCalled();
    });

    it('should process difference operation from OpenSCAD code', async () => {
      console.log('[DEBUG] Testing difference operation integration');

      // Mock successful parsing with difference operation
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [
          {
            type: 'difference',
            children: [
              { type: 'cube', size: [20, 20, 20] },
              { type: 'sphere', radius: 8 }
            ]
          }
        ],
        errors: [],
        parseTime: 75
      });

      const openscadCode = `
        difference() {
          cube([20, 20, 20]);
          sphere(8);
        }
      `;

      const result = await processOpenSCADPipeline(openscadCode, {
        enableLogging: true,
        enableOptimization: true
      });

      expect(result.success).toBe(true);
      expect(result.meshes).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      
      // Verify difference operation was performed
      const { CSG } = await import('three-csg-ts');
      expect(CSG.fromGeometry).toHaveBeenCalled();
      expect(CSG.toGeometry).toHaveBeenCalled();
    });

    it('should process intersection operation from OpenSCAD code', async () => {
      console.log('[DEBUG] Testing intersection operation integration');

      // Mock successful parsing with intersection operation
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [
          {
            type: 'intersection',
            children: [
              { type: 'cube', size: [15, 15, 15] },
              { type: 'sphere', radius: 10 }
            ]
          }
        ],
        errors: [],
        parseTime: 60
      });

      const openscadCode = `
        intersection() {
          cube([15, 15, 15]);
          sphere(10);
        }
      `;

      const result = await processOpenSCADPipeline(openscadCode, {
        enableLogging: true,
        enableOptimization: true
      });

      expect(result.success).toBe(true);
      expect(result.meshes).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      
      // Verify intersection operation was performed
      const { CSG } = await import('three-csg-ts');
      expect(CSG.fromGeometry).toHaveBeenCalled();
      expect(CSG.toGeometry).toHaveBeenCalled();
    });

    it('should handle complex nested CSG operations', async () => {
      console.log('[DEBUG] Testing complex nested CSG operations');

      // Mock successful parsing with nested operations
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [
          {
            type: 'union',
            children: [
              {
                type: 'difference',
                children: [
                  { type: 'cube', size: [20, 20, 20] },
                  { type: 'sphere', radius: 8 }
                ]
              },
              { type: 'cylinder', height: 10, radius1: 3, radius2: 3 }
            ]
          }
        ],
        errors: [],
        parseTime: 120
      });

      const openscadCode = `
        union() {
          difference() {
            cube([20, 20, 20]);
            sphere(8);
          }
          cylinder(h=10, r=3);
        }
      `;

      const result = await processOpenSCADPipeline(openscadCode, {
        enableLogging: true,
        enableOptimization: true
      });

      expect(result.success).toBe(true);
      expect(result.meshes).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.nodeCount).toBeGreaterThan(1);
      
      // Verify multiple CSG operations were performed
      const { CSG } = await import('three-csg-ts');
      expect(CSG.fromGeometry).toHaveBeenCalledTimes(4); // 2 for difference, 2 for union
      expect(CSG.toGeometry).toHaveBeenCalledTimes(2); // 1 for difference result, 1 for union result
    });

    it('should handle CSG operation failures gracefully', async () => {
      console.log('[DEBUG] Testing CSG operation failure handling');

      // Mock CSG failure
      const { CSG } = await import('three-csg-ts');
      (CSG.fromGeometry as any).mockImplementationOnce(() => {
        throw new Error('CSG operation failed');
      });

      // Mock successful parsing
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [
          {
            type: 'union',
            children: [
              { type: 'cube', size: [10, 10, 10] },
              { type: 'sphere', radius: 5 }
            ]
          }
        ],
        errors: [],
        parseTime: 50
      });

      const openscadCode = `
        union() {
          cube([10, 10, 10]);
          sphere(5);
        }
      `;

      const result = await processOpenSCADPipeline(openscadCode);

      // Should succeed with fallback (first child mesh)
      expect(result.success).toBe(true);
      expect(result.meshes).toHaveLength(1);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Optimization', () => {
    it('should cache CSG geometries for performance', async () => {
      console.log('[DEBUG] Testing CSG geometry caching');

      // Mock successful parsing
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [
          { type: 'cube', size: [10, 10, 10] }
        ],
        errors: [],
        parseTime: 25
      });

      const openscadCode = 'cube([10, 10, 10]);';

      // Process the same code twice
      const result1 = await processOpenSCADPipeline(openscadCode, {
        enableCaching: true
      });

      const result2 = await processOpenSCADPipeline(openscadCode, {
        enableCaching: true
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      // Second result should be faster due to caching
      expect(result2.metrics.r3fGenerationTime).toBeLessThanOrEqual(result1.metrics.r3fGenerationTime);
    });

    it('should report accurate performance metrics', async () => {
      console.log('[DEBUG] Testing performance metrics reporting');

      // Mock successful parsing
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [
          {
            type: 'union',
            children: [
              { type: 'cube', size: [10, 10, 10] },
              { type: 'sphere', radius: 5 },
              { type: 'cylinder', height: 8, radius1: 3, radius2: 3 }
            ]
          }
        ],
        errors: [],
        parseTime: 100
      });

      const openscadCode = `
        union() {
          cube([10, 10, 10]);
          sphere(5);
          cylinder(h=8, r=3);
        }
      `;

      const result = await processOpenSCADPipeline(openscadCode, {
        enableLogging: true
      });

      expect(result.success).toBe(true);
      expect(result.metrics.totalTime).toBeGreaterThan(0);
      expect(result.metrics.parsingTime).toBeGreaterThan(0);
      expect(result.metrics.csgProcessingTime).toBeGreaterThan(0);
      expect(result.metrics.r3fGenerationTime).toBeGreaterThan(0);
      expect(result.metrics.nodeCount).toBe(4); // 1 union + 3 primitives
      expect(result.metrics.meshCount).toBe(1); // 1 final mesh after CSG
    });
  });
});
