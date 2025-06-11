/**
 * @file Simple integration test for the full OpenSCAD pipeline
 * 
 * Tests the pipeline: OpenSCAD code → parseAST → CSG2 → Babylon.js scene
 * Using real parser and NullEngine for testing
 */

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
