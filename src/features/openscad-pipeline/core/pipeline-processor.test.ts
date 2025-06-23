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

// No longer mocking dependencies to perform integration testing

describe('Pipeline Processor', () => {
  beforeEach(() => {
    // Clear mocks for callbacks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('processOpenSCADPipeline', () => {
    it('should process simple OpenSCAD code successfully', async () => {
      console.log('[DEBUG] Testing successful pipeline processing');

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

      const code = 'invalid syntax;';
      const result = await processOpenSCADPipeline(code);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      if (result.errors[0]) {
        expect(result.errors[0].stage).toBe('parsing');
        expect(result.errors[0].message).toBeDefined();
      }
      expect(result.meshes).toHaveLength(0);
    });

    it('should handle CSG processing errors', async () => {
      console.log('[DEBUG] Testing CSG processing error handling');

      // A difference with only one child should cause a processing error.
      const code = 'difference() { cube(10); }';
      const result = await processOpenSCADPipeline(code);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      if (result.errors[0]) {
        expect(result.errors[0].stage).toBe('csg-processing');
        expect(result.errors[0].message).toBeDefined();
      }
    });

    it('should call progress callback during processing', async () => {
      console.log('[DEBUG] Testing progress callback functionality');

      const progressCallback = vi.fn();
      const code = 'cube([10, 10, 10]);';
      
      await processOpenSCADPipeline(code, {}, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      
      const calls = progressCallback.mock.calls.map(call => call[0] as PipelineProgress);
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
      // We can't easily verify that the config was used without mocks,
      // but we can at least ensure the pipeline runs to completion with the config object.
      expect(result.meshes).toHaveLength(1);
    });

    it('should call error callback when errors occur', async () => {
      console.log('[DEBUG] Testing error callback functionality');

      const errorCallback = vi.fn();
      const code = 'invalid syntax;';
      
      await processOpenSCADPipeline(code, {}, undefined, errorCallback);

      expect(errorCallback).toHaveBeenCalled();
      const errorArg = errorCallback.mock.calls[0][0] as PipelineError;
      expect(errorArg.stage).toBe('parsing');
      expect(errorArg.message).toBeDefined();
      expect(errorArg.severity).toBe('error');
    });
  });
});
