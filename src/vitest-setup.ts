import '@testing-library/jest-dom';
import * as BABYLON from '@babylonjs/core';
import createFetchMock from 'vitest-fetch-mock';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { findUpSync } from 'find-up';

// Use resolve.sync for robust module resolution following Node.js algorithm
import resolve from 'resolve';



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
        console.log(`Attempting @openscad/tree-sitter-openscad strategy 1 (direct) for ${normalizedPath}`);
        const packagePath = resolve.sync('@openscad/tree-sitter-openscad/package.json', {
          basedir: __dirname
        });
        const resolvedWasmPath = join(dirname(packagePath), normalizedPath);

        return resolvedWasmPath;
      } catch (e) {

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
      } catch (e) {

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
      } catch (e) {

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
      } catch (e) {

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
      } catch (e) {

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

  console.log(`URL path: ${urlPath}`);


  const resolvedPath = resolveWasmPath(urlPath);

  console.log(`Resolved WASM file path: ${resolvedPath}`);

  try {
    // Resolve the actual file path

    // Read file as Uint8Array
    const localFile = readFileSync(resolvedPath);
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
