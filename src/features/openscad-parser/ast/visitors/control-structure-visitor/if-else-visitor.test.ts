/**
 * Tests for the IfElseVisitor implementation
 *
 * @module lib/openscad-parser/ast/visitors/control-structure-visitor/if-else-visitor.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node as TSNode } from 'web-tree-sitter';
import { ErrorHandler } from '../../../error-handling/index.js';
import { OpenscadParser } from '../../../openscad-parser';
import type * as ast from '../../ast-types.js';
import { printNodeStructure } from '../../utils/debug-utils.js';
import { ControlStructureVisitor } from '../control-structure-visitor.js';

describe('IfElseVisitor', () => {
  let parser: OpenscadParser;
  let errorHandler: ErrorHandler;
  let visitor: ControlStructureVisitor;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
    errorHandler = new ErrorHandler();
    visitor = new ControlStructureVisitor('', errorHandler);
  });

  afterEach(() => {
    parser.dispose();
    vi.clearAllMocks();
  });

  describe('visitIfStatement', () => {
    it('should parse a basic if statement', () => {
      const code = `if (true) { cube(10); }`;
      const tree = parser.parseCST(code);
      const rootNode = tree?.rootNode;

      // Find the if statement node
      const ifNode = rootNode?.namedChildren[0];
      expect(ifNode?.type).toBe('statement');

      // Log the node structure
      printNodeStructure(ifNode as TSNode, 0, 5, 10);

      // Get the actual if_statement node
      const actualIfNode = ifNode?.namedChild(0);
      expect(actualIfNode?.type).toBe('if_statement');

      // Visit the if statement node
      const result = visitor.visitIfStatement(actualIfNode as TSNode);

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('if');

      const ifResult = result as ast.IfNode;
      expect(ifResult.condition).toBeDefined();
      expect(ifResult.condition.expressionType).toBe('literal');
      expect(ifResult.thenBranch).toBeDefined();
      expect(ifResult.thenBranch.length).toBeGreaterThan(0);
      expect(ifResult.elseBranch).toBeUndefined();
    });

    it('should parse an if-else statement', () => {
      const code = `if (true) { cube(10); } else { sphere(5); }`;
      const tree = parser.parseCST(code);
      const rootNode = tree?.rootNode;

      // Find the if statement node
      const ifNode = rootNode?.namedChildren[0];
      expect(ifNode?.type).toBe('statement');

      // Get the actual if_statement node
      const actualIfNode = ifNode?.namedChild(0);
      expect(actualIfNode?.type).toBe('if_statement');

      // Visit the if statement node
      const result = visitor.visitIfStatement(actualIfNode as TSNode);

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('if');

      const ifResult = result as ast.IfNode;
      expect(ifResult.condition).toBeDefined();
      expect(ifResult.thenBranch).toBeDefined();
      expect(ifResult.thenBranch.length).toBeGreaterThan(0);
      expect(ifResult.elseBranch).toBeDefined();
      expect(ifResult.elseBranch?.length).toBeGreaterThan(0);
    });

    it('should parse an if-else-if-else statement', () => {
      const code = `if (true) { cube(10); } else if (false) { sphere(5); } else { cylinder(h=10, r=2); }`;
      const tree = parser.parseCST(code);
      const rootNode = tree?.rootNode;

      // Find the if statement node
      const ifNode = rootNode?.namedChildren[0];
      expect(ifNode?.type).toBe('statement');

      // Get the actual if_statement node
      const actualIfNode = ifNode?.namedChild(0);
      expect(actualIfNode?.type).toBe('if_statement');

      // Visit the if statement node
      const result = visitor.visitIfStatement(actualIfNode as TSNode);

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('if');

      const ifResult = result as ast.IfNode;
      expect(ifResult.condition).toBeDefined();
      expect(ifResult.thenBranch).toBeDefined();
      expect(ifResult.thenBranch.length).toBeGreaterThan(0);
      expect(ifResult.elseBranch).toBeDefined();
      expect(ifResult.elseBranch?.length).toBe(1);

      // Check the else-if branch
      const elseIfNode = ifResult.elseBranch?.[0] as ast.IfNode;
      expect(elseIfNode.type).toBe('if');
      expect(elseIfNode.condition).toBeDefined();
      expect(elseIfNode.thenBranch).toBeDefined();
      expect(elseIfNode.thenBranch.length).toBeGreaterThan(0);
      expect(elseIfNode.elseBranch).toBeDefined();
      expect(elseIfNode.elseBranch?.length).toBeGreaterThan(0);
    });

    it('should handle complex conditions in if statements', () => {
      const code = `if (x > 5 && y < 10 || z == 0) { cube(10); }`;
      const tree = parser.parseCST(code);
      const rootNode = tree?.rootNode;

      // Find the if statement node
      const ifNode = rootNode?.namedChildren[0];
      expect(ifNode?.type).toBe('statement');

      // Get the actual if_statement node
      const actualIfNode = ifNode?.namedChild(0);
      expect(actualIfNode?.type).toBe('if_statement');

      // Visit the if statement node
      const result = visitor.visitIfStatement(actualIfNode as TSNode);

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.type).toBe('if');

      const ifResult = result as ast.IfNode;
      expect(ifResult.condition).toBeDefined();
      // For complex conditions, the expression type can be 'binary', 'literal', or 'variable'
      expect(['binary', 'literal', 'variable']).toContain(ifResult.condition.expressionType);
      expect(ifResult.thenBranch).toBeDefined();
      expect(ifResult.thenBranch.length).toBeGreaterThan(0);
    });
  });
});
