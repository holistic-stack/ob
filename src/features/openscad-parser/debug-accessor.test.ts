import { EnhancedOpenscadParser } from './enhanced-parser.js';

describe('Debug Accessor Expression Structure', () => {
  let parser: EnhancedOpenscadParser;

  beforeEach(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init('./tree-sitter-openscad.wasm');
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should debug the accessor expression structure for translate', () => {
    const code = 'translate([1, 2, 3]) {}';
    const tree = parser.parseCST(code);
    if (!tree) throw new Error('Failed to parse CST');

    console.log('Source code:', code);
    console.log('\nTree structure:');
    console.log(JSON.stringify(formatNode(tree.rootNode), null, 2));

    // Walk the tree to find specific nodes
    console.log('\nWalking the tree to find accessor_expression nodes:');
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
  const indent = '  '.repeat(depth);

  if (node.type === targetType) {
    console.log(`${indent}Found ${targetType}: ${node.text}`);
    console.log(`${indent}Children count: ${node.childCount}`);

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        console.log(`${indent}  Child ${i}: ${child.type} - ${child.text}`);

        // If this is a call_expression, print its children too
        if (child.type === 'call_expression') {
          console.log(
            `${indent}    Call expression children count: ${child.childCount}`
          );
          for (let j = 0; j < child.childCount; j++) {
            const callChild = child.child(j);
            if (callChild) {
              console.log(
                `${indent}      Child ${j}: ${callChild.type} - ${callChild.text}`
              );
            }
          }
        }
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
