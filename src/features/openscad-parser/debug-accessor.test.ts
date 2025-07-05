import { beforeEach } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { OpenscadParser } from './openscad-parser.js';

describe('Debug Accessor Expression Structure', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = createTestParser();
    await parser.init('./tree-sitter-openscad.wasm');
  });

  // Note: cleanup is now handled automatically by the test utility

  it('should debug the accessor expression structure for translate', () => {
    const code = 'translate([1, 2, 3]) {}';
    const tree = parser.parseCST(code);
    if (!tree) throw new Error('Failed to parse CST');

    console.log('Source code:', code);
    console.log(JSON.stringify(formatNode(tree.rootNode), null, 2));

    // Walk the tree to find specific nodes
    walkTree(tree.rootNode, 'accessor_expression');

    // Expect the test to pass
    expect(true).toBe(true);
  });
});

function formatNode(node: any) {
  const result: any = {
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

function walkTree(node: any, targetType: string, depth = 0) {
  const _indent = '  '.repeat(depth);

  if (node.type === targetType) {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        // If this is a call_expression, print its children too
        if (child.type === 'call_expression') {
          for (let j = 0; j < child.childCount; j++) {
            const callChild = child.child(j);
            if (callChild) {
            }
          }
        }
      }
    }

    // Try to get field names
    const nameField = node.childForFieldName('name');
    if (nameField) {
    } else {
    }

    const argsField = node.childForFieldName('arguments');
    if (argsField) {
    } else {
    }
  }

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) {
      walkTree(child, targetType, depth + 1);
    }
  }
}
