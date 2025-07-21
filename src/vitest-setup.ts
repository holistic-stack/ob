/**
 * @file vitest-setup.ts
 * @description This file configures the Vitest testing environment for the OpenSCAD Babylon project.
 * It sets up global mocks for browser APIs, handles WASM file resolution for `web-tree-sitter`,
 * and includes utilities for memory management during tests.
 *
 * @architectural_decision
 * - **Global Setup**: Mocks and polyfills are applied globally to ensure a consistent testing environment
 *   for all UI components and services that rely on browser APIs.
 * - **Real WASM Loading**: Instead of mocking `web-tree-sitter`'s WASM loading, this setup provides a robust
 *   mechanism to resolve and load the actual WASM files, ensuring that parser-related tests run against
 *   a near-production environment.
 * - **Memory Management**: Includes explicit garbage collection and mock resets to prevent test contamination
 *   and ensure reliable, isolated test runs.
 *
 * @limitations
 * - Some browser API mocks are simplified and might not cover all edge cases of real browser behavior.
 * - Explicit garbage collection (`global.gc()`) requires Node.js to be run with `--expose-gc` flag.
 *
 * @example
 * ```typescript
 * // This file is automatically loaded by Vitest before running tests.
 * // No explicit import is needed in individual test files.
 * // To run tests with garbage collection enabled:
 * // vitest --expose-gc
 * ```
 */

import React from 'react';
import { vi } from 'vitest';

/**
 * @mock MonacoEditorComponent
 * @description Mocks the `MonacoEditorComponent` to prevent actual editor rendering during tests.
 * This improves test performance and isolates UI component tests from the Monaco Editor's complexities.
 * @example
 * ```tsx
 * // In a test file, rendering a component that uses MonacoEditorComponent:
 * render(<MyComponentUsingEditor />);
 * expect(screen.getByTestId('monaco-editor-mock')).toBeInTheDocument();
 * ```
 */
vi.mock('./features/code-editor/components/monaco-editor.tsx', () => ({
  MonacoEditorComponent: () =>
    React.createElement('div', { 'data-testid': 'monaco-editor-mock' }, 'Monaco Editor Mock'),
}));

/**
 * @polyfill ResizeObserver
 * @description Polyfills `ResizeObserver` globally to ensure components relying on it (e.g., for responsive layouts)
 * function correctly in the JSDOM environment where it's not natively available.
 * @architectural_decision
 * Placed at the very top to ensure it's available before any other imports that might use it.
 * @example
 * Basic usage:
 * A component using ResizeObserver will now work in tests.
 * The polyfill ensures ResizeObserver is available in JSDOM environment.
 */
import ResizeObserver from 'resize-observer-polyfill';

global.ResizeObserver = ResizeObserver;
globalThis.ResizeObserver = ResizeObserver;
window.ResizeObserver = ResizeObserver;

import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { findUpSync } from 'find-up';
import resolve from 'resolve';
import { afterEach } from 'vitest';

import { createLogger } from './shared/services/logger.service.js';
import './vitest-helpers/openscad-parser-test-utils.ts';

/**
 * @mock Zustand
 * @description Mocks the Zustand library to ensure proper isolation and control over store state during tests.
 * This allows for predictable state management without relying on actual store instances.
 * @example
 * Basic usage:
 * In tests, you can mock Zustand hooks for predictable state management.
 * This allows for isolated testing without actual store instances.
 */
vi.mock('zustand');

/**
 * @constant logger
 * @description Initializes a logger instance for the Vitest setup file.
 * Used for debugging and tracing the setup process itself.
 */
const logger = createLogger('VitestSetup');

/**
 * @section Browser API Mocks for UI Component Testing
 * @description This section provides global mocks for various browser APIs to enable reliable
 * testing of UI components in a Node.js environment (JSDOM).
 */

