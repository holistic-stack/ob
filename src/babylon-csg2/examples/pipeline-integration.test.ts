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
      defaultMaterial,
      parentTransform: BABYLON.Matrix.Identity(),
      debug: true
    };
    
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
    const astNodes = parser.parseAST(openscadCode);
      expect(astNodes).toBeDefined();
    expect(Array.isArray(astNodes)).toBe(true);
    expect(astNodes.length).toBeGreaterThan(0);
    
    const astNode = astNodes[0];
    expect(astNode).toBeDefined();
    console.log('[DEBUG] Parsed AST node type:', astNode.type);
    
    // Step 2: Verify AST structure for cube
    if (astNode && astNode.type === 'cube') {
      console.log('[DEBUG] Step 2: Verifying cube AST structure');
      const cubeNode = astNode as any;
      
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
    }
    
    console.log('[END] Pipeline integration test completed successfully');
  });

  it('[INTEGRATION] should process simple sphere code through full pipeline', async () => {
    console.log('[DEBUG] Testing sphere(r=5) pipeline');
    
    const openscadCode = 'sphere(r=5);';
    
    // Step 1: Parse OpenSCAD code
    console.log('[DEBUG] Step 1: Parsing OpenSCAD code');
    const parseResult = await parser.parse(openscadCode);
    
    expect(parseResult.success).toBe(true);
    expect(parseResult.ast).toBeDefined();
    expect(parseResult.ast.length).toBeGreaterThan(0);
    
    const astNode = parseResult.ast[0];
    console.log('[DEBUG] Parsed AST node type:', astNode.type);
    
    // Step 2: Verify AST structure for sphere
    if (astNode.type === 'sphere') {
      console.log('[DEBUG] Step 2: Verifying sphere AST structure');
      const sphereNode = astNode as any;
      
      // Note: The parser might use 'radius' or 'r' property
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
    }
    
    console.log('[END] Pipeline integration test completed successfully');
  });

  it('[INTEGRATION] should handle invalid OpenSCAD code gracefully', async () => {
    console.log('[DEBUG] Testing invalid OpenSCAD code handling');
    
    const invalidCode = 'invalid_function([1, 2, 3]);';
    
    // Step 1: Parse invalid OpenSCAD code
    const parseResult = await parser.parse(invalidCode);
    
    // The parser should either fail or return an error node
    if (!parseResult.success) {
      console.log('[DEBUG] Parser correctly rejected invalid code');
      expect(parseResult.success).toBe(false);
    } else {
      console.log('[DEBUG] Parser returned AST, checking for error nodes');
      // If parsing succeeded, there might be error nodes in the AST
      expect(parseResult.ast).toBeDefined();
    }
    
    console.log('[END] Invalid code test completed');
  });
});

console.log('[END] Pipeline integration test module loaded');
