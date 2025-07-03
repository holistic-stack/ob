/**
 * @file Real Tree-sitter Node Generator for Testing
 *
 * This utility provides functions to generate real Tree-sitter nodes for testing
 * instead of using mocks. This ensures tests work with actual parser behavior.
 *
 * @example
 * ```typescript
 * const generator = new RealNodeGenerator();
 * await generator.init();
 *
 * const cubeNode = await generator.getCallExpressionNode('cube(10)');
 * const binaryExprNode = await generator.getBinaryExpressionNode('1 + 2');
 *
 * generator.dispose();
 * ```
 */

import { Node as TSNode } from 'web-tree-sitter';
import { OpenscadParser } from '../../openscad-parser.js';

/**
 * Utility class for generating real Tree-sitter nodes for testing
 */
export class RealNodeGenerator {
  private parser: OpenscadParser | null = null;
  private isInitialized = false;

  /**
   * Initialize the parser
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.parser = new OpenscadParser();
    await this.parser.init();
    this.isInitialized = true;
  }

  /**
   * Dispose of the parser
   */
  dispose(): void {
    if (this.parser) {
      this.parser.dispose();
      this.parser = null;
    }
    this.isInitialized = false;
  }

  /**
   * Get a call expression node (e.g., cube(10), sphere(r=5))
   * Note: In the OpenSCAD grammar, function calls are represented as accessor_expression with argument_list
   */
  async getCallExpressionNode(code: string): Promise<TSNode | null> {
    if (!this.parser) {
      throw new Error('Parser not initialized. Call init() first.');
    }

    const tree = this.parser.parse(code);
    if (!tree) {
      return null;
    }

    // Look for accessor_expression that has an argument_list child (function call)
    const accessorNode = this.findNodeByType(tree.rootNode, 'accessor_expression');
    if (accessorNode) {
      // Check if it has an argument_list child (indicating it's a function call)
      const argumentList = this.findNodeByType(accessorNode, 'argument_list');
      if (argumentList) {
        return accessorNode;
      }
    }

    // Also try looking for module_instantiation (which is how OpenSCAD parses primitives like cube, sphere)
    const moduleInstNode = this.findNodeByType(tree.rootNode, 'module_instantiation');
    if (moduleInstNode) {
      return moduleInstNode;
    }

    return null;
  }

  /**
   * Get a binary expression node (e.g., 1 + 2, a * b)
   */
  async getBinaryExpressionNode(expressionCode: string): Promise<TSNode | null> {
    if (!this.parser) {
      throw new Error('Parser not initialized. Call init() first.');
    }

    // Wrap in assignment to ensure proper parsing
    const code = `x = ${expressionCode};`;
    const tree = this.parser.parse(code);
    if (!tree) {
      return null;
    }

    // Look for binary expression type (unified in current grammar)
    const binaryTypes = [
      'binary_expression'
    ];

    for (const type of binaryTypes) {
      const node = this.findNodeByType(tree.rootNode, type);
      if (node) {
        return node;
      }
    }

    return null;
  }

  /**
   * Get a unary expression node (e.g., -x, !flag)
   */
  async getUnaryExpressionNode(expressionCode: string): Promise<TSNode | null> {
    if (!this.parser) {
      throw new Error('Parser not initialized. Call init() first.');
    }

    const code = `x = ${expressionCode};`;
    const tree = this.parser.parse(code);
    if (!tree) {
      return null;
    }

    return this.findNodeByType(tree.rootNode, 'unary_expression');
  }

  /**
   * Get an expression node of any type (looks for the value in assignment)
   */
  async getExpressionNode(expressionCode: string): Promise<TSNode | null> {
    if (!this.parser) {
      throw new Error('Parser not initialized. Call init() first.');
    }

    const code = `x = ${expressionCode};`;
    const tree = this.parser.parse(code);
    if (!tree) {
      return null;
    }

    // Look for the value node in the assignment statement
    const assignmentNode = this.findNodeByType(tree.rootNode, 'assignment_statement');
    if (assignmentNode) {
      // Find the value field in the assignment
      for (let i = 0; i < assignmentNode.childCount; i++) {
        const child = assignmentNode.child(i);
        if (child && child.type !== 'identifier' && child.type !== '=') {
          return child; // This should be the expression/value node
        }
      }
    }

    return null;
  }

  /**
   * Get a module instantiation node (e.g., translate([1,2,3]), rotate([0,0,90]))
   */
  async getModuleInstantiationNode(code: string): Promise<TSNode | null> {
    if (!this.parser) {
      throw new Error('Parser not initialized. Call init() first.');
    }

    const tree = this.parser.parse(code);
    if (!tree) {
      return null;
    }

    return this.findNodeByType(tree.rootNode, 'module_instantiation');
  }

  /**
   * Get a statement node
   */
  async getStatementNode(code: string): Promise<TSNode | null> {
    if (!this.parser) {
      throw new Error('Parser not initialized. Call init() first.');
    }

    const tree = this.parser.parse(code);
    if (!tree) {
      return null;
    }

    return this.findNodeByType(tree.rootNode, 'statement');
  }

  /**
   * Get any node by type from code
   */
  async getNodeByType(code: string, nodeType: string): Promise<TSNode | null> {
    if (!this.parser) {
      throw new Error('Parser not initialized. Call init() first.');
    }

    const tree = this.parser.parse(code);
    if (!tree) {
      return null;
    }

    return this.findNodeByType(tree.rootNode, nodeType);
  }

  /**
   * Find a node of specific type in the tree
   */
  private findNodeByType(node: TSNode, targetType: string): TSNode | null {
    if (node.type === targetType) {
      return node;
    }

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        const found = this.findNodeByType(child, targetType);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Get all nodes of a specific type
   */
  private findAllNodesByType(node: TSNode, targetType: string): TSNode[] {
    const results: TSNode[] = [];

    if (node.type === targetType) {
      results.push(node);
    }

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        results.push(...this.findAllNodesByType(child, targetType));
      }
    }

    return results;
  }

  /**
   * Debug: Print tree structure
   */
  debugPrintTree(code: string): void {
    if (!this.parser) {
      throw new Error('Parser not initialized. Call init() first.');
    }

    const tree = this.parser.parse(code);
    if (!tree) {
      console.log('Failed to parse code:', code);
      return;
    }

    console.log('Tree structure for code:', code);
    this.printNode(tree.rootNode, 0);
  }

  /**
   * Helper to print node structure
   */
  private printNode(node: TSNode, depth: number): void {
    const indent = '  '.repeat(depth);
    console.log(`${indent}${node.type}: "${node.text.substring(0, 50)}"`);

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        this.printNode(child, depth + 1);
      }
    }
  }
}

/**
 * Convenience function to create a real node generator for tests
 */
export async function createRealNodeGenerator(): Promise<RealNodeGenerator> {
  const generator = new RealNodeGenerator();
  await generator.init();
  return generator;
}