/**
 * @mock window.matchMedia
 * @description Mocks `window.matchMedia` to control the behavior of media queries in tests.
 * Essential for testing responsive designs and accessibility features that depend on `prefers-reduced-motion` or `prefers-color-scheme`.
 * @example
 * Basic usage:
 * In tests, you can override the mock behavior to simulate different media query states.
 * This is useful for testing responsive designs and accessibility features.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * @mock window.CSS.supports
 * @description Mocks `window.CSS.supports` to control CSS feature detection in tests.
 * Particularly useful for testing components that use `@supports` rules or check for specific CSS capabilities (e.g., `backdrop-filter`).
 * @example
 * ```typescript
 * // In a test, you can simulate browser support for a CSS feature:
 * vi.spyOn(window.CSS, 'supports').mockReturnValue(false); // Simulate no support for a feature
 * ```
 */
Object.defineProperty(window, 'CSS', {
  writable: true,
  value: {
    supports: vi.fn().mockReturnValue(true),
  },
});

/**
 * @mock document.createElementNS
 * @description Mocks `document.createElementNS` to handle SVG element creation, specifically adding an `href` property for SVG filter tests.
 * This is crucial for testing SVG-based UI elements or effects.
 * @example
 * ```typescript
 * // When a component creates an SVG filter element:
 * const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
 * expect(filter.href).toBe('test-href');
 * ```
 */
Object.defineProperty(document, 'createElementNS', {
  writable: true,
  value: vi.fn().mockImplementation((_namespace: string, tagName: string) => {
    const element = document.createElement(tagName);
    if (tagName === 'filter') {
      Object.defineProperty(element, 'href', {
        value: 'test-href',
        writable: true,
      });
    }
    return element;
  }),
});

/**
 * @mock IntersectionObserver
 * @description Mocks the `IntersectionObserver` API, which is commonly used for lazy loading, infinite scrolling, and visibility tracking.
 * This mock allows testing components that rely on element visibility without a real browser environment.
 * @example
 * ```typescript
 * // A component using IntersectionObserver will now have its observe/unobserve methods mocked:
 * const observer = new IntersectionObserver(() => {});
 * observer.observe(myElement);
 * expect(observer.observe).toHaveBeenCalledWith(myElement);
 * ```
 */
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

/**
 * @mock performance.now()
 * @description Mocks `performance.now()` to provide consistent and predictable timestamps during tests.
 * This is vital for performance-sensitive components or logic that relies on precise timing, preventing flaky tests due to variable execution times.
 * @example
 * ```typescript
 * // In a test, performance.now() will return an incrementing value:
 * const time1 = performance.now(); // e.g., 1000
 * const time2 = performance.now(); // e.g., 1000.1
 * expect(time2).toBeGreaterThan(time1);
 * ```
 */
Object.defineProperty(performance, 'now', {
  writable: true,
  value: vi.fn(() => {
    const baseTime = 1000;
    const increment = 0.1;
    const callCount = (performance.now as any).__callCount || 0;
    (performance.now as any).__callCount = callCount + 1;
    return baseTime + callCount * increment;
  }),
});

/**
 * @mock window.addEventListener and window.removeEventListener
 * @description Mocks `window.addEventListener` and `window.removeEventListener`.
 * This is particularly useful for libraries like `react-use-measure` that attach global event listeners.
 * @example
 * ```typescript
 * // In a test, you can assert if event listeners were added/removed:
 * expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
 * ```
 */
Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: vi.fn(),
});

/**
 * @mock window.attachEvent and window.detachEvent
 * @description Mocks IE-specific event methods (`attachEvent`, `detachEvent`) for React DOM compatibility.
 * This ensures that React's internal event system does not throw errors in a JSDOM environment that lacks these legacy methods.
 * @architectural_decision
 * These mocks are applied to `window` and dynamically to all elements created via `document.createElement`.
 */
Object.defineProperty(window, 'attachEvent', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'detachEvent', {
  writable: true,
  value: vi.fn(),
});

/**
 * @mock document.createElement
 * @description Overrides `document.createElement` to automatically add mocked `attachEvent` and `detachEvent` methods
 * to all newly created DOM elements. This prevents React DOM errors in JSDOM.
 */
const originalCreateElement = document.createElement;
document.createElement = function (tagName: string, options?: ElementCreationOptions) {
  const element = originalCreateElement.call(this, tagName, options);
  if (!(element as any).attachEvent) {
    (element as any).attachEvent = vi.fn();
  }
  if (!(element as any).detachEvent) {
    (element as any).detachEvent = vi.fn();
  }
  return element;
};

