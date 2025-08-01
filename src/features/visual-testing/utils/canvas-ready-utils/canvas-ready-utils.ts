/**
 * @file Canvas Ready Utils
 *
 * Reusable utilities for waiting for BabylonJS canvas to be fully rendered
 * before taking screenshots in visual regression tests. Provides robust
 * waiting strategies that ensure consistent and reliable visual testing.
 *
 * @example
 * ```typescript
 * import { waitForCanvasReady } from './canvas-ready-utils';
 *
 * test('my visual test', async ({ mount, page }) => {
 *   const component = await mount(<MyBabylonComponent />);
 *
 *   // Wait for canvas to be fully rendered
 *   await waitForCanvasReady(page, {
 *     testName: 'my-test',
 *     timeout: 15000,
 *     stabilizationTime: 2000
 *   });
 *
 *   await expect(component).toHaveScreenshot('my-test.png');
 * });
 * ```
 */

import type { Page } from '@playwright/test';
import { createLogger } from '@/shared';

const logger = createLogger('CanvasReadyUtils');

/**
 * Configuration options for canvas readiness waiting
 */
export interface CanvasReadyOptions {
  /** Test name for logging context */
  readonly testName?: string;
  /** Maximum time to wait for canvas readiness (default: 15000ms) */
  readonly timeout?: number;
  /** Time to wait for rendering stabilization (default: 2000ms) */
  readonly stabilizationTime?: number;
  /** Canvas selector (default: 'canvas') */
  readonly canvasSelector?: string;
  /** Data attribute to check for readiness (default: 'data-ready') */
  readonly readyAttribute?: string;
  /** Expected value for ready attribute (default: 'true') */
  readonly readyValue?: string;
  /** Whether to wait for WebGL context (default: true) */
  readonly waitForWebGL?: boolean;
  /** Whether to wait for stable frame rendering (default: true) */
  readonly waitForStableFrames?: boolean;
  /** Number of stable frames to wait for (default: 3) */
  readonly stableFrameCount?: number;
}

/**
 * Default configuration for canvas readiness waiting
 */
export const DEFAULT_CANVAS_READY_OPTIONS: Required<CanvasReadyOptions> = {
  testName: 'canvas-ready',
  timeout: 15000,
  stabilizationTime: 2000,
  canvasSelector: 'canvas',
  readyAttribute: 'data-ready',
  readyValue: 'true',
  waitForWebGL: true,
  waitForStableFrames: true,
  stableFrameCount: 3,
} as const;

/**
 * Wait for BabylonJS canvas to be fully rendered and ready for screenshots
 *
 * This function provides a comprehensive waiting strategy that ensures:
 * 1. Canvas element is present in DOM
 * 2. Canvas has the ready attribute set
 * 3. WebGL context is initialized (optional)
 * 4. Rendering has stabilized (no frame changes)
 * 5. Additional stabilization time has passed
 *
 * @param page - Playwright page instance
 * @param options - Configuration options for waiting behavior
 * @returns Promise that resolves when canvas is ready for screenshot
 *
 * @example
 * ```typescript
 * // Basic usage
 * await waitForCanvasReady(page);
 *
 * // With custom options
 * await waitForCanvasReady(page, {
 *   testName: 'circle-primitive',
 *   timeout: 20000,
 *   stabilizationTime: 3000
 * });
 * ```
 */
export const waitForCanvasReady = async (
  page: Page,
  options: CanvasReadyOptions = {}
): Promise<void> => {
  const config = { ...DEFAULT_CANVAS_READY_OPTIONS, ...options };
  const context = config.testName ? `[${config.testName}]` : '';

  logger.info(
    `[CANVAS_READY]${context} Starting canvas readiness check (timeout: ${config.timeout}ms)`
  );

  try {
    // Step 1: Wait for canvas element to be present
    await waitForCanvasElement(page, config);

    // Step 2: Wait for ready attribute
    await waitForReadyAttribute(page, config);

    // Step 3: Wait for WebGL context (optional)
    if (config.waitForWebGL) {
      await waitForWebGLContext(page, config);
    }

    // Step 4: Wait for stable frame rendering (optional)
    if (config.waitForStableFrames) {
      await waitForStableFrames(page, config);
    }

    // Step 5: Final stabilization wait
    await waitForStabilization(page, config);

    logger.info(`[CANVAS_READY]${context} Canvas is ready for screenshot`);
  } catch (error) {
    logger.error(`[CANVAS_READY]${context} Canvas readiness check failed: ${error}`);
    throw error;
  }
};

/**
 * Wait for canvas element to be present and visible in DOM
 */
