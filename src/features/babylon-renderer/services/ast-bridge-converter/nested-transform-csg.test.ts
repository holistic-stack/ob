/**
 * @file nested-transform-csg.test.ts
 * @description Test for the specific nested OpenSCAD code provided by the user.
 * Tests nested translate operations with CSG operations inside.
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser.js';
import { ASTBridgeConverter } from './ast-bridge-converter.js';

describe('Nested Transform CSG Test', () => {
  let engine: NullEngine;
  let scene: Scene;
  let parser: OpenscadParser;
  let converter: ASTBridgeConverter;

  beforeEach(async () => {
    // Create BabylonJS test environment
    engine = new NullEngine();
    scene = new Scene(engine);

    // Create OpenSCAD parser
    parser = createTestParser();
    await parser.init();

    // Create AST bridge converter
    converter = new ASTBridgeConverter();
    const initResult = await converter.initialize(scene);
    expect(initResult.success).toBe(true);
  });

  afterEach(() => {
    scene?.dispose();
    engine?.dispose();
  });

  it('should parse simple OpenSCAD code first', async () => {
    const simpleCode = 'cube(10);';
    console.log('Testing simple cube parsing...');

    const ast = parser.parseAST(simpleCode);
    console.log('Simple AST parsed, length:', ast.length);

    expect(ast.length).toBe(1);
    expect(ast[0]?.type).toBe('cube');

    console.log('Simple parsing test passed');
  }, 5000);

  it('should convert simple cube to BabylonJS', async () => {
    const simpleCode = 'cube(10);';
    console.log('Testing simple cube conversion...');

    const ast = parser.parseAST(simpleCode);
    console.log('AST parsed, starting conversion...');

    const conversionResult = await converter.convertAST(ast);
    console.log('Conversion result:', conversionResult.success);

    expect(conversionResult.success).toBe(true);

    if (conversionResult.success) {
      const babylonNodes = conversionResult.data;
      expect(babylonNodes.length).toBe(1);

      console.log('Starting mesh generation...');
      const meshResult = await babylonNodes[0]?.generateMesh();
      console.log('Mesh generation result:', meshResult?.success);

      expect(meshResult?.success).toBe(true);
    }
  }, 10000);

  it('should parse nested translate with union', async () => {
    const nestedCode = `
      translate([10,0,0]) {
        union() {
          cube(5);
          sphere(3);
        }
      }
    `;

    console.log('Testing nested translate with union...');

    const ast = parser.parseAST(nestedCode);
    console.log('Nested AST parsed, length:', ast.length);
    console.log('Root node type:', ast[0]?.type);

    expect(ast.length).toBe(1);
    expect(ast[0]?.type).toBe('translate');

    // Check if translate has children
    const translateNode = ast[0] as any;
    console.log('Translate children count:', translateNode.children?.length);

    if (translateNode.children && translateNode.children.length > 0) {
      console.log('First child type:', translateNode.children[0]?.type);
    }
  }, 5000);

  it('should convert simple union without translate', async () => {
    const simpleUnionCode = `
      union() {
        cube(5);
        sphere(3);
      }
    `;

    console.log('Step 1: Testing simple union conversion...');

    const ast = parser.parseAST(simpleUnionCode);
    console.log('Step 1: AST parsed, starting conversion...');

    const conversionResult = await converter.convertAST(ast);
    console.log('Step 2: Conversion result:', conversionResult.success);

    expect(conversionResult.success).toBe(true);

    if (conversionResult.success) {
      const babylonNodes = conversionResult.data;
      expect(babylonNodes.length).toBe(1);
      console.log('Step 2: Conversion completed, got', babylonNodes.length, 'nodes');
      console.log('Node type:', babylonNodes[0]?.constructor.name);

      console.log('Step 3: Starting mesh generation...');
      const meshResult = await babylonNodes[0]?.generateMesh();
      console.log('Step 3: Mesh generation result:', meshResult?.success);

      if (!meshResult?.success) {
        console.error('Mesh generation error:', meshResult?.error?.message);
      }

      expect(meshResult?.success).toBe(true);
    }
  }, 15000);

  it('should convert nested translate with union', async () => {
    const nestedCode = `
      translate([10,0,0]) {
        union() {
          cube(5);
          sphere(3);
        }
      }
    `;

    console.log('Step 1: Testing nested translate with union conversion...');

    const ast = parser.parseAST(nestedCode);
    console.log('Step 1: AST parsed, starting conversion...');

    const conversionResult = await converter.convertAST(ast);
    console.log('Step 2: Conversion result:', conversionResult.success);

    expect(conversionResult.success).toBe(true);

    if (conversionResult.success) {
      const babylonNodes = conversionResult.data;
      expect(babylonNodes.length).toBe(1);
      console.log('Step 2: Conversion completed, got', babylonNodes.length, 'nodes');
      console.log('Node type:', babylonNodes[0]?.constructor.name);

      console.log('Step 3: Starting mesh generation...');
      const meshResult = await babylonNodes[0]?.generateMesh();
      console.log('Step 3: Mesh generation result:', meshResult?.success);

      if (!meshResult?.success) {
        console.error('Mesh generation error:', meshResult?.error?.message);
      }

      expect(meshResult?.success).toBe(true);
    }
  }, 15000);

  it('should parse the user complex nested OpenSCAD code', async () => {
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

    console.log('Testing user complex nested code parsing...');

    const ast = parser.parseAST(userCode);
    console.log('User AST parsed, length:', ast.length);
    console.log('Root node type:', ast[0]?.type);

    expect(ast.length).toBe(1);
    expect(ast[0]?.type).toBe('translate');

    // Check the structure
    const translateNode = ast[0] as any;
    console.log('Root translate children count:', translateNode.children?.length);

    if (translateNode.children) {
      for (let i = 0; i < translateNode.children.length; i++) {
        console.log(`Child ${i} type:`, translateNode.children[i]?.type);
      }
    }
  }, 5000);
});
