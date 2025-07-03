/**
 * Minimal Cube Test
 * 
 * This is a minimal standalone test for cube extraction with binary expressions.
 * It follows the Single Responsibility Principle by focusing only on the specific issue.
 */

import { OpenscadParser as EnhancedOpenscadParser } from '../../openscad-parser.js';
import { ErrorHandler } from '../../error-handling/index.js';
import { extractCubeNode } from './cube-extractor.js';
import { Node as TSNode } from 'web-tree-sitter';

/**
 * Main function to run the test
 */
async function runTest() {
  // Initialize parser
  const parser = new EnhancedOpenscadParser();
  await parser.init();
  const errorHandler = new ErrorHandler();

  try {
    // Test cases
    const testCases = [
      { code: 'cube(5);', expected: 5, name: 'simple number' },
      { code: 'cube(2 + 3);', expected: 5, name: 'addition' },
      { code: 'cube(2 * 3);', expected: 6, name: 'multiplication' },
      { code: 'cube(1 + 2 * 3);', expected: 7, name: 'complex expression' },
    ];

    // Run each test case
    for (const test of testCases) {
      console.log(`\n--- Testing ${test.name}: ${test.code} ---`);
      
      // Parse the code
      const tree = parser.parse(test.code);
      if (!tree) {
        console.error(`Failed to parse code: ${test.code}`);
        continue;
      }
      
      // Find the cube node
      const cubeNode = findCubeNode(tree.rootNode);
      if (!cubeNode) {
        console.error(`Failed to find cube node in: ${test.code}`);
        continue;
      }
      
      // Print detailed information about the cube node
      console.log(`Cube node: ${cubeNode.type} - "${cubeNode.text}"`);
      
      // Print the argument structure
      printArgumentStructure(cubeNode);
      
      // Extract the cube
      const cubeAST = extractCubeNode(cubeNode, errorHandler);
      console.log(`Extracted cube AST: ${JSON.stringify(cubeAST, null, 2)}`);
      
      // Check the result
      if (cubeAST && cubeAST.size === test.expected) {
        console.log(`✅ PASS: ${test.name} - Got expected size: ${cubeAST.size}`);
      } else {
        console.log(`❌ FAIL: ${test.name} - Expected: ${test.expected}, Got: ${cubeAST?.size}`);
      }
      
      // Print any errors
      const errors = errorHandler.getErrors();
      if (errors.length > 0) {
        console.log(`Errors: ${JSON.stringify(errors, null, 2)}`);
      }
    }
  } finally {
    // Clean up
    parser.dispose();
  }
}

/**
 * Helper function to find a cube node in the tree
 */
function findCubeNode(node: TSNode): TSNode | null {
  if ((node.type === 'module_instantiation' || node.type === 'accessor_expression') &&
      node.text.includes('cube')) {
    return node;
  }
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) {
      const result = findCubeNode(child);
      if (result) return result;
    }
  }
  return null;
}

/**
 * Helper function to print the argument structure
 */
function printArgumentStructure(node: TSNode): void {
  // Find the arguments node
  let argsNode: TSNode | null = null;
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && (child.type === 'argument_list' || child.type === 'arguments')) {
      argsNode = child;
      console.log(`Found arguments node at index ${i}: ${child.type}`);
      break;
    }
  }
  
  if (!argsNode) {
    console.log('No arguments node found');
    return;
  }
  
  // Print the arguments structure
  console.log(`Arguments node: ${argsNode.type} - "${argsNode.text}"`);
  
  // Print all children
  for (let i = 0; i < argsNode.childCount; i++) {
    const child = argsNode.child(i);
    if (child) {
      console.log(`  Child ${i}: ${child.type} - "${child.text}"`);
      
      // If this is a binary expression, print its structure
      if (child.type === 'binary_expression' || 
          child.type === 'additive_expression' || 
          child.type === 'multiplicative_expression') {
        console.log(`    Binary expression found: ${child.type}`);
        
        // Print all children of the binary expression
        for (let j = 0; j < child.childCount; j++) {
          const grandchild = child.child(j);
          if (grandchild) {
            console.log(`      Grandchild ${j}: ${grandchild.type} - "${grandchild.text}"`);
          }
        }
      }
    }
  }
}

// Run the test
runTest().catch(console.error);