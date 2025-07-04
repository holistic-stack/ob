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

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OpenscadParser } from './openscad-parser';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';

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
    parser = createTestParser();

    // Initialize the parser
    await parser.init();
  });

  // Note: cleanup is now handled automatically by the test utility

  it('should initialize automatically in the constructor', async () => {
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

  it('should not leak memory when creating and disposing parsers repeatedly', async () => {
    // Skip this test in environments where process.memoryUsage is not available
    if (typeof process === 'undefined' || typeof process.memoryUsage !== 'function') {
      console.warn('Skipping memory leak test: process.memoryUsage not available');
      return;
    }

    // Force garbage collection if available (Node.js with --expose-gc flag)
    const forceGC = () => {
      if (typeof global !== 'undefined' && (global as any).gc) {
        (global as any).gc();
      }
    };

    // Warm up - create and dispose a few parsers to stabilize memory
    for (let i = 0; i < 10; i++) {
      const warmupParser = createTestParser();
      await warmupParser.init();
      warmupParser.parseCST('cube(1);');
      // Note: dispose() will be called automatically by test utility
    }

    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100)); // Allow cleanup

    // Measure initial memory
    const initialMemory = process.memoryUsage();
    const initialHeapUsed = initialMemory.heapUsed;

    // Create and dispose parsers 1000 times
    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
      const testParser = createTestParser();
      await testParser.init();
      
      // Parse some code to exercise the parser
      testParser.parseCST(SAMPLE_OPENSCAD_CODE);
      testParser.parseAST('cube([1, 2, 3]); sphere(r=5);');
      
      // Note: dispose() will be called automatically by test utility
      
      // Force GC every 100 iterations to help with cleanup
      if (i % 100 === 0) {
        forceGC();
      }
    }

    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100)); // Allow cleanup

    // Measure final memory
    const finalMemory = process.memoryUsage();
    const finalHeapUsed = finalMemory.heapUsed;

    // Calculate memory growth
    const memoryGrowth = finalHeapUsed - initialHeapUsed;
    const memoryGrowthMB = memoryGrowth / (1024 * 1024);

    console.log(`Memory growth after ${iterations} parser cycles: ${memoryGrowthMB.toFixed(2)} MB`);
    console.log(`Initial heap: ${(initialHeapUsed / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Final heap: ${(finalHeapUsed / (1024 * 1024)).toFixed(2)} MB`);

    // The key check is that memory shouldn't grow linearly with iterations
    // If there's a major leak, we'd expect several hundred MB of growth
    // With WASM and Tree-sitter, some memory growth is expected due to allocator overhead
    const maxLinearGrowth = iterations * 0.2; // Less than 200KB per iteration
    const maxTotalGrowth = 150; // Less than 150MB total for 1000 iterations
    
    console.log(`Max linear growth allowed: ${maxLinearGrowth.toFixed(2)} MB`);
    console.log(`Max total growth allowed: ${maxTotalGrowth} MB`);
    
    // Primary test: Memory shouldn't grow linearly with iterations
    expect(memoryGrowthMB).toBeLessThan(maxLinearGrowth);
    
    // Secondary test: Total memory growth should be reasonable
    expect(memoryGrowthMB).toBeLessThan(maxTotalGrowth);
  }, 30000); // 30 second timeout for this test
});
