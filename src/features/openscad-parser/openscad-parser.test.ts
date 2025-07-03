/**
 * tree-sitter-openscad-parser.test.ts
 *
 * Tests for the TreeSitterOpenSCADParser class.
 *
 * @module lib/openscad-parser/tree-sitter-openscad-parser/tree-sitter-openscad-parser.test

 *
 * @dependencies
 * - vitest: For test framework
 * - web-tree-sitter: For parsing OpenSCAD code
 * - tree-sitter-openscad.wasm: WebAssembly module containing the OpenSCAD grammar
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenscadParser } from './openscad-parser.js';

// Sample OpenSCAD code for testing
const SAMPLE_OPENSCAD_CODE = `
  module test() {
    cube([10, 10, 10]);
  }
  test();
`;

// Complex OpenSCAD code for testing
const COMPLEX_OPENSCAD_CODE = `
  module rounded_cylinder(h, r, fillet) {
    union() {
      // Main cylinder body
      translate([0, 0, fillet])
        cylinder(h=h-2*fillet, r=r);

      // Bottom rounded edge
      translate([0, 0, fillet])
        rotate_extrude()
          translate([r, 0, 0])
            circle(r=fillet);

      // Top rounded edge
      translate([0, 0, h-fillet])
        rotate_extrude()
          translate([r, 0, 0])
            circle(r=fillet);
    }
  }

  rounded_cylinder(h=20, r=10, fillet=2);
`;

// Invalid OpenSCAD code for testing
const INVALID_OPENSCAD_CODE = `
  module test( {
    cube([10, 10, 10]);
  }
  test();
`;

describe('OpenSCADParser', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    // Create a new parser instance before each test
    parser = new OpenscadParser();

    // Initialize the parser
    await parser.init();
  });

  afterEach(() => {
    // Clean up after each test
    parser.dispose();
  });

  it('should initialize automatically in the constructor', async () => {
    // Wait for initialization to complete
    await parser.init();

    // Check that the parser is initialized
    expect(parser.isInitialized).toBe(true);
  });

  it('should parse simple OpenSCAD code correctly', async () => {
    // Parse the sample code
    const result = parser.parse(SAMPLE_OPENSCAD_CODE);
    console.log('result', JSON.stringify(result));

    // Check that the result is valid
    expect(result).toBeDefined();
    expect(result?.rootNode).toBeDefined();
    expect(result?.rootNode.type).toBe('source_file');

    // Check that the text content contains the expected code
    const text = result?.rootNode.text;
    expect(text).toContain('module test()');
    expect(text).toContain('cube([10, 10, 10])');
    expect(text).toContain('test();');
  });

  it('should parse complex OpenSCAD code correctly', async () => {
    // Wait for initialization to complete
    await parser.init();

    // Parse the complex code
    const result = parser.parse(COMPLEX_OPENSCAD_CODE);
    console.log('result', JSON.stringify(result));

    // Check that the result is valid
    expect(result).toBeDefined();
    expect(result?.rootNode).toBeDefined();
    expect(result?.rootNode.type).toBe('source_file');

    // Check that the text content contains the expected code
    const text = result?.rootNode.text;
    expect(text).toContain('module rounded_cylinder');
    expect(text).toContain('union()');
    expect(text).toContain('cylinder(h=h-2*fillet, r=r)');
    expect(text).toContain('rotate_extrude()');
    expect(text).toContain('translate([0, 0, fillet])');
  });

  it('should handle invalid OpenSCAD code gracefully', async () => {
    // Wait for initialization to complete
    await parser.init();

    // Parse the invalid code
    const result = parser.parseCST(INVALID_OPENSCAD_CODE);

    // Should still parse but with syntax errors in the tree
    expect(result).toBeDefined();
    expect(result?.rootNode).toBeDefined();

    // Check if there are any errors in the tree
    const hasErrors = result?.rootNode.hasError;
    expect(hasErrors).toBe(true);

    // The tree should contain MISSING tokens (tree-sitter error recovery)
    const rootNodeString = result?.rootNode.toString();
    expect(rootNodeString).toContain('MISSING');
  });
});
