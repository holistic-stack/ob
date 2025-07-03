import { OpenscadParser } from './openscad-parser.js';

describe('Debug CST Structure', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init('./tree-sitter-openscad.wasm');
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should debug the CST structure for cube', () => {
    const code = 'cube(10);';
    const tree = parser.parseCST(code);
    if (!tree) throw new Error('Failed to parse CST');

    console.log('Source code:', code);
    console.log('\nTree structure:');
    console.log(JSON.stringify(formatNode(tree.rootNode), null, 2));

    // Walk the tree to find specific nodes
    console.log('\nWalking the tree to find call_expression nodes:');
    walkTree(tree.rootNode, 'call_expression');

    // Expect the test to pass
    expect(true).toBe(true);
  });

  it('should debug the CST structure for sphere', () => {
    const code = 'sphere(5);';
    const tree = parser.parseCST(code);
    if (!tree) throw new Error('Failed to parse CST');

    console.log('Source code:', code);
    console.log('\nTree structure:');
    console.log(JSON.stringify(formatNode(tree.rootNode), null, 2));

    // Walk the tree to find specific nodes
    console.log('\nWalking the tree to find call_expression nodes:');
    walkTree(tree.rootNode, 'call_expression');

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
  const indent = '  '.repeat(depth);

  if (node.type === targetType) {
    console.log(`${indent}Found ${targetType}: ${node.text}`);
    console.log(`${indent}Children:`);

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        console.log(`${indent}  Child ${i}: ${child.type} - ${child.text}`);
      }
    }

    // Try to get field names
    console.log(`${indent}Fields:`);
    const nameField = node.childForFieldName('name');
    if (nameField) {
      console.log(`${indent}  name: ${nameField.type} - ${nameField.text}`);
    } else {
      console.log(`${indent}  name: not found`);
    }

    const argsField = node.childForFieldName('arguments');
    if (argsField) {
      console.log(
        `${indent}  arguments: ${argsField.type} - ${argsField.text}`
      );
    } else {
      console.log(`${indent}  arguments: not found`);
    }
  }

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) {
      walkTree(child, targetType, depth + 1);
    }
  }
}
