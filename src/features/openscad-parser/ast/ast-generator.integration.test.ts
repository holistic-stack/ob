import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Node as TSNode } from 'web-tree-sitter';
import type { CubeNode, TranslateNode } from '../ast/ast-types.js';
import { OpenscadParser } from '../openscad-parser';

describe('AST Generator Integration Tests', () => {
  let parser: OpenscadParser;

  beforeAll(async () => {
    parser = new OpenscadParser();
    // Assuming the WASM file is in the public directory when served
    await parser.init();
  });

  afterAll(() => {
    parser.dispose();
  });

  describe('translate and cube operations', () => {
    it('should parse translate with cube without curly braces', () => {
      const code = `translate([1,0,0]) cube([1,2,3], center=true);`;

      // Debug: Log the CST structure
      const cst = parser.parseCST(code);
      expect(cst).toBeDefined();

      // Print the tree structure for debugging
      function printNode(node: TSNode | null | undefined, depth = 0) {
        if (!node) return;
        const indent = '  '.repeat(depth);
        console.log(
          `${indent}${node.type} [${node.startPosition.row},${
            node.startPosition.column
          } → ${node.endPosition.row},${node.endPosition.column}]: '${node.text.substring(0, 30)}${
            node.text.length > 30 ? '...' : ''
          }'`
        );
        for (let i = 0; i < node.childCount; i++) {
          const child: TSNode | null = node.child(i);
          printNode(child, depth + 1);
        }
      }
      printNode(cst?.rootNode);

      const ast = parser.parseAST(code);
      console.log('\nGenerated AST:', JSON.stringify(ast, null, 2));

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const translateNode = ast[0];
      if (translateNode === undefined) {
        throw new Error('Expected AST node at index 0 but found none.');
      }
      expect(translateNode.type).toBe('translate');
      expect((translateNode as TranslateNode).v).toEqual([1, 0, 0]); // translate([1,0,0])

      // The child should be a cube
      const children = (translateNode as TranslateNode).children;
      expect(children).toHaveLength(1); // Should have 1 child (the cube)
      const cubeNode = children?.[0];
      expect(cubeNode?.type).toBe('cube');
      expect((cubeNode as CubeNode).size).toEqual([1, 2, 3]);
      expect((cubeNode as CubeNode).center).toBe(true);
    });

    it('should parse translate with cube using curly braces and named parameters', () => {
      const code = `translate(v=[3,0,0]) { cube(size=[1,2,3], center=true); }`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const translateNode = ast[0];
      if (translateNode === undefined) {
        throw new Error('Expected AST node at index 0 but found none.');
      }
      expect(translateNode.type).toBe('translate');
      // Current behavior: named argument parsing produces [3, 0, 0] (which is correct)
      expect((translateNode as TranslateNode).v).toEqual([3, 0, 0]);

      // The child should be a cube (curly brace parsing is now working!)
      const children = (translateNode as TranslateNode).children;
      expect(children).toHaveLength(1); // Fixed: curly brace parsing now works correctly

      const cubeNode = children?.[0] as CubeNode;
      expect(cubeNode.type).toBe('cube');
      expect(cubeNode.size).toEqual([1, 2, 3]); // Size from parameters: cube(size=[1,2,3], center=true)
      expect(cubeNode.center).toBe(true); // Center parameter should be parsed correctly
      // expect((cubeNode as CubeNode).center).toBe(true);
    });
  });
});