/**
 * @mock window.getComputedStyle
 * @description Mocks `window.getComputedStyle` to return predictable CSS styles for elements.
 * This is crucial for testing layout-dependent components or libraries like `react-use-measure`.
 * It can parse inline styles and return default computed values.
 * @example
 * ```typescript
 * // In a test, you can simulate an element's computed width:
 * const element = document.createElement('div');
 * element.style.width = '500px';
 * const computedStyle = window.getComputedStyle(element);
 * expect(computedStyle.getPropertyValue('width')).toBe('500px');
 * ```
 * @limitations
 * - Only handles a limited set of CSS properties (`width`, `height`, `overflow`).
 * - Relies on simple string matching for inline styles and class names, not a full CSS cascade.
 */
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: vi.fn((element: Element) => {
    const style = element.getAttribute('style') || '';
    const className = element.getAttribute('class') || '';

    const parseInlineStyle = (styleAttr: string, property: string): string => {
      const regex = new RegExp(`${property}:\s*([^;]+)`, 'i');
      const match = styleAttr.match(regex);
      return match ? match[1]?.trim() || '' : '';
    };

    const inlineWidth = parseInlineStyle(style, 'width');
    const inlineHeight = parseInlineStyle(style, 'height');

    const computedStyle: any = {
      getPropertyValue: vi.fn((property: string) => {
        switch (property) {
          case 'width':
            if (inlineWidth) return inlineWidth;
            if (style.includes('width: 1024px')) return '1024px';
            if (style.includes('width: 100%')) return '100%';
            if (className.includes('custom-class')) return '1024px';
            return '100%';
          case 'height':
            if (inlineHeight) return inlineHeight;
            if (style.includes('height: 768px')) return '768px';
            if (style.includes('height: 400px')) return '400px';
            if (className.includes('custom-class')) return '768px';
            return '400px';
          default:
            return '';
        }
      }),
      overflow: 'visible',
      overflowX: 'visible',
      overflowY: 'visible',
      width: inlineWidth || (style.includes('width: 1024px') ? '1024px' : '100%'),
      height: inlineHeight || (style.includes('height: 768px') ? '768px' : '400px'),
    };

    return computedStyle;
  }),
});

const __dirname = import.meta.dirname;
const projectRoot = join(__dirname, '..');

/**
 * @mock fetch
 * @description Stubs the global `fetch` API to intercept network requests, particularly for WASM files.
 * This allows Vitest to serve WASM files from the local filesystem during tests.
 * @architectural_decision
 * Intercepting `fetch` is crucial for `web-tree-sitter` which loads its parser grammar as a WASM module.
 * This ensures that tests can run without actual network requests.
 */
vi.stubGlobal('fetch', vi.fn());

/**
 * @function _createMockWasmFile
 * @description Creates a minimal, valid WebAssembly (WASM) file as a `Uint8Array`.
 * This serves as a fallback when the actual OpenSCAD grammar WASM file cannot be resolved or loaded,
 * preventing tests from failing due to missing WASM binaries.
 * @returns {Uint8Array} A `Uint8Array` representing a minimal WASM file.
 * @example
 * ```typescript
 * const mockWasm = _createMockWasmFile();
 * expect(mockWasm.length).toBeGreaterThan(0);
 * ```
 */
function _createMockWasmFile(): Uint8Array {
  const wasmHeader = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
  const typeSection = new Uint8Array([0x01, 0x00]);
  const functionSection = new Uint8Array([0x03, 0x00]);
  const exportSection = new Uint8Array([0x07, 0x00]);
  const codeSection = new Uint8Array([0x0a, 0x00]);

  const totalLength =
    wasmHeader.length +
    typeSection.length +
    functionSection.length +
    exportSection.length +
    codeSection.length;
  const mockWasm = new Uint8Array(totalLength);

  let offset = 0;
  mockWasm.set(wasmHeader, offset);
  offset += wasmHeader.length;
  mockWasm.set(typeSection, offset);
  offset += typeSection.length;
  mockWasm.set(functionSection, offset);
  offset += functionSection.length;
  mockWasm.set(exportSection, offset);
  offset += exportSection.length;
  mockWasm.set(codeSection, offset);

  logger.debug(`Created mock WASM file: ${mockWasm.length} bytes`);
  return mockWasm;
}

