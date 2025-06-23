/**
 * @file useR3FCSGConverter Hook Tests
 * 
 * TDD tests for the useR3FCSGConverter hook following React 19 best practices
 * and functional programming principles. Tests React hook behavior and state management.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useR3FCSGConverter, useOpenSCADToR3F, useOpenSCADToJSX } from './use-r3f-csg-converter';
import type { UseR3FCSGConverterConfig } from './use-r3f-csg-converter';

// Mock the converter
vi.mock('../converter/r3f-csg-converter', () => ({
  createR3FCSGConverter: vi.fn(() => ({
    convertToR3F: vi.fn(async (code, onProgress, onError) => {
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
          CanvasComponent: () => 'MockCanvas',
          SceneComponent: () => 'MockScene',
          MeshComponents: [() => 'MockMesh'],
          scene: { type: 'Scene' },
          camera: { type: 'PerspectiveCamera' },
          meshes: [{ type: 'Mesh' }],
          metrics: {
            totalNodes: 1,
            processedNodes: 1,
            failedNodes: 0,
            processingTime: 400,
            memoryUsage: 1024,
            cacheHits: 0,
            cacheMisses: 1
          },
          jsx: '<Canvas>Mock JSX</Canvas>'
        }
      };
    }),
    convertToJSX: vi.fn(async (code, componentName) => ({
      success: true,
      data: `export const ${componentName || 'OpenSCADScene'} = () => <Canvas>Mock JSX</Canvas>;`
    })),
    getState: vi.fn(() => ({
      isProcessing: false,
      conversionCount: 1,
      cacheHits: 0,
      cacheMisses: 1
    })),
    getStatistics: vi.fn(() => ({
      conversionCount: 1,
      cacheHitRate: 0,
      cacheSize: 0
    })),
    clearCache: vi.fn(),
    dispose: vi.fn()
  }))
}));

describe('useR3FCSGConverter', () => {
  beforeEach(() => {
    console.log('[DEBUG] Setting up useR3FCSGConverter test');
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up useR3FCSGConverter test');
    vi.clearAllMocks();
  });

  describe('hook initialization', () => {
    it('should initialize with default state', () => {
      console.log('[DEBUG] Testing hook initialization');
      
      const { result } = renderHook(() => useR3FCSGConverter());
      
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
      expect(typeof result.current.convertToR3F).toBe('function');
      expect(typeof result.current.convertToJSX).toBe('function');
      expect(typeof result.current.clearCache).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should initialize with custom configuration', () => {
      console.log('[DEBUG] Testing hook initialization with custom config');
      
      const config: UseR3FCSGConverterConfig = {
        enableCaching: false,
        enableLogging: true,
        autoConvert: true,
        debounceMs: 1000
      };
      
      const { result } = renderHook(() => useR3FCSGConverter(config));
      
      expect(result.current).toBeDefined();
      expect(typeof result.current.convertToR3F).toBe('function');
    });

    it('should cleanup on unmount', () => {
      console.log('[DEBUG] Testing hook cleanup on unmount');
      
      const { unmount } = renderHook(() => useR3FCSGConverter());
      
      // Unmount should not throw
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('conversion functionality', () => {
    it('should convert OpenSCAD code to R3F components', async () => {
      console.log('[DEBUG] Testing OpenSCAD to R3F conversion');
      
      const { result } = renderHook(() => useR3FCSGConverter());
      
      await act(async () => {
        const conversionResult = await result.current.convertToR3F('cube([1, 2, 3]);');
        expect(conversionResult.success).toBe(true);
      });
      
      await waitFor(() => {
        expect(result.current.result).toBeDefined();
        expect(result.current.result!.success).toBe(true);
        expect(result.current.isProcessing).toBe(false);
      });
    });

    it('should track progress during conversion', async () => {
      console.log('[DEBUG] Testing progress tracking');
      
      const { result } = renderHook(() => useR3FCSGConverter());
      
      await act(async () => {
        await result.current.convertToR3F('sphere(5);');
      });
      
      await waitFor(() => {
        expect(result.current.progress).toBeDefined();
        expect(result.current.progress!.stage).toBe('complete');
        expect(result.current.progress!.progress).toBe(100);
      });
    });

    it('should convert OpenSCAD code to JSX', async () => {
      console.log('[DEBUG] Testing OpenSCAD to JSX conversion');
      
      const { result } = renderHook(() => useR3FCSGConverter());
      
      let jsxResult: any;
      await act(async () => {
        jsxResult = await result.current.convertToJSX('cylinder(h=10, r=3);', 'TestScene');
      });
      
      expect(jsxResult.success).toBe(true);
      expect(jsxResult.data).toContain('TestScene');
    });

    it('should update statistics after conversion', async () => {
      console.log('[DEBUG] Testing statistics updates');
      
      const { result } = renderHook(() => useR3FCSGConverter());
      
      const initialStats = result.current.statistics;
      expect(initialStats.conversionCount).toBe(0);
      
      await act(async () => {
        await result.current.convertToR3F('cube([1, 1, 1]);');
      });
      
      await waitFor(() => {
        expect(result.current.statistics.conversionCount).toBeGreaterThan(0);
      });
    });
  });

  describe('error handling', () => {
    it('should handle conversion errors', async () => {
      console.log('[DEBUG] Testing conversion error handling');
      
      // Mock converter to fail
      const { createR3FCSGConverter } = await import('../converter/r3f-csg-converter');
      const mockConverter = createR3FCSGConverter as any;
      
      mockConverter.mockImplementationOnce(() => ({
        convertToR3F: vi.fn(async () => ({
          success: false,
          error: 'Test conversion error'
        })),
        getState: vi.fn(() => ({ isProcessing: false, conversionCount: 0, cacheHits: 0, cacheMisses: 0 })),
        getStatistics: vi.fn(() => ({ conversionCount: 0, cacheHitRate: 0, cacheSize: 0 })),
        clearCache: vi.fn(),
        dispose: vi.fn()
      }));
      
      const { result } = renderHook(() => useR3FCSGConverter());
      
      await act(async () => {
        await result.current.convertToR3F('invalid code');
      });
      
      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error).toContain('Test conversion error');
        expect(result.current.isProcessing).toBe(false);
      });
    });

    it('should handle JSX conversion errors', async () => {
      console.log('[DEBUG] Testing JSX conversion error handling');
      
      // Mock converter to fail JSX conversion
      const { createR3FCSGConverter } = await import('../converter/r3f-csg-converter');
      const mockConverter = createR3FCSGConverter as any;
      
      mockConverter.mockImplementationOnce(() => ({
        convertToJSX: vi.fn(async () => ({
          success: false,
          error: 'JSX conversion failed'
        })),
        getState: vi.fn(() => ({ isProcessing: false, conversionCount: 0, cacheHits: 0, cacheMisses: 0 })),
        getStatistics: vi.fn(() => ({ conversionCount: 0, cacheHitRate: 0, cacheSize: 0 })),
        clearCache: vi.fn(),
        dispose: vi.fn()
      }));
      
      const { result } = renderHook(() => useR3FCSGConverter());
      
      let jsxResult: any;
      await act(async () => {
        jsxResult = await result.current.convertToJSX('invalid code');
      });
      
      expect(jsxResult.success).toBe(false);
      expect(jsxResult.error).toContain('JSX conversion failed');
    });

    it('should retry on error when enabled', async () => {
      console.log('[DEBUG] Testing retry on error');
      
      // Mock converter to fail first time, succeed second time
      const { createR3FCSGConverter } = await import('../converter/r3f-csg-converter');
      const mockConverter = createR3FCSGConverter as any;
      
      let callCount = 0;
      mockConverter.mockImplementationOnce(() => ({
        convertToR3F: vi.fn(async () => {
          callCount++;
          if (callCount === 1) {
            return { success: false, error: 'First attempt failed' };
          }
          return { success: true, data: { CanvasComponent: () => 'Mock' } };
        }),
        getState: vi.fn(() => ({ isProcessing: false, conversionCount: callCount, cacheHits: 0, cacheMisses: callCount })),
        getStatistics: vi.fn(() => ({ conversionCount: callCount, cacheHitRate: 0, cacheSize: 0 })),
        clearCache: vi.fn(),
        dispose: vi.fn()
      }));
      
      const { result } = renderHook(() => useR3FCSGConverter({
        retryOnError: true,
        maxRetries: 2
      }));
      
      await act(async () => {
        await result.current.convertToR3F('test code');
      });
      
      // Should have retried and succeeded
      expect(callCount).toBe(2);
    });
  });

  describe('control functions', () => {
    it('should clear cache when requested', async () => {
      console.log('[DEBUG] Testing cache clearing');
      
      const { result } = renderHook(() => useR3FCSGConverter());
      
      act(() => {
        result.current.clearCache();
      });
      
      // Should not throw
      expect(result.current.clearCache).toBeDefined();
    });

    it('should clear error when requested', async () => {
      console.log('[DEBUG] Testing error clearing');
      
      const { result } = renderHook(() => useR3FCSGConverter());
      
      // Set an error first
      await act(async () => {
        const { createR3FCSGConverter } = await import('../converter/r3f-csg-converter');
        const mockConverter = createR3FCSGConverter as any;
        
        mockConverter.mockImplementationOnce(() => ({
          convertToR3F: vi.fn(async () => ({ success: false, error: 'Test error' })),
          getState: vi.fn(() => ({ isProcessing: false, conversionCount: 0, cacheHits: 0, cacheMisses: 0 })),
          getStatistics: vi.fn(() => ({ conversionCount: 0, cacheHitRate: 0, cacheSize: 0 })),
          clearCache: vi.fn(),
          dispose: vi.fn()
        }));
        
        await result.current.convertToR3F('invalid');
      });
      
      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });

    it('should reset all state when requested', async () => {
      console.log('[DEBUG] Testing state reset');
      
      const { result } = renderHook(() => useR3FCSGConverter());
      
      // First convert something to set state
      await act(async () => {
        await result.current.convertToR3F('cube([1, 1, 1]);');
      });
      
      await waitFor(() => {
        expect(result.current.result).toBeDefined();
      });
      
      // Then reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
      expect(result.current.progress).toBeNull();
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('auto-convert mode', () => {
    it('should debounce conversions in auto-convert mode', async () => {
      console.log('[DEBUG] Testing auto-convert debouncing');
      
      const { result } = renderHook(() => useR3FCSGConverter({
        autoConvert: true,
        debounceMs: 100
      }));
      
      // Multiple rapid calls should be debounced
      act(() => {
        result.current.convertToR3F('cube([1, 1, 1]);');
        result.current.convertToR3F('cube([2, 2, 2]);');
        result.current.convertToR3F('cube([3, 3, 3]);');
      });
      
      // Should only process the last one after debounce
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      }, { timeout: 200 });
    });
  });
});

describe('useOpenSCADToR3F', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should auto-convert when code changes', async () => {
    console.log('[DEBUG] Testing useOpenSCADToR3F auto-conversion');
    
    const { result, rerender } = renderHook(
      ({ code }) => useOpenSCADToR3F(code),
      { initialProps: { code: 'cube([1, 1, 1]);' } }
    );
    
    await waitFor(() => {
      expect(result.current.CanvasComponent).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });
    
    // Change code
    rerender({ code: 'sphere(5);' });
    
    await waitFor(() => {
      expect(result.current.CanvasComponent).toBeDefined();
    });
  });

  it('should provide simplified interface', async () => {
    console.log('[DEBUG] Testing useOpenSCADToR3F simplified interface');
    
    const { result } = renderHook(() => useOpenSCADToR3F('cylinder(h=10, r=3);'));
    
    await waitFor(() => {
      expect(result.current.CanvasComponent).toBeDefined();
      expect(result.current.SceneComponent).toBeDefined();
      expect(result.current.scene).toBeDefined();
      expect(result.current.meshes).toBeDefined();
      expect(result.current.metrics).toBeDefined();
      expect(typeof result.current.retry).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });
});

describe('useOpenSCADToJSX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should auto-convert to JSX when code changes', async () => {
    console.log('[DEBUG] Testing useOpenSCADToJSX auto-conversion');
    
    const { result } = renderHook(() => useOpenSCADToJSX('cube([2, 2, 2]);', 'TestComponent'));
    
    await waitFor(() => {
      expect(result.current.jsx).toBeDefined();
      expect(result.current.jsx).toContain('TestComponent');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should provide JSX-specific interface', async () => {
    console.log('[DEBUG] Testing useOpenSCADToJSX interface');
    
    const { result } = renderHook(() => useOpenSCADToJSX('sphere(3);'));
    
    await waitFor(() => {
      expect(result.current.jsx).toBeDefined();
      expect(typeof result.current.retry).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  it('should handle component name changes', async () => {
    console.log('[DEBUG] Testing component name changes');
    
    const { result, rerender } = renderHook(
      ({ name }) => useOpenSCADToJSX('cube([1, 1, 1]);', name),
      { initialProps: { name: 'Component1' } }
    );
    
    await waitFor(() => {
      expect(result.current.jsx).toContain('Component1');
    });
    
    // Change component name
    rerender({ name: 'Component2' });
    
    await waitFor(() => {
      expect(result.current.jsx).toContain('Component2');
    });
  });
});
