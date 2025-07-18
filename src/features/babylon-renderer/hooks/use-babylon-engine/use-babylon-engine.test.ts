/**
 * @file Use BabylonJS Engine Hook Tests
 *
 * Tests for BabylonJS engine management hook.
 * Following TDD principles with React Testing Library.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HookEngineInitOptions as EngineInitOptions } from './use-babylon-engine';
import { useBabylonEngine } from './use-babylon-engine';

// Mock BabylonJS Engine Service
const mockEngineService = {
  init: vi.fn(),
  dispose: vi.fn(),
  getState: vi.fn(),
};

vi.mock('../../services/babylon-engine-service', () => ({
  BabylonEngineService: vi.fn().mockImplementation(() => mockEngineService),
}));

// Mock canvas
const createMockCanvas = () =>
  ({
    getContext: vi.fn(() => ({})),
    width: 800,
    height: 600,
  }) as unknown as HTMLCanvasElement;

describe('useBabylonEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    mockEngineService.init.mockResolvedValue({ success: true });
    mockEngineService.dispose.mockResolvedValue({ success: true });
    mockEngineService.getState.mockReturnValue({
      isInitialized: true,
      isWebGPU: false,
      engine: { dispose: vi.fn() },
      canvas: null,
      performanceMetrics: {
        fps: 60,
        frameTime: 16.67,
        drawCalls: 0,
        triangleCount: 0,
        textureCount: 0,
        memoryUsage: 0,
      },
      capabilities: {
        webGPUSupported: false,
        webGL2Supported: true,
        maxTextureSize: 4096,
        maxCubeTextureSize: 4096,
        maxRenderTargetSize: 4096,
        maxVertexTextureImageUnits: 16,
        maxFragmentTextureImageUnits: 16,
        maxAnisotropy: 16,
      },
      error: null,
      lastUpdated: new Date(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useBabylonEngine());

      expect(result.current.engineService).toBeNull();
      expect(result.current.engineState.isInitialized).toBe(false);
      expect(result.current.engineState.engine).toBeNull();
      expect(result.current.engineState.error).toBeNull();
    });

    it('should provide WebGPU and WebGL support detection', () => {
      // Mock navigator.gpu for WebGPU support
      Object.defineProperty(navigator, 'gpu', {
        value: {},
        configurable: true,
      });

      const { result } = renderHook(() => useBabylonEngine());

      expect(result.current.isWebGPUSupported).toBe(true);
      expect(result.current.isWebGLSupported).toBe(true);
    });
  });

  describe('engine initialization', () => {
    it('should initialize engine successfully', async () => {
      const { result } = renderHook(() => useBabylonEngine());
      const canvas = createMockCanvas();

      await act(async () => {
        const initResult = await result.current.initializeEngine(canvas);
        expect(initResult.success).toBe(true);
      });

      expect(mockEngineService.init).toHaveBeenCalledWith(
        canvas,
        expect.objectContaining({
          enableWebGPU: true,
          antialias: true,
          adaptToDeviceRatio: true,
        })
      );
    });

    it('should initialize engine with custom options', async () => {
      const { result } = renderHook(() => useBabylonEngine());
      const canvas = createMockCanvas();
      const options: EngineInitOptions = {
        enableWebGPU: false,
        antialias: false,
        powerPreference: 'low-power',
      };

      await act(async () => {
        await result.current.initializeEngine(canvas, options);
      });

      expect(mockEngineService.init).toHaveBeenCalledWith(
        canvas,
        expect.objectContaining({
          enableWebGPU: false,
          antialias: false,
          powerPreference: 'low-power',
        })
      );
    });

    it('should handle initialization failure', async () => {
      const { result } = renderHook(() => useBabylonEngine());
      const canvas = createMockCanvas();
      const error = {
        code: 'ENGINE_INITIALIZATION_FAILED',
        message: 'WebGPU not supported',
        timestamp: new Date(),
      };

      mockEngineService.init.mockResolvedValue({ success: false, error });

      await act(async () => {
        const initResult = await result.current.initializeEngine(canvas);
        expect(initResult.success).toBe(false);
        if (!initResult.success) {
          expect(initResult.error).toEqual(error);
        }
      });
    });

    it('should prevent multiple simultaneous initializations', async () => {
      const { result } = renderHook(() => useBabylonEngine());
      const canvas = createMockCanvas();

      // Start first initialization
      const promise1 = act(async () => {
        return result.current.initializeEngine(canvas);
      });

      // Start second initialization immediately
      const promise2 = act(async () => {
        return result.current.initializeEngine(canvas);
      });

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.error?.message).toContain('already in progress');
      }
    });

    it('should call onEngineReady callback', async () => {
      const { result } = renderHook(() => useBabylonEngine());
      const canvas = createMockCanvas();
      const onEngineReady = vi.fn();

      await act(async () => {
        await result.current.initializeEngine(canvas, { onEngineReady });
      });

      expect(onEngineReady).toHaveBeenCalledWith(
        expect.objectContaining({
          dispose: expect.any(Function),
        })
      );
    });

    it('should call onEngineError callback on failure', async () => {
      const { result } = renderHook(() => useBabylonEngine());
      const canvas = createMockCanvas();
      const onEngineError = vi.fn();
      const error = {
        code: 'ENGINE_INITIALIZATION_FAILED',
        message: 'Initialization failed',
        timestamp: new Date(),
      };

      mockEngineService.init.mockResolvedValue({ success: false, error });

      await act(async () => {
        await result.current.initializeEngine(canvas, { onEngineError });
      });

      expect(onEngineError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Initialization failed',
        })
      );
    });
  });

  describe('engine disposal', () => {
    it('should dispose engine successfully', async () => {
      const { result } = renderHook(() => useBabylonEngine());
      const canvas = createMockCanvas();

      // Initialize first
      await act(async () => {
        await result.current.initializeEngine(canvas);
      });

      // Then dispose
      await act(async () => {
        const disposeResult = await result.current.disposeEngine();
        expect(disposeResult.success).toBe(true);
      });

      expect(mockEngineService.dispose).toHaveBeenCalled();
    });

    it('should handle disposal when engine not initialized', async () => {
      const { result } = renderHook(() => useBabylonEngine());

      await act(async () => {
        const disposeResult = await result.current.disposeEngine();
        expect(disposeResult.success).toBe(true);
      });

      expect(mockEngineService.dispose).not.toHaveBeenCalled();
    });

    it('should handle disposal failure', async () => {
      const { result } = renderHook(() => useBabylonEngine());
      const canvas = createMockCanvas();
      const error = {
        code: 'DISPOSAL_FAILED',
        message: 'Failed to dispose engine',
        timestamp: new Date(),
      };

      mockEngineService.dispose.mockResolvedValue({ success: false, error });

      // Initialize first
      await act(async () => {
        await result.current.initializeEngine(canvas);
      });

      // Then dispose
      await act(async () => {
        const disposeResult = await result.current.disposeEngine();
        expect(disposeResult.success).toBe(false);
        if (!disposeResult.success) {
          expect(disposeResult.error).toEqual(error);
        }
      });
    });
  });

  describe('performance metrics', () => {
    it('should return performance metrics', async () => {
      const { result } = renderHook(() => useBabylonEngine());
      const canvas = createMockCanvas();

      await act(async () => {
        await result.current.initializeEngine(canvas);
      });

      const metrics = result.current.getPerformanceMetrics();

      expect(metrics).toEqual(
        expect.objectContaining({
          fps: expect.any(Number),
          frameTime: expect.any(Number),
          drawCalls: expect.any(Number),
        })
      );
    });

    it('should return default metrics when engine not initialized', () => {
      const { result } = renderHook(() => useBabylonEngine());

      const metrics = result.current.getPerformanceMetrics();

      expect(metrics.fps).toBe(0);
      expect(metrics.renderTime).toBe(0);
      expect(metrics.drawCalls).toBe(0);
    });
  });

  describe('state updates', () => {
    it('should update engine state after initialization', async () => {
      const { result } = renderHook(() => useBabylonEngine());
      const canvas = createMockCanvas();

      await act(async () => {
        await result.current.initializeEngine(canvas);
      });

      await waitFor(() => {
        expect(result.current.engineState.isInitialized).toBe(true);
        expect(result.current.engineState.engine).toBeDefined();
      });
    });

    it('should reset state after disposal', async () => {
      const { result } = renderHook(() => useBabylonEngine());
      const canvas = createMockCanvas();

      // Initialize
      await act(async () => {
        await result.current.initializeEngine(canvas);
      });

      // Dispose
      await act(async () => {
        await result.current.disposeEngine();
      });

      expect(result.current.engineState.isInitialized).toBe(false);
      expect(result.current.engineState.engine).toBeNull();
      expect(result.current.engineService).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useBabylonEngine());

      unmount();

      // Cleanup is handled internally, no direct assertions possible
      // but the hook should not throw errors
    });
  });
});
