import '@testing-library/jest-dom';
import * as BABYLON from '@babylonjs/core';
import createFetchMock from 'vitest-fetch-mock';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { findUpSync } from 'find-up';

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
 * Initialize CSG2 for testing environments
 * Provides fallback mock CSG2 if real CSG2 initialization fails
 */
export async function initializeCSG2ForTests(): Promise<void> {
  console.log('[INIT] Initializing CSG2 for tests');

  try {
    // Try to initialize real CSG2 with a timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('CSG2 initialization timeout')), 3000)
    );

    await Promise.race([
      BABYLON.InitializeCSG2Async(),
      timeoutPromise
    ]);

    console.log('[DEBUG] ✅ Real CSG2 initialized successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('[WARN] Real CSG2 initialization failed, using mock CSG2:', errorMessage);

    // Set up mock CSG2 for testing
    interface MockCSG2 {
      FromMesh: () => {
        add: () => { toMesh: () => null };
        subtract: () => { toMesh: () => null };
        intersect: () => { toMesh: () => null };
      };
    }
    (globalThis as typeof globalThis & { __MOCK_CSG2__?: MockCSG2 }).__MOCK_CSG2__ = {
      FromMesh: () => ({
        add: () => ({ toMesh: () => null }),
        subtract: () => ({ toMesh: () => null }),
        intersect: () => ({ toMesh: () => null })
      })
    };

    console.log('[DEBUG] ✅ Mock CSG2 initialized for testing');
  }
}

/**
 * Create a test scene with NullEngine for headless testing
 * Following the pattern used in existing tests
 */
export function createTestScene(): { engine: BABYLON.NullEngine; scene: BABYLON.Scene } {
  console.log('[DEBUG] Creating test scene with NullEngine');

  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  return { engine, scene };
}

/**
 * Dispose test scene resources properly
 * Following the pattern used in existing tests
 */
export function disposeTestScene(engine: BABYLON.NullEngine, scene: BABYLON.Scene): void {
  console.log('[DEBUG] Disposing test scene resources');

  if (scene) {
    scene.dispose();
  }

  if (engine) {
    engine.dispose();
  }
}
