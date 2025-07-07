/**
 * Tests for the recovery strategies
 */

import type { TSNode } from '../../types/ast.types.js';
import { type ErrorPosition, ParserError } from './parser-error.js';
import {
  createRecoveryStrategy,
  DeleteExtraTokenStrategy,
  InsertMissingTokenStrategy,
  SkipToNextStatementStrategy,
} from './recovery-strategy.js';
import { SemanticError } from './semantic-error.js';
import { OpenSCADSyntaxError } from './syntax-error.js';

// Mock the TreeSitter Node type
class MockNode {
  type: string;
  parent: MockNode | null = null;
  nextSibling: MockNode | null = null;
  childCount: number = 0;
  private children: MockNode[] = [];
  startPosition: { row: number; column: number } = { row: 0, column: 0 };
  endPosition: { row: number; column: number } = { row: 0, column: 0 };
  text: string = '';

  constructor(type: string) {
    this.type = type;
  }

  setParent(parent: MockNode): MockNode {
    this.parent = parent;
    return this;
  }

  setNextSibling(sibling: MockNode): MockNode {
    this.nextSibling = sibling;
    return this;
  }

  addChild(child: MockNode): MockNode {
    this.children.push(child);
    this.childCount = this.children.length;
    child.setParent(this);
    return this;
  }

  child(index: number): MockNode | null {
    return this.children[index] || null;
  }
}

describe('RecoveryStrategies', () => {
  // Test data
  const source = 'cube([10, 10, 10);';
  const position: ErrorPosition = { line: 0, column: 15, offset: 15 };

  describe('SkipToNextStatementStrategy', () => {
    it('should skip to the next statement', () => {
      // Create a mock tree structure
      const errorNode = new MockNode('ERROR');
      const statementNode = new MockNode('statement');
      const nextStatementNode = new MockNode('statement');

      statementNode.setNextSibling(nextStatementNode);
      errorNode.setParent(statementNode);

      const error = new OpenSCADSyntaxError('Test error', source, position);
      const strategy = new SkipToNextStatementStrategy();

      const result = strategy.recover(errorNode as unknown as TSNode, error);

      expect(result).toBe(nextStatementNode);
    });

    it('should return null if no next statement is found', () => {
      const errorNode = new MockNode('ERROR');
      const statementNode = new MockNode('statement');

      errorNode.setParent(statementNode);

      const error = new OpenSCADSyntaxError('Test error', source, position);
      const strategy = new SkipToNextStatementStrategy();

      const result = strategy.recover(errorNode as TSNode, error);

      expect(result).toBeNull();
    });
  });

  describe('InsertMissingTokenStrategy', () => {
    it('should handle missing token errors', () => {
      const errorNode = new MockNode('ERROR');
      const error = OpenSCADSyntaxError.missingToken(']', source, position);
      const strategy = new InsertMissingTokenStrategy();

      const result = strategy.recover(errorNode as TSNode, error);

      // In our implementation, we just return the node for now
      expect(result).toBe(errorNode);
    });

    it('should return null for non-syntax errors', () => {
      const errorNode = new MockNode('ERROR');
      const error = new ParserError('Test error', 'TEST_ERROR', source, position);
      const strategy = new InsertMissingTokenStrategy();

      const result = strategy.recover(errorNode as TSNode, error);

      expect(result).toBeNull();
    });
  });

  describe('DeleteExtraTokenStrategy', () => {
    it('should handle unexpected token errors', () => {
      const errorNode = new MockNode('ERROR');
      const nextNode = new MockNode('token');

      errorNode.setNextSibling(nextNode);

      const error = OpenSCADSyntaxError.unexpectedToken(')', ']', source, position);
      const strategy = new DeleteExtraTokenStrategy();

      const result = strategy.recover(errorNode as TSNode, error);

      // Should return the next sibling
      expect(result).toBe(nextNode);
    });

    it('should return null for non-syntax errors', () => {
      const errorNode = new MockNode('ERROR');
      const error = new ParserError('Test error', 'TEST_ERROR', source, position);
      const strategy = new DeleteExtraTokenStrategy();

      const result = strategy.recover(errorNode as TSNode, error);

      expect(result).toBeNull();
    });
  });

  describe('createRecoveryStrategy', () => {
    it('should create InsertMissingTokenStrategy for missing token errors', () => {
      const error = OpenSCADSyntaxError.missingToken(']', source, position);
      const strategy = createRecoveryStrategy(error);

      expect(strategy).toBeInstanceOf(InsertMissingTokenStrategy);
    });

    it('should create DeleteExtraTokenStrategy for unexpected token errors', () => {
      const error = OpenSCADSyntaxError.unexpectedToken(')', ']', source, position);
      const strategy = createRecoveryStrategy(error);

      expect(strategy).toBeInstanceOf(DeleteExtraTokenStrategy);
    });

    it('should create SkipToNextStatementStrategy for other syntax errors', () => {
      const error = new OpenSCADSyntaxError('Test error', source, position);
      const strategy = createRecoveryStrategy(error);

      expect(strategy).toBeInstanceOf(SkipToNextStatementStrategy);
    });

    it('should return null for non-syntax errors', () => {
      const error = new SemanticError('Test error', source, position);
      const strategy = createRecoveryStrategy(error);

      expect(strategy).toBeNull();
    });
  });
});
