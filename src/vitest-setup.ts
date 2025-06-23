import '@testing-library/jest-dom';
import createFetchMock from 'vitest-fetch-mock';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { findUpSync } from 'find-up';

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
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
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
  value: vi.fn().mockImplementation((namespace: string, tagName: string) => {
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

// Mock IntersectionObserver for visibility-based components
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Use resolve.sync for robust module resolution following Node.js algorithm
import resolve from 'resolve';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize vitest-fetch-mock properly
const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

/**
 * Advanced WASM file resolution using multiple strategies
 * Combines Node.js module resolution with directory traversal for maximum robustness
 */
function resolveWasmPath(urlPath: string): string {
  // Normalize the path - remove leading ./ or /
  const normalizedPath = urlPath.replace(/^\.?\//, '');

  console.log(`Resolving WASM file: ${normalizedPath}`);
  console.log(`__dirname: ${__dirname}`);


  // Strategy 1: Use Node.js module resolution algorithm (most reliable)
  const moduleResolutionStrategies = [
    // Try @openscad/tree-sitter-openscad package
    () => {
      try {
        console.log(`Attempting @openscad/tree-sitter-openscad strategy 1 (direct) for ${normalizedPath}`);
        const packagePath = resolve.sync('@openscad/tree-sitter-openscad/package.json', {
          basedir: __dirname
        });
        const resolvedWasmPath = join(dirname(packagePath), normalizedPath);

        return resolvedWasmPath;
      } catch (_e) {

        return null;
      }
    },

    // Try web-tree-sitter package
    () => {
      console.log(`Attempting web-tree-sitter strategy 2 (direct) for ${normalizedPath}`);
      try {
        const packagePath = resolve.sync('web-tree-sitter/package.json', {
          basedir: __dirname
        });
        const resolvedWasmPath = join(dirname(packagePath), normalizedPath);

        return resolvedWasmPath;
      } catch (_e) {

        return null;
      }
    },

    // Try web-tree-sitter/lib subdirectory
    () => {
      console.log(`Attempting web-tree-sitter strategy 3 (lib) for ${normalizedPath}`);
      try {
        const packagePath = resolve.sync('web-tree-sitter/package.json', {
          basedir: __dirname
        });
        const resolvedWasmPath = join(dirname(packagePath), 'lib', normalizedPath);
        console.log(`  - packagePath: ${packagePath}`);
        console.log(`  - dirname(packagePath): ${dirname(packagePath)}`);
        console.log(`  - normalizedPath: ${normalizedPath}`);
        console.log(`  - resolvedWasmPath: ${resolvedWasmPath}`);
        console.log(`Attempting web-tree-sitter strategy 3 (lib): ${resolvedWasmPath}`);
        return resolvedWasmPath;
      } catch (_e) {

        return null;
      }
    }
  ];

  // Strategy 2: Use find-up to locate package.json files and resolve from there
  const findUpStrategies = [
    // Find @openscad/tree-sitter-openscad package.json using matcher function
    () => {
      try {
        console.log(`Attempting @openscad/tree-sitter-openscad strategy 4 (find-up direct) for ${normalizedPath}`);
        const packageJson = findUpSync((directory: string) => {
          const packagePath = join(directory, 'package.json');
          try {
            const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
            return pkg.name === '@openscad/tree-sitter-openscad' ? packagePath : undefined;
          } catch {
            return undefined;
          }
        }, {
          cwd: __dirname,
          type: 'file'
        });

        if (packageJson) {
          const resolvedWasmPath = join(dirname(packageJson), normalizedPath);

          return resolvedWasmPath;
        }
        return null;
      } catch (_e) {

        return null;
      }
    },

    // Find web-tree-sitter package.json using matcher function
    () => {
      try {
        console.log(`Attempting web-tree-sitter strategy 5 (find-up direct) for ${normalizedPath}`);
        const packageJson = findUpSync((directory: string) => {
          const packagePath = join(directory, 'package.json');
          try {
            const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
            return pkg.name === 'web-tree-sitter' ? packagePath : undefined;
          } catch {
            return undefined;
          }
        }, {
          cwd: __dirname,
          type: 'file'
        });

        if (packageJson) {
          const resolvedWasmPath = join(dirname(packageJson), normalizedPath);

          return resolvedWasmPath;
        }
        return null;
      } catch (_e) {

        return null;
      }
    }
  ];

  // Try all strategies in order of preference
  const allStrategies = [...moduleResolutionStrategies, ...findUpStrategies];

  for (const [index, strategy] of allStrategies.entries()) {
    const resolvedPath = strategy();
    if (resolvedPath) {
      try {
        // Test if file exists by attempting to read it
        readFileSync(resolvedPath, { flag: 'r' });
        console.log(`✅ Found WASM file: ${normalizedPath} at ${resolvedPath} (strategy ${index + 1})`);

        return `${resolvedPath}`;
      } catch {
        // File doesn't exist, continue to next strategy
        console.log(`❌ Strategy ${index + 1} failed: ${resolvedPath} (file not found)`);
        continue;
      }
    }
  }

  throw new Error(`WASM file not found: ${normalizedPath}. Tried ${allStrategies.length} resolution strategies.`);
}

/**
 * Custom fetch mock handler for WASM files using vitest-fetch-mock
 * Handles loading local WASM files during testing
 */
function createWasmFetchHandler(url: string | URL | Request): Promise<Response> {
  console.log('[DEBUG] Using vitest-fetch-mock for WASM loading:', url);

  // Handle both string and URL objects
  let urlPath: string;
  if (typeof url === 'string') {
    urlPath = url;
  } else if (url instanceof URL) {
    urlPath = url.href; // Use href to get the full file:// URL
  } else if (url instanceof Request) {
    urlPath = url.url;
  } else {
    // Handle other URL-like objects
    urlPath = String(url);
  }

  console.log(`[DEBUG] URL path: ${urlPath}`);

  try {
    const resolvedPath = resolveWasmPath(urlPath);
    console.log(`[DEBUG] Resolved WASM file path: ${resolvedPath}`);

    // Read file as Uint8Array
    const localFile = readFileSync(resolvedPath);
    const uint8Array = new Uint8Array(localFile);

    console.log(`[DEBUG] Successfully loaded WASM file: ${urlPath} (${uint8Array.length} bytes)`);

    return Promise.resolve(new Response(uint8Array.buffer, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/wasm',
        'Content-Length': uint8Array.length.toString()
      }
    }));
  } catch (error) {
    console.error('[ERROR] Failed to read WASM file:', urlPath, error);
    return Promise.resolve(new Response(`WASM file not found: ${urlPath}`, {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'Content-Type': 'text/plain'
      }
    }));
  }
}

