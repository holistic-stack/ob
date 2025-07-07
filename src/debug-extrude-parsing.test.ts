import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OpenscadParser } from './features/openscad-parser/core/openscad-parser.js';

describe('Debug Extrude Parsing', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should debug linear_extrude parsing step by step', () => {
    console.log('=== Debug Extrude Parsing ===');

    const testCases = [
      { code: 'cube(10);', expected: 1 },
      { code: 'square(5);', expected: 1 },
      { code: 'linear_extrude(height=10) square(5);', expected: 1 },
      { code: 'rotate_extrude() square(5);', expected: 1 },
    ];

    for (const testCase of testCases) {
      console.log(`\n--- Testing: ${testCase.code} ---`);
      try {
        const ast = parser.parseAST(testCase.code);
        console.log(`AST length: ${ast?.length || 0} (expected: ${testCase.expected})`);
        if (ast && ast.length > 0) {
          console.log('AST nodes:', JSON.stringify(ast, null, 2));
        } else {
          console.log('No AST nodes generated');
        }

        // Don't fail the test, just log the results
        expect(ast).toBeDefined();
      } catch (error) {
        console.error('Parse error:', error);
      }
    }
  });
});
