/**
 * @file Simple integration test for the full OpenSCAD pipeline
 * 
 * Tests the pipeline: OpenSCAD code → parseAST → CSG2 → Babylon.js scene
 * Using real parser and NullEngine for testing
 */
import createFetchMock from 'vitest-fetch-mock';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { findUpSync } from 'find-up';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenscadParser } from '@holistic-stack/openscad-parser';
import { PrimitiveConverter } from '../converters/primitive-converter/primitive-converter.js';
import type { ConversionContext } from '../types/converter-types.js';

console.log('[INIT] Starting pipeline integration tests');

describe('OpenSCAD Pipeline Integration', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let parser: OpenscadParser;
  let converter: PrimitiveConverter;
  let context: ConversionContext;

  beforeEach(async () => {
    console.log('[DEBUG] Setting up test environment');
    
    // Create Babylon.js engine and scene
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    
    // Create default material
    const defaultMaterial = new BABYLON.StandardMaterial('default', scene);
    
    // Setup conversion context
    context = {
      scene,
      // engine, // TODO: Add engine to context if needed by converters
      defaultMaterial,
      // errorHandler, // TODO: Add a real error handler
      // options: { enableLogging: true }, // TODO: Configure options properly
      // meshCache: new Map(), // TODO: Initialize caches if used
      // materialCache: new Map()
    } as unknown as ConversionContext; // TODO: Remove 'as unknown as ConversionContext' by providing all required properties
    
    // Initialize parser
    parser = new OpenscadParser();
    await parser.init();
    
    // Initialize converter
    converter = new PrimitiveConverter();
    
    console.log('[DEBUG] Test environment ready');
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up test environment');
    parser.dispose();
    scene.dispose();
    engine.dispose();
  });
  it('[INTEGRATION] should process simple cube code through full pipeline', async () => {
    console.log('[DEBUG] Testing cube([10, 10, 10]) pipeline');
    
    const openscadCode = 'cube([10, 10, 10]);';
    
    // Step 1: Parse OpenSCAD code
    console.log('[DEBUG] Step 1: Parsing OpenSCAD code');
    const astNodes = parser.parseAST(openscadCode); // Use parseAST which returns ASTNode[]
    
    expect(astNodes).toBeDefined();
    expect(Array.isArray(astNodes)).toBe(true);
    expect(astNodes.length).toBeGreaterThan(0); // Ensure AST is not empty
    
    const astNode = astNodes[0]; // Get the first node
    // Add a check to ensure astNode is defined before using it
    if (!astNode) {
      // Fail the test if astNode is undefined, as we expect a node for valid code
      expect(astNode).toBeDefined(); 
      return; // Exit test if astNode is not defined
    }
    console.log('[DEBUG] Parsed AST node type:', astNode.type);
    
    // Step 2: Verify AST structure for cube
    // Ensure astNode is not null or undefined before accessing its properties
    if (astNode && astNode.type === 'cube') {
      console.log('[DEBUG] Step 2: Verifying cube AST structure');
      const cubeNode = astNode as any; // Cast to any for simplicity, or define a proper type
      
      expect(cubeNode.size).toBeDefined();
      expect(Array.isArray(cubeNode.size)).toBe(true);
      expect(cubeNode.size).toEqual([10, 10, 10]);
      
      // Step 3: Convert to Babylon.js mesh
      console.log('[DEBUG] Step 3: Converting to Babylon.js mesh');
      const conversionResult = await converter.convert(cubeNode, context);
      
      expect(conversionResult.success).toBe(true);
      if (conversionResult.success) {
        expect(conversionResult.data).toBeInstanceOf(BABYLON.Mesh);
        expect(conversionResult.data.name).toContain('cube_');
        
        console.log('[DEBUG] Mesh created successfully:', conversionResult.data.name);
      }
    } else {
      // Fail the test if the AST node is not as expected
      expect(astNode?.type).toBe('cube');
    }
    
    console.log('[END] Pipeline integration test completed successfully');
  });

  it('[INTEGRATION] should process simple sphere code through full pipeline', async () => {
    console.log('[DEBUG] Testing sphere(r=5) pipeline');
    
    const openscadCode = 'sphere(r=5);';
    
    // Step 1: Parse OpenSCAD code
    console.log('[DEBUG] Step 1: Parsing OpenSCAD code');
    const astNodes = parser.parseAST(openscadCode); // Use parseAST which returns ASTNode[]
    
    expect(astNodes).toBeDefined();
    expect(Array.isArray(astNodes)).toBe(true);
    expect(astNodes.length).toBeGreaterThan(0);
    
    const astNode = astNodes[0]; // Get the first node
    // Add a check to ensure astNode is defined
    if (!astNode) {
      expect(astNode).toBeDefined();
      return; // Exit test if astNode is not defined
    }
    console.log('[DEBUG] Parsed AST node type:', astNode.type);
    
    // Step 2: Verify AST structure for sphere
    if (astNode && astNode.type === 'sphere') {
      console.log('[DEBUG] Step 2: Verifying sphere AST structure');
      const sphereNode = astNode as any; // Cast to any for simplicity
      
      const hasRadius = 'radius' in sphereNode || 'r' in sphereNode;
      expect(hasRadius).toBe(true);
      
      // Step 3: Convert to Babylon.js mesh
      console.log('[DEBUG] Step 3: Converting to Babylon.js mesh');
      const conversionResult = await converter.convert(sphereNode, context);
      
      expect(conversionResult.success).toBe(true);
      if (conversionResult.success) {
        expect(conversionResult.data).toBeInstanceOf(BABYLON.Mesh);
        expect(conversionResult.data.name).toContain('sphere_');
        
        console.log('[DEBUG] Mesh created successfully:', conversionResult.data.name);
      }
    } else {
      expect(astNode?.type).toBe('sphere');
    }
    
    console.log('[END] Pipeline integration test completed successfully');
  });

  it('[INTEGRATION] should handle invalid OpenSCAD code gracefully', async () => {
    console.log('[DEBUG] Testing invalid OpenSCAD code handling');
    
    const invalidCode = 'invalid_function([1, 2, 3]);';
    
    // Step 1: Parse invalid OpenSCAD code
    const astNodes = parser.parseAST(invalidCode);
    
    // The parser should return an empty array or an array with error/unknown nodes
    // For this test, we expect an empty array or a node that is not a standard primitive
    // depending on how the parser handles errors.
    // If the parser is robust, it might return a specific error node type.
    // For now, let's assume it might return an empty array or a non-primitive node.
    
    expect(astNodes).toBeDefined();
    expect(Array.isArray(astNodes)).toBe(true);

    if (astNodes.length > 0) {
      const firstNode = astNodes[0];
      // Add a check to ensure firstNode is defined before using it
      if (!firstNode) {
        expect(firstNode).toBeDefined();
        return; // Exit test if firstNode is not defined
      }
      // Check if it's a known primitive, if so, it's an unexpected success
      const knownPrimitives = ['cube', 'sphere', 'cylinder'];
      expect(knownPrimitives.includes(firstNode.type)).toBe(false);
      console.log('[DEBUG] Parser returned a non-primitive node for invalid code:', firstNode.type);
    } else {
      console.log('[DEBUG] Parser returned an empty AST for invalid code, as expected.');
      expect(astNodes.length).toBe(0);
    }
    
    // Further checks can be added if the parser has specific error reporting in the AST
    console.log('[END] Invalid code handling test completed');
  });
});

console.log('[END] Pipeline integration test module loaded');


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
