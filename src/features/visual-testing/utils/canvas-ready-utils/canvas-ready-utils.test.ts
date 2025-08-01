/**
 * @file Canvas Ready Utils Tests
 *
 * Unit tests for canvas readiness utilities used in visual regression testing.
 * Tests the various waiting strategies and configuration options.
 */

import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import {
  type CanvasReadyOptions,
  DEFAULT_CANVAS_READY_OPTIONS,
  waitForCanvasReady,
  waitForCanvasReadyQuick,
} from './canvas-ready-utils';

// Mock the logger service
vi.mock('@/shared/services/logger.service', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock Playwright page
const createMockPage = () => {
  const mockPage = {
    waitForSelector: vi.fn(),
    waitForTimeout: vi.fn(),
    evaluate: vi.fn(),
  } as unknown as Page;

  return mockPage;
};

describe('Canvas Ready Utils', () => {
  describe('DEFAULT_CANVAS_READY_OPTIONS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CANVAS_READY_OPTIONS).toEqual({
        testName: 'canvas-ready',
        timeout: 15000,
        stabilizationTime: 2000,
        canvasSelector: 'canvas',
        readyAttribute: 'data-ready',
        readyValue: 'true',
        waitForWebGL: true,
        waitForStableFrames: true,
        stableFrameCount: 3,
      });
    });
  });

  describe('waitForCanvasReady', () => {
    it('should wait for canvas element with default options', async () => {
      const mockPage = createMockPage();

      // Mock successful waits
      vi.mocked(mockPage.waitForSelector).mockResolvedValue(null as any);
      vi.mocked(mockPage.waitForTimeout).mockResolvedValue();
      vi.mocked(mockPage.evaluate).mockResolvedValue(true);

      await waitForCanvasReady(mockPage);

      // Should wait for canvas element
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('canvas', {
        timeout: 15000,
        state: 'visible',
      });

      // Should wait for ready attribute
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('canvas[data-ready="true"]', {
        timeout: 15000,
      });

      // Should check WebGL context
      expect(mockPage.evaluate).toHaveBeenCalled();

      // Should wait for stabilization
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(2000);
    });

    it('should use custom options when provided', async () => {
      const mockPage = createMockPage();
      const customOptions: CanvasReadyOptions = {
        testName: 'custom-test',
        timeout: 20000,
        stabilizationTime: 3000,
        canvasSelector: '.custom-canvas',
        readyAttribute: 'data-custom-ready',
        readyValue: 'yes',
      };

      vi.mocked(mockPage.waitForSelector).mockResolvedValue(null as any);
      vi.mocked(mockPage.waitForTimeout).mockResolvedValue();
      vi.mocked(mockPage.evaluate).mockResolvedValue(true);

      await waitForCanvasReady(mockPage, customOptions);

      // Should use custom selector and timeout
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('.custom-canvas', {
        timeout: 20000,
        state: 'visible',
      });

      // Should use custom ready attribute
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        '.custom-canvas[data-custom-ready="yes"]',
        {
          timeout: 20000,
        }
      );

      // Should use custom stabilization time
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(3000);
    });

    it('should skip WebGL check when waitForWebGL is false', async () => {
      const mockPage = createMockPage();
      const options: CanvasReadyOptions = {
        waitForWebGL: false,
        waitForStableFrames: false, // Also disable stable frames to avoid evaluate calls
      };

      vi.mocked(mockPage.waitForSelector).mockResolvedValue(null as any);
      vi.mocked(mockPage.waitForTimeout).mockResolvedValue();

      await waitForCanvasReady(mockPage, options);

      // Should not check WebGL context or stable frames
      expect(mockPage.evaluate).not.toHaveBeenCalled();
    });

    it('should skip stable frames check when waitForStableFrames is false', async () => {
      const mockPage = createMockPage();
      const options: CanvasReadyOptions = {
        waitForStableFrames: false,
      };

      vi.mocked(mockPage.waitForSelector).mockResolvedValue(null as any);
      vi.mocked(mockPage.waitForTimeout).mockResolvedValue();
      vi.mocked(mockPage.evaluate).mockResolvedValue(true);

      await waitForCanvasReady(mockPage, options);

      // Should only call waitForTimeout once (for stabilization, not for frame checks)
      expect(mockPage.waitForTimeout).toHaveBeenCalledTimes(1);
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(2000);
    });

    it('should throw error when canvas element is not found', async () => {
      const mockPage = createMockPage();

      vi.mocked(mockPage.waitForSelector).mockRejectedValue(new Error('Selector timeout'));

      await expect(waitForCanvasReady(mockPage)).rejects.toThrow('Selector timeout');
    });

    it('should throw error when WebGL context is not available', async () => {
      const mockPage = createMockPage();

      vi.mocked(mockPage.waitForSelector).mockResolvedValue(null as any);
      vi.mocked(mockPage.waitForTimeout).mockResolvedValue();
      vi.mocked(mockPage.evaluate).mockResolvedValue(false); // No WebGL

      await expect(waitForCanvasReady(mockPage)).rejects.toThrow('WebGL context not available');
    });
  });

  describe('waitForCanvasReadyQuick', () => {
    it('should use quick configuration', async () => {
      const mockPage = createMockPage();

      vi.mocked(mockPage.waitForSelector).mockResolvedValue(null as any);
      vi.mocked(mockPage.waitForTimeout).mockResolvedValue();
      vi.mocked(mockPage.evaluate).mockResolvedValue(true);

      await waitForCanvasReadyQuick(mockPage, { testName: 'quick-test' });

      // Should use shorter stabilization time
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(1000);
    });

    it('should skip stable frames check by default', async () => {
      const mockPage = createMockPage();

      vi.mocked(mockPage.waitForSelector).mockResolvedValue(null as any);
      vi.mocked(mockPage.waitForTimeout).mockResolvedValue();
      vi.mocked(mockPage.evaluate).mockResolvedValue(true);

      await waitForCanvasReadyQuick(mockPage);

      // Should only call waitForTimeout once (no frame stability checks)
      expect(mockPage.waitForTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe('WebGL context evaluation', () => {
    it('should correctly evaluate WebGL context availability', () => {
      // This test verifies the logic that runs in the browser context
      const mockCanvas = {
        getContext: vi.fn(),
      } as unknown as HTMLCanvasElement;

      // Mock successful WebGL context
      vi.mocked(mockCanvas.getContext).mockReturnValue({} as WebGLRenderingContext);

      // Simulate the evaluation function
      const evaluationFunction = (_selector: string) => {
        const canvas = mockCanvas; // In real scenario, this would be document.querySelector(selector)
        if (!canvas) return false;

        try {
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          return gl !== null;
        } catch {
          return false;
        }
      };

      const result = evaluationFunction('canvas');
      expect(result).toBe(true);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl');
    });

    it('should handle WebGL context creation failure', () => {
      const mockCanvas = {
        getContext: vi.fn(),
      } as unknown as HTMLCanvasElement;

      // Mock failed WebGL context
      vi.mocked(mockCanvas.getContext).mockReturnValue(null);

      const evaluationFunction = (_selector: string) => {
        const canvas = mockCanvas;
        if (!canvas) return false;

        try {
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          return gl !== null;
        } catch {
          return false;
        }
      };

      const result = evaluationFunction('canvas');
      expect(result).toBe(false);
    });
  });
});
