/**
 * @file Shared Test Setup
 *
 * Shared configuration and utilities for all visual regression tests.
 * Provides consistent setup for debugging, logging, and test environment
 * configuration across all .vspec.tsx files.
 *
 * @example
 * ```typescript
 * import { setupVisualTest, runVisualTest } from './shared-test-setup';
 *
 * test.describe('My Visual Tests', () => {
 *   test.beforeEach(setupVisualTest);
 *
 *   test('my test', async ({ mount, page }) => {
 *     await runVisualTest(page, 'my-test', async () => {
 *       const component = await mount(<MyComponent />);
 *       await expect(component).toHaveScreenshot('my-test.png');
 *     });
 *   });
 * });
 * ```
 */

import type { Page } from '@playwright/test';
import {
  type CanvasReadyOptions,
  waitForCanvasReady,
  waitForCanvasReadyQuick,
} from '../canvas-ready-utils/canvas-ready-utils';
import type { DebugConfig } from '../playwright-debug-utils/playwright-debug-utils';
import {
  capturePerformanceMetrics,
  logTestInfo,
  setupDebugListeners,
} from '../playwright-debug-utils/playwright-debug-utils';

/**
 * Default debug configuration for visual tests
 */
export const DEFAULT_VISUAL_TEST_DEBUG_CONFIG: Partial<DebugConfig> = {
  logConsole: true,
  logNetwork: true,
  logErrors: true,
  logTiming: true,
  networkExcludes: [
    '.woff',
    '.woff2',
    '.ttf',
    '.eot', // Font files
    '.ico', // Favicons
    'data:', // Data URLs
    'blob:', // Blob URLs
    '.map', // Source maps
    'chrome-extension:', // Chrome extensions
  ],
  consoleTypes: ['log', 'info', 'warn', 'error'],
  networkIncludes: [], // Include all by default
} as const;

/**
 * Setup function for visual test beforeEach hooks
 *
 * @param page - Playwright page instance
 * @param testName - Optional test name for context
 * @param debugConfig - Optional debug configuration override
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await setupVisualTest(page, 'my-test-suite');
 * });
 * ```
 */
export const setupVisualTest = async (
  page: Page,
  testName = 'visual-test',
  debugConfig: Partial<DebugConfig> = {}
): Promise<void> => {
  // Set consistent viewport size
  await page.setViewportSize({ width: 1280, height: 720 });

  // Merge debug configuration
  const finalDebugConfig = {
    ...DEFAULT_VISUAL_TEST_DEBUG_CONFIG,
    ...debugConfig,
    testName,
  };

  // Setup debug listeners
  await setupDebugListeners(page, testName, finalDebugConfig);

  await logTestInfo(page, `Visual test environment setup complete`, testName);
};

/**
 * Run a visual test with consistent logging and error handling
 *
 * @param page - Playwright page instance
 * @param testName - Name of the test for logging
 * @param testFunction - Test function to execute
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * test('circle primitive', async ({ mount, page }) => {
 *   await runVisualTest(page, 'circle-test', async () => {
 *     const component = await mount(<CircleComponent />);
 *     await expect(component).toHaveScreenshot('circle.png');
 *   });
 * });
 * ```
 */
export const runVisualTest = async (
  page: Page,
  testName: string,
  testFunction: () => Promise<void>,
  options: {
    captureMetrics?: boolean;
    babylonTimeout?: number;
  } = {}
): Promise<void> => {
  const { captureMetrics = false } = options;

  try {
    await logTestInfo(page, `Starting visual test: ${testName}`, testName);

    // Execute the test function
    await testFunction();

    // Capture performance metrics if requested
    if (captureMetrics) {
      await capturePerformanceMetrics(page, testName);
    }

    await logTestInfo(page, `Visual test completed successfully: ${testName}`, testName);
  } catch (error) {
    await logTestInfo(page, `Visual test failed: ${testName} - ${error}`, testName);
    throw error;
  }
};

/**
 * Run a BabylonJS visual test with comprehensive canvas waiting
 *
 * @param page - Playwright page instance
 * @param testName - Name of the test for logging
 * @param testFunction - Test function to execute
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * test('babylon scene test', async ({ mount, page }) => {
 *   await runBabylonVisualTest(page, 'babylon-test', async () => {
 *     const component = await mount(<BabylonComponent />);
 *     // Canvas waiting is handled automatically
 *     await expect(component).toHaveScreenshot('babylon.png');
 *   });
 * });
 * ```
 */
