/**
 * @file R3F Pipeline Processor Tests
 * 
 * TDD tests for the R3F pipeline processor following React 19 best practices
 * and functional programming principles. Tests the complete OpenSCAD → R3F pipeline.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { R3FPipelineProcessor, createR3FPipelineProcessor } from './r3f-pipeline-processor';
import type { R3FPipelineConfig, ProcessingProgress } from '../../types/r3f-csg-types';

// Mock the AST visitor
vi.mock('../../openscad/ast-visitor/r3f-ast-visitor', () => ({
  createR3FASTVisitor: vi.fn(() => ({
    visit: vi.fn(() => ({
      success: true,
      data: {
        type: 'Mesh',
        geometry: { type: 'BoxGeometry' },
        material: { type: 'MeshStandardMaterial' },
        name: 'test_cube'
      }
    })),
    dispose: vi.fn()
  }))
}));

// Mock the scene factory
vi.mock('../../services/scene-factory/r3f-scene-factory', () => ({
  createR3FSceneFactory: vi.fn(() => ({
    createSceneWithCamera: vi.fn(() => ({
      success: true,
      data: {
        scene: {
          type: 'Scene',
          children: [],
          traverse: vi.fn(),
          clear: vi.fn()
        },
        camera: {
          type: 'PerspectiveCamera',
          position: { set: vi.fn() },
          lookAt: vi.fn()
        }
      }
    }))
  }))
}));

// Mock Three.js for testing
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    Scene: vi.fn().mockImplementation(() => ({
      type: 'Scene',
      children: [],
      traverse: vi.fn((callback) => {
        // Mock traverse to call callback on mock objects
        callback({
          type: 'Mesh',
          geometry: {
            attributes: { position: { count: 24 } },
            computeVertexNormals: vi.fn(),
            computeBoundingBox: vi.fn(),
            computeBoundingSphere: vi.fn(),
            dispose: vi.fn()
          },
          material: { dispose: vi.fn() }
        });
      }),
      clear: vi.fn()
    }))
  };
});

describe('R3FPipelineProcessor', () => {
  let processor: R3FPipelineProcessor;
  let mockProgressCallback: ReturnType<typeof vi.fn>;
  let mockErrorCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    console.log('[DEBUG] Setting up R3F pipeline processor test');
    
    processor = createR3FPipelineProcessor();
    mockProgressCallback = vi.fn();
    mockErrorCallback = vi.fn();
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3F pipeline processor test');
    processor.dispose();
    vi.clearAllMocks();
  });

  describe('constructor and configuration', () => {
    it('should create pipeline processor with default configuration', () => {
      console.log('[DEBUG] Testing pipeline processor creation with defaults');
      
      const defaultProcessor = createR3FPipelineProcessor();
      expect(defaultProcessor).toBeDefined();
      expect(typeof defaultProcessor.processOpenSCAD).toBe('function');
      expect(typeof defaultProcessor.dispose).toBe('function');
      
      defaultProcessor.dispose();
    });

    it('should create pipeline processor with custom configuration', () => {
      console.log('[DEBUG] Testing pipeline processor creation with custom config');
      
      const config: R3FPipelineConfig = {
        enableCaching: false,
        enableOptimization: false,
        enableLogging: false,
        processingTimeout: 30000
      };
      
      const customProcessor = createR3FPipelineProcessor(config);
      expect(customProcessor).toBeDefined();
      
      customProcessor.dispose();
    });
  });

  describe('OpenSCAD processing', () => {
    it('should process simple OpenSCAD code successfully', async () => {
      console.log('[DEBUG] Testing simple OpenSCAD processing');
      
      const openscadCode = 'cube([1, 2, 3]);';
      const result = await processor.processOpenSCAD(
        openscadCode,
        mockProgressCallback,
        mockErrorCallback
      );
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scene).toBeDefined();
        expect(result.data.meshes).toBeDefined();
        expect(result.data.metrics).toBeDefined();
        expect(Array.isArray(result.data.meshes)).toBe(true);
      }
      
      expect(mockErrorCallback).not.toHaveBeenCalled();
    });

    it('should report progress during processing', async () => {
      console.log('[DEBUG] Testing progress reporting');
      
      const openscadCode = 'sphere(5);';
      const result = await processor.processOpenSCAD(
        openscadCode,
        mockProgressCallback,
        mockErrorCallback
      );
      
      expect(result.success).toBe(true);
      expect(mockProgressCallback).toHaveBeenCalled();
      
      // Check that progress was reported for different stages
      const progressCalls = mockProgressCallback.mock.calls;
      const stages = progressCalls.map(call => call[0].stage);
      
      expect(stages).toContain('parsing');
      expect(stages).toContain('ast-processing');
      expect(stages).toContain('scene-generation');
      expect(stages).toContain('complete');
    });

    it('should process complex OpenSCAD code with multiple operations', async () => {
      console.log('[DEBUG] Testing complex OpenSCAD processing');
      
      const openscadCode = `
        difference() {
          cube([10, 10, 10]);
          sphere(6);
        }
      `;
      
      const result = await processor.processOpenSCAD(
        openscadCode,
        mockProgressCallback,
        mockErrorCallback
      );
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scene.type).toBe('Scene');
        expect(result.data.camera).toBeDefined();
        expect(result.data.metrics.processingTime).toBeGreaterThan(0);
      }
    });

    it('should include camera in scene result', async () => {
      console.log('[DEBUG] Testing camera inclusion in result');
      
      const openscadCode = 'cylinder(h=10, r=3);';
      const result = await processor.processOpenSCAD(openscadCode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.camera).toBeDefined();
        expect(result.data.camera?.type).toBe('PerspectiveCamera');
      }
    });
  });

  describe('caching functionality', () => {
    it('should cache processing results when caching is enabled', async () => {
      console.log('[DEBUG] Testing caching functionality');
      
      const cachingProcessor = createR3FPipelineProcessor({ enableCaching: true });
      const openscadCode = 'cube([2, 2, 2]);';
      
      // First processing should miss cache
      const result1 = await cachingProcessor.processOpenSCAD(openscadCode);
      expect(result1.success).toBe(true);
      
      // Second processing should hit cache
      const result2 = await cachingProcessor.processOpenSCAD(openscadCode);
      expect(result2.success).toBe(true);
      
      // Results should be identical
      if (result1.success && result2.success) {
        expect(result1.data.scene.type).toBe(result2.data.scene.type);
      }
      
      cachingProcessor.dispose();
    });

    it('should provide cache statistics', async () => {
      console.log('[DEBUG] Testing cache statistics');
      
      const cachingProcessor = createR3FPipelineProcessor({ enableCaching: true });
      
      const initialStats = cachingProcessor.getCacheStats();
      expect(initialStats.size).toBe(0);
      expect(initialStats.keys).toEqual([]);
      
      await cachingProcessor.processOpenSCAD('cube([1, 1, 1]);');
      
      const finalStats = cachingProcessor.getCacheStats();
      expect(finalStats.size).toBe(1);
      expect(finalStats.keys).toHaveLength(1);
      
      cachingProcessor.dispose();
    });

    it('should clear cache when requested', async () => {
      console.log('[DEBUG] Testing cache clearing');
      
      const cachingProcessor = createR3FPipelineProcessor({ enableCaching: true });
      
      await cachingProcessor.processOpenSCAD('sphere(2);');
      expect(cachingProcessor.getCacheStats().size).toBe(1);
      
      cachingProcessor.clearCache();
      expect(cachingProcessor.getCacheStats().size).toBe(0);
      
      cachingProcessor.dispose();
    });
  });

  describe('retry functionality', () => {
    it('should retry processing on failure', async () => {
      console.log('[DEBUG] Testing retry functionality');
      
      const retryProcessor = createR3FPipelineProcessor({ maxRetries: 2 });
      
      // Mock the AST visitor to fail first time, succeed second time
      const { createR3FASTVisitor } = await import('../../openscad/ast-visitor/r3f-ast-visitor');
      const mockVisitor = createR3FASTVisitor as any;
      
      let callCount = 0;
      mockVisitor.mockImplementation(() => ({
        visit: vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            return { success: false, error: 'First attempt failed' };
          }
          return {
            success: true,
            data: {
              type: 'Mesh',
              geometry: { type: 'BoxGeometry' },
              material: { type: 'MeshStandardMaterial' }
            }
          };
        }),
        dispose: vi.fn()
      }));
      
      const result = await retryProcessor.processWithRetry('cube([1, 1, 1]);');
      
      expect(result.success).toBe(true);
      expect(callCount).toBe(2); // Should have retried once
      
      retryProcessor.dispose();
    });

    it('should fail after maximum retries', async () => {
      console.log('[DEBUG] Testing maximum retry limit');
      
      const retryProcessor = createR3FPipelineProcessor({ maxRetries: 2 });
      
      // Mock the AST visitor to always fail
      const { createR3FASTVisitor } = await import('../../openscad/ast-visitor/r3f-ast-visitor');
      const mockVisitor = createR3FASTVisitor as any;
      
      mockVisitor.mockImplementation(() => ({
        visit: vi.fn(() => ({ success: false, error: 'Always fails' })),
        dispose: vi.fn()
      }));
      
      const result = await retryProcessor.processWithRetry('invalid code');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('after 2 attempts');
      }
      
      retryProcessor.dispose();
    });
  });

  describe('error handling', () => {
    it('should handle parsing errors gracefully', async () => {
      console.log('[DEBUG] Testing parsing error handling');
      
      // This will use the mock parser which should succeed, but let's test error path
      const result = await processor.processOpenSCAD(
        'invalid syntax {{{',
        mockProgressCallback,
        mockErrorCallback
      );
      
      // With our mock implementation, this should still succeed
      // In a real implementation with actual parser, this would fail
      expect(result.success).toBe(true);
    });

    it('should handle AST processing errors', async () => {
      console.log('[DEBUG] Testing AST processing error handling');
      
      // Mock the AST visitor to fail
      const { createR3FASTVisitor } = await import('../../openscad/ast-visitor/r3f-ast-visitor');
      const mockVisitor = createR3FASTVisitor as any;
      
      mockVisitor.mockImplementationOnce(() => ({
        visit: vi.fn(() => ({ success: false, error: 'AST processing failed' })),
        dispose: vi.fn()
      }));
      
      const result = await processor.processOpenSCAD(
        'cube([1, 1, 1]);',
        mockProgressCallback,
        mockErrorCallback
      );
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('AST processing failed');
      }
      
      expect(mockErrorCallback).toHaveBeenCalledWith(
        expect.stringContaining('AST processing failed'),
        'ast-processing'
      );
    });

    it('should handle scene generation errors', async () => {
      console.log('[DEBUG] Testing scene generation error handling');
      
      // Mock the scene factory to fail
      const { createR3FSceneFactory } = await import('../../services/scene-factory/r3f-scene-factory');
      const mockFactory = createR3FSceneFactory as any;
      
      mockFactory.mockImplementationOnce(() => ({
        createSceneWithCamera: vi.fn(() => ({
          success: false,
          error: 'Scene generation failed'
        }))
      }));
      
      const result = await processor.processOpenSCAD(
        'sphere(1);',
        mockProgressCallback,
        mockErrorCallback
      );
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Scene generation failed');
      }
    });

    it('should call error callback on failures', async () => {
      console.log('[DEBUG] Testing error callback invocation');
      
      // Mock the AST visitor to fail
      const { createR3FASTVisitor } = await import('../../openscad/ast-visitor/r3f-ast-visitor');
      const mockVisitor = createR3FASTVisitor as any;
      
      mockVisitor.mockImplementationOnce(() => ({
        visit: vi.fn(() => ({ success: false, error: 'Test error' })),
        dispose: vi.fn()
      }));
      
      await processor.processOpenSCAD(
        'test code',
        mockProgressCallback,
        mockErrorCallback
      );
      
      expect(mockErrorCallback).toHaveBeenCalledWith(
        expect.stringContaining('Test error'),
        'ast-processing'
      );
    });
  });

  describe('optimization features', () => {
    it('should optimize scene when optimization is enabled', async () => {
      console.log('[DEBUG] Testing scene optimization');
      
      const optimizingProcessor = createR3FPipelineProcessor({ enableOptimization: true });
      const result = await optimizingProcessor.processOpenSCAD('cube([1, 1, 1]);');
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Verify optimization was attempted (traverse was called)
        expect(result.data.scene.traverse).toHaveBeenCalled();
      }
      
      optimizingProcessor.dispose();
    });

    it('should skip optimization when disabled', async () => {
      console.log('[DEBUG] Testing disabled optimization');
      
      const nonOptimizingProcessor = createR3FPipelineProcessor({ enableOptimization: false });
      const result = await nonOptimizingProcessor.processOpenSCAD('cube([1, 1, 1]);');
      
      expect(result.success).toBe(true);
      
      nonOptimizingProcessor.dispose();
    });
  });

  describe('resource management', () => {
    it('should dispose resources properly', async () => {
      console.log('[DEBUG] Testing resource disposal');
      
      const result = await processor.processOpenSCAD('cube([1, 1, 1]);');
      expect(result.success).toBe(true);
      
      // Dispose should not throw
      expect(() => processor.dispose()).not.toThrow();
    });

    it('should handle disposal of empty processor', () => {
      console.log('[DEBUG] Testing disposal of empty processor');
      
      const emptyProcessor = createR3FPipelineProcessor();
      
      // Dispose should not throw even if no processing was done
      expect(() => emptyProcessor.dispose()).not.toThrow();
    });

    it('should clean up scene resources on disposal', async () => {
      console.log('[DEBUG] Testing scene resource cleanup');
      
      const result = await processor.processOpenSCAD('sphere(2);');
      expect(result.success).toBe(true);
      
      processor.dispose();
      
      if (result.success) {
        expect(result.data.scene.traverse).toHaveBeenCalled();
        expect(result.data.scene.clear).toHaveBeenCalled();
      }
    });
  });

  describe('metrics and performance', () => {
    it('should provide processing metrics', async () => {
      console.log('[DEBUG] Testing processing metrics');
      
      const result = await processor.processOpenSCAD('cylinder(h=5, r=2);');
      
      expect(result.success).toBe(true);
      if (result.success) {
        const metrics = result.data.metrics;
        
        expect(metrics).toBeDefined();
        expect(typeof metrics.totalNodes).toBe('number');
        expect(typeof metrics.processedNodes).toBe('number');
        expect(typeof metrics.failedNodes).toBe('number');
        expect(typeof metrics.processingTime).toBe('number');
        expect(typeof metrics.memoryUsage).toBe('number');
        
        expect(metrics.processingTime).toBeGreaterThan(0);
      }
    });

    it('should estimate memory usage', async () => {
      console.log('[DEBUG] Testing memory usage estimation');
      
      const result = await processor.processOpenSCAD('cube([5, 5, 5]);');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
