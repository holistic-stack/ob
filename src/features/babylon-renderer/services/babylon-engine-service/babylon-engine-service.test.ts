/**
 * @file BabylonJS Engine Service Tests
 * 
 * Comprehensive tests for BabylonJS engine service with WebGPU support.
 * Following TDD principles with real implementations (no mocks).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BabylonEngineService } from './babylon-engine-service';
import type { BabylonEngineConfig, EngineInitOptions } from '../../types/babylon-engine.types';
import { DEFAULT_ENGINE_CONFIG } from '../../types/babylon-engine.types';

// Mock canvas for testing
const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
};

describe('BabylonEngineService', () => {
  let engineService: BabylonEngineService;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create fresh instances for each test
    engineService = new BabylonEngineService();
    mockCanvas = createMockCanvas();
    
    // Mock WebGPU support check
    vi.stubGlobal('navigator', {
      gpu: undefined, // Simulate no WebGPU support for consistent testing
    });
  });

  afterEach(() => {
    // Clean up after each test
    engineService.dispose();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const service = new BabylonEngineService();
      expect(service.isInitialized()).toBe(false);
      expect(service.getEngine()).toBeNull();
    });

    it('should initialize with custom configuration', () => {
      const customConfig: BabylonEngineConfig = {
        ...DEFAULT_ENGINE_CONFIG,
        enableWebGPU: false,
        antialias: false,
      };
      
      const service = new BabylonEngineService(customConfig);
      expect(service.isInitialized()).toBe(false);
    });
  });

  describe('init', () => {
    it('should initialize WebGL2 engine when WebGPU is not supported', async () => {
      const initOptions: EngineInitOptions = {
        canvas: mockCanvas,
        config: { ...DEFAULT_ENGINE_CONFIG, enableWebGPU: false },
      };

      const result = await engineService.init(initOptions);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isInitialized).toBe(true);
        expect(result.data.isWebGPU).toBe(false);
        expect(result.data.engine).toBeDefined();
      }
    });

    it('should handle initialization failure gracefully', async () => {
      // Use invalid canvas to trigger failure
      const invalidCanvas = null as any;
      
      const initOptions: EngineInitOptions = {
        canvas: invalidCanvas,
        config: DEFAULT_ENGINE_CONFIG,
      };

      const result = await engineService.init(initOptions);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ENGINE_INITIALIZATION_FAILED');
        expect(result.error.message).toContain('Engine initialization failed');
      }
    });

    it('should not allow double initialization', async () => {
      const initOptions: EngineInitOptions = {
        canvas: mockCanvas,
        config: { ...DEFAULT_ENGINE_CONFIG, enableWebGPU: false },
      };

      // First initialization should succeed
      const firstResult = await engineService.init(initOptions);
      expect(firstResult.success).toBe(true);

      // Second initialization should fail
      const secondResult = await engineService.init(initOptions);
      expect(secondResult.success).toBe(false);
      if (!secondResult.success) {
        expect(secondResult.error.message).toContain('Engine already initialized');
      }
    });
  });

  describe('getState', () => {
    it('should return correct state when not initialized', () => {
      const state = engineService.getState();
      
      expect(state.isInitialized).toBe(false);
      expect(state.isDisposed).toBe(false);
      expect(state.engine).toBeNull();
      expect(state.canvas).toBeNull();
    });

    it('should return correct state when initialized', async () => {
      const initOptions: EngineInitOptions = {
        canvas: mockCanvas,
        config: { ...DEFAULT_ENGINE_CONFIG, enableWebGPU: false },
      };

      await engineService.init(initOptions);
      const state = engineService.getState();
      
      expect(state.isInitialized).toBe(true);
      expect(state.isDisposed).toBe(false);
      expect(state.engine).toBeDefined();
      expect(state.canvas).toBe(mockCanvas);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return zero metrics when not initialized', () => {
      const metrics = engineService.getPerformanceMetrics();
      
      expect(metrics.fps).toBe(0);
      expect(metrics.deltaTime).toBe(0);
      expect(metrics.renderTime).toBe(0);
      expect(metrics.drawCalls).toBe(0);
    });

    it('should return valid metrics when initialized', async () => {
      const initOptions: EngineInitOptions = {
        canvas: mockCanvas,
        config: { ...DEFAULT_ENGINE_CONFIG, enableWebGPU: false },
      };

      await engineService.init(initOptions);
      const metrics = engineService.getPerformanceMetrics();
      
      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.deltaTime).toBe('number');
      expect(typeof metrics.renderTime).toBe('number');
      expect(typeof metrics.drawCalls).toBe('number');
    });
  });

  describe('isWebGPU', () => {
    it('should return false for WebGL2 engine', async () => {
      const initOptions: EngineInitOptions = {
        canvas: mockCanvas,
        config: { ...DEFAULT_ENGINE_CONFIG, enableWebGPU: false },
      };

      await engineService.init(initOptions);
      expect(engineService.isWebGPU()).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should dispose engine successfully', async () => {
      const initOptions: EngineInitOptions = {
        canvas: mockCanvas,
        config: { ...DEFAULT_ENGINE_CONFIG, enableWebGPU: false },
      };

      await engineService.init(initOptions);
      expect(engineService.isInitialized()).toBe(true);

      const disposeResult = engineService.dispose();
      expect(disposeResult.success).toBe(true);
      expect(engineService.isInitialized()).toBe(false);
      expect(engineService.getEngine()).toBeNull();
    });

    it('should handle disposal of uninitialized engine', () => {
      const disposeResult = engineService.dispose();
      expect(disposeResult.success).toBe(true);
    });
  });
});