// Configure vitest-fetch-mock to handle WASM files
fetchMocker.mockResponse((req) => {
  const url = req.url;

  // Check if this is a WASM file request
  if (url.includes('.wasm') || url.includes('tree-sitter')) {
    return createWasmFetchHandler(url);
  }

  // For non-WASM requests, return a default mock response
  console.log('[DEBUG] Non-WASM fetch request:', url);
  return Promise.resolve(new Response('Mock response', { status: 200 }));
});

/**
 * Initialize Three.js CSG for testing environments
 * Provides fallback mock CSG if real CSG initialization fails
 */
export async function initializeCSGForTests(): Promise<void> {
  console.log('[INIT] Initializing Three.js CSG for tests');

  try {
    // Mock Three.js CSG for testing
    const mockCSG = {
      fromMesh: () => ({
        union: () => ({ toMesh: () => null }),
        subtract: () => ({ toMesh: () => null }),
        intersect: () => ({ toMesh: () => null })
      })
    };

    (globalThis as typeof globalThis & { __MOCK_THREE_CSG__?: typeof mockCSG }).__MOCK_THREE_CSG__ = mockCSG;

    console.log('[DEBUG] ✅ Mock Three.js CSG initialized for testing');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('[WARN] Three.js CSG initialization failed:', errorMessage);
  }
}

/**
 * Create a test Three.js scene for headless testing
 * Following R3F testing patterns
 */
export function createTestScene(): { scene: any; camera: any; renderer: any } {
  console.log('[DEBUG] Creating test Three.js scene');

  // Mock Three.js objects for testing
  const scene = {
    add: vi.fn(),
    remove: vi.fn(),
    dispose: vi.fn(),
    children: []
  };

  const camera = {
    position: { set: vi.fn(), x: 0, y: 0, z: 0 },
    lookAt: vi.fn(),
    updateProjectionMatrix: vi.fn()
  };

  const renderer = {
    render: vi.fn(),
    dispose: vi.fn(),
    setSize: vi.fn()
  };

  return { scene, camera, renderer };
}

/**
 * Dispose test scene resources properly
 * Following R3F testing patterns
 */
export function disposeTestScene(scene: any, camera: any, renderer: any): void {
  console.log('[DEBUG] Disposing test scene resources');

  if (scene?.dispose) {
    scene.dispose();
  }

  if (renderer?.dispose) {
    renderer.dispose();
  }
}
