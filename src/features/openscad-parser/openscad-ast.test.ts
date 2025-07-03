import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OpenscadParser } from './openscad-parser.js';
import { Tree } from 'web-tree-sitter';

describe('OpenSCAD Parser - AST Generation', () => {
  let osParser: OpenscadParser;
  let tree: Tree | null;

  beforeAll(async () => {
    osParser = new OpenscadParser();
    await osParser.init('/tree-sitter-openscad.wasm');
  });

  afterAll(() => {
    osParser.dispose();
  });

  function findDescendantNode(
    node: any | null,
    predicate: (n: any) => boolean
  ): any | undefined {
    if (!node) return undefined;
    if (predicate(node)) return node;

    // Handle case where node.children might not be iterable
    if (!node.children || node.children.length === 0) return undefined;

    for (const child of node.children) {
      if (!child) continue;
      const found = findDescendantNode(child, predicate);
      if (found) return found;
    }
    return undefined;
  }

  // Debug function to print the tree structure
  function printTree(node: any, depth = 0) {
    if (!node) return;
    const indent = '  '.repeat(depth);
    console.log(`${indent}${node.type}: ${node.text.substring(0, 30)}`);
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (child) printTree(child, depth + 1);
      }
    }
  }

  describe('Primitive Shapes', () => {
    describe('Cube', () => {
      it('should parse a simple cube with size parameter', () => {
        const code = 'cube(5);';
        tree = osParser.parse(code);

        expect(tree).not.toBeNull();
        const rootNode = tree?.rootNode;
        expect(rootNode).not.toBeNull();

        // Find the cube node using the current grammar structure
        // Grammar: (source_file (statement (module_instantiation name: (identifier) arguments: (argument_list ...))))
        const cubeNode = findDescendantNode(
          rootNode,
          n =>
            n.type === 'module_instantiation' &&
            n.childForFieldName('name')?.text === 'cube'
        );

        expect(cubeNode).toBeDefined();
      });

      it('should parse a cube with vector size', () => {
        const code = 'cube([10, 20, 30]);';
        tree = osParser.parse(code);

        expect(tree).not.toBeNull();
        const rootNode = tree?.rootNode;
        expect(rootNode).not.toBeNull();

        // Find the cube node using the current grammar structure
        const cubeNode = findDescendantNode(
          rootNode,
          n =>
            n.type === 'module_instantiation' &&
            n.childForFieldName('name')?.text === 'cube'
        );
        expect(cubeNode).toBeDefined();

        // TODO: Add assertions for vector size
      });

      it('should parse a cube with named parameters', () => {
        const code = 'cube(size = 10, center = true);';
        tree = osParser.parse(code);

        expect(tree).not.toBeNull();
        const rootNode = tree?.rootNode;
        expect(rootNode).not.toBeNull();

        // Find the cube node using the current grammar structure
        const cubeNode = findDescendantNode(
          rootNode,
          n =>
            n.type === 'module_instantiation' &&
            n.childForFieldName('name')?.text === 'cube'
        );
        expect(cubeNode).toBeDefined();

        // TODO: Add assertions for named parameters
      });
    });
  });
});
