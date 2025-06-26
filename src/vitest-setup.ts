import '@testing-library/jest-dom';
import createFetchMock from 'vitest-fetch-mock';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { findUpSync } from 'find-up';
// Use resolve.sync for robust module resolution following Node.js algorithm
import resolve from 'resolve';

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

const __dirname = import.meta.dirname;
const projectRoot = join(__dirname, '..');

// Initialize vitest-fetch-mock properly
const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

/**
 * Advanced WASM file resolution using multiple strategies
 * Combines Node.js module resolution with directory traversal for maximum robustness
 */
export function resolveWasmPath(urlPath: string): string {
  // Extract filename from URL or path
  let normalizedPath: string;

  if (urlPath.startsWith('http://') || urlPath.startsWith('https://') || urlPath.startsWith('file://')) {
    try {
      const url = new URL(urlPath);
      normalizedPath = url.pathname.split('/').pop() || urlPath;
      console.log(`Extracted filename from URL: ${normalizedPath}`);
    } catch (error) {
      console.warn(`Failed to parse URL: ${urlPath}, using as-is`);
      normalizedPath = urlPath;
    }
  } else {
    // Remove leading ./ or /
    normalizedPath = urlPath.replace(/^\.?\//, '');
  }

  console.log(`Resolving WASM file: ${normalizedPath}`);
  console.log(`__dirname: ${__dirname}`);


  // Strategy 1: Use Node.js module resolution algorithm (most reliable)
  const moduleResolutionStrategies = [
    // Try @holistic-stack/tree-sitter-openscad package
    () => {
      try {
        console.log(`Attempting @holistic-stack/tree-sitter-openscad strategy 1 (direct) for ${normalizedPath}`);
        const packagePath = resolve.sync('@holistic-stack/tree-sitter-openscad/package.json', {
          basedir: projectRoot
        });
        const resolvedWasmPath = join(dirname(packagePath), normalizedPath);
        console.log(`✅ Strategy 1 found package at: ${packagePath}`);
        console.log(`✅ Strategy 1 resolved path: ${resolvedWasmPath}`);
        return resolvedWasmPath;
      } catch (e) {
        console.log(`❌ Strategy 1 failed: ${e instanceof Error ? e.message : String(e)}`);
        return null;
      }
    },

    // Try web-tree-sitter package
    () => {
      console.log(`Attempting web-tree-sitter strategy 2 (direct) for ${normalizedPath}`);
      try {
        const packagePath = resolve.sync('web-tree-sitter/package.json', {
          basedir: projectRoot
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
          basedir: projectRoot
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
          basedir: __dirname
        });
        return join(dirname(packagePath), 'debug', normalizedPath);
      } catch {
        return null;
      }
    }
  ];

  // Strategy 2: Use find-up to locate package.json files and resolve from there
  const findUpStrategies = [
    // Find @holistic-stack/tree-sitter-openscad package.json using matcher function
    () => {
      try {
        console.log(`Attempting @holistic-stack/tree-sitter-openscad strategy 4 (find-up direct) for ${normalizedPath}`);
        const packageJson = findUpSync((directory: string) => {
          const packagePath = join(directory, 'package.json');
          try {
            const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
            return pkg.name === '@holistic-stack/tree-sitter-openscad' ? packagePath : undefined;
          } catch {
            return undefined;
          }
        }, {
          cwd: projectRoot,
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
        return `file://${resolvedPath}`;
      } catch {
        // File doesn't exist, continue to next strategy
        console.log(`❌ Strategy ${index + 1} failed: ${resolvedPath} (file not found)`);
        continue;
      }
    }
  }

  throw new Error(`WASM file not found: ${normalizedPath}. Tried ${allStrategies.length} resolution strategies.`);
}



// Configure vitest-fetch-mock to handle WASM files with better URL handling
vi.mocked(fetch).mockImplementation(url => {
  console.log('using local fetch mock', url);
  console.log('URL type:', typeof url, 'URL constructor:', url.constructor.name);

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

    console.log(`Successfully loaded WASM file: ${urlPath} (${uint8Array.length} bytes)`);

    return Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(uint8Array.buffer),
      bytes: () => Promise.resolve(uint8Array),
    } as unknown as Response);
  } catch (error) {
    console.error('Failed to read WASM file:', urlPath, error);
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
