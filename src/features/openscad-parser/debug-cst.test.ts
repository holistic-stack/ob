import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { OpenscadParser } from './openscad-parser';

describe('Debug CST Structure', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = createTestParser();
    await parser.init('./tree-sitter-openscad.wasm');
  });

  // Note: cleanup is now handled automatically by the test utility

  it('should debug the CST structure for cube', () => {
    const code = 'cube(10);';
    const tree = parser.parseCST(code);
    if (!tree) throw new Error('Failed to parse CST');

    console.log('Source code:', code);
    console.log(JSON.stringify(formatNode(tree.rootNode), null, 2));

    // Walk the tree to find specific nodes
    walkTree(tree.rootNode, 'call_expression');

    // Expect the test to pass
    expect(true).toBe(true);
  });

  it('should debug the CST structure for sphere', () => {
    const code = 'sphere(5);';
    const tree = parser.parseCST(code);
    if (!tree) throw new Error('Failed to parse CST');

    console.log('Source code:', code);
    console.log(JSON.stringify(formatNode(tree.rootNode), null, 2));

    // Walk the tree to find specific nodes
    walkTree(tree.rootNode, 'call_expression');

    // Expect the test to pass
    expect(true).toBe(true);
  });
});

function formatNode(node: TSNode) {
  const result: Record<string, unknown> = {
    type: node.type,
    text: node.text,
    startPosition: node.startPosition,
    endPosition: node.endPosition,
    children: [],
  };

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) {
      result.children.push(formatNode(child));
    }
  }

  return result;
}

function walkTree(node: TSNode, targetType: string, depth = 0) {
  const _indent = '  '.repeat(depth);

  if (node.type === targetType) {
    for (let i = 0; i < node.childCount; i++) {
      const _child = node.child(i);
      // No-op: This block was for debugging and had an empty statement.
    }

    // Try to get field names
    const _nameField = node.childForFieldName('name');
    // No-op: This block was for debugging and had an empty statement.

    const _argsField = node.childForFieldName('arguments');
    // No-op: This block was for debugging and had an empty statement.
  }

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) {
      walkTree(child, targetType, depth + 1);
    }
  }
}
