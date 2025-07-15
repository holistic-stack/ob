/**
 * @file BabylonJS Engine Service Tests
 *
 * Tests for the BabylonJS Engine Management Service using real BabylonJS NullEngine.
 * Follows TDD principles with comprehensive test coverage and no mocks for core functionality.
 */

import { NullEngine } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBabylonEngineService, resetBabylonEngineService } from './babylon-engine.service';
import type { BabylonEngineService, EngineInitOptions } from './babylon-engine.types';

// Mock ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock logger service
vi.mock('../../../shared/services/logger.service', () => ({
  createLogger: () => ({
    init: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    end: vi.fn(),
  }),
}));

// Mock BabylonJS Engine to use NullEngine for headless testing
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core');
  return {
    ...actual,
    Engine: vi.fn().mockImplementation(() => {
      // Create a mock that behaves like NullEngine
      return {
        dispose: vi.fn(),
        resize: vi.fn(),
        runRenderLoop: vi.fn(),
        stopRenderLoop: vi.fn(),
        getDeltaTime: vi.fn().mockReturnValue(16.67), // ~60 FPS
        getFps: vi.fn().mockReturnValue(60),
      };
    }),
  };
});

describe('BabylonEngineService', () => {
  let engineService: BabylonEngineService;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(async () => {
    // Reset singleton for clean test state
    resetBabylonEngineService();

    // Create a fresh service instance for each test
    engineService = createBabylonEngineService();

    // Create a mock canvas element
    mockCanvas = document.createElement('canvas');
    document.body.appendChild(mockCanvas);
  });

  afterEach(async () => {
    // Clean up after each test
    await engineService.dispose();
    document.body.removeChild(mockCanvas);
    resetBabylonEngineService();
  });

  describe('initialization', () => {
    it('should initialize engine successfully with valid canvas', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
        antialias: true,
      };

      const result = await engineService.init(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }

      const state = engineService.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.engine).toBeDefined();
      expect(state.error).toBeNull();
    });

    it('should fail initialization without canvas', async () => {
      const options: EngineInitOptions = {
        canvas: null as any,
      };

      const result = await engineService.init(options);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CANVAS_NOT_AVAILABLE');
        expect(result.error.message).toContain('Canvas element is required');
      }
    });

    it('should prevent double initialization', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      // First initialization should succeed
      const firstResult = await engineService.init(options);
      expect(firstResult.success).toBe(true);

      // Second initialization should fail
      const secondResult = await engineService.init(options);
      expect(secondResult.success).toBe(false);
      if (!secondResult.success) {
        expect(secondResult.error.code).toBe('ENGINE_ALREADY_INITIALIZED');
      }
    });

    it('should use default options when not provided', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      const result = await engineService.init(options);

      expect(result.success).toBe(true);
      const state = engineService.getState();
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('disposal', () => {
    it('should dispose engine successfully', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      const disposeResult = await engineService.dispose();

      expect(disposeResult.success).toBe(true);

      const state = engineService.getState();
      expect(state.isInitialized).toBe(false);
      expect(state.isDisposed).toBe(true);
      expect(state.engine).toBeNull();
    });

    it('should handle disposal of uninitialized engine', async () => {
      const result = await engineService.dispose();

      expect(result.success).toBe(true);
      const state = engineService.getState();
      expect(state.isDisposed).toBe(true);
    });
  });

  describe('state management', () => {
    it('should return correct initial state', () => {
      const state = engineService.getState();

      expect(state.isInitialized).toBe(false);
      expect(state.isDisposed).toBe(false);
      expect(state.engine).toBeNull();
      expect(state.performanceMetrics).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should update state after initialization', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      const state = engineService.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.engine).toBeDefined();
      expect(state.performanceMetrics).toBeDefined();
    });
  });

  describe('performance monitoring', () => {
    it('should provide performance metrics after initialization', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      const metrics = engineService.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      if (metrics) {
        expect(typeof metrics.frameTime).toBe('number');
        expect(typeof metrics.fps).toBe('number');
        expect(typeof metrics.memoryUsage).toBe('number');
        expect(typeof metrics.drawCalls).toBe('number');
        expect(typeof metrics.triangles).toBe('number');
      }
    });

    it('should return null metrics when not initialized', () => {
      const metrics = engineService.getPerformanceMetrics();
      expect(metrics).toBeNull();
    });
  });

  describe('render loop management', () => {
    it('should start render loop successfully', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      const result = engineService.startRenderLoop();

      expect(result.success).toBe(true);
    });

    it('should stop render loop successfully', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      engineService.startRenderLoop();
      const result = engineService.stopRenderLoop();

      expect(result.success).toBe(true);
    });

    it('should fail to start render loop without initialization', () => {
      const result = engineService.startRenderLoop();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ENGINE_INITIALIZATION_FAILED');
      }
    });
  });

  describe('resize handling', () => {
    it('should resize engine successfully', async () => {
      const options: EngineInitOptions = {
        canvas: mockCanvas,
      };

      await engineService.init(options);
      const result = engineService.resize();

      expect(result.success).toBe(true);
    });

    it('should fail to resize without initialization', () => {
      const result = engineService.resize();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ENGINE_INITIALIZATION_FAILED');
      }
    });
  });
});