/**
 * @function resolveWasmPath
 * @description Resolves the absolute file path for a given WASM file URL or path using multiple strategies.
 * This function is critical for `web-tree-sitter` to load its WASM grammar files correctly in the test environment.
 * It prioritizes finding the actual WASM file over falling back to a mock.
 * @param {string} urlPath - The URL or path to the WASM file (e.g., 'tree-sitter-openscad.wasm').
 * @returns {string} The resolved absolute file path prefixed with `file://`.
 * @throws {Error} If the WASM file cannot be found after trying all resolution strategies.
 *
 * @architectural_decision
 * - **Multi-Strategy Resolution**: Employs a series of strategies (public directory, Node.js module resolution, `find-up`)
 *   to maximize the chances of finding the WASM file regardless of the test runner's working directory or module resolution quirks.
 * - **Robustness**: Handles various input formats for `urlPath` (HTTP/HTTPS URLs, `file://` URLs, relative paths).
 *
 * @limitations
 * - Relies on synchronous file system operations (`readFileSync`, `resolve.sync`, `findUpSync`), which are acceptable in a test setup but not for production code.
 * - The `find-up` strategy involves parsing `package.json` files, which adds a slight overhead.
 *
 * @edge_cases
 * - **Missing File**: If the WASM file is genuinely missing, it will throw an error after exhausting all strategies.
 * - **Incorrect Path**: Handles cases where the provided `urlPath` might be a full URL or a relative path.
 *
 * @example
 * ```typescript
 * // Example usage in a test setup:
 * const wasmPath = resolveWasmPath('tree-sitter-openscad.wasm');
 * expect(wasmPath).toMatch(/file:\/\/.+\/tree-sitter-openscad.wasm$/);
 *
 * // Example of a URL input:
 * const urlWasmPath = resolveWasmPath('http://localhost:3000/tree-sitter-openscad.wasm');
 * expect(urlWasmPath).toMatch(/file:\/\/.+\/tree-sitter-openscad.wasm$/);
 * ```
 */
