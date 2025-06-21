/**
 * @file Test setup for openscad-demo package
 * Configures the test environment for Monaco Editor and OpenSCAD components
 * Following the same pattern as openscad-editor package for consistency
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

// Use resolve.sync for robust module resolution following Node.js algorithm
import resolve from 'resolve';
// Use find-up for finding files by walking up parent directories
import { findUpSync } from 'find-up';

// Mock fs/promises for web-tree-sitter compatibility in browser environment
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockImplementation((path: string) => {
    try {
      return Promise.resolve(readFileSync(path));
    } catch (error) {
      return Promise.reject(error);
    }
  }),
  writeFile: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockResolvedValue({ isFile: () => true, isDirectory: () => false }),
}));

const __dirname = import.meta.dirname;

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
        const packagePath = resolve.sync('@openscad/tree-sitter-openscad/package.json', {
          basedir: __dirname
        });
        return join(dirname(packagePath), normalizedPath);
      } catch {
        return null;
      }
    },

    // Try web-tree-sitter package
    () => {
      try {
        const packagePath = resolve.sync('web-tree-sitter/package.json', {
          basedir: __dirname
        });
        return join(dirname(packagePath), normalizedPath);
      } catch {
        return null;
      }
    },

    // Try web-tree-sitter/lib subdirectory
    () => {
      try {
        const packagePath = resolve.sync('web-tree-sitter/package.json', {
          basedir: __dirname
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
    // Find @openscad/tree-sitter-openscad package.json using matcher function
    () => {
      try {
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
          return join(dirname(packageJson), normalizedPath);
        }
        return null;
      } catch {
        return null;
      }
    },

    // Find web-tree-sitter package.json using matcher function
    () => {
      try {
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
          return join(dirname(packageJson), normalizedPath);
        }
        return null;
      } catch {
        return null;
      }
    }
  ];

  // Try all strategies in order of preference
  const allStrategies = [...moduleResolutionStrategies, ...findUpStrategies];
  console.log(`Total strategies available: ${allStrategies.length}`);

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

vi.mocked(fetch).mockImplementation(url => {
  console.log('using local fetch mock', url);

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

// Setup Monaco Editor environment for tests
Object.defineProperty(window, 'MonacoEnvironment', {
  value: {
    getWorkerUrl: () => '',
    getWorker: () => ({
      postMessage: () => {},
      terminate: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  },
});

// Mock ResizeObserver which is used by Monaco Editor
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
} as any;