const waitForCanvasElement = async (
  page: Page,
  config: Required<CanvasReadyOptions>
): Promise<void> => {
  const context = config.testName ? `[${config.testName}]` : '';

  logger.debug(`[CANVAS_ELEMENT]${context} Waiting for canvas element: ${config.canvasSelector}`);

  await page.waitForSelector(config.canvasSelector, {
    timeout: config.timeout,
    state: 'visible',
  });

  logger.debug(`[CANVAS_ELEMENT]${context} Canvas element found and visible`);
};

/**
 * Wait for canvas ready attribute to be set
 */
const waitForReadyAttribute = async (
  page: Page,
  config: Required<CanvasReadyOptions>
): Promise<void> => {
  const context = config.testName ? `[${config.testName}]` : '';
  const selector = `${config.canvasSelector}[${config.readyAttribute}="${config.readyValue}"]`;

  logger.debug(`[CANVAS_READY_ATTR]${context} Waiting for ready attribute: ${selector}`);

  await page.waitForSelector(selector, { timeout: config.timeout });

  logger.debug(`[CANVAS_READY_ATTR]${context} Ready attribute found`);
};

/**
 * Wait for WebGL context to be initialized
 */
const waitForWebGLContext = async (
  page: Page,
  config: Required<CanvasReadyOptions>
): Promise<void> => {
  const context = config.testName ? `[${config.testName}]` : '';

  logger.debug(`[CANVAS_WEBGL]${context} Checking WebGL context initialization`);

  const hasWebGL = await page.evaluate((selector) => {
    const canvas = document.querySelector(selector) as HTMLCanvasElement;
    if (!canvas) return false;

    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl !== null;
    } catch {
      return false;
    }
  }, config.canvasSelector);

  if (!hasWebGL) {
    throw new Error(`WebGL context not available for canvas: ${config.canvasSelector}`);
  }

  logger.debug(`[CANVAS_WEBGL]${context} WebGL context confirmed`);
};

/**
 * Wait for stable frame rendering (no visual changes)
 */
const waitForStableFrames = async (
  page: Page,
  config: Required<CanvasReadyOptions>
): Promise<void> => {
  const context = config.testName ? `[${config.testName}]` : '';

  logger.debug(`[CANVAS_STABLE]${context} Waiting for ${config.stableFrameCount} stable frames`);

  let stableCount = 0;
  let previousImageData: string | null = null;

  while (stableCount < config.stableFrameCount) {
    // Wait a bit between frame checks
    await page.waitForTimeout(200);

    // Get current canvas image data
    const currentImageData = await page.evaluate((selector) => {
      const canvas = document.querySelector(selector) as HTMLCanvasElement;
      if (!canvas) return null;

      try {
        return canvas.toDataURL();
      } catch {
        return null;
      }
    }, config.canvasSelector);

    if (currentImageData === null) {
      throw new Error(`Cannot read canvas image data: ${config.canvasSelector}`);
    }

    if (previousImageData === currentImageData) {
      stableCount++;
      logger.debug(
        `[CANVAS_STABLE]${context} Stable frame ${stableCount}/${config.stableFrameCount}`
      );
    } else {
      stableCount = 0; // Reset if frame changed
      logger.debug(`[CANVAS_STABLE]${context} Frame changed, resetting stable count`);
    }

    previousImageData = currentImageData;
  }

  logger.debug(`[CANVAS_STABLE]${context} Frame rendering stabilized`);
};

/**
 * Final stabilization wait to ensure rendering is complete
 */
const waitForStabilization = async (
  page: Page,
  config: Required<CanvasReadyOptions>
): Promise<void> => {
  const context = config.testName ? `[${config.testName}]` : '';

  logger.debug(
    `[CANVAS_STABILIZATION]${context} Final stabilization wait: ${config.stabilizationTime}ms`
  );

  await page.waitForTimeout(config.stabilizationTime);

  logger.debug(`[CANVAS_STABILIZATION]${context} Stabilization complete`);
};

/**
 * Quick canvas ready check for simple scenarios
 *
 * Simplified version that only waits for basic readiness without
 * extensive frame stability checking. Useful for faster tests.
 *
 * @param page - Playwright page instance
 * @param options - Configuration options
 * @returns Promise that resolves when canvas is basically ready
 */
export const waitForCanvasReadyQuick = async (
  page: Page,
  options: CanvasReadyOptions = {}
): Promise<void> => {
  const quickConfig = {
    ...DEFAULT_CANVAS_READY_OPTIONS,
    ...options,
    waitForStableFrames: false,
    stabilizationTime: 1000,
  };

  await waitForCanvasReady(page, quickConfig);
};