export function resolveWasmPath(urlPath: string): string {
  let normalizedPath: string;

  if (
    urlPath.startsWith('http://') ||
    urlPath.startsWith('https://') ||
    urlPath.startsWith('file://')
  ) {
    try {
      const url = new URL(urlPath);
      normalizedPath = url.pathname.split('/').pop() ?? urlPath;
      logger.debug(`Extracted filename from URL: ${normalizedPath}`);
    } catch (_error) {
      logger.warn(`Failed to parse URL: ${urlPath}, using as-is`);
      normalizedPath = urlPath;
    }
  } else {
    normalizedPath = urlPath.replace(/^\.?\//, '');
  }

  logger.debug(`Resolving WASM file: ${normalizedPath}`);
  logger.debug(`__dirname: ${__dirname}`);

  const publicDirectoryStrategies = [
    () => {
      logger.debug(`Attempting public directory strategy for ${normalizedPath}`);
      try {
        const publicWasmPath = join(projectRoot, 'public', normalizedPath);
        return publicWasmPath;
      } catch {
        return null;
      }
    },
    () => {
      logger.debug(`Attempting root directory strategy for ${normalizedPath}`);
      try {
        const rootWasmPath = join(projectRoot, normalizedPath);
        return rootWasmPath;
      } catch {
        return null;
      }
    },
  ];

  const moduleResolutionStrategies = [
    () => {
      logger.debug(`Attempting web-tree-sitter strategy 2 (direct) for ${normalizedPath}`);
      try {
        const packagePath = resolve.sync('web-tree-sitter/package.json', {
          basedir: projectRoot,
        });
        const resolvedWasmPath = join(dirname(packagePath), normalizedPath);
        return resolvedWasmPath;
      } catch (_e) {
        return null;
      }
    },
    () => {
      try {
        const packagePath = resolve.sync('web-tree-sitter/package.json', {
          basedir: projectRoot,
        });
        return join(dirname(packagePath), 'lib', normalizedPath);
      } catch {
        return null;
      }
    },
    () => {
      try {
        const packagePath = resolve.sync('web-tree-sitter/package.json', {
          basedir: __dirname,
        });
        return join(dirname(packagePath), 'debug', normalizedPath);
      } catch {
        return null;
      }
    },
  ];

  const findUpStrategies = [
    () => {
      try {
        logger.debug(
          `Attempting web-tree-sitter strategy 5 (find-up direct) for ${normalizedPath}`
        );
        const packageJson = findUpSync(
          (directory: string) => {
            const packagePath = join(directory, 'package.json');
            try {
              const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
              return pkg.name === 'web-tree-sitter' ? packagePath : undefined;
            } catch {
              return undefined;
            }
          },
          {
            cwd: __dirname,
            type: 'file',
          }
        );

        if (packageJson) {
          const resolvedWasmPath = join(dirname(packageJson), normalizedPath);
          return resolvedWasmPath;
        }
        return null;
      } catch (_e) {
        return null;
      }
    },
  ];

  const allStrategies = [
    ...publicDirectoryStrategies,
    ...moduleResolutionStrategies,
    ...findUpStrategies,
  ];

  for (const [index, strategy] of allStrategies.entries()) {
    const resolvedPath = strategy();
    if (resolvedPath) {
      try {
        readFileSync(resolvedPath, { flag: 'r' });
        logger.debug(
          `✅ Found WASM file: ${normalizedPath} at ${resolvedPath} (strategy ${index + 1})`
        );
        return `file://${resolvedPath}`;
      } catch {
        logger.debug(`❌ Strategy ${index + 1} failed: ${resolvedPath} (file not found)`);
      }
    }
  }

  throw new Error(
    `WASM file not found: ${normalizedPath}. Tried ${allStrategies.length} resolution strategies.`
  );
}

/**
 * @mock fetch
 * @description Configures the global `fetch` mock to serve WASM files from the local filesystem.
 * This mock intercepts `fetch` calls for WASM files and resolves them using `resolveWasmPath`,
 * reading the file content and returning it as an `ArrayBuffer`.
 * @param {RequestInfo | URL} url - The URL or `RequestInfo` object passed to `fetch`.
 * @returns {Promise<Response>} A promise that resolves to a mocked `Response` object containing the WASM file's content.
 * @throws {Error} If the WASM file cannot be read from the resolved path.
 * @example
 * ```typescript
 * // In a test, a component or library calling fetch for a WASM file will be intercepted:
 * const response = await fetch('tree-sitter-openscad.wasm');
 * expect(response.ok).toBe(true);
 * const buffer = await response.arrayBuffer();
 * expect(buffer.byteLength).toBeGreaterThan(0);
 * ```
 */
vi.mocked(fetch).mockImplementation((url) => {
  logger.debug('using local fetch mock', url);
  logger.debug('URL type:', typeof url, 'URL constructor:', url.constructor.name);

  let urlPath: string;
  if (typeof url === 'string') {
    urlPath = url;
  } else if (url instanceof URL) {
    urlPath = url.href;
  } else {
    urlPath = String(url);
  }

  if (urlPath.startsWith('file://')) {
    urlPath = urlPath.substring('file://'.length);
  }

  try {
    const resolvedPath = resolveWasmPath(urlPath);

    let actualPath = resolvedPath;
    if (actualPath.startsWith('file://')) {
      actualPath = actualPath.substring('file://'.length);
    }

    const localFile = readFileSync(actualPath);
    const uint8Array = new Uint8Array(localFile);

    logger.debug(`Successfully loaded WASM file: ${urlPath} (${uint8Array.length} bytes)`);

    return Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(uint8Array.buffer),
      bytes: () => Promise.resolve(uint8Array),
    } as unknown as Response);
  } catch (error) {
    logger.error('Failed to read WASM file:', urlPath, error);
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve(`WASM file not found: ${urlPath}`),
    } as unknown as Response);
  }
});

/**
 * @function resetMatrixServiceSingletons
 * @description Resets any singleton instances related to matrix services for clean test isolation.
 * This function is currently a no-op as complex matrix services have been removed or simplified.
 * @returns {Promise<void>} A promise that resolves when the reset is complete.
 * @deprecated This function is largely deprecated as the underlying services have been simplified.
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await resetMatrixServiceSingletons();
 * });
 * ```
 */
