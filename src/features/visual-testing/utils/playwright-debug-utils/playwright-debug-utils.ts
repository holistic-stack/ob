/**
 * @file Playwright Debug Utils
 *
 * Utility functions for debugging Playwright component tests with console logging,
 * network request monitoring, and error tracking. Provides reusable debugging
 * configuration for visual regression tests.
 *
 * @example
 * ```typescript
 * import { setupDebugListeners, logTestInfo } from './playwright-debug-utils';
 *
 * test('my visual test', async ({ mount, page }) => {
 *   await setupDebugListeners(page, 'my-test');
 *
 *   const component = await mount(<MyComponent />);
 *   await logTestInfo(page, 'Component mounted');
 * });
 * ```
 */

import type { Page, Request, Response } from '@playwright/test';
import { createLogger } from '@/shared/services/logger.service';

const logger = createLogger('PlaywrightDebugUtils');

/**
 * Console message types for filtering
 */
export type ConsoleMessageType = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace';

/**
 * Network request information
 */
export interface NetworkRequestInfo {
  readonly url: string;
  readonly method: string;
  readonly status?: number;
  readonly statusText?: string;
  readonly timing?: number;
  readonly size?: number;
  readonly resourceType: string;
}

/**
 * Debug configuration options
 */
export interface DebugConfig {
  /** Enable console message logging */
  readonly logConsole?: boolean;
  /** Console message types to log (default: all) */
  readonly consoleTypes?: readonly ConsoleMessageType[];
  /** Enable network request logging */
  readonly logNetwork?: boolean;
  /** Network request URL patterns to include (default: all) */
  readonly networkIncludes?: readonly string[];
  /** Network request URL patterns to exclude */
  readonly networkExcludes?: readonly string[];
  /** Enable error logging */
  readonly logErrors?: boolean;
  /** Enable performance timing */
  readonly logTiming?: boolean;
  /** Test name for logging context */
  readonly testName?: string;
}

/**
 * Default debug configuration
 */
const DEFAULT_DEBUG_CONFIG: Required<DebugConfig> = {
  logConsole: true,
  consoleTypes: ['log', 'info', 'warn', 'error', 'debug', 'trace'],
  logNetwork: true,
  networkIncludes: [],
  networkExcludes: [
    'data:', // Exclude data URLs
    'blob:', // Exclude blob URLs
    '.woff',
    '.woff2',
    '.ttf',
    '.eot', // Exclude fonts
    '.ico', // Exclude favicons
  ],
  logErrors: true,
  logTiming: true,
  testName: 'unknown-test',
} as const;

/**
 * Setup debug listeners for a Playwright page
 *
 * @param page - Playwright page instance
 * @param testName - Name of the test for logging context
 * @param config - Debug configuration options
 *
 * @example
 * ```typescript
 * test('circle primitive visual test', async ({ mount, page }) => {
 *   await setupDebugListeners(page, 'circle-primitive-test', {
 *     logConsole: true,
 *     logNetwork: true,
 *     networkExcludes: ['.png', '.jpg'],
 *   });
 *
 *   const component = await mount(<CircleComponent />);
 * });
 * ```
 */
export const setupDebugListeners = async (
  page: Page,
  testName: string,
  config: Partial<DebugConfig> = {}
): Promise<void> => {
  const debugConfig = { ...DEFAULT_DEBUG_CONFIG, ...config, testName };

  logger.init(`[INIT][PlaywrightDebug] Setting up debug listeners for test: ${testName}`);

  // Console message listener
  if (debugConfig.logConsole) {
    page.on('console', (msg) => {
      const msgType = msg.type() as ConsoleMessageType;

      if (debugConfig.consoleTypes.includes(msgType)) {
        const text = msg.text();
        const location = msg.location();

        logger.debug(
          `[CONSOLE][${testName}][${msgType.toUpperCase()}] ${text} (${location.url}:${location.lineNumber}:${location.columnNumber})`
        );
      }
    });
  }

  // Network request listener
  if (debugConfig.logNetwork) {
    page.on('request', (request: Request) => {
      const url = request.url();

      // Check if URL should be logged
      const shouldLog = shouldLogNetworkRequest(url, debugConfig);

      if (shouldLog) {
        logger.debug(
          `[NETWORK][${testName}][REQUEST] ${request.method()} ${url} (${request.resourceType()})`
        );
      }
    });

    page.on('response', (response: Response) => {
      const url = response.url();

      // Check if URL should be logged
      const shouldLog = shouldLogNetworkRequest(url, debugConfig);

      if (shouldLog) {
        const timing = response.request().timing();
        const status = response.status();
        const statusText = response.statusText();

        logger.debug(
          `[NETWORK][${testName}][RESPONSE] ${status} ${statusText} ${url} (${timing.responseEnd - timing.requestStart}ms)`
        );
      }
    });

    page.on('requestfailed', (request: Request) => {
      const url = request.url();
      const failure = request.failure();

      logger.error(
        `[NETWORK][${testName}][FAILED] ${request.method()} ${url} - ${failure?.errorText || 'Unknown error'}`
      );
    });
  }

  // Error listener
  if (debugConfig.logErrors) {
    page.on('pageerror', (error) => {
      logger.error(`[PAGE_ERROR][${testName}] ${error.message}\n${error.stack}`);
    });

    page.on('crash', () => {
      logger.error(`[PAGE_CRASH][${testName}] Page crashed`);
    });
  }

  logger.debug(`[DEBUG][PlaywrightDebug] Debug listeners configured for test: ${testName}`);
};

