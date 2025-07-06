import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { findUpSync } from 'find-up';
// Use resolve.sync for robust module resolution following Node.js algorithm
import resolve from 'resolve';
import { afterEach, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { createLogger } from './shared/services/logger.service.js';
// Import OpenSCAD parser test utility to register cleanup hooks
import './vitest-helpers/openscad-parser-test-utils.js';

// Enable Zustand mocking for proper store testing
vi.mock('zustand');

// ============================================================================
// Real Web-Tree-Sitter Setup for Testing
// ============================================================================

const logger = createLogger('VitestSetup');

// ============================================================================
// Browser API Mocks for UI Component Testing
// ============================================================================

// Mock window.matchMedia for accessibility and responsive design tests
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

// Mock CSS.supports for glass morphism compatibility tests
Object.defineProperty(window, 'CSS', {
  writable: true,
  value: {
    supports: vi.fn().mockReturnValue(true),
  },
});

// Mock document.createElementNS for SVG filter tests
Object.defineProperty(document, 'createElementNS', {
  writable: true,
  value: vi.fn().mockImplementation((_namespace: string, tagName: string) => {
    const element = document.createElement(tagName);
    // Add href property for SVG filter elements
    if (tagName === 'filter') {
      Object.defineProperty(element, 'href', {
        value: 'test-href',
        writable: true,
      });
    }
    return element;
  }),
});

// Mock ResizeObserver for responsive components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock navigator.userAgent for detect-gpu
if (global.navigator) {
  Object.defineProperty(global.navigator, 'userAgent', {
    value:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    writable: true,
  });
} else {
  (global as any).navigator = {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  };
}

// Mock IntersectionObserver for visibility-based components
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const __dirname = import.meta.dirname;
const projectRoot = join(__dirname, '..');

// Initialize vitest-fetch-mock properly
const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

/**
 * Create a minimal mock WASM file for testing purposes
 * This provides a fallback when the actual OpenSCAD grammar WASM is not available
 */
function _createMockWasmFile(): Uint8Array {
  // Create a minimal valid WASM file structure
  // WASM magic number (0x00, 0x61, 0x73, 0x6d) + version (0x01, 0x00, 0x00, 0x00)
  const wasmHeader = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

  // Add minimal sections for a valid WASM file
  // Type section (empty)
  const typeSection = new Uint8Array([0x01, 0x00]);
  // Function section (empty)
  const functionSection = new Uint8Array([0x03, 0x00]);
  // Export section (empty)
  const exportSection = new Uint8Array([0x07, 0x00]);
  // Code section (empty)
  const codeSection = new Uint8Array([0x0a, 0x00]);

  // Combine all sections
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
 * Advanced WASM file resolution using multiple strategies
 * Combines Node.js module resolution with directory traversal for maximum robustness
 * Falls back to mock WASM for OpenSCAD grammar when not available
 */
export function resolveWasmPath(urlPath: string): string {
  // Extract filename from URL or path
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
    // Remove leading ./ or /
    normalizedPath = urlPath.replace(/^\.?\//, '');
  }

  logger.debug(`Resolving WASM file: ${normalizedPath}`);
  logger.debug(`__dirname: ${__dirname}`);

  // Strategy 1: Check public directory first (where WASM files are located)
  const publicDirectoryStrategies = [
    // Try public directory (main location for WASM files)
    () => {
      logger.debug(`Attempting public directory strategy for ${normalizedPath}`);
      try {
        const publicWasmPath = join(projectRoot, 'public', normalizedPath);
        return publicWasmPath;
      } catch {
        return null;
      }
    },

    // Try root directory
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

  // Strategy 2: Use Node.js module resolution algorithm (fallback)
  const moduleResolutionStrategies = [
    // Try web-tree-sitter package
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

    // Try web-tree-sitter/lib subdirectory
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

    // Try web-tree-sitter debug directory (for tree-sitter.wasm)
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

  // Strategy 2: Use find-up to locate package.json files and resolve from there
  const findUpStrategies = [
    // Find web-tree-sitter package.json using matcher function
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

  // Try all strategies in order of preference (public directory first, then modules, then find-up)
  const allStrategies = [
    ...publicDirectoryStrategies,
    ...moduleResolutionStrategies,
    ...findUpStrategies,
  ];

  for (const [index, strategy] of allStrategies.entries()) {
    const resolvedPath = strategy();
    if (resolvedPath) {
      try {
        // Test if file exists by attempting to read it
        readFileSync(resolvedPath, { flag: 'r' });
        logger.debug(
          `✅ Found WASM file: ${normalizedPath} at ${resolvedPath} (strategy ${index + 1})`
        );
        return `file://${resolvedPath}`;
      } catch {
        // File doesn't exist, continue to next strategy
        logger.debug(`❌ Strategy ${index + 1} failed: ${resolvedPath} (file not found)`);
      }
    }
  }

  throw new Error(
    `WASM file not found: ${normalizedPath}. Tried ${allStrategies.length} resolution strategies.`
  );
}

// Configure vitest-fetch-mock to handle WASM files with better URL handling
vi.mocked(fetch).mockImplementation((url) => {
  logger.debug('using local fetch mock', url);
  logger.debug('URL type:', typeof url, 'URL constructor:', url.constructor.name);

  // Handle both string and URL objects
  let urlPath: string;
  if (typeof url === 'string') {
    urlPath = url;
  } else if (url instanceof URL) {
    urlPath = url.href; // Use href to get the full file:// URL
  } else {
    // Handle other URL-like objects
    urlPath = String(url);
  }

  // Remove 'file://' prefix if present for local file system access
  if (urlPath.startsWith('file://')) {
    urlPath = urlPath.substring('file://'.length);
  }

  try {
    // Resolve the actual file path
    const resolvedPath = resolveWasmPath(urlPath);

    // Remove file:// prefix if present for file system access
    let actualPath = resolvedPath;
    if (actualPath.startsWith('file://')) {
      actualPath = actualPath.substring('file://'.length);
    }

    // Read file as Uint8Array
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
 * Initialize Three.js CSG for testing environments
 * Provides fallback mock CSG if real CSG initialization fails
 */
export async function initializeCSGForTests(): Promise<void> {
  logger.info('Initializing Three.js CSG for tests');

  try {
    // Mock Three.js CSG for testing
    const mockCSG = {
      fromMesh: () => ({
        union: () => ({ toMesh: () => null }),
        subtract: () => ({ toMesh: () => null }),
        intersect: () => ({ toMesh: () => null }),
      }),
    };

    (globalThis as typeof globalThis & { __MOCK_THREE_CSG__?: typeof mockCSG }).__MOCK_THREE_CSG__ =
      mockCSG;

    logger.debug('✅ Mock Three.js CSG initialized for testing');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Three.js CSG initialization failed:', errorMessage);
  }

  // Mock matrix services to prevent initialization stalling
  try {
    const mockMatrixService = {
      ensureInitialized: () => Promise.resolve({ success: true }),
      getConversionService: () => ({
        convertMatrix4ToMLMatrix: () =>
          Promise.resolve({
            success: true,
            data: {
              result: {
                data: [
                  [1, 0, 0, 0],
                  [0, 1, 0, 0],
                  [0, 0, 1, 0],
                  [0, 0, 0, 1],
                ],
              },
              performance: {
                memoryUsed: 1024,
                cacheHit: false,
              },
            },
          }),
        performRobustInversion: () =>
          Promise.resolve({
            success: true,
            data: {
              result: {
                data: [
                  [1, 0, 0, 0],
                  [0, 1, 0, 0],
                  [0, 0, 1, 0],
                  [0, 0, 0, 1],
                ],
              },
              performance: {
                memoryUsed: 1024,
                cacheHit: false,
              },
            },
          }),
        computeRobustNormalMatrix: () =>
          Promise.resolve({
            success: true,
            data: {
              result: {
                elements: [1, 0, 0, 0, 1, 0, 0, 0, 1],
              },
              performance: {
                memoryUsed: 1024,
                cacheHit: false,
              },
            },
          }),
        getPerformanceMetrics: () => ({
          operationCount: 0,
          averageExecutionTime: 0,
          totalMemoryUsed: 0,
          cacheHitRate: 0,
        }),
      }),
      getValidationService: () => null,
      getTelemetryService: () => null,
      getCacheService: () => ({
        getStats: () => ({
          cacheHitRate: 0.8,
          size: 0,
          maxSize: 100,
        }),
      }),
      getConfigManager: () => null,
      getOperationsAPI: () => ({}),
      shutdown: () => Promise.resolve(),
    };

    (
      globalThis as typeof globalThis & { __MOCK_MATRIX_SERVICE__?: typeof mockMatrixService }
    ).__MOCK_MATRIX_SERVICE__ = mockMatrixService;

    logger.debug('✅ Mock Matrix Service initialized for testing');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Matrix Service mock initialization failed:', errorMessage);
  }
}

/**
 * Create a test Three.js scene for headless testing
 * Following R3F testing patterns
 */
export function createTestScene(): { scene: unknown; camera: unknown; renderer: unknown } {
  logger.debug('Creating test Three.js scene');

  // Mock Three.js objects for testing
  const scene = {
    add: vi.fn(),
    remove: vi.fn(),
    dispose: vi.fn(),
    children: [],
  };

  const camera = {
    position: { set: vi.fn(), x: 0, y: 0, z: 0 },
    lookAt: vi.fn(),
    updateProjectionMatrix: vi.fn(),
  };

  const renderer = {
    render: vi.fn(),
    dispose: vi.fn(),
    setSize: vi.fn(),
  };

  return { scene, camera, renderer };
}

/**
 * Dispose test scene resources properly
 * Following R3F testing patterns
 */
export function disposeTestScene(scene: unknown, _camera: unknown, renderer: unknown): void {
  logger.debug('Disposing test scene resources');

  const sceneObj = scene as { dispose?: () => void };
  if (sceneObj?.dispose) {
    sceneObj.dispose();
  }

  const rendererObj = renderer as { dispose?: () => void };
  if (rendererObj?.dispose) {
    rendererObj.dispose();
  }
}

/**
 * Reset singleton instances for clean test isolation
 * Call this in beforeEach or afterEach hooks to prevent test contamination
 */
export async function resetMatrixServiceSingletons(): Promise<void> {
  logger.debug('Matrix service singletons reset (simplified - no complex services)');
  // No-op since we removed all complex matrix services
}

/**
 * Initialize matrix services with thread-safe async initialization
 * Use this in test setup to ensure services are properly initialized
 * DEPRECATED: Use lightweight test setup instead to prevent hanging
 */
export async function initializeMatrixServicesForTest(): Promise<{
  serviceContainer: unknown;
  integrationService: unknown;
}> {
  logger.debug('Initializing simplified matrix services for test');

  // Return simple mock services since we removed complex infrastructure
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

// ============================================================================
// Memory Management for Tests
// ============================================================================

/**
 * Force garbage collection to prevent memory leaks during tests
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
 * Clear test memory and force garbage collection
 */
export function clearTestMemory(): void {
  logger.debug('Clearing test memory');

  // Force garbage collection
  forceGarbageCollection();
}



// ============================================================================
// Global Test Hooks for Memory Management
// ============================================================================

// Global memory cleanup after each test
afterEach(() => {
  clearTestMemory();
});