export async function resetMatrixServiceSingletons(): Promise<void> {
  logger.debug('Matrix service singletons reset (simplified - no complex services)');
}

/**
 * @function initializeMatrixServicesForTest
 * @description Initializes simplified mock matrix services for testing purposes.
 * This function provides mock implementations for services that were previously complex,
 * ensuring tests can run without heavy dependencies.
 * @returns {Promise<{ serviceContainer: unknown; integrationService: unknown; }>} A promise that resolves with mock service objects.
 * @deprecated This function is deprecated in favor of more lightweight test setups to prevent hanging issues.
 * @example
 * ```typescript
 * test('should perform a matrix operation', async () => {
 *   const { integrationService } = await initializeMatrixServicesForTest();
 *   const result = await integrationService.performRobustInversion();
 *   expect(result.success).toBe(true);
 * });
 * ```
 */
export async function initializeMatrixServicesForTest(): Promise<{
  serviceContainer: unknown;
  integrationService: unknown;
}> {
  logger.debug('Initializing simplified matrix services for test');

  const mockServiceContainer = {
    getService: () => null,
    isHealthy: () => true,
    shutdown: () => Promise.resolve(),
  };

  const mockIntegrationService = {
    convertMatrix4ToMLMatrix: () => Promise.resolve({ success: true, data: { result: null } }),
    performRobustInversion: () => Promise.resolve({ success: true, data: { result: null } }),
    computeRobustNormalMatrix: () => Promise.resolve({ success: true, data: { result: null } }),
  };

  logger.debug('✅ Simplified matrix services initialized for test');

  return {
    serviceContainer: mockServiceContainer,
    integrationService: mockIntegrationService,
  };
}

/**
 * @section Memory Management for Tests
 * @description This section provides utilities for managing memory during test runs,
 * crucial for preventing memory leaks and ensuring consistent test performance.
 */

/**
 * @function forceGarbageCollection
 * @description Forces a garbage collection run in the Node.js environment.
 * This is used to explicitly free up memory after tests, helping to identify memory leaks
 * and ensure a clean state for subsequent tests.
 * @returns {void}
 * @example
 * ```typescript
 * afterEach(() => {
 *   forceGarbageCollection();
 * });
 * ```
 * @limitations
 * - Requires Node.js to be run with the `--expose-gc` flag.
 * - `global.gc()` is not available in all environments.
 */
export function forceGarbageCollection(): void {
  if (global.gc) {
    logger.debug('Forcing garbage collection');
    global.gc();
  } else {
    logger.debug(
      'Garbage collection not available (run with --expose-gc for better memory management)'
    );
  }
}

/**
 * @function resetPerformanceMock
 * @description Resets the `performance.now()` mock's internal call counter.
 * This ensures that `performance.now()` returns consistent, predictable values at the start of each test,
 * preventing accumulated increments from affecting timing-sensitive tests.
 * @returns {void}
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetPerformanceMock();
 * });
 * ```
 */
export function resetPerformanceMock(): void {
  if (performance.now && typeof performance.now === 'function') {
    (performance.now as any).__callCount = 0;
  }
}

/**
 * @function clearTestMemory
 * @description Clears test-specific memory and forces garbage collection.
 * This is a comprehensive cleanup function called after each test to ensure maximum test isolation.
 * @returns {void}
 * @example
 * ```typescript
 * afterEach(() => {
 *   clearTestMemory();
 * });
 * ```
 */
export function clearTestMemory(): void {
  logger.debug('Clearing test memory');
  resetPerformanceMock();
  forceGarbageCollection();
}

/**
 * @section Global Test Hooks for Memory Management
 * @description Defines global Vitest hooks to ensure memory is managed effectively after each test.
 */

/**
 * @hook afterEach
 * @description Vitest hook that runs after each test, calling `clearTestMemory`.
 * This ensures that each test starts with a clean memory slate, preventing side effects and memory leaks between tests.
 * @example
 * ```typescript
 * // This hook is automatically applied by Vitest due to its presence in vitest-setup.ts.
 * // No explicit call is needed in individual test files.
 * ```
 */
afterEach(() => {
  clearTestMemory();
});
