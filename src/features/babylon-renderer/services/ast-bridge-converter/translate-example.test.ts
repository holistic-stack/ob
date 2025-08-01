/**
 * @file translate-example.test.ts
 * @description Test for the specific OpenSCAD translate example provided by the user.
 * Tests the exact code: sphere(10); translate([15,0,0]) cube(15, center=true);
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { OPENSCAD_DEFAULTS } from '@/features/store/slices/openscad-globals-slice/index.js';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { CubeNode, TranslateNode } from '../../../openscad-parser/ast/ast-types.js';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser.js';
import { PrimitiveBabylonNode } from './primitive-babylon-node.js';
import { TransformationBabylonNode } from './transformation-babylon-node.js';

describe('OpenSCAD Translate Example', () => {
  let engine: NullEngine;
  let scene: Scene;
  let parser: OpenscadParser;

  beforeEach(async () => {
    // Create BabylonJS test environment
    engine = new NullEngine();
    scene = new Scene(engine);

    // Create OpenSCAD parser
    parser = createTestParser();

    // Initialize the parser
    await parser.init();
  });

  afterEach(() => {
    scene?.dispose();
    engine?.dispose();
  });

  it('should parse and render the user example: sphere(10); translate([15,0,0]) cube(15, center=true);', async () => {
    // The exact OpenSCAD code provided by the user
    const openscadCode = `
      sphere(10);
      translate([15,0,0]) 
        cube(15, center=true);
    `;

    // Parse the OpenSCAD code
    const ast = parser.parseAST(openscadCode);

    expect(ast).toBeDefined();
    expect(Array.isArray(ast)).toBe(true);
    expect(ast.length).toBe(2); // sphere + translate

    // First node should be sphere
    const sphereNode = ast[0];
    expect(sphereNode).toBeDefined();
    expect(sphereNode?.type).toBe('sphere');

    // Second node should be translate
    const translateNode = ast[1] as TranslateNode;
    expect(translateNode).toBeDefined();
    expect(translateNode.type).toBe('translate');
    expect(translateNode.v).toEqual([15, 0, 0]); // Translation vector

    // The translate node should have a cube child
    expect(translateNode.children).toBeDefined();
    expect(translateNode.children?.length).toBe(1);

    const cubeChild = translateNode.children?.[0] as CubeNode;
    expect(cubeChild?.type).toBe('cube');
    expect(cubeChild?.size).toBe(15); // Cube size
    expect(cubeChild?.center).toBe(true); // Center parameter
  });

  it('should create BabylonJS nodes for the translate example', async () => {
    const openscadCode = 'translate([15,0,0]) cube(15, center=true);';
    const ast = parser.parseAST(openscadCode);

    expect(ast.length).toBeGreaterThan(0);
    const translateNode = ast[0] as TranslateNode;

    // Create a child cube node for the transformation
    const cubeCode = 'cube(15, center=true);';
    const cubeAst = parser.parseAST(cubeCode);
    expect(cubeAst.length).toBeGreaterThan(0);
    expect(cubeAst[0]).toBeDefined();
    expect(cubeAst[0]).toBeDefined();
    if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
    const cubeNode = new PrimitiveBabylonNode(
      'translated_cube',
      scene,
      cubeAst[0],
      OPENSCAD_DEFAULTS
    );

    // Create the transformation node
    const transformationNode = new TransformationBabylonNode(
      'translate_example',
      scene,
      translateNode,
      [cubeNode]
    );

    // Generate the mesh
    const result = await transformationNode.generateMesh();
    expect(result.success).toBe(true);

    if (result.success) {
      const mesh = result.data;
      expect(mesh).toBeDefined();
      expect(mesh.name).toBe('translate_example');
      expect(mesh.metadata?.isTransformation).toBe(true);
      expect(mesh.metadata?.transformationType).toBe('translate');

      // Check that the translation was applied correctly
      expect(mesh.position.x).toBe(15);
      expect(mesh.position.y).toBe(0);
      expect(mesh.position.z).toBe(0);
    }
  });

  it('should handle multiple objects with translate correctly', async () => {
    // Test the full example with both sphere and translated cube
    const sphereCode = 'sphere(10);';
    const translateCode = 'translate([15,0,0]) cube(15, center=true);';

    // Parse sphere
    const sphereAst = parser.parseAST(sphereCode);
    expect(sphereAst.length).toBeGreaterThan(0);
    expect(sphereAst[0]).toBeDefined();
    if (!sphereAst[0]) throw new Error('sphereAst[0] is undefined');
    const sphereNode = new PrimitiveBabylonNode(
      'example_sphere',
      scene,
      sphereAst[0],
      OPENSCAD_DEFAULTS
    );

    // Parse translate + cube
    const translateAst = parser.parseAST(translateCode);
    expect(translateAst.length).toBeGreaterThan(0);
    const translateNode = translateAst[0] as TranslateNode;

    // Create cube child for translate
    const cubeCode = 'cube(15, center=true);';
    const cubeAst = parser.parseAST(cubeCode);
    expect(cubeAst.length).toBeGreaterThan(0);
    expect(cubeAst[0]).toBeDefined();
    if (!cubeAst[0]) throw new Error('cubeAst[0] is undefined');
    const cubeNode = new PrimitiveBabylonNode('example_cube', scene, cubeAst[0], OPENSCAD_DEFAULTS);

    // Create transformation node
    const transformationNode = new TransformationBabylonNode(
      'example_translate',
      scene,
      translateNode,
      [cubeNode]
    );

    // Generate both meshes
    const sphereResult = await sphereNode.generateMesh();
    const translateResult = await transformationNode.generateMesh();

    expect(sphereResult.success).toBe(true);
    expect(translateResult.success).toBe(true);

    if (sphereResult.success && translateResult.success) {
      const sphereMesh = sphereResult.data;
      const translateMesh = translateResult.data;

      // Sphere should be at origin
      expect(sphereMesh.position.x).toBe(0);
      expect(sphereMesh.position.y).toBe(0);
      expect(sphereMesh.position.z).toBe(0);

      // Translated cube should be at [15,0,0]
      expect(translateMesh.position.x).toBe(15);
      expect(translateMesh.position.y).toBe(0);
      expect(translateMesh.position.z).toBe(0);

      // Both meshes should be valid
      expect(sphereMesh.name).toBe('example_sphere');
      expect(translateMesh.name).toBe('example_translate');
    }
  });

  it('should validate translate parameters correctly', async () => {
    // Test various translate parameter formats
    const testCases = [
      { code: 'translate([10, 5, 2]) cube(1);', expected: [10, 5, 2] },
      { code: 'translate([0, 0, 0]) cube(1);', expected: [0, 0, 0] },
      { code: 'translate([-5, 10, -3]) cube(1);', expected: [-5, 10, -3] },
      { code: 'translate([15, 0, 0]) cube(1);', expected: [15, 0, 0] }, // User's example
    ];

    for (const testCase of testCases) {
      const ast = parser.parseAST(testCase.code);
      expect(ast.length).toBeGreaterThan(0);

      const translateNode = ast[0] as TranslateNode;
      expect(translateNode.type).toBe('translate');
      expect(translateNode.v).toEqual(testCase.expected);
    }
  });
});
