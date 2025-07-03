import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OpenscadParser } from '../../openscad-parser.js';
import { type Node as SyntaxNode } from 'web-tree-sitter';
import { extractCylinderNode } from '../extractors/cylinder-extractor.js';

let parser: OpenscadParser;
const _defaultWasmPath = '/tree-sitter-openscad.wasm'; // Adjust if your WASM path is different

describe('Cylinder Extractor', () => {
  beforeAll(async () => {
    parser = new OpenscadParser();
    // Attempt to initialize the parser. If it fails, log an error and skip tests.
    try {
      await parser.init();
    } catch (error) {
      console.error(
        'Failed to initialize parser in cylinder-extractor.test.ts:',
        error
      );
      // This will cause tests to be skipped if the parser fails to initialize
      throw error;
    }
  });

  afterAll(() => {
    if (parser) {
      parser.dispose();
    }
  });

  const parseToSyntaxNode = (code: string): SyntaxNode | null => {
    if (!parser?.isInitialized) {
      throw new Error('Parser not initialized. Cannot parse code.');
    }
    const tree = parser.parseCST(code);
    // We expect the structure: source_file -> statement -> expression_statement -> call_expression
    // Or source_file -> statement -> expression_statement -> module_call (if that's how cylinder is parsed)
    // For a simple call like `cylinder(...);`
    // The relevant node for the extractor is usually the 'call_expression' or similar
    // This might need adjustment based on actual CST structure for `cylinder` calls
    const rootNode = tree?.rootNode;
    // console.log('Root node:', rootNode?.toString());
    // rootNode?.children.forEach(child => console.log('Child of root:', child.type, child.text));

    // Attempt to find the call_expression node for the cylinder call
    // This is a common pattern but might need to be more robust
    if (rootNode?.childCount && rootNode.childCount > 0) {
      const statementNode = rootNode.child(0);
      // console.log('Statement node:', statementNode?.type, statementNode?.text);
      if (statementNode?.childCount && statementNode.childCount > 0) {
        const expressionStatementNode = statementNode.child(0);
        // console.log('ExpressionStatement node:', expressionStatementNode?.type, expressionStatementNode?.text);
        if (
          expressionStatementNode?.childCount &&
          expressionStatementNode.childCount > 0
        ) {
          const callExpressionNode = expressionStatementNode.child(0);
          // console.log('CallExpression node:', callExpressionNode?.type, callExpressionNode?.text);
          if (
            callExpressionNode?.type === 'call_expression' ||
            callExpressionNode?.type === 'module_call'
          ) {
            return callExpressionNode;
          }
        }
      }
    }
    console.warn(`Could not find call_expression node for code: ${code}`);
    return null;
  };

  describe('extractCylinderNode', () => {
    it('should extract cylinder with h and r parameters', () => {
      const code = 'cylinder(h=10, r=5);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(10);
      expect(result?.r).toBe(5);
      expect(result?.r1).toBeUndefined();
      expect(result?.r2).toBeUndefined();
      expect(result?.d).toBeUndefined();
      expect(result?.d1).toBeUndefined();
      expect(result?.d2).toBeUndefined();
      expect(result?.center).toBeUndefined();
    });

    it('should extract cylinder with h and d parameters', () => {
      const code = 'cylinder(h=12, d=8);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(12);
      expect(result?.d).toBe(8);
      expect(result?.r).toBe(4); // r should be d/2
      expect(result?.r1).toBeUndefined();
      expect(result?.r2).toBeUndefined();
      expect(result?.d1).toBeUndefined();
      expect(result?.d2).toBeUndefined();
    });

    it('should extract cylinder with h, r1, and r2 parameters', () => {
      const code = 'cylinder(h=20, r1=5, r2=3);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(20);
      expect(result?.r1).toBe(5);
      expect(result?.r2).toBe(3);
      expect(result?.r).toBeUndefined();
      expect(result?.d).toBeUndefined();
      expect(result?.d1).toBeUndefined();
      expect(result?.d2).toBeUndefined();
    });

    it('should extract cylinder with h, d1, and d2 parameters', () => {
      const code = 'cylinder(h=15, d1=10, d2=6);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(15);
      expect(result?.d1).toBe(10);
      expect(result?.d2).toBe(6);
      expect(result?.r1).toBe(5); // r1 should be d1/2
      expect(result?.r2).toBe(3); // r2 should be d2/2
      expect(result?.r).toBeUndefined();
      expect(result?.d).toBeUndefined();
    });

    it('should extract cylinder with center=true parameter', () => {
      const code = 'cylinder(h=10, r=5, center=true);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(10);
      expect(result?.r).toBe(5);
      expect(result?.center).toBe(true);
    });

    it('should extract cylinder with center=false parameter', () => {
      const code = 'cylinder(h=10, r=5, center=false);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(10);
      expect(result?.r).toBe(5);
      expect(result?.center).toBe(false);
    });

    it('should extract cylinder with $fn parameter', () => {
      const code = 'cylinder(h=10, r=5, $fn=100);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(10);
      expect(result?.r).toBe(5);
      expect(result?.$fn).toBe(100);
    });

    it('should extract cylinder with $fa parameter', () => {
      const code = 'cylinder(h=10, r=5, $fa=12);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(10);
      expect(result?.r).toBe(5);
      expect(result?.$fa).toBe(12);
    });

    it('should extract cylinder with $fs parameter', () => {
      const code = 'cylinder(h=10, r=5, $fs=2);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(10);
      expect(result?.r).toBe(5);
      expect(result?.$fs).toBe(2);
    });

    it('should handle positional arguments (h, r1, r2, center)', () => {
      // cylinder(h, r, center) or cylinder(h, r1, r2, center)
      const code = 'cylinder(10, 5, 3, true);'; // h, r1, r2, center
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(10);
      expect(result?.r1).toBe(5);
      expect(result?.r2).toBe(3);
      expect(result?.center).toBe(true);
    });

    it('should handle positional arguments (h, r, center)', () => {
      const code = 'cylinder(10, 5, true);'; // h, r, center
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(10);
      expect(result?.r).toBe(5);
      expect(result?.center).toBe(true);
    });

    it('should prioritize named parameters over positional ones (mixed)', () => {
      const code = 'cylinder(10, r1=7, r2=4, h=12);'; // Positional h is overridden by named h
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      expect(result).toBeDefined();
      expect(result?.type).toBe('cylinder');
      expect(result?.h).toBe(12);
      expect(result?.r1).toBe(7);
      expect(result?.r2).toBe(4);
    });

    it('should default r1 and r2 to r if r is provided and r1/r2 are not', () => {
      const code = 'cylinder(h=10, r=5);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;
      const result = extractCylinderNode(node);
      expect(result?.r1).toBe(5);
      expect(result?.r2).toBe(5);
    });

    it('should default r to r1 if r1 is provided and r is not (and r2 is different or undefined)', () => {
      const code = 'cylinder(h=10, r1=5, r2=3);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;
      const result = extractCylinderNode(node);
      // In this case, r should probably be undefined as r1 and r2 define the radii
      // Or, if r is meant to be a single radius, it should only be set if r1 and r2 are equal and r isn't set.
      // Let's assume for now that if r1/r2 are set, r is not automatically derived from just one of them.
      expect(result?.r).toBeUndefined();
    });

    it('should default r to d/2 if d is provided', () => {
      const code = 'cylinder(h=10, d=8);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;
      const result = extractCylinderNode(node);
      expect(result?.r).toBe(4);
      expect(result?.r1).toBe(4); // Also implies r1 and r2 from d
      expect(result?.r2).toBe(4);
    });

    it('should default r1 to d1/2 and r2 to d2/2 if d1 and d2 are provided', () => {
      const code = 'cylinder(h=10, d1=8, d2=6);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;
      const result = extractCylinderNode(node);
      expect(result?.r1).toBe(4);
      expect(result?.r2).toBe(3);
    });

    // Test for missing required 'h' parameter - this should probably be handled by the extractor or parser
    // For now, the extractor might return undefined or a node with h as undefined/NaN
    it('should return undefined or minimal node if h is missing', () => {
      const code = 'cylinder(r=5);';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      // Depending on implementation, it might throw, return null, or return a partial node.
      // For now, let's assume it returns a node but h would be undefined or NaN.
      // The OpenSCAD language itself requires 'h'.
      // The AST node type `CylinderNode` has `h: number` (not optional).
      // This implies the extractor should ensure h is present or handle its absence.
      // Let's expect it to be undefined for now, and the calling code (e.g., visitor) would handle this.
      // OR, the extractor itself could throw an error if 'h' is not found.
      // For this test, let's assume it tries to create a node but h is not set.
      // This test will likely fail until the extractor logic for required params is defined.
      expect(result?.h).toBeUndefined(); // Or expect(() => extractCylinderNode(node)).toThrow();
    });

    it('should handle no parameters by using defaults (if any are defined by OpenSCAD)', () => {
      const code = 'cylinder();';
      const node = parseToSyntaxNode(code);
      expect(node).toBeDefined();
      if (!node) return;

      const result = extractCylinderNode(node);
      // OpenSCAD documentation states cylinder() is not valid without parameters.
      // cylinder(h,r) is the minimal form.
      // So, this should likely result in an error or an incomplete node.
      // Similar to the missing 'h' case.
      expect(result?.h).toBeUndefined();
      expect(result?.r).toBeUndefined();
    });
  });
});
