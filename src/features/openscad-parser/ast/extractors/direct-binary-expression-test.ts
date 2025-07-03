/**
 * Direct Binary Expression Test
 * 
 * This is a direct test for binary expression evaluation in the value extractor.
 * It follows the Single Responsibility Principle by focusing only on the specific issue.
 */

import { ErrorHandler } from '../../error-handling/index.js';

/**
 * Mock TSNode for testing
 */
class MockTSNode {
  type: string;
  text: string;
  children: MockTSNode[];

  constructor(type: string, text: string, children: MockTSNode[] = []) {
    this.type = type;
    this.text = text;
    this.children = children;
  }

  get childCount(): number {
    return this.children.length;
  }

  child(index: number): MockTSNode | null {
    return this.children[index] || null;
  }

  namedChild(index: number): MockTSNode | null {
    return this.children[index] || null;
  }

  childForFieldName(_name: string): MockTSNode | null {
    return null; // Not implemented for this test
  }

  get namedChildCount(): number {
    return this.children.length;
  }
}

/**
 * Check if a node represents a complex expression that needs evaluation
 */
function isComplexExpression(node: MockTSNode): boolean {
  const complexTypes = new Set([
    'additive_expression',
    'multiplicative_expression',
    'exponentiation_expression',
    'logical_or_expression',
    'logical_and_expression',
    'equality_expression',
    'relational_expression',
    'binary_expression'
  ]);

  return complexTypes.has(node.type);
}

/**
 * Extract a value from a node with enhanced expression evaluation
 */
function extractValueEnhanced(node: MockTSNode, errorHandler?: ErrorHandler): number | undefined {
  console.log(`[extractValueEnhanced] Attempting to extract from node: type='${node.type}', text='${node.text}'`);

  // Handle number literals directly
  if (node.type === 'number_literal') {
    const value = parseFloat(node.text);
    console.log(`[extractValueEnhanced] Extracted number literal: ${value}`);
    return value;
  }

  // Check if this is a complex expression that needs evaluation
  if (isComplexExpression(node)) {
    console.log(`[extractValueEnhanced] Detected complex expression: ${node.type}`);

    try {
      // Direct evaluation approach for binary expressions
      const evaluateBinaryExpression = (node: MockTSNode): number | undefined => {
        console.log(`[evaluateBinaryExpression] Evaluating binary expression: ${node.type} - "${node.text}"`);
        
        // Get left, operator, and right nodes
        const leftNode = node.child(0);
        const operatorNode = node.child(1);
        const rightNode = node.child(2);
        
        console.log(`[evaluateBinaryExpression] Found nodes: left=${leftNode?.text}, op=${operatorNode?.text}, right=${rightNode?.text}`);
        
        if (!leftNode || !operatorNode || !rightNode) {
          console.warn(`[evaluateBinaryExpression] Could not find all parts of the binary expression`);
          return undefined;
        }
        
        // Recursively evaluate operands
        let leftValue: number | undefined;
        let rightValue: number | undefined;
        
        // Handle nested expressions
        if (isComplexExpression(leftNode)) {
          leftValue = evaluateBinaryExpression(leftNode);
        } else {
          leftValue = extractValueEnhanced(leftNode, errorHandler);
        }
        
        if (isComplexExpression(rightNode)) {
          rightValue = evaluateBinaryExpression(rightNode);
        } else {
          rightValue = extractValueEnhanced(rightNode, errorHandler);
        }
        
        console.log(`[evaluateBinaryExpression] Evaluated operands: left=${leftValue}, right=${rightValue}`);
        
        if (leftValue === undefined || rightValue === undefined) {
          console.warn(`[evaluateBinaryExpression] Could not evaluate operands`);
          return undefined;
        }
        
        // Perform the operation
        let result: number;
        switch (operatorNode.text) {
          case '+': result = leftValue + rightValue; break;
          case '-': result = leftValue - rightValue; break;
          case '*': result = leftValue * rightValue; break;
          case '/': result = leftValue / rightValue; break;
          case '%': result = leftValue % rightValue; break;
          default:
            console.warn(`[evaluateBinaryExpression] Unsupported operator: ${operatorNode.text}`);
            return undefined;
        }
        
        console.log(`[evaluateBinaryExpression] Result: ${leftValue} ${operatorNode.text} ${rightValue} = ${result}`);
        return result;
      };
      
      // Handle different expression types
      if (node.type === 'binary_expression' || 
          node.type === 'additive_expression' || 
          node.type === 'multiplicative_expression') {
        const result = evaluateBinaryExpression(node);
        if (result !== undefined) {
          return result;
        }
      }
      
      console.warn(`[extractValueEnhanced] Could not evaluate expression directly`);
      return undefined;
    } catch (error) {
      console.warn(`[extractValueEnhanced] Expression evaluation failed: ${error}`);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Main function to run the test
 */
function runTest() {
  const errorHandler = new ErrorHandler();

  // Test cases
  const testCases = [
    {
      name: 'Simple Addition',
      node: new MockTSNode('binary_expression', '1 + 2', [
        new MockTSNode('number_literal', '1'),
        new MockTSNode('operator', '+'),
        new MockTSNode('number_literal', '2')
      ]),
      expected: 3
    },
    {
      name: 'Simple Multiplication',
      node: new MockTSNode('binary_expression', '2 * 3', [
        new MockTSNode('number_literal', '2'),
        new MockTSNode('operator', '*'),
        new MockTSNode('number_literal', '3')
      ]),
      expected: 6
    },
    {
      name: 'Complex Expression',
      node: new MockTSNode('binary_expression', '1 + 2 * 3', [
        new MockTSNode('number_literal', '1'),
        new MockTSNode('operator', '+'),
        new MockTSNode('binary_expression', '2 * 3', [
          new MockTSNode('number_literal', '2'),
          new MockTSNode('operator', '*'),
          new MockTSNode('number_literal', '3')
        ])
      ]),
      expected: 7
    }
  ];

  // Run each test case
  for (const test of testCases) {
    console.log(`\n--- Testing ${test.name}: ${test.node.text} ---`);
    
    // Extract the value
    const result = extractValueEnhanced(test.node, errorHandler);
    
    // Check the result
    if (result === test.expected) {
      console.log(`✅ PASS: ${test.name} - Got expected result: ${result}`);
    } else {
      console.log(`❌ FAIL: ${test.name} - Expected: ${test.expected}, Got: ${result}`);
    }
  }
}

// Run the test
runTest();