/**
 * Check if a network request URL should be logged
 */
const shouldLogNetworkRequest = (url: string, config: Required<DebugConfig>): boolean => {
  // Check excludes first
  for (const exclude of config.networkExcludes) {
    if (url.includes(exclude)) {
      return false;
    }
  }

  // If includes are specified, check them
  if (config.networkIncludes.length > 0) {
    return config.networkIncludes.some((include) => url.includes(include));
  }

  // Log by default if no specific includes
  return true;
};

/**
 * Log test information with timing
 *
 * @param page - Playwright page instance
 * @param message - Message to log
 * @param testName - Test name for context
 *
 * @example
 * ```typescript
 * await logTestInfo(page, 'Scene initialization started', 'circle-test');
 * // ... scene setup ...
 * await logTestInfo(page, 'Scene initialization completed', 'circle-test');
 * ```
 */
export const logTestInfo = async (
  page: Page,
  message: string,
  testName?: string
): Promise<void> => {
  const timestamp = new Date().toISOString();
  const context = testName ? `[${testName}]` : '';

  logger.info(`[TEST_INFO]${context} ${message} (${timestamp})`);
};

/**
 * Capture and log page performance metrics
 *
 * @param page - Playwright page instance
 * @param testName - Test name for context
 * @returns Performance metrics
 *
 * @example
 * ```typescript
 * const metrics = await capturePerformanceMetrics(page, 'circle-test');
 * console.log('Render time:', metrics.renderTime);
 * ```
 */
export const capturePerformanceMetrics = async (
  page: Page,
  testName?: string
): Promise<{
  renderTime: number;
  domContentLoaded: number;
  loadComplete: number;
  memoryUsage?: number;
}> => {
  const context = testName ? `[${testName}]` : '';

  try {
    const performanceTiming = await page.evaluate(() => {
      const timing = performance.timing;
      const memory = (performance as any).memory;

      return {
        renderTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        memoryUsage: memory ? memory.usedJSHeapSize : undefined,
      };
    });

    logger.debug(
      `[PERFORMANCE]${context} Render: ${performanceTiming.renderTime}ms, ` +
        `DOM: ${performanceTiming.domContentLoaded}ms, ` +
        `Load: ${performanceTiming.loadComplete}ms` +
        (performanceTiming.memoryUsage
          ? `, Memory: ${Math.round(performanceTiming.memoryUsage / 1024 / 1024)}MB`
          : '')
    );

    return performanceTiming;
  } catch (error) {
    logger.error(`[PERFORMANCE]${context} Failed to capture metrics: ${error}`);
    return {
      renderTime: 0,
      domContentLoaded: 0,
      loadComplete: 0,
    };
  }
};

/**
 * Wait for BabylonJS scene to be ready with debugging
 *
 * @param page - Playwright page instance
 * @param testName - Test name for context
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @returns Promise that resolves when scene is ready
 *
 * @example
 * ```typescript
 * await waitForBabylonScene(page, 'circle-test', 15000);
 * ```
 */
export const waitForBabylonScene = async (
  page: Page,
  testName?: string,
  timeout = 10000
): Promise<void> => {
  const context = testName ? `[${testName}]` : '';

  logger.debug(`[BABYLON]${context} Waiting for scene to be ready (timeout: ${timeout}ms)`);

  try {
    await page.waitForSelector('[data-ready="true"]', { timeout });
    logger.debug(`[BABYLON]${context} Scene ready selector found`);

    // Additional wait for rendering to stabilize
    await page.waitForTimeout(1000);
    logger.debug(`[BABYLON]${context} Scene stabilization complete`);
  } catch (error) {
    logger.error(`[BABYLON]${context} Scene ready timeout: ${error}`);
    throw error;
  }
};