export const runBabylonVisualTest = async (
  page: Page,
  testName: string,
  testFunction: () => Promise<void>,
  options: {
    captureMetrics?: boolean;
    canvasOptions?: CanvasReadyOptions;
    waitForCanvas?: boolean;
  } = {}
): Promise<void> => {
  const { captureMetrics = true, canvasOptions = {}, waitForCanvas = true } = options;

  await runVisualTest(
    page,
    testName,
    async () => {
      // Execute the test function first (mount component)
      await testFunction();

      // Wait for BabylonJS canvas if requested
      if (waitForCanvas) {
        await logTestInfo(page, 'Waiting for BabylonJS canvas to be ready', testName);
        await waitForCanvasReady(page, {
          testName,
          waitForWebGL: false, // Disable WebGL check for Playwright (headless browser)
          ...canvasOptions,
        });
      }
    },
    { captureMetrics }
  );
};

/**
 * Run a BabylonJS visual test with quick canvas waiting
 *
 * Faster version of runBabylonVisualTest that uses simplified waiting
 * strategy. Good for tests where rendering is simple and fast.
 *
 * @param page - Playwright page instance
 * @param testName - Name of the test for logging
 * @param testFunction - Test function to execute
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * test('simple babylon test', async ({ mount, page }) => {
 *   await runBabylonVisualTestQuick(page, 'simple-test', async () => {
 *     const component = await mount(<SimpleComponent />);
 *     await expect(component).toHaveScreenshot('simple.png');
 *   });
 * });
 * ```
 */
export const runBabylonVisualTestQuick = async (
  page: Page,
  testName: string,
  testFunction: () => Promise<void>,
  options: {
    captureMetrics?: boolean;
    canvasOptions?: CanvasReadyOptions;
  } = {}
): Promise<void> => {
  const { captureMetrics = false, canvasOptions = {} } = options;

  await runVisualTest(
    page,
    testName,
    async () => {
      // Execute the test function first (mount component)
      await testFunction();

      // Quick canvas wait
      await logTestInfo(page, 'Quick wait for BabylonJS canvas', testName);
      await waitForCanvasReadyQuick(page, {
        testName,
        waitForWebGL: false, // Disable WebGL check for Playwright (headless browser)
        ...canvasOptions,
      });
    },
    { captureMetrics }
  );
};

/**
 * Create a test name from scenario and camera angle
 *
 * @param primitive - Primitive type
 * @param scenario - Test scenario name
 * @param cameraAngle - Camera angle
 * @returns Formatted test name
 *
 * @example
 * ```typescript
 * const testName = createTestName('circle', 'radius-10', 'front');
 * // Returns: 'circle-radius-10-front'
 * ```
 */
export const createTestName = (
  primitive: string,
  scenario: string,
  cameraAngle: string
): string => {
  return `${primitive}-${scenario}-${cameraAngle}`;
};

/**
 * Create a screenshot filename from test parameters
 *
 * @param primitive - Primitive type
 * @param scenario - Test scenario name
 * @param cameraAngle - Camera angle
 * @returns Screenshot filename
 *
 * @example
 * ```typescript
 * const filename = createScreenshotName('circle', 'radius-10', 'front');
 * // Returns: 'circle-radius-10-front.png'
 * ```
 */
export const createScreenshotName = (
  primitive: string,
  scenario: string,
  cameraAngle: string
): string => {
  return `${primitive}-${scenario}-${cameraAngle}.png`;
};

/**
 * Standard screenshot options for visual regression tests
 */
export const STANDARD_SCREENSHOT_OPTIONS = {
  threshold: 0.2, // Allow small differences due to rendering variations
  maxDiffPixels: 100,
  animations: 'disabled' as const,
} as const;

/**
 * Strict screenshot options for consistency tests
 */
export const STRICT_SCREENSHOT_OPTIONS = {
  threshold: 0.1, // Stricter threshold for consistency tests
  maxDiffPixels: 50,
  animations: 'disabled' as const,
} as const;

/**
 * Helper function to setup beforeEach for visual tests
 *
 * @param testSuiteName - Name of the test suite
 * @param debugConfig - Optional debug configuration
 * @returns beforeEach function
 *
 * @example
 * ```typescript
 * test.describe('Circle Tests', () => {
 *   test.beforeEach(createBeforeEach('circle-tests'));
 * });
 * ```
 */
export const createBeforeEach = (testSuiteName: string, debugConfig: Partial<DebugConfig> = {}) => {
  return async ({ page }: { page: Page }) => {
    await setupVisualTest(page, testSuiteName, debugConfig);
  };
};
