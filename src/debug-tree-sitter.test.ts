import { beforeEach, describe, it } from 'vitest';
import type { Node as SyntaxNode } from 'web-tree-sitter';
import type { OpenscadParser } from '@/features/openscad-parser/openscad-parser';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';

describe('Debug Tree-sitter Parsing', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = createTestParser();
    await parser.init();
  });

  it('should debug Tree-sitter CST output for linear_extrude', () => {
    console.log('=== Debug Tree-sitter CST Output ===');

    const testCases = [
      'cube(10);',
      'square(5);',
      'translate([1,2,3]) cube(10);',
      'linear_extrude(height=10) square(5);',
      'import("model.stl");',
      'surface(file="heightmap.png");',
      'projection(cut=true) cube(10);',
    ];

    for (const code of testCases) {
      console.log(`\n--- Testing: ${code} ---`);
      try {
        // Get the Tree-sitter tree using the public API
        const tree = parser.parseCST(code);
        if (tree) {
          console.log('Tree-sitter CST:');
          console.log(tree.rootNode.toString());

          // Check if there are any syntax errors
          if (tree.rootNode.hasError) {
            console.log('SYNTAX ERRORS DETECTED!');
            const errorNodes: Array<{
              type: string;
              text: string;
              startPosition: { row: number; column: number };
              endPosition: { row: number; column: number };
            }> = [];
            const _cursor = tree.walk();

            const findErrors = (node: SyntaxNode): void => {
              if (node.hasError) {
                errorNodes.push({
                  type: node.type,
                  text: node.text,
                  startPosition: node.startPosition,
                  endPosition: node.endPosition,
                });
              }

              for (let i = 0; i < node.childCount; i++) {
                const child = node.child(i);
                if (child) {
                  findErrors(child);
                }
              }
            };

            findErrors(tree.rootNode as SyntaxNode);
            console.log('Error nodes:', errorNodes);
          }
        } else {
          console.log('No Tree-sitter tree generated');
        }

        // Also test the AST conversion
        const ast = parser.parseAST(code);
        console.log(`AST length: ${ast?.length || 0}`);
        if (ast && ast.length > 0) {
          console.log('AST nodes:', JSON.stringify(ast, null, 2));
        }
      } catch (error) {
        console.error('Parse error:', error);
      }
    }
  });
});
