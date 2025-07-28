/**
 * @file Shared Test Setup Tests
 *
 * Unit tests for shared visual test setup utilities. Tests configuration handling,
 * test execution helpers, and utility functions for consistent visual regression testing.
 *
 * @example
 * Tests validate:
 * - Setup function configuration
 * - Test execution wrappers
 * - Naming utility functions
 * - Error handling scenarios
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBeforeEach,
  createScreenshotName,
  createTestName,
  DEFAULT_VISUAL_TEST_DEBUG_CONFIG,
  runBabylonVisualTest,
  runVisualTest,
  STANDARD_SCREENSHOT_OPTIONS,
  STRICT_SCREENSHOT_OPTIONS,
  setupVisualTest,
} from './shared-test-setup';

// Mock the debug utils
vi.mock('../playwright-debug-utils/playwright-debug-utils', () => ({
  setupDebugListeners: vi.fn().mockResolvedValue(undefined),
  waitForBabylonScene: vi.fn().mockResolvedValue(undefined),
  logTestInfo: vi.fn().mockResolvedValue(undefined),
  capturePerformanceMetrics: vi.fn().mockResolvedValue({
    renderTime: 100,
    domContentLoaded: 80,
    loadComplete: 120,
  }),
}));

// Mock Playwright page object
const createMockPage = () => ({
  setViewportSize: vi.fn().mockResolvedValue(undefined),
  waitForSelector: vi.fn().mockResolvedValue(true),
  waitForTimeout: vi.fn().mockResolvedValue(undefined),
});

describe('Shared Test Setup', () => {
  let mockPage: ReturnType<typeof createMockPage>;

  beforeEach(() => {
    mockPage = createMockPage();
    vi.clearAllMocks();
  });

  describe('setupVisualTest', () => {
    it('should setup visual test with default configuration', async () => {
      await setupVisualTest(mockPage as any, 'test-case');

      expect(mockPage.setViewportSize).toHaveBeenCalledWith({
        width: 1280,
        height: 720,
      });
    });

    it('should setup visual test with custom debug config', async () => {
      const customConfig = {
        logConsole: false,
        logNetwork: true,
      };

      await setupVisualTest(mockPage as any, 'test-case', customConfig);

      expect(mockPage.setViewportSize).toHaveBeenCalledWith({
        width: 1280,
        height: 720,
      });
    });

    it('should use default test name when not provided', async () => {
      await setupVisualTest(mockPage as any);

      expect(mockPage.setViewportSize).toHaveBeenCalled();
    });
  });

  describe('runVisualTest', () => {
    it('should execute test function successfully', async () => {
      const testFunction = vi.fn().mockResolvedValue(undefined);

      await runVisualTest(mockPage as any, 'test-case', testFunction);

      expect(testFunction).toHaveBeenCalledOnce();
    });

    it('should capture metrics when requested', async () => {
      const testFunction = vi.fn().mockResolvedValue(undefined);

      await runVisualTest(mockPage as any, 'test-case', testFunction, {
        captureMetrics: true,
      });

      expect(testFunction).toHaveBeenCalledOnce();
    });

    it('should handle test function errors', async () => {
      const testError = new Error('Test failed');
      const testFunction = vi.fn().mockRejectedValue(testError);

      await expect(runVisualTest(mockPage as any, 'test-case', testFunction)).rejects.toThrow(
        'Test failed'
      );

      expect(testFunction).toHaveBeenCalledOnce();
    });
  });

  describe('runBabylonVisualTest', () => {
    it('should execute babylon test with scene waiting', async () => {
      const testFunction = vi.fn().mockResolvedValue(undefined);

      await runBabylonVisualTest(mockPage as any, 'babylon-test', testFunction);

      expect(testFunction).toHaveBeenCalledOnce();
    });

    it('should skip canvas waiting when disabled', async () => {
      const testFunction = vi.fn().mockResolvedValue(undefined);

      await runBabylonVisualTest(mockPage as any, 'babylon-test', testFunction, {
        waitForCanvas: false,
      });

      expect(testFunction).toHaveBeenCalledOnce();
    });

    it('should use custom canvas options', async () => {
      const testFunction = vi.fn().mockResolvedValue(undefined);

      await runBabylonVisualTest(mockPage as any, 'babylon-test', testFunction, {
        canvasOptions: {
          timeout: 15000,
          stabilizationTime: 3000,
        },
      });

      expect(testFunction).toHaveBeenCalledOnce();
    });
  });

  describe('Utility Functions', () => {
    describe('createTestName', () => {
      it('should create formatted test name', () => {
        const testName = createTestName('circle', 'radius-10', 'front');
        expect(testName).toBe('circle-radius-10-front');
      });

      it('should handle different parameters', () => {
        const testName = createTestName('square', 'size-15', 'isometric');
        expect(testName).toBe('square-size-15-isometric');
      });
    });

    describe('createScreenshotName', () => {
      it('should create screenshot filename', () => {
        const filename = createScreenshotName('circle', 'radius-10', 'front');
        expect(filename).toBe('circle-radius-10-front.png');
      });

      it('should handle different parameters', () => {
        const filename = createScreenshotName('polygon', 'triangle', 'side');
        expect(filename).toBe('polygon-triangle-side.png');
      });
    });

    describe('createBeforeEach', () => {
      it('should create beforeEach function', () => {
        const beforeEach = createBeforeEach('test-suite');
        expect(typeof beforeEach).toBe('function');
      });

      it('should execute setup when called', async () => {
        const beforeEach = createBeforeEach('test-suite');
        await beforeEach({ page: mockPage as any });

        expect(mockPage.setViewportSize).toHaveBeenCalled();
      });
    });
  });

  describe('Configuration Constants', () => {
    it('should have default debug configuration', () => {
      expect(DEFAULT_VISUAL_TEST_DEBUG_CONFIG).toEqual({
        logConsole: true,
        logNetwork: true,
        logErrors: true,
        logTiming: true,
        networkExcludes: [
          '.woff',
          '.woff2',
          '.ttf',
          '.eot',
          '.ico',
          'data:',
          'blob:',
          '.map',
          'chrome-extension:',
        ],
        consoleTypes: ['log', 'info', 'warn', 'error'],
        networkIncludes: [],
      });
    });

    it('should have standard screenshot options', () => {
      expect(STANDARD_SCREENSHOT_OPTIONS).toEqual({
        threshold: 0.2,
        maxDiffPixels: 100,
        animations: 'disabled',
      });
    });

    it('should have strict screenshot options', () => {
      expect(STRICT_SCREENSHOT_OPTIONS).toEqual({
        threshold: 0.1,
        maxDiffPixels: 50,
        animations: 'disabled',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle setup errors gracefully', async () => {
      mockPage.setViewportSize.mockRejectedValue(new Error('Viewport error'));

      await expect(setupVisualTest(mockPage as any, 'test-case')).rejects.toThrow('Viewport error');
    });

    it('should propagate test function errors', async () => {
      const testError = new Error('Custom test error');
      const testFunction = vi.fn().mockRejectedValue(testError);

      await expect(runVisualTest(mockPage as any, 'test-case', testFunction)).rejects.toThrow(
        'Custom test error'
      );
    });
  });

  describe('Integration', () => {
    it('should work with all utilities together', async () => {
      const testName = createTestName('circle', 'test', 'front');
      const screenshotName = createScreenshotName('circle', 'test', 'front');

      expect(testName).toBe('circle-test-front');
      expect(screenshotName).toBe('circle-test-front.png');

      const testFunction = vi.fn().mockResolvedValue(undefined);
      await runVisualTest(mockPage as any, testName, testFunction);

      expect(testFunction).toHaveBeenCalledOnce();
    });
  });
});
