/**
 * @file R3F CSG Converter Tests
 * 
 * TDD tests for the R3F CSG converter following React 19 best practices
 * and functional programming principles. Tests the complete OpenSCAD to R3F conversion.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import * as _THREE from 'three';
import { R3FCSGConverter, createR3FCSGConverter } from './r3f-csg-converter';
import type { R3FCSGConverterConfig, ConversionResult, ProcessingProgress } from '../types/r3f-csg-types';

// Mock Component type for testing
interface MockComponent {
  type: string;
  props: {
    children?: MockComponent | MockComponent[];
    [key: string]: any;
  };
  key: any;
}

// Mock React
vi.mock('react', async () => {
  const actualReact = await vi.importActual<typeof React>('react');
  return {
    ...actualReact,
    default: actualReact,
    createElement: vi.fn((type, props, ...children) => ({
      type,
      props: { ...props, children: children.length === 1 ? children[0] : children },
      key: props?.key,
    })),
    memo: vi.fn(component => component),
    Fragment: 'Fragment',
  };
});

// Mock @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: vi.fn((props) => ({ type: 'Canvas', props }))
}));

// Mock @react-three/drei
vi.mock('@react-three/drei', () => ({
  OrbitControls: vi.fn((props) => ({ type: 'OrbitControls', props })),
  Grid: vi.fn((props) => ({ type: 'Grid', props })),
  Stats: vi.fn((props) => ({ type: 'Stats', props }))
}));

// Mock the pipeline processor
vi.mock('../pipeline/processor/r3f-pipeline-processor', () => ({
  createR3FPipelineProcessor: vi.fn(() => ({
    processOpenSCAD: vi.fn(async (_code, onProgress, _onError) => {
      // Simulate progress
      if (onProgress) {
        onProgress({ stage: 'parsing', progress: 25, message: 'Parsing...', timeElapsed: 100 });
        onProgress({ stage: 'ast-processing', progress: 50, message: 'Processing...', timeElapsed: 200 });
        onProgress({ stage: 'scene-generation', progress: 75, message: 'Generating...', timeElapsed: 300 });
        onProgress({ stage: 'complete', progress: 100, message: 'Complete', timeElapsed: 400 });
      }
      
      return {
        success: true,
        data: {
          scene: {
            type: 'Scene',
            traverse: vi.fn(),
            clear: vi.fn()
          },
          camera: {
            type: 'PerspectiveCamera',
            position: { x: 10, y: 10, z: 10 }
          },
          meshes: [
            {
              type: 'Mesh',
              geometry: { type: 'BoxGeometry' },
              material: { type: 'MeshStandardMaterial' },
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            }
          ],
          metrics: {
            totalNodes: 1,
            processedNodes: 1,
            failedNodes: 0,
            processingTime: 400,
            memoryUsage: 1024,
            cacheHits: 0,
            cacheMisses: 1
          }
        }
      };
    }),
    dispose: vi.fn()
  }))
}));

// Mock Three.js for testing
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    Scene: vi.fn().mockImplementation(() => ({
      type: 'Scene',
      traverse: vi.fn(),
      clear: vi.fn()
    }))
  };
});

describe('R3FCSGConverter', () => {
  let converter: R3FCSGConverter;
  let mockProgressCallback: ReturnType<typeof vi.fn>;
  let mockErrorCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    console.log('[DEBUG] Setting up R3F CSG converter test');
    
    converter = createR3FCSGConverter();
    mockProgressCallback = vi.fn();
    mockErrorCallback = vi.fn();
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3F CSG converter test');
    converter.dispose();
    vi.clearAllMocks();
  });

  describe('constructor and configuration', () => {
    it('should create converter with default configuration', () => {
      console.log('[DEBUG] Testing converter creation with defaults');
      
      const defaultConverter = createR3FCSGConverter();
      expect(defaultConverter).toBeDefined();
      expect(typeof defaultConverter.convertToR3F).toBe('function');
      expect(typeof defaultConverter.convertToJSX).toBe('function');
      expect(typeof defaultConverter.dispose).toBe('function');
      
      defaultConverter.dispose();
    });

    it('should create converter with custom configuration', () => {
      console.log('[DEBUG] Testing converter creation with custom config');
      
      const config: R3FCSGConverterConfig = {
        pipelineConfig: {
          enableCaching: false,
          enableLogging: false,
        },
        canvasConfig: {
          width: '100%',
          height: '100%',
        },
        sceneConfig: {
          backgroundColor: '#000',
          showAxes: false,
          showGrid: false,
        },
        controlsConfig: {
          enableZoom: false,
          enablePan: false,
          enableRotate: false,
        },
      };
      
      const customConverter = createR3FCSGConverter(config);
      expect(customConverter).toBeDefined();
      
      customConverter.dispose();
    });
  });

  describe('OpenSCAD to R3F conversion', () => {
    it('should convert simple OpenSCAD code to R3F components', async () => {
      console.log('[DEBUG] Testing simple OpenSCAD to R3F conversion');
      
      const openscadCode = 'cube([1, 2, 3]);';
      const result = await converter.convertToR3F(
        openscadCode,
        mockProgressCallback,
        mockErrorCallback
      );
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data!.CanvasComponent).toBeDefined();
        expect(result.data!.SceneComponent).toBeDefined();
        expect(result.data!.MeshComponents).toBeDefined();
        expect(Array.isArray(result.data!.MeshComponents)).toBe(true);
        expect(result.data!.scene).toBeDefined();
        expect(result.data!.meshes).toBeDefined();
        expect(result.data!.metrics).toBeDefined();
        expect(result.data!.jsx).toBeDefined();
      }
      
      expect(mockErrorCallback).not.toHaveBeenCalled();
    });

    it('should report progress during conversion', async () => {
      console.log('[DEBUG] Testing progress reporting during conversion');
      
      const openscadCode = 'sphere(5);';
      const result = await converter.convertToR3F(
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

    it('should generate React components with proper structure', async () => {
      console.log('[DEBUG] Testing React component structure');
      
      const openscadCode = 'cylinder(h=10, r=3);';
      const result = await converter.convertToR3F(openscadCode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const { CanvasComponent, SceneComponent, MeshComponents } = result.data!;
        
        // Test Canvas component
        expect(CanvasComponent).toBeDefined();
        expect(typeof CanvasComponent).toBe('function');
        
        // Test Scene component
        expect(SceneComponent).toBeDefined();
        expect(typeof SceneComponent).toBe('function');
        
        // Test Mesh components
        expect(Array.isArray(MeshComponents)).toBe(true);
        expect(MeshComponents.length).toBeGreaterThan(0);
        MeshComponents.forEach(component => {
          expect(typeof component).toBe('function');
        });
      }
    });

    it('should include scene metadata in result', async () => {
      console.log('[DEBUG] Testing scene metadata inclusion');
      
      const openscadCode = 'difference() { cube([10, 10, 10]); sphere(6); }';
      const result = await converter.convertToR3F(openscadCode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.scene.type).toBe('Scene');
        expect(result.data!.camera).toBeDefined();
        expect(result.data!.meshes.length).toBeGreaterThan(0);
        expect(result.data!.metrics.processingTime).toBeGreaterThan(0);
      }
    });
  });

  describe('JSX generation', () => {
    it('should convert OpenSCAD code to JSX string', async () => {
      console.log('[DEBUG] Testing JSX string generation');
      
      const openscadCode = 'cube([2, 2, 2]);';
      const result = await converter.convertToJSX(openscadCode, 'TestScene');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data).toBe('string');
        expect(result.data).toContain('TestScene');
        expect(result.data).toContain('Canvas');
        expect(result.data).toContain('ambientLight');
        expect(result.data).toContain('directionalLight');
        expect(result.data).toContain('OrbitControls');
      }
    });

    it('should generate JSX with default component name', async () => {
      console.log('[DEBUG] Testing JSX generation with default name');
      
      const openscadCode = 'sphere(3);';
      const result = await converter.convertToJSX(openscadCode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('OpenSCADScene');
        expect(result.data).toContain('export const OpenSCADScene');
        expect(result.data).toContain('export default OpenSCADScene');
      }
    });

    it('should include configuration in generated JSX', async () => {
      console.log('[DEBUG] Testing configuration inclusion in JSX');
      
      const configuredConverter = createR3FCSGConverter({
        canvasConfig: {
          shadows: true,
          antialias: true
        },
        sceneConfig: {
          enableGrid: true,
          enableStats: true
        },
        controlsConfig: {
          enableOrbitControls: true,
          autoRotate: true
        }
      });
      
      const result = await configuredConverter.convertToJSX('cube([1, 1, 1]);');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('shadows={true}');
        expect(result.data).toContain('Grid');
        expect(result.data).toContain('Stats');
        expect(result.data).toContain('OrbitControls');
        expect(result.data).toContain('autoRotate={true}');
      }
      
      configuredConverter.dispose();
    });
  });

  describe('caching functionality', () => {
    it('should cache conversion results when caching is enabled', async () => {
      console.log('[DEBUG] Testing caching functionality');
      
      const cachingConverter = createR3FCSGConverter({ enableCaching: true });
      const openscadCode = 'cube([2, 2, 2]);';
      
      // First conversion should miss cache
      const result1 = await cachingConverter.convertToR3F(openscadCode);
      expect(result1.success).toBe(true);
      
      const stats1 = cachingConverter.getStatistics();
      expect(stats1.cacheMisses).toBe(1);
      expect(stats1.cacheHits).toBe(0);
      
      // Second conversion should hit cache
      const result2 = await cachingConverter.convertToR3F(openscadCode);
      expect(result2.success).toBe(true);
      
      const stats2 = cachingConverter.getStatistics();
      expect(stats2.cacheHits).toBe(1);
      
      cachingConverter.dispose();
    });

    it('should provide conversion statistics', async () => {
      console.log('[DEBUG] Testing conversion statistics');
      
      const initialStats = converter.getStatistics();
      expect(initialStats.conversionCount).toBe(0);
      expect(initialStats.cacheHitRate).toBe(0);
      
      await converter.convertToR3F('sphere(1);');
      
      const finalStats = converter.getStatistics();
      expect(finalStats.conversionCount).toBe(1);
      expect(finalStats.cacheSize).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache when requested', async () => {
      console.log('[DEBUG] Testing cache clearing');
      
      const cachingConverter = createR3FCSGConverter({ enableCaching: true });
      
      await cachingConverter.convertToR3F('cylinder(h=5, r=2);');
      expect(cachingConverter.getStatistics().cacheSize).toBeGreaterThan(0);
      
      cachingConverter.clearCache();
      expect(cachingConverter.getStatistics().cacheSize).toBe(0);
      expect(cachingConverter.getStatistics().cacheHits).toBe(0);
      expect(cachingConverter.getStatistics().cacheMisses).toBe(0);
      
      cachingConverter.dispose();
    });
  });

  describe('state management', () => {
    it('should track converter state during processing', async () => {
      console.log('[DEBUG] Testing state tracking');
      
      const initialState = converter.getState();
      expect(initialState.isProcessing).toBe(false);
      expect(initialState.conversionCount).toBe(0);
      
      const conversionPromise = converter.convertToR3F('cube([1, 1, 1]);');
      
      // State should be updated after conversion
      await conversionPromise;
      
      const finalState = converter.getState();
      expect(finalState.conversionCount).toBe(1);
      expect(finalState.isProcessing).toBe(false);
      expect(finalState.currentProgress).toBeDefined();
      expect(finalState.currentProgress!.stage).toBe('complete');
    });

    it('should track progress in state', async () => {
      console.log('[DEBUG] Testing progress tracking in state');
      
      const progressUpdates: any[] = [];
      
      await converter.convertToR3F(
        'sphere(2);',
        (progress) => {
          progressUpdates.push(progress);
        }
      );
      
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      const finalState = converter.getState();
      expect(finalState.currentProgress).toBeDefined();
      expect(finalState.currentProgress!.progress).toBe(100);
    });

    it('should track errors in state', async () => {
      console.log('[DEBUG] Testing error tracking in state');
      
      // Mock the processor to fail
      const { createR3FPipelineProcessor } = await import('../pipeline/processor/r3f-pipeline-processor');
      const mockProcessor = createR3FPipelineProcessor as any;
      
      mockProcessor.mockImplementationOnce(() => ({
        processOpenSCAD: vi.fn(async () => ({
          success: false,
          error: 'Test processing error'
        })),
        dispose: vi.fn()
      }));
      
      const failingConverter = createR3FCSGConverter();
      const result = await failingConverter.convertToR3F('invalid code');
      
      expect(result.success).toBe(false);
      
      const state = failingConverter.getState();
      expect(state.lastError).toBeDefined();
      expect(state.lastError).toContain('Test processing error');
      
      failingConverter.dispose();
    });
  });

  describe('error handling', () => {
    it('should handle pipeline processing errors', async () => {
      console.log('[DEBUG] Testing pipeline error handling');
      
      // Mock the processor to fail
      const { createR3FPipelineProcessor } = await import('../pipeline/processor/r3f-pipeline-processor');
      const mockProcessor = createR3FPipelineProcessor as any;
      
      mockProcessor.mockImplementationOnce(() => ({
        processOpenSCAD: vi.fn(async () => ({
          success: false,
          error: 'Pipeline processing failed'
        })),
        dispose: vi.fn()
      }));
      
      const failingConverter = createR3FCSGConverter();
      const result = await failingConverter.convertToR3F(
        'invalid syntax',
        mockProgressCallback,
        mockErrorCallback
      );
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Pipeline processing failed');
      }
      
      failingConverter.dispose();
    });

    it('should handle JSX generation errors', async () => {
      console.log('[DEBUG] Testing JSX generation error handling');
      
      // Mock React.createElement to throw
      const originalCreateElement = React.createElement;
      (React as any).createElement = vi.fn(() => {
        throw new Error('JSX generation failed');
      });
      
      const result = await converter.convertToR3F('cube([1, 1, 1]);');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Component generation failed');
      }
      
      // Restore original function
      (React as any).createElement = originalCreateElement;
    });

    it('should call error callback on failures', async () => {
      console.log('[DEBUG] Testing error callback invocation');
      
      // Mock the processor to fail
      const { createR3FPipelineProcessor } = await import('../pipeline/processor/r3f-pipeline-processor');
      const mockProcessor = createR3FPipelineProcessor as any;
      
      mockProcessor.mockImplementationOnce(() => ({
        processOpenSCAD: vi.fn(async (_code, _onProgress, onError) => {
          if (onError) {
            onError('Test error', 'test-stage');
          }
          return { success: false, error: 'Test error' };
        }),
        dispose: vi.fn()
      }));
      
      const failingConverter = createR3FCSGConverter();
      await failingConverter.convertToR3F(
        'test code',
        mockProgressCallback,
        mockErrorCallback
      );
      
      expect(mockErrorCallback).toHaveBeenCalledWith('Test error', 'test-stage');
      
      failingConverter.dispose();
    });
  });

  describe('configuration options', () => {
    it('should respect canvas configuration', async () => {
      console.log('[DEBUG] Testing canvas configuration');
      
      const configuredConverter = createR3FCSGConverter({
        canvasConfig: { shadows: false, camera: { fov: 60 } },
      });
      const result = await configuredConverter.convertToR3F('cube(1);');
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const CanvasComponent = result.data.CanvasComponent as unknown as MockComponent;
        expect(CanvasComponent.type).toBe('Canvas');
        expect(CanvasComponent.props.shadows).toBe(false);
        expect(CanvasComponent.props.camera).toEqual({ fov: 60 });
      }
      configuredConverter.dispose();
    });

    it('should respect scene configuration', async () => {
      console.log('[DEBUG] Testing scene configuration');
      
      const configuredConverter = createR3FCSGConverter({
        sceneConfig: { enableGrid: false, enableStats: true },
      });
      const result = await configuredConverter.convertToR3F('sphere(1);');
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const CanvasComponent = result.data.CanvasComponent as unknown as MockComponent;
        const canvasChildren = (CanvasComponent.props.children as MockComponent[]).flat();
        expect(canvasChildren.some((c: MockComponent) => c.type === 'Grid')).toBe(false);
        expect(canvasChildren.some((c: MockComponent) => c.type === 'Stats')).toBe(true);
      }
      configuredConverter.dispose();
    });

    it('should respect controls configuration', async () => {
      console.log('[DEBUG] Testing controls configuration');
      const configuredConverter = createR3FCSGConverter({
        controlsConfig: { enableOrbitControls: false },
      });
      const result = await configuredConverter.convertToR3F('cylinder(h=3, r=1);');
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        const CanvasComponent = result.data.CanvasComponent as unknown as MockComponent;
        const canvasChildren = (CanvasComponent.props.children as MockComponent[]).flat();
        expect(canvasChildren.some((c: MockComponent) => c.type === 'OrbitControls')).toBe(false);
      }
      configuredConverter.dispose();
    });
  });

  describe('resource management', () => {
    it('should dispose resources properly', async () => {
      console.log('[DEBUG] Testing resource disposal');
      
      const result = await converter.convertToR3F('cube([1, 1, 1]);');
      expect(result.success).toBe(true);
      
      // Dispose should not throw
      expect(() => converter.dispose()).not.toThrow();
    });

    it('should handle disposal of empty converter', () => {
      console.log('[DEBUG] Testing disposal of empty converter');
      
      const emptyConverter = createR3FCSGConverter();
      
      // Dispose should not throw even if no conversions were done
      expect(() => emptyConverter.dispose()).not.toThrow();
    });

    it('should clean up processor resources on disposal', async () => {
      console.log('[DEBUG] Testing processor resource cleanup');
      const { createR3FPipelineProcessor } = await import('../pipeline/processor/r3f-pipeline-processor');
      const mockDispose = vi.fn();
      (createR3FPipelineProcessor as any).mockReturnValue({
        processOpenSCAD: vi.fn().mockResolvedValue({
          success: true,
          data: {
            scene: { type: 'Scene' },
            meshes: [],
            metrics: { totalNodes: 0, processedNodes: 0, failedNodes: 0, processingTime: 0, memoryUsage: 0, cacheHits: 0, cacheMisses: 0 },
          },
        }),
        dispose: mockDispose,
      });
      const testConverter = createR3FCSGConverter();
      // Perform a conversion to ensure the processor is created
      await testConverter.convertToR3F('cube(1);');
      // Dispose the converter and check if the processor's dispose method was called
      testConverter.dispose();
      expect(mockDispose).toHaveBeenCalledTimes(1);
    });
  });
});
