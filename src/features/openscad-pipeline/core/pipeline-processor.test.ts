/**
 * @file Pipeline Processor Tests
 * 
 * TDD tests for the complete OpenSCAD to R3F pipeline processor.
 * Tests the integration of AST parsing, CSG processing, and R3F generation
 * with comprehensive error handling and performance monitoring.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { processOpenSCADPipeline } from './pipeline-processor';
import type { PipelineConfig, PipelineProgress, PipelineError } from './pipeline-processor';

// Mock the dependencies
vi.mock('../../ui-components/editor/code-editor/openscad-ast-service', () => ({
  parseOpenSCADCodeCached: vi.fn()
}));

vi.mock('../../csg-processor', () => ({
  processASTToCSGTree: vi.fn()
}));

vi.mock('../../r3f-generator', () => ({
  generateR3FFromCSGTree: vi.fn()
}));

describe('Pipeline Processor', () => {
  beforeEach(() => {
    console.log('[DEBUG] Setting up pipeline processor test');
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up pipeline processor test');
    vi.clearAllMocks();
  });

  describe('processOpenSCADPipeline', () => {
    it('should process simple OpenSCAD code successfully', async () => {
      console.log('[DEBUG] Testing successful pipeline processing');

      // Mock successful parsing
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [{ type: 'cube', size: [10, 10, 10] }],
        errors: [],
        parseTime: 50
      });

      // Mock successful CSG processing
      const { processASTToCSGTree } = await import('../../csg-processor');
      (processASTToCSGTree as any).mockReturnValue({
        success: true,
        tree: {
          root: [{ id: 'test-cube', type: 'cube', size: [10, 10, 10] }],
          metadata: { nodeCount: 1, primitiveCount: 1, operationCount: 0, maxDepth: 1 },
          processingTime: 25
        },
        errors: [],
        warnings: []
      });

      // Mock successful R3F generation
      const { generateR3FFromCSGTree } = await import('../../r3f-generator');
      (generateR3FFromCSGTree as any).mockResolvedValue({
        success: true,
        meshes: [{ mesh: { type: 'Mesh' }, nodeId: 'test-cube', nodeType: 'cube', metadata: {} }],
        scene: { type: 'Scene' },
        errors: [],
        warnings: [],
        metrics: { totalMeshes: 1, totalVertices: 24, totalTriangles: 12, generationTime: 75, memoryUsage: 1024, cacheHitRate: 0 }
      });

      const code = 'cube([10, 10, 10]);';
      const result = await processOpenSCADPipeline(code);

      expect(result.success).toBe(true);
      expect(result.meshes).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.nodeCount).toBe(1);
      expect(result.metrics.meshCount).toBe(1);
    });

    it('should handle parsing errors gracefully', async () => {
      console.log('[DEBUG] Testing parsing error handling');

      // Mock parsing failure
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: false,
        ast: [],
        errors: [{ message: 'Syntax error', location: { line: 1, column: 5 }, severity: 'error' }],
        parseTime: 10
      });

      const code = 'invalid syntax';
      const result = await processOpenSCADPipeline(code);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].stage).toBe('parsing');
      expect(result.errors[0].message).toContain('Syntax error');
      expect(result.meshes).toHaveLength(0);
    });

    it('should handle CSG processing errors', async () => {
      console.log('[DEBUG] Testing CSG processing error handling');

      // Mock successful parsing
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [{ type: 'cube', size: [10, 10, 10] }],
        errors: [],
        parseTime: 50
      });

      // Mock CSG processing failure
      const { processASTToCSGTree } = await import('../../csg-processor');
      (processASTToCSGTree as any).mockReturnValue({
        success: false,
        tree: null,
        errors: [{ message: 'Invalid cube dimensions', code: 'INVALID_DIMENSIONS', severity: 'error' }],
        warnings: []
      });

      const code = 'cube([0, 0, 0]);';
      const result = await processOpenSCADPipeline(code);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].stage).toBe('csg-processing');
      expect(result.errors[0].message).toContain('Invalid cube dimensions');
    });

    it('should handle R3F generation errors', async () => {
      console.log('[DEBUG] Testing R3F generation error handling');

      // Mock successful parsing and CSG processing
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [{ type: 'cube', size: [10, 10, 10] }],
        errors: [],
        parseTime: 50
      });

      const { processASTToCSGTree } = await import('../../csg-processor');
      (processASTToCSGTree as any).mockReturnValue({
        success: true,
        tree: {
          root: [{ id: 'test-cube', type: 'cube', size: [10, 10, 10] }],
          metadata: { nodeCount: 1, primitiveCount: 1, operationCount: 0, maxDepth: 1 },
          processingTime: 25
        },
        errors: [],
        warnings: []
      });

      // Mock R3F generation failure
      const { generateR3FFromCSGTree } = await import('../../r3f-generator');
      (generateR3FFromCSGTree as any).mockResolvedValue({
        success: false,
        meshes: [],
        errors: [{ message: 'Geometry generation failed', code: 'GEOMETRY_ERROR', severity: 'error' }],
        warnings: [],
        metrics: { totalMeshes: 0, totalVertices: 0, totalTriangles: 0, generationTime: 0, memoryUsage: 0, cacheHitRate: 0 }
      });

      const code = 'cube([10, 10, 10]);';
      const result = await processOpenSCADPipeline(code);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].stage).toBe('r3f-generation');
      expect(result.errors[0].message).toContain('Geometry generation failed');
    });

    it('should call progress callback during processing', async () => {
      console.log('[DEBUG] Testing progress callback functionality');

      // Mock successful processing
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [{ type: 'cube', size: [10, 10, 10] }],
        errors: [],
        parseTime: 50
      });

      const { processASTToCSGTree } = await import('../../csg-processor');
      (processASTToCSGTree as any).mockReturnValue({
        success: true,
        tree: {
          root: [{ id: 'test-cube', type: 'cube', size: [10, 10, 10] }],
          metadata: { nodeCount: 1, primitiveCount: 1, operationCount: 0, maxDepth: 1 },
          processingTime: 25
        },
        errors: [],
        warnings: []
      });

      const { generateR3FFromCSGTree } = await import('../../r3f-generator');
      (generateR3FFromCSGTree as any).mockResolvedValue({
        success: true,
        meshes: [{ mesh: { type: 'Mesh' }, nodeId: 'test-cube', nodeType: 'cube', metadata: {} }],
        scene: { type: 'Scene' },
        errors: [],
        warnings: [],
        metrics: { totalMeshes: 1, totalVertices: 24, totalTriangles: 12, generationTime: 75, memoryUsage: 1024, cacheHitRate: 0 }
      });

      const progressCallback = vi.fn();
      const code = 'cube([10, 10, 10]);';
      
      await processOpenSCADPipeline(code, {}, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      
      // Check that progress was called for different stages
      const calls = progressCallback.mock.calls.map(call => call[0]);
      const stages = calls.map(progress => progress.stage);
      
      expect(stages).toContain('parsing');
      expect(stages).toContain('csg-processing');
      expect(stages).toContain('r3f-generation');
      expect(stages).toContain('complete');
    });

    it('should handle empty code input', async () => {
      console.log('[DEBUG] Testing empty code input');

      const result = await processOpenSCADPipeline('');

      expect(result.success).toBe(true);
      expect(result.meshes).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.nodeCount).toBe(0);
    });

    it('should handle whitespace-only code input', async () => {
      console.log('[DEBUG] Testing whitespace-only code input');

      const result = await processOpenSCADPipeline('   \n\t  ');

      expect(result.success).toBe(true);
      expect(result.meshes).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.nodeCount).toBe(0);
    });

    it('should respect configuration options', async () => {
      console.log('[DEBUG] Testing configuration options');

      // Mock successful processing
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: true,
        ast: [{ type: 'cube', size: [10, 10, 10] }],
        errors: [],
        parseTime: 50
      });

      const { processASTToCSGTree } = await import('../../csg-processor');
      (processASTToCSGTree as any).mockReturnValue({
        success: true,
        tree: {
          root: [{ id: 'test-cube', type: 'cube', size: [10, 10, 10] }],
          metadata: { nodeCount: 1, primitiveCount: 1, operationCount: 0, maxDepth: 1 },
          processingTime: 25
        },
        errors: [],
        warnings: []
      });

      const { generateR3FFromCSGTree } = await import('../../r3f-generator');
      (generateR3FFromCSGTree as any).mockResolvedValue({
        success: true,
        meshes: [{ mesh: { type: 'Mesh' }, nodeId: 'test-cube', nodeType: 'cube', metadata: {} }],
        scene: { type: 'Scene' },
        errors: [],
        warnings: [],
        metrics: { totalMeshes: 1, totalVertices: 24, totalTriangles: 12, generationTime: 75, memoryUsage: 1024, cacheHitRate: 0 }
      });

      const config: PipelineConfig = {
        enableLogging: true,
        enableCaching: false,
        enableOptimization: false,
        timeout: 10000,
        parsingConfig: {
          timeout: 2000,
          maxRetries: 1
        },
        csgConfig: {
          enableValidation: false,
          maxDepth: 25,
          maxNodes: 5000
        },
        r3fConfig: {
          enableCaching: false,
          materialQuality: 'low',
          enableShadows: false
        }
      };

      const code = 'cube([10, 10, 10]);';
      const result = await processOpenSCADPipeline(code, config);

      expect(result.success).toBe(true);
      
      // Verify that configuration was passed to sub-processors
      expect(parseOpenSCADCodeCached).toHaveBeenCalledWith(code, expect.objectContaining({
        enableLogging: true,
        timeout: 2000,
        maxRetries: 1
      }));

      expect(processASTToCSGTree).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({
        enableLogging: true,
        enableOptimization: false,
        enableValidation: false,
        maxDepth: 25,
        maxNodes: 5000
      }));

      expect(generateR3FFromCSGTree).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
        enableLogging: true,
        enableCaching: false,
        enableOptimization: false,
        materialQuality: 'low',
        enableShadows: false
      }));
    });

    it('should handle pipeline exceptions gracefully', async () => {
      console.log('[DEBUG] Testing pipeline exception handling');

      // Mock parsing to throw an exception
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockRejectedValue(new Error('Network error'));

      const code = 'cube([10, 10, 10]);';
      const result = await processOpenSCADPipeline(code);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].stage).toBe('complete');
      expect(result.errors[0].message).toContain('Pipeline failed');
      expect(result.meshes).toHaveLength(0);
    });

    it('should call error callback when errors occur', async () => {
      console.log('[DEBUG] Testing error callback functionality');

      // Mock parsing failure
      const { parseOpenSCADCodeCached } = await import('../../ui-components/editor/code-editor/openscad-ast-service');
      (parseOpenSCADCodeCached as any).mockResolvedValue({
        success: false,
        ast: [],
        errors: [{ message: 'Syntax error', location: { line: 1, column: 5 }, severity: 'error' }],
        parseTime: 10
      });

      const errorCallback = vi.fn();
      const code = 'invalid syntax';
      
      await processOpenSCADPipeline(code, {}, undefined, errorCallback);

      expect(errorCallback).toHaveBeenCalled();
      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'parsing',
          message: expect.stringContaining('Syntax error'),
          severity: 'error'
        }),
        'parsing'
      );
    });
  });
});
