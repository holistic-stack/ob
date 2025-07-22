/**
 * @file User Nested CSG Test
 *
 * Test for the user's specific nested OpenSCAD code that was not rendering properly.
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import { ASTBridgeConverter } from './ast-bridge-converter';

describe('User Nested CSG Test', () => {
  let parser: OpenscadParser;
  let converter: ASTBridgeConverter;
  let engine: NullEngine;
  let scene: Scene;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();

    // Create real BabylonJS NullEngine for testing (no mocks)
    engine = new NullEngine({
      renderHeight: 600,
      renderWidth: 800,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });

    scene = new Scene(engine);
    converter = new ASTBridgeConverter();
    const initResult = await converter.initialize(scene);
    expect(initResult.success).toBe(true);
  });

  afterEach(() => {
    parser.dispose();
    scene?.dispose();
    engine?.dispose();
  });

  it('should parse and convert the user nested OpenSCAD code', async () => {
    const userCode = `
      translate([24,0,0]) { 
        union() { 
          cube(15, center=true); 
          sphere(10); 
        } 
        translate([24,0,0]) { 
          difference() { 
            cube(15, center=true); 
            sphere(10); 
          } 
          translate([24,0,0]) 
            intersection() { 
              cube(15, center=true); 
              sphere(10); 
            } 
        } 
      }
    `;

    console.log('Step 1: Parsing user OpenSCAD code...');
    const ast = parser.parseAST(userCode);
    expect(ast.length).toBeGreaterThan(0);
    console.log('Step 1: Parsing completed, got', ast.length, 'nodes');

    console.log('Step 2: Converting AST to Babylon nodes...');
    const conversionResult = await converter.convertAST(ast);
    console.log('Step 2: Conversion result:', conversionResult.success);

    expect(conversionResult.success).toBe(true);

    if (conversionResult.success) {
      const babylonNodes = conversionResult.data;
      console.log('Step 2: Got', babylonNodes.length, 'babylon nodes');

      // Log the structure of the nodes
      babylonNodes.forEach((node, index) => {
        console.log(`Node ${index}: type=${node.nodeType}, name=${node.name}`);
      });

      expect(babylonNodes.length).toBeGreaterThan(0);

      // Test that we can generate debug info without actually generating meshes
      console.log('Step 3: Getting debug info...');
      const debugInfo = babylonNodes[0]?.getDebugInfo();
      console.log('Step 3: Debug info:', debugInfo);
      expect(debugInfo).toBeDefined();
    }
  }, 10000);

  it('should parse simple nested translate with union', async () => {
    const simpleCode = `
      translate([10, 0, 0]) {
        union() {
          cube(5);
          sphere(3);
        }
      }
    `;

    console.log('Step 1: Parsing simple nested code...');
    const ast = parser.parseAST(simpleCode);
    expect(ast.length).toBeGreaterThan(0);
    console.log('Step 1: Parsing completed');

    console.log('Step 2: Converting to Babylon nodes...');
    const conversionResult = await converter.convertAST(ast);
    console.log('Step 2: Conversion result:', conversionResult.success);

    expect(conversionResult.success).toBe(true);

    if (conversionResult.success) {
      const babylonNodes = conversionResult.data;
      expect(babylonNodes.length).toBe(1);
      console.log('Step 2: Got babylon node:', babylonNodes[0]?.nodeType);

      // Validate the node structure without generating meshes
      const validationResult = babylonNodes[0]?.validateNode();
      console.log('Step 3: Validation result:', validationResult?.success);
      expect(validationResult?.success).toBe(true);
    }
  }, 5000);
});
