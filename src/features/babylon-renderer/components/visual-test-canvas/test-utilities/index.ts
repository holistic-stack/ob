/**
 * @file Test Utilities for Visual Regression Tests
 * 
 * Provides utility functions for visual regression testing with Playwright
 * Includes rendering wait promises, assertion helpers, and test configuration
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

/**
 * Configuration for rendering wait promises
 */
export interface RenderingWaitConfig {
  readonly timeoutMs?: number;
  readonly enableLogging?: boolean;
  readonly testName?: string;
}

/**
 * Result of rendering completion
 */
export interface RenderingResult {
  readonly success: boolean;
  readonly duration: number;
  readonly error?: string;
  readonly testName?: string;
}

/**
 * Rendering wait promise with callbacks
 */
export interface RenderingWaitPromise {
  readonly promise: Promise<RenderingResult>;
  readonly onRenderingComplete: (duration: number) => void;
  readonly onRenderingError: (error: string) => void;
}

/**
 * Creates a promise that waits for rendering completion using callbacks
 * 
 * @param config - Configuration for the wait promise
 * @returns Promise with callback handlers
 */
export function createRenderingWaitPromise(config: RenderingWaitConfig = {}): RenderingWaitPromise {
  const {
    timeoutMs = 5000,
    enableLogging = false,
    testName = 'unknown'
  } = config;

  let resolvePromise: (result: RenderingResult) => void;
  let rejectPromise: (error: Error) => void;

  const promise = new Promise<RenderingResult>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;

    // Set timeout
    setTimeout(() => {
      const errorMessage = `Rendering timeout after ${timeoutMs}ms for test: ${testName}`;
      if (enableLogging) {
        console.log(`[ERROR] ${errorMessage}`);
      }
      resolve({
        success: false,
        duration: timeoutMs,
        error: errorMessage,
        testName
      });
    }, timeoutMs);
  });

  const startTime = Date.now();

  const onRenderingComplete = (duration?: number) => {
    const actualDuration = duration ?? (Date.now() - startTime);
    if (enableLogging) {
      console.log(`[DEBUG] Rendering completed successfully in ${actualDuration}ms for test: ${testName}`);
    }
    resolvePromise({
      success: true,
      duration: actualDuration,
      testName
    });
  };

  const onRenderingError = (error: string) => {
    const duration = Date.now() - startTime;
    if (enableLogging) {
      console.log(`[ERROR] Rendering failed after ${duration}ms for test: ${testName} - ${error}`);
    }
    resolvePromise({
      success: false,
      duration,
      error,
      testName
    });
  };

  return {
    promise,
    onRenderingComplete,
    onRenderingError
  };
}

/**
 * Asserts that rendering was successful
 * 
 * @param result - The rendering result to check
 * @param testName - Name of the test for error messages
 * @throws Error if rendering was not successful
 */
export function assertRenderingSuccess(result: RenderingResult, testName?: string): void {
  if (!result.success) {
    const errorMessage = `Rendering failed for test: ${testName || result.testName || 'unknown'} - ${result.error || 'Unknown error'}`;
    throw new Error(errorMessage);
  }
}

/**
 * Creates a simple wait promise for tests that don't use callbacks
 * 
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that resolves after timeout
 */
export function createSimpleWait(timeoutMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeoutMs));
}

/**
 * Utility function to wait for rendering with automatic timeout
 * 
 * @param timeoutMs - Timeout in milliseconds
 * @param testName - Name of the test for logging
 * @returns Promise that resolves when rendering should be complete
 */
export async function waitForRendering(timeoutMs: number = 5000, testName: string = 'unknown'): Promise<void> {
  console.log(`[DEBUG] Waiting ${timeoutMs}ms for rendering completion in test: ${testName}`);
  await createSimpleWait(timeoutMs);
  console.log(`[DEBUG] Rendering wait completed for test: ${testName}`);
}

/**
 * Configuration for test timeouts based on complexity
 */
export const TEST_TIMEOUTS = {
  SIMPLE: 3000,
  MEDIUM: 5000,
  COMPLEX: 8000,
  VERY_COMPLEX: 12000
} as const;

/**
 * Gets appropriate timeout for test complexity
 * 
 * @param complexity - Test complexity level
 * @returns Timeout in milliseconds
 */
export function getTimeoutForComplexity(complexity: keyof typeof TEST_TIMEOUTS): number {
  return TEST_TIMEOUTS[complexity];
}

/**
 * Utility to create consistent test names
 * 
 * @param operation - The operation being tested
 * @param primitive - The primitive being used
 * @param variant - Optional variant description
 * @returns Formatted test name
 */
export function createTestName(operation: string, primitive: string, variant?: string): string {
  const parts = [operation, primitive];
  if (variant) {
    parts.push(variant);
  }
  return parts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

/**
 * Utility to create test descriptions
 * 
 * @param operation - The operation being tested
 * @param primitive - The primitive being used
 * @param parameters - Optional parameters description
 * @returns Formatted test description
 */
export function createTestDescription(operation: string, primitive: string, parameters?: string): string {
  let description = `${operation} operation with ${primitive}`;
  if (parameters) {
    description += ` (${parameters})`;
  }
  return description;
}

/**
 * Common test configuration for visual regression tests
 */
export const VISUAL_TEST_CONFIG = {
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600,
  COMPARISON_WIDTH: 1200,
  COMPARISON_HEIGHT: 800,
  ENABLE_DEBUG_LOGGING: true,
  DEFAULT_OBJECT_SEPARATION: 40
} as const;

/**
 * Export all utilities for easy importing
 */
export {
  type RenderingWaitConfig,
  type RenderingResult,
  type RenderingWaitPromise
};
