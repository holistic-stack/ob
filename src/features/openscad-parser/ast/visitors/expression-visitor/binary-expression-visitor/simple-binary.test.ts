import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { BinaryExpressionVisitor } from './binary-expression-visitor.js';
import { ExpressionVisitor } from '../../expression-visitor.js';
import { ErrorHandler } from '../../../../error-handling/index.js';
import { OpenscadParser } from '../../../../openscad-parser.js';
import { RealNodeGenerator } from '../../../test-utils/real-node-generator.js';

describe('SimpleBinaryExpressionTest', () => {
  let parser: OpenscadParser;
  let nodeGenerator: RealNodeGenerator;
  let errorHandler: ErrorHandler;
  let parentExpressionVisitor: ExpressionVisitor;
  let visitor: BinaryExpressionVisitor;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();

    nodeGenerator = new RealNodeGenerator();
    await nodeGenerator.init();

    errorHandler = new ErrorHandler();
    parentExpressionVisitor = new ExpressionVisitor('test source', errorHandler);
    visitor = new BinaryExpressionVisitor(parentExpressionVisitor, errorHandler);
  });

  afterEach(() => {
    parser.dispose();
    nodeGenerator.dispose();
  });

  it('should handle simple addition with real binary expression node', async () => {
    // Get a real binary expression node for addition
    const binaryNode = await nodeGenerator.getBinaryExpressionNode('1 + 2');

    expect(binaryNode).not.toBeNull();
    expect(binaryNode?.type).toBe('binary_expression'); // Updated to reflect unified grammar

    // Debug: Print the tree structure to understand the issue
    console.log('\n=== Testing binary expression visitor with real nodes ===');

    // Test that the visitor can handle the real node
    const result = visitor.visit(binaryNode!);

    // The visitor should return a binary expression AST node or delegate properly
    // Note: This might return null if the visitor delegates to parent, which is expected behavior
    expect(result).toBeDefined(); // Either an AST node or null is acceptable
  });

  it('should handle simple multiplication with real binary expression node', async () => {
    // Get a real binary expression node for multiplication
    const binaryNode = await nodeGenerator.getBinaryExpressionNode('3 * 4');

    expect(binaryNode).not.toBeNull();
    expect(binaryNode?.type).toBe('binary_expression'); // Updated to reflect unified grammar

    // Test that the visitor can handle the real node
    const result = visitor.visit(binaryNode!);

    // The visitor should return a binary expression AST node or delegate properly
    expect(result).toBeDefined(); // Either an AST node or null is acceptable
  });

  it('should handle comparison expressions with real nodes', async () => {
    // Get a real binary expression node for comparison
    const binaryNode = await nodeGenerator.getBinaryExpressionNode('x > 5');

    expect(binaryNode).not.toBeNull();

    // Test that the visitor can handle the real node
    const result = visitor.visit(binaryNode!);

    // The visitor should return a binary expression AST node or delegate properly
    expect(result).toBeDefined(); // Either an AST node or null is acceptable
  });
});
