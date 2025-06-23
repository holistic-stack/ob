/**
 * @file R3F Engine Service Tests
 * 
 * TDD tests for the R3F engine service following React 19 best practices
 * and functional programming principles. Tests equivalent to Babylon engine service tests.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { createR3FEngineService } from './r3f-engine-service';
import type { R3FEngineConfig } from '../../types/r3f-types';

// Mock Three.js WebGLRenderer for testing
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      getContext: vi.fn(() => ({
        getExtension: vi.fn(),
        getParameter: vi.fn(),
        getSupportedExtensions: vi.fn(() => [])
      })),
      shadowMap: { enabled: false, type: THREE.PCFSoftShadowMap },
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1,
      outputColorSpace: THREE.SRGBColorSpace,
      setClearColor: vi.fn(),
      setPixelRatio: vi.fn(),
      capabilities: {
        maxTextureSize: 1024,
        maxCubeTextureSize: 1024,
        maxVertexTextures: 16,
        maxFragmentTextures: 16,
        maxVaryingVectors: 16,
        maxVertexAttribs: 16
      }
    }))
  };
});

describe('R3FEngineService', () => {
  let engineService: ReturnType<typeof createR3FEngineService>;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    console.log('[DEBUG] Setting up R3F engine service test');
    
    // Create engine service
    engineService = createR3FEngineService();
    
    // Create mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    // Mock getContext to return a mock WebGL context
    canvas.getContext = vi.fn(() => ({
      getExtension: vi.fn(),
      getParameter: vi.fn(),
      getSupportedExtensions: vi.fn(() => [])
    }));
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3F engine service test');
    vi.clearAllMocks();
  });

  describe('createRenderer', () => {
    it('should create renderer with default configuration', () => {
      console.log('[DEBUG] Testing renderer creation with defaults');
      
      const result = engineService.createRenderer(canvas);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.domElement).toBe(canvas);
      }
    });

    it('should create renderer with custom configuration', () => {
      console.log('[DEBUG] Testing renderer creation with custom config');

      const config: R3FEngineConfig = {
        antialias: false,
        alpha: true,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power',
        shadowMapEnabled: false
      };

      const result = engineService.createRenderer(canvas, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.domElement).toBe(canvas);
      }
    });

    it('should handle renderer creation with null canvas', () => {
      console.log('[DEBUG] Testing renderer creation with null canvas');
      
      const result = engineService.createRenderer(null);
      
      // Should create mock renderer for test environment
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }
    });

    it('should handle renderer creation with invalid canvas', () => {
      console.log('[DEBUG] Testing renderer creation with invalid canvas');
      
      const invalidCanvas = {} as HTMLCanvasElement;
      const result = engineService.createRenderer(invalidCanvas);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid canvas element');
      }
    });

    it('should force real renderer creation when configured', () => {
      console.log('[DEBUG] Testing forced real renderer creation');
      
      const config: R3FEngineConfig = {
        forceRealRenderer: true
      };
      
      const result = engineService.createRenderer(canvas, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }
    });
  });

  describe('disposeRenderer', () => {
    it('should dispose renderer safely', () => {
      console.log('[DEBUG] Testing renderer disposal');
      
      const result = engineService.createRenderer(canvas);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const renderer = result.data;
        expect(() => engineService.disposeRenderer(renderer)).not.toThrow();
        expect(renderer.dispose).toHaveBeenCalled();
      }
    });

    it('should handle disposal of null renderer', () => {
      console.log('[DEBUG] Testing disposal of null renderer');
      
      expect(() => engineService.disposeRenderer(null)).not.toThrow();
    });
  });

  describe('handleResize', () => {
    it('should handle renderer resize', () => {
      console.log('[DEBUG] Testing renderer resize');
      
      const result = engineService.createRenderer(canvas);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const renderer = result.data;
        
        // Set canvas size
        canvas.clientWidth = 1024;
        canvas.clientHeight = 768;
        
        expect(() => engineService.handleResize(renderer)).not.toThrow();
        expect(renderer.setSize).toHaveBeenCalledWith(1024, 768, false);
      }
    });

    it('should handle resize with null renderer', () => {
      console.log('[DEBUG] Testing resize with null renderer');
      
      expect(() => engineService.handleResize(null)).not.toThrow();
    });
  });

  describe('setupErrorHandlers', () => {
    it('should setup error handlers', () => {
      console.log('[DEBUG] Testing error handlers setup');
      
      const result = engineService.createRenderer(canvas);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const renderer = result.data;
        const onContextLost = vi.fn();
        const onContextRestored = vi.fn();
        
        expect(() => {
          engineService.setupErrorHandlers(renderer, onContextLost, onContextRestored);
        }).not.toThrow();
        
        // Verify event listeners were added
        expect(canvas.addEventListener).toHaveBeenCalledWith('webglcontextlost', expect.any(Function));
        expect(canvas.addEventListener).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function));
      }
    });
  });

  describe('getRendererInfo', () => {
    it('should get renderer information', () => {
      console.log('[DEBUG] Testing renderer info retrieval');
      
      const result = engineService.createRenderer(canvas);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const renderer = result.data;
        const info = engineService.getRendererInfo(renderer);
        
        expect(info).toBeDefined();
        expect(info.vendor).toBeDefined();
        expect(info.renderer).toBeDefined();
        expect(info.version).toBeDefined();
        expect(info.extensions).toBeInstanceOf(Array);
      }
    });

    it('should handle error when getting renderer info', () => {
      console.log('[DEBUG] Testing renderer info error handling');
      
      const result = engineService.createRenderer(canvas);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const renderer = result.data;
        
        // Mock getContext to throw error
        renderer.getContext = vi.fn(() => {
          throw new Error('Context error');
        });
        
        const info = engineService.getRendererInfo(renderer);
        
        expect(info.vendor).toBe('Unknown');
        expect(info.renderer).toBe('Unknown');
        expect(info.version).toBe('Unknown');
      }
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle renderer creation errors gracefully', () => {
      console.log('[DEBUG] Testing renderer creation error handling');
      
      // Mock WebGLRenderer constructor to throw
      const originalWebGLRenderer = THREE.WebGLRenderer;
      (THREE as any).WebGLRenderer = vi.fn(() => {
        throw new Error('WebGL not supported');
      });
      
      const result = engineService.createRenderer(canvas);
      
      // Should fall back to mock renderer
      expect(result.success).toBe(true);
      
      // Restore original constructor
      (THREE as any).WebGLRenderer = originalWebGLRenderer;
    });

    it('should handle disposal errors gracefully', () => {
      console.log('[DEBUG] Testing disposal error handling');
      
      const result = engineService.createRenderer(canvas);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const renderer = result.data;
        
        // Mock dispose to throw error
        renderer.dispose = vi.fn(() => {
          throw new Error('Disposal error');
        });
        
        expect(() => engineService.disposeRenderer(renderer)).not.toThrow();
      }
    });

    it('should handle resize errors gracefully', () => {
      console.log('[DEBUG] Testing resize error handling');
      
      const result = engineService.createRenderer(canvas);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const renderer = result.data;
        
        // Mock setSize to throw error
        renderer.setSize = vi.fn(() => {
          throw new Error('Resize error');
        });
        
        expect(() => engineService.handleResize(renderer)).not.toThrow();
      }
    });
  });
});
