/**
 * @file WASM Test Setup for OpenSCAD Parser
 *
 * Test utilities for setting up WASM-based OpenSCAD parser testing.
 * Provides fetch mocking and WASM file resolution for vitest environment.
 * Based on patterns from docs/openscad-parser/src/test-utils/setupTest.ts
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { findUpSync } from 'find-up';
import resolve from 'resolve';
import createFetchMock from 'vitest-fetch-mock';

const fetchMocker = createFetchMock(vi);

/**
 * Advanced WASM file resolution using multiple strategies
 * Combines Node.js module resolution with directory traversal for maximum robustness
 */
function resolveWasmPath(urlPath: string): string {
  // Normalize the path - remove leading ./ or /
  const normalizedPath = urlPath.replace(/^\.?\//, '');

  console.log(`[WASM Test Setup] Resolving WASM file: ${normalizedPath}`);

  // Strategy 1: Use Node.js module resolution algorithm
  const moduleResolutionStrategies = [
    // Try web-tree-sitter package (main directory)
    () => {
      try {
        console.log(
          `[WASM Test Setup] Attempting web-tree-sitter strategy 1 (direct) for ${normalizedPath}`
        );
        const packagePath = resolve.sync('web-tree-sitter/package.json', {
          basedir: process.cwd(),
        });
        const resolvedWasmPath = join(dirname(packagePath), normalizedPath);
        return resolvedWasmPath;
      } catch {
        return null;
      }
    },

    // Try web-tree-sitter/lib subdirectory
    () => {
      try {
        console.log(
          `[WASM Test Setup] Attempting web-tree-sitter strategy 2 (lib) for ${normalizedPath}`
        );
        const packagePath = resolve.sync('web-tree-sitter/package.json', {
          basedir: process.cwd(),
        });
        const resolvedWasmPath = join(dirname(packagePath), 'lib', normalizedPath);
        return resolvedWasmPath;
      } catch {
        return null;
      }
    },

    // Try web-tree-sitter root directory for tree-sitter.wasm
    () => {
      try {
        console.log(
          `[WASM Test Setup] Attempting web-tree-sitter strategy 3 (root) for ${normalizedPath}`
        );
        const packagePath = resolve.sync('web-tree-sitter/package.json', {
          basedir: process.cwd(),
        });
        const resolvedWasmPath = join(dirname(packagePath), normalizedPath);
        return resolvedWasmPath;
      } catch {
        return null;
      }
    },
  ];

  // Strategy 2: Use find-up to locate package.json files
  const findUpStrategies = [
    // Find web-tree-sitter package.json using matcher function
    () => {
      try {
        console.log(
          `[WASM Test Setup] Attempting web-tree-sitter strategy 4 (find-up) for ${normalizedPath}`
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
            cwd: process.cwd(),
            type: 'file',
          }
        );

        if (packageJson) {
          const resolvedWasmPath = join(dirname(packageJson), normalizedPath);
          return resolvedWasmPath;
        }
        return null;
      } catch {
        return null;
      }
    },
  ];

  // Try all strategies in order of preference
  const allStrategies = [...moduleResolutionStrategies, ...findUpStrategies];

  for (const [index, strategy] of allStrategies.entries()) {
    const resolvedPath = strategy();
    if (resolvedPath) {
      try {
        // Test if file exists by attempting to read it
        readFileSync(resolvedPath, { flag: 'r' });
        console.log(
          `[WASM Test Setup] ✅ Found WASM file: ${normalizedPath} at ${resolvedPath} (strategy ${index + 1})`
        );
        return resolvedPath;
      } catch {
        // File doesn't exist, continue to next strategy
        console.log(
          `[WASM Test Setup] ❌ Strategy ${index + 1} failed: ${resolvedPath} (file not found)`
        );
      }
    }
  }

  throw new Error(
    `[WASM Test Setup] WASM file not found: ${normalizedPath}. Tried ${allStrategies.length} resolution strategies.`
  );
}

/**
 * Setup WASM testing environment with fetch mocking
 * Call this in test setup to enable WASM file loading in tests
 */
export function setupWasmTesting(): void {
  fetchMocker.enableMocks();

  vi.mocked(fetch).mockImplementation((url) => {
    console.log('[WASM Test Setup] Using local fetch mock for:', url);

    // Handle both string and URL objects
    let urlPath: string;
    if (typeof url === 'string') {
      urlPath = url;
    } else if (url instanceof URL) {
      urlPath = url.href;
    } else {
      urlPath = String(url);
    }

    console.log(`[WASM Test Setup] URL path: ${urlPath}`);

    try {
      const resolvedPath = resolveWasmPath(urlPath);
      console.log(`[WASM Test Setup] Resolved WASM file path: ${resolvedPath}`);

      // Read file as Uint8Array
      const localFile = readFileSync(resolvedPath);
      const uint8Array = new Uint8Array(localFile);

      console.log(
        `[WASM Test Setup] Successfully loaded WASM file: ${urlPath} (${uint8Array.length} bytes)`
      );

      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(uint8Array.buffer),
        bytes: () => Promise.resolve(uint8Array),
      } as unknown as Response);
    } catch (error) {
      console.error('[WASM Test Setup] Failed to read WASM file:', urlPath, error);
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve(`WASM file not found: ${urlPath}`),
      } as unknown as Response);
    }
  });
}

/**
 * Cleanup WASM testing environment
 * Call this in test teardown to restore original fetch
 */
export function cleanupWasmTesting(): void {
  fetchMocker.disableMocks();
}